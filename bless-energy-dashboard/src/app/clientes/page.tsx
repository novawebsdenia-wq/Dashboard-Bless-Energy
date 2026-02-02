'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { DetailSidePanel } from '@/components/DetailSidePanel';
import { Filter, X, UserPlus } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';
import { TableSkeleton, StatsCardSkeleton } from '@/components/Skeleton';
import { useToast } from '@/context/ToastContext';

export default function ClientesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | ''>('');

  // Add client panel
  const [showAddPanel, setShowAddPanel] = useState(false);

  const fetchTabs = useCallback(async () => {
    try {
      const response = await fetch('/api/sheets/tabs?sheet=clientes');
      const data = await response.json();
      if (data.success && data.data) {
        if (data.data.length > 0 && !activeTab) {
          setActiveTab(data.data[0].title);
        }
      }
    } catch (error) {
      console.error('Error fetching tabs:', error);
    }
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    if (!activeTab) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sheets?sheet=clientes&tab=${encodeURIComponent(activeTab)}`);
      const data = await response.json();
      if (data.success) {
        setHeaders(data.data.headers);
        setRows(data.data.rows);
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    if (activeTab) {
      fetchData();
    }
  }, [activeTab, fetchData]);

  const handleUpdate = async (rowIndex: number, values: string[]) => {
    try {
      const response = await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet: 'clientes',
          tab: activeTab,
          rowIndex,
          values,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        console.error('Update error:', data.error);
        alert('Error al actualizar: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating row:', error);
    }
  };

  const handleAddClient = async (values: string[]) => {
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet: 'clientes',
        tab: activeTab,
        values,
      }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Error adding client');
    }
    toast({
      type: 'success',
      title: 'Cliente creado',
      message: 'El nuevo cliente se ha añadido correctamente.'
    });
    fetchData();
  };

  // Parse date+time from DD/MM/YYYY HH:MM:SS or DD/MM/YYYY formats
  const parseFilterDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const ddmmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ddmmMatch) {
      const day = parseInt(ddmmMatch[1]);
      const month = parseInt(ddmmMatch[2]) - 1;
      let year = parseInt(ddmmMatch[3]);
      if (year < 100) year += 2000;
      const hour = ddmmMatch[4] ? parseInt(ddmmMatch[4]) : 0;
      const minute = ddmmMatch[5] ? parseInt(ddmmMatch[5]) : 0;
      const second = ddmmMatch[6] ? parseInt(ddmmMatch[6]) : 0;
      return new Date(year, month, day, hour, minute, second);
    }
    const isoDate = new Date(str);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  };

  const fechaCol = headers.find(h => h.toLowerCase().includes('fecha')) || headers[0];

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(row => {
        const rowDate = parseFilterDate(String(row[fechaCol] || ''));
        return rowDate && rowDate >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(row => {
        const rowDate = parseFilterDate(String(row[fechaCol] || ''));
        return rowDate && rowDate <= to;
      });
    }

    if (sortOrder) {
      result.sort((a, b) => {
        const dateA = parseFilterDate(String(a[fechaCol] || ''));
        const dateB = parseFilterDate(String(b[fechaCol] || ''));
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return sortOrder === 'recent'
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      });
    }

    return result;
  }, [rows, dateFrom, dateTo, sortOrder, fechaCol]);

  const hasActiveFilters = dateFrom || dateTo || sortOrder;

  const handleExport = (displayedRows?: Record<string, string | number>[]) => {
    const dataToExport = displayedRows || filteredRows;
    exportToExcel(dataToExport, headers, {
      filename: 'clientes',
      sheetName: 'Clientes'
    });
  };

  // Empty data for the add client panel
  const emptyClientData = useMemo(() => {
    const obj: Record<string, string | number> = {};
    headers.forEach(h => { obj[h] = ''; });
    return obj;
  }, [headers]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Clientes"
        subtitle="Gestión de cartera de clientes"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
          {/* Stats summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm animate-fade-in">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gold transition-colors duration-300">
                    {filteredRows.length}{hasActiveFilters ? ` / ${rows.length}` : ''}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Filter Section */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasActiveFilters
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/40'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtros Avanzados</span>
                <span className="sm:hidden">Filtros</span>
                {hasActiveFilters && (
                  <span className="bg-black text-gold text-[9px] px-1.5 py-0.5 rounded-full font-black ml-1">
                    {[dateFrom || dateTo, sortOrder].filter(Boolean).length}
                  </span>
                )}
              </button>

              <div className="flex bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-gold/20 rounded-xl overflow-hidden p-1 shadow-sm">
                <button
                  onClick={() => setSortOrder(sortOrder === 'recent' ? '' : 'recent')}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortOrder === 'recent'
                      ? 'bg-gold text-black shadow-sm'
                      : 'text-gray-500 hover:text-gold'
                    }`}
                >
                  Reciente
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'oldest' ? '' : 'oldest')}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${sortOrder === 'oldest'
                      ? 'bg-gold text-black shadow-sm'
                      : 'text-gray-500 hover:text-gold'
                    }`}
                >
                  Antiguo
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSortOrder('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <X className="w-3 h-3" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}

              {/* Add Client Button */}
              <button
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-gradient-to-r from-gold to-gold-dark text-black shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Añadir Cliente</span>
                <span className="sm:hidden">Añadir</span>
              </button>
            </div>

            {showFilters && (
              <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Fecha desde</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Fecha hasta</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="bg-white dark:bg-black shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gold/10">
              <DataTable
                headers={headers}
                rows={filteredRows}
                onUpdate={handleUpdate}
                onExport={handleExport}
                isLoading={isLoading}
                pageType="clientes"
              />
            </div>
          )}
        </div>
      </main>

      {/* Add Client Side Panel */}
      <DetailSidePanel
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        data={emptyClientData}
        headers={headers}
        onUpdate={async (values) => {
          await handleAddClient(values);
        }}
        type="Nuevo Cliente"
        startInEditMode
      />
    </div>
  );
}
