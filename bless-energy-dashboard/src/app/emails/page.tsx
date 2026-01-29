'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx-js-style';
import { Filter, X, ArrowDownUp, Tag } from 'lucide-react';

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
  const categoryCol = findColumn(['categoria', 'category', 'tipo', 'type']);

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

  const handleExport = () => {
    const dataToExport = hasActiveFilters ? filteredRows : rows;

    const validHeaders = headers.filter(h => {
      if (!h || !h.trim()) return false;
      return dataToExport.some(row => String(row[h] || '').trim().length > 0);
    });

    const exportData = dataToExport
      .map((row) => {
        const obj: Record<string, string> = {};
        validHeaders.forEach((header) => {
          obj[header] = String(row[header] || '').trim();
        });
        return obj;
      })
      .filter(obj => {
        const values = validHeaders.map(h => obj[h] || '');
        return values.slice(0, Math.min(3, values.length)).some(v => v.trim().length > 0);
      });

    if (exportData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(exportData, { header: validHeaders });
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: exportData.length, c: validHeaders.length - 1 }
    });
    ws['!cols'] = validHeaders.map(header => {
      const maxLen = Math.max(
        header.length,
        ...exportData.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 60) };
    });
    validHeaders.forEach((_, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: 'D4AF37' } },
          font: { bold: true, color: { rgb: '000000' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Emails"
        subtitle="Gestion de correos electronicos"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Filter Toggle & Panel */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasActiveFilters
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-gold text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {[dateFrom || dateTo, sortOrder, selectedCategory].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedCategory
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
                } focus:outline-none focus:ring-2 focus:ring-gold/50`}
              >
                <option value="">Todas las categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setSortOrder(sortOrder === 'recent' ? '' : 'recent')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === 'recent'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              Mas reciente
            </button>
            <button
              onClick={() => setSortOrder(sortOrder === 'oldest' ? '' : 'oldest')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortOrder === 'oldest'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              Mas antiguo
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Fecha desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Fecha hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                {categories.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Categoria
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="">Todas</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <DataTable
          headers={headers}
          rows={filteredRows}
          onUpdate={handleUpdate}
          onExport={handleExport}
          isLoading={isLoading}
          pageType="emails"
        />
      </div>
    </>
  );
}
