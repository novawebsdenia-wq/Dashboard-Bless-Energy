'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { Filter, X, ArrowDownUp } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';
import { TableSkeleton, StatsCardSkeleton } from '@/components/Skeleton';


export default function FormularioPage() {
  const [activeTab, setActiveTab] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | ''>('');

  const fetchTabs = useCallback(async () => {
    try {
      const response = await fetch('/api/sheets/tabs?sheet=formulario');
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
      const response = await fetch(`/api/sheets?sheet=formulario&tab=${encodeURIComponent(activeTab)}`);
      const data = await response.json();
      if (data.success) {
        setHeaders(data.data.headers);
        setRows(data.data.rows);
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
          sheet: 'formulario',
          tab: activeTab,
          rowIndex,
          values,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating row:', error);
    }
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

  const fechaCol = headers.find(h => h.toLowerCase().includes('fecha', 0)) || headers[0];

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

  const estadoKey = headers.find(h => h.toLowerCase().includes('estado')) || 'estado';

  const hasActiveFilters = dateFrom || dateTo || sortOrder;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSortOrder('');
  };

  const handleExport = (displayedRows?: Record<string, string | number>[]) => {
    const dataToExport = displayedRows || filteredRows;
    exportToExcel(dataToExport, headers, {
      filename: 'formulario',
      sheetName: activeTab
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Formulario Web"
        subtitle="Leads del formulario de contacto"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1 animate-fade-in">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total registros</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredRows.length}{hasActiveFilters ? ` / ${rows.length}` : ''}
                  </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 shadow-sm animate-fade-in [animation-delay:100ms]">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                    {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('pendiente')).length}
                  </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 shadow-sm animate-fade-in [animation-delay:200ms]">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Contactados</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">
                    {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('contactado')).length}
                  </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 shadow-sm animate-fade-in [animation-delay:300ms]">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">En proceso</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('proceso')).length}
                  </p>
                </div>
                <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-green-200 dark:border-green-500/20 rounded-xl p-4 shadow-sm animate-fade-in [animation-delay:400ms]">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Cerrados</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                    {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('cerrado')).length}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Filter Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasActiveFilters
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/40'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros Avanzados
                {hasActiveFilters && (
                  <span className="bg-black text-gold text-[9px] px-1.5 py-0.5 rounded-full font-black ml-1">
                    {[dateFrom || dateTo, sortOrder].filter(Boolean).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'recent' ? '' : 'recent')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortOrder === 'recent'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
                  }`}
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                Mas reciente
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
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
                pageType="formulario"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
