'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx-js-style';
import { Filter, X, ArrowDownUp } from 'lucide-react';

interface Tab {
  sheetId?: number;
  title?: string;
}

export default function FormularioPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
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
      const response = await fetch('/api/sheets/tabs?sheet=formulario');
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
  }, []);

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
      const hours = ddmmMatch[4] ? parseInt(ddmmMatch[4]) : 0;
      const minutes = ddmmMatch[5] ? parseInt(ddmmMatch[5]) : 0;
      const seconds = ddmmMatch[6] ? parseInt(ddmmMatch[6]) : 0;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        return new Date(year, month, day, hours, minutes, seconds);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
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
    const exportData = dataToExport
      .map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header) => {
          obj[header] = String(row[header] || '').trim();
        });
        return obj;
      })
      .filter(obj => {
        const values = headers.map(h => obj[h] || '');
        const hasKeyField = values.slice(0, Math.min(3, values.length)).some(v => v.trim().length > 0);
        return hasKeyField;
      });

    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit column widths
    const colWidths = headers.map(header => {
      const maxLen = Math.max(
        header.length,
        ...exportData.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 60) };
    });
    ws['!cols'] = colWidths;

    // Style header row with gold background and black bold text
    headers.forEach((_, idx) => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Formulario Web');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulario_web_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const estadoKey = headers.find(h => h.toLowerCase().includes('estado')) || 'estado';

  return (
    <>
      <Header
        title="Formulario Web"
        subtitle="Contactos del formulario de la pagina web"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total registros</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {filteredRows.length}{hasActiveFilters ? ` / ${rows.length}` : ''}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Pendientes</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('pendiente')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Contactados</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-500">
              {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('contactado')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">En proceso</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-500">
              {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('proceso')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-green-200 dark:border-green-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Cerrados</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-500">
              {filteredRows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('cerrado')).length}
            </p>
          </div>
        </div>

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

        {/* Tab selector if multiple tabs */}
        {tabs.length > 1 && (
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        <DataTable
          headers={headers}
          rows={filteredRows}
          onUpdate={handleUpdate}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
