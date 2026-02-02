'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import { Receipt, Percent, Calculator, Filter } from 'lucide-react';
import { exportToExcel } from '@/lib/exportUtils';
import { TableSkeleton, StatsCardSkeleton } from '@/components/Skeleton';

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

  const fetchTabs = useCallback(async () => {
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
  }, [activeTab]);

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

  const handleExport = (displayedRows?: Record<string, string | number>[]) => {
    const dataToExport = displayedRows || filteredRows;
    exportToExcel(dataToExport, headers, {
      filename: 'contabilidad',
      sheetName: activeTab || 'Contabilidad'
    });
  };

  const findColumn = useCallback((possibleNames: string[]) => {
    return headers.find(h =>
      possibleNames.some(name => h.toLowerCase().includes(name))
    );
  }, [headers]);

  const parseNumber = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const ddmmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (ddmmMatch) {
      const day = parseInt(ddmmMatch[1]);
      const month = parseInt(ddmmMatch[2]) - 1;
      let year = parseInt(ddmmMatch[3]);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }
    const isoDate = new Date(str);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  };

  const filteredRows = useMemo(() => {
    let result = [...rows];
    const fechaCol = findColumn(['fecha']);
    const importeCol = findColumn(['importe', 'base', 'subtotal', 'neto']);

    if (dateFrom && fechaCol) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((row) => {
        const rowDate = parseFilterDate(String(row[fechaCol] || ''));
        return rowDate && rowDate >= from;
      });
    }

    if (dateTo && fechaCol) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((row) => {
        const rowDate = parseFilterDate(String(row[fechaCol] || ''));
        return rowDate && rowDate <= to;
      });
    }

    if (priceFrom) {
      result = result.filter((row) => {
        if (!importeCol) return true;
        return parseNumber(row[importeCol]) >= parseFloat(priceFrom);
      });
    }

    if (priceTo) {
      result = result.filter((row) => {
        if (!importeCol) return true;
        return parseNumber(row[importeCol]) <= parseFloat(priceTo);
      });
    }

    return result;
  }, [rows, findColumn, dateFrom, dateTo, priceFrom, priceTo]);

  const hasActiveFilters = dateFrom || dateTo || priceFrom || priceTo;

  // Calculate totals
  const calculations = useMemo(() => {
    const importeCol = findColumn(['importe', 'base', 'subtotal', 'neto']);
    const ivaCol = findColumn(['iva']);
    const totalCol = findColumn(['total']);

    let importeTotal = 0;
    let ivaTotal = 0;
    let totalFacturas = 0;

    filteredRows.forEach((row) => {
      if (importeCol) importeTotal += parseNumber(row[importeCol]);
      if (ivaCol) ivaTotal += parseNumber(row[ivaCol]);
      if (totalCol) {
        totalFacturas += parseNumber(row[totalCol]);
      } else if (importeCol && ivaCol) {
        totalFacturas += parseNumber(row[importeCol]) + parseNumber(row[ivaCol]);
      }
    });

    return {
      base: importeTotal,
      iva: ivaTotal,
      total: totalFacturas
    };
  }, [findColumn, filteredRows]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Contabilidad"
        subtitle="Gestión financiera y facturación"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <TabSelector
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gold/20 rounded-2xl p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-gold" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">Base Imponible</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(calculations.base)}
                  </p>
                </div>

                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gold/20 rounded-2xl p-6 shadow-sm animate-fade-in [animation-delay:100ms]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Percent className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">IVA Total</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(calculations.iva)}
                  </p>
                </div>

                <div className="bg-white dark:bg-white/[0.03] border border-gold/40 rounded-2xl p-6 shadow-md shadow-gold/5 animate-fade-in [animation-delay:200ms]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-gold" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest text-gold">Total Facturado</p>
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-gold tracking-tight">
                    {formatCurrency(calculations.total)}
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
                    : 'bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-2xl animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Fecha Desde</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Fecha Hasta</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Importe Min</label>
                  <input type="number" placeholder="0.00" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Importe Max</label>
                  <input type="number" placeholder="99k" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-xl text-sm" />
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              headers={headers}
              rows={filteredRows}
              onUpdate={handleUpdate}
              onExport={handleExport}
              isLoading={isLoading}
              showStatusSelectors={false}
              pageType="contabilidad"
            />
          )}
        </div>
      </main>
    </div>
  );
}
