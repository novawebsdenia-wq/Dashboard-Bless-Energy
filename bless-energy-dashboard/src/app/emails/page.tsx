'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx';
import { Filter, X, ArrowDownUp } from 'lucide-react';

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

  // Parse date from DD/MM/YYYY or DD-MM-YYYY format
  const parseFilterDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return new Date(year, month, day);
      }
    }
    return null;
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

  const fechaCol = findColumn(['fecha']);

  // Apply filters and sort
  const filteredRows = useMemo(() => {
    let result = rows.filter(row => {
      if (dateFrom || dateTo) {
        if (!fechaCol) return true;
        const rowDate = parseFilterDate(String(row[fechaCol] || ''));
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

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSortOrder('');
  };

  const handleExport = () => {
    const dataToExport = hasActiveFilters ? filteredRows : rows;
    const exportData = dataToExport.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header) => {
        obj[header] = String(row[header] || '');
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `emails_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                  {[dateFrom || dateTo, sortOrder].filter(Boolean).length}
                </span>
              )}
            </button>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
