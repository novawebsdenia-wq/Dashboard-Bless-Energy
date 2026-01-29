'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx-js-style';
import { Receipt, Percent, Calculator, Filter, X } from 'lucide-react';

interface Tab {
  sheetId?: number;
  title?: string;
}

export default function ContabilidadPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const fetchTabs = async () => {
    try {
      const response = await fetch('/api/sheets/tabs?sheet=contabilidad');
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
      const response = await fetch(`/api/sheets?sheet=contabilidad&tab=${encodeURIComponent(activeTab)}`);
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
          sheet: 'contabilidad',
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
        const nonEmptyCount = Object.values(obj).filter(v => v && v.trim().length > 0).length;
        return nonEmptyCount >= 2;
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
    XLSX.utils.book_append_sheet(wb, ws, activeTab || 'Contabilidad');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contabilidad_${activeTab || 'datos'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse a number from various formats
  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined || value === null || value === '') return 0;
    
    let strValue = String(value);
    
    // Remove currency symbols, spaces and percentage signs
    strValue = strValue.replace(/[€$£%\s]/g, '');
    
    // Handle Spanish format (1.234,56) vs English format (1,234.56)
    if (/,\d{1,2}$/.test(strValue)) {
      // Spanish format: 1.234,56 -> 1234.56
      strValue = strValue.replace(/\./g, '').replace(',', '.');
    } else if (/\.\d{3}/.test(strValue) && !strValue.includes(',')) {
      // Spanish format without decimals: 1.234 -> 1234
      strValue = strValue.replace(/\./g, '');
    } else {
      // English format: remove commas
      strValue = strValue.replace(/,/g, '');
    }
    
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num;
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

  // Get column keys for filtering
  const fechaCol = findColumn(['fecha']);
  const totalCol = findColumn(['total']);
  const importeCol = findColumn(['importe', 'base', 'subtotal', 'neto']);
  const categoriaCol = findColumn(['categoria', 'categoría', 'tipo']);
  const metodoCol = findColumn(['metodo', 'método', 'pago', 'forma de pago']);
  const priceCol = totalCol || importeCol;

  // Extract unique categories and payment methods
  const uniqueCategories = useMemo(() => {
    if (!categoriaCol) return [];
    const set = new Set<string>();
    rows.forEach(row => {
      const val = String(row[categoriaCol] || '').trim();
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [rows, categoriaCol]);

  const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Desconocido'];

  // Apply filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Date range filter
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

      // Price range filter
      if (priceFrom || priceTo) {
        if (!priceCol) return true;
        const price = parseNumber(row[priceCol]);
        if (priceFrom && price < parseFloat(priceFrom)) return false;
        if (priceTo && price > parseFloat(priceTo)) return false;
      }

      // Category filter
      if (filterCategory) {
        if (!categoriaCol) return true;
        const val = String(row[categoriaCol] || '').trim();
        if (val !== filterCategory) return false;
      }

      // Payment method filter
      if (filterPayment) {
        if (!metodoCol) return true;
        const val = String(row[metodoCol] || '').trim();
        if (val !== filterPayment) return false;
      }

      return true;
    });
  }, [rows, dateFrom, dateTo, priceFrom, priceTo, filterCategory, filterPayment, fechaCol, priceCol, categoriaCol, metodoCol]);

  const hasActiveFilters = dateFrom || dateTo || priceFrom || priceTo || filterCategory || filterPayment;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPriceFrom('');
    setPriceTo('');
    setFilterCategory('');
    setFilterPayment('');
  };

  // Calculate specific totals (using filtered rows)
  const calculations = useMemo(() => {
    // Find specific columns
    const importeCol = findColumn(['importe', 'base', 'subtotal', 'neto']);
    const ivaCol = findColumn(['iva']);
    const totalCol = findColumn(['total']);

    let importeTotal = 0;
    let ivaTotal = 0;
    let totalGeneral = 0;

    filteredRows.forEach((row) => {
      // Calculate Importe (base sin IVA)
      if (importeCol) {
        importeTotal += parseNumber(row[importeCol]);
      }
      
      // Calculate IVA
      if (ivaCol) {
        ivaTotal += parseNumber(row[ivaCol]);
      }
      
      // Calculate Total (con IVA)
      if (totalCol) {
        totalGeneral += parseNumber(row[totalCol]);
      }
    });

    // If we don't have a total column but have importe and IVA, calculate it
    if (!totalCol && importeCol && ivaCol) {
      totalGeneral = importeTotal + ivaTotal;
    }
    
    // If we only have total, that's our main number
    if (totalCol && !importeCol && !ivaCol) {
      importeTotal = 0;
      ivaTotal = 0;
    }

    return {
      importe: { value: importeTotal, column: importeCol },
      iva: { value: ivaTotal, column: ivaCol },
      total: { value: totalGeneral, column: totalCol },
    };
  }, [headers, filteredRows]);

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <Header
        title="Contabilidad"
        subtitle="Gestion financiera y facturacion"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Total Registros */}
          <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg items-center justify-center">
                <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Facturas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredRows.length}{hasActiveFilters ? ` / ${rows.length}` : ''}
                </p>
              </div>
            </div>
          </div>
          
          {/* Importe (Base sin IVA) */}
          {calculations.importe.column && (
            <div className="bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Base Imponible</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculations.importe.value)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* IVA */}
          {calculations.iva.column && (
            <div className="bg-white dark:bg-black/30 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg items-center justify-center">
                  <Percent className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total IVA</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(calculations.iva.value)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Total (con IVA) */}
          {(calculations.total.column || (calculations.importe.column && calculations.iva.column)) && (
            <div className="bg-white dark:bg-black/30 border border-green-200 dark:border-green-500/20 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total (con IVA)</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(calculations.total.value)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info about calculations */}
        {!calculations.importe.column && !calculations.iva.column && !calculations.total.column && rows.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
            <p className="text-yellow-800 dark:text-yellow-400 text-sm">
              No se encontraron columnas de importes. Asegurate de tener columnas con nombres como "Importe", "IVA" o "Total" para ver los calculos automaticos.
            </p>
          </div>
        )}

        {/* Filter Toggle & Panel */}
        <div className="mb-4">
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
                {[dateFrom || dateTo, priceFrom || priceTo, filterCategory, filterPayment].filter(Boolean).length}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="mt-3 bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
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

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Precio min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Precio max
                  </label>
                  <input
                    type="number"
                    placeholder="999999"
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                  />
                </div>

                {/* Category */}
                {uniqueCategories.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Categoria
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="">Todas</option>
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment Method */}
                {metodoCol && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Metodo de pago
                    </label>
                    <select
                      value={filterPayment}
                      onChange={(e) => setFilterPayment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="">Todos</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Clear filters */}
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
          showStatusSelectors={false}
        />
      </div>
    </>
  );
}
