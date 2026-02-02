'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import { Filter, X, ArrowDownUp, Tag } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';
import { TableSkeleton, StatsCardSkeleton } from '@/components/Skeleton';

interface Tab {
  sheetId?: number;
  title?: string;
}

export default function EmailsPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('mails');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchTabs = async () => {
    try {
      const response = await fetch('/api/sheets/tabs?sheet=emails');
      const data = await response.json();
      if (data.success && data.data) {
        setTabs(data.data);
        if (data.data.length > 0 && !activeTab) {
          setActiveTab(data.data[0].title);
        }
      }
    } catch (error) {
      console.error('Error fetching tabs:', error);
    }
  };

  const fetchData = useCallback(async () => {
    if (!activeTab) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sheets?sheet=emails&tab=${activeTab}`);
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (rowIndex: number, values: string[]) => {
    try {
      const response = await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet: 'emails',
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

  // Find column by keywords
  const findColumn = (keywords: string[]): string | null => {
    for (const header of headers) {
      const headerLower = header.toLowerCase();
      for (const keyword of keywords) {
        if (headerLower.includes(keyword.toLowerCase())) {
          return header;
        }
      }
    }
    return null;
  };

  const fechaCol = findColumn(['fecha', 'date', 'dia', 'enviado', 'recibido', 'timestamp', 'created']);
  const categoryCol = findColumn(['categor', 'category', 'tipo', 'type', 'etiqueta', 'label']);
  const estadoKey = findColumn(['estado']) || '';

  const categories = useMemo(() => {
    if (!categoryCol) return [];
    return [...new Set(rows.map(r => String(r[categoryCol] || '').trim()).filter(Boolean))].sort();
  }, [rows, categoryCol]);

  // Parse date+time from DD/MM/YYYY HH:MM:SS or DD/MM/YYYY formats
  const parseDateValue = (dateStr: string): Date | null => {
    if (!dateStr || !String(dateStr).trim()) return null;
    const str = String(dateStr).trim();

    // Try DD/MM/YYYY with optional time (HH:MM or HH:MM:SS)
    const ddmmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ddmmMatch) {
      const day = parseInt(ddmmMatch[1]);
      const month = parseInt(ddmmMatch[2]) - 1;
      let year = parseInt(ddmmMatch[3]);
      if (year < 100) year += 2000;
      const hours = ddmmMatch[4] ? parseInt(ddmmMatch[4]) : 0;
      const minutes = ddmmMatch[5] ? parseInt(ddmmMatch[5]) : 0;
      const seconds = ddmmMatch[6] ? parseInt(ddmmMatch[6]) : 0;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return new Date(year, month, day, hours, minutes, seconds);
      }
    }

    // Fallback: try native Date parsing (ISO, timestamps, etc.)
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  // Apply filters and sort
  const filteredRows = useMemo(() => {
    let result = rows.filter(row => {
      if (selectedCategory && categoryCol) {
        const rowCategory = String(row[categoryCol] || '').trim();
        if (rowCategory !== selectedCategory) return false;
      }
      if (dateFrom || dateTo) {
        if (!fechaCol) return true;
        const rowDate = parseDateValue(String(row[fechaCol] || ''));
        if (!rowDate) return false;
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (rowDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (rowDate > to) return false;
        }
      }
      return true;
    });

    if (sortOrder && fechaCol) {
      result = [...result].sort((a, b) => {
        const dateA = parseDateValue(String(a[fechaCol] || ''));
        const dateB = parseDateValue(String(b[fechaCol] || ''));
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return sortOrder === 'recent'
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      });
    }

    // Fallback sort by row order if no date column found
    if (sortOrder && !fechaCol) {
      result = sortOrder === 'recent' ? [...result].reverse() : result;
    }

    return result;
  }, [rows, dateFrom, dateTo, sortOrder, fechaCol, selectedCategory, categoryCol]);

  const hasActiveFilters = dateFrom || dateTo || sortOrder || selectedCategory;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSortOrder('');
    setSelectedCategory('');
  };

  const handleExport = (displayedRows?: Record<string, string | number>[]) => {
    const dataToExport = displayedRows || filteredRows;
    exportToExcel(dataToExport, headers, {
      filename: 'emails',
      sheetName: activeTab
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Emails"
        subtitle="Gestion de correos electronicos"
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
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total emails</p>
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasActiveFilters
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/40'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-black text-gold text-[9px] px-1.5 py-0.5 rounded-full font-black ml-1">
                    {[dateFrom || dateTo, sortOrder, selectedCategory].filter(Boolean).length}
                  </span>
                )}
              </button>

              {categories.length > 0 && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Tag className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`pl-10 pr-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all appearance-none cursor-pointer border ${selectedCategory
                      ? 'bg-gold/10 text-gold border-gold/30'
                      : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gold/20'
                      } focus:outline-none focus:ring-1 focus:ring-gold/50`}
                  >
                    <option value="">Todas las categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

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
            </div>

            {showFilters && (
              <div className="mt-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Fecha desde</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Fecha hasta</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DataTable
            headers={headers}
            rows={filteredRows}
            onUpdate={handleUpdate}
            onExport={handleExport}
            isLoading={isLoading}
            pageType="emails"
          />
        </div>
      </main>
    </div>
  );
}
