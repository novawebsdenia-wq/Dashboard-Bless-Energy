'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx';
import { Receipt, Percent, Calculator } from 'lucide-react';

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
    const exportData = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header) => {
        obj[header] = String(row[header] || '');
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab || 'Contabilidad');
    XLSX.writeFile(wb, `contabilidad_${activeTab || 'datos'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Calculate specific totals
  const calculations = useMemo(() => {
    // Find specific columns
    const importeCol = findColumn(['importe', 'base', 'subtotal', 'neto']);
    const ivaCol = findColumn(['iva']);
    const totalCol = findColumn(['total']);
    
    let importeTotal = 0;
    let ivaTotal = 0;
    let totalGeneral = 0;

    rows.forEach((row) => {
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
  }, [headers, rows]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Registros */}
          <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Facturas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rows.length}</p>
              </div>
            </div>
          </div>
          
          {/* Importe (Base sin IVA) */}
          {calculations.importe.column && (
            <div className="bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Base Imponible</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculations.importe.value)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* IVA */}
          {calculations.iva.column && (
            <div className="bg-white dark:bg-black/30 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total IVA</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(calculations.iva.value)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Total (con IVA) */}
          {(calculations.total.column || (calculations.importe.column && calculations.iva.column)) && (
            <div className="bg-white dark:bg-black/30 border border-green-200 dark:border-green-500/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total (con IVA)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
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

        {tabs.length > 1 && (
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        <DataTable
          headers={headers}
          rows={rows}
          onUpdate={handleUpdate}
          onExport={handleExport}
          isLoading={isLoading}
          showStatusSelectors={false}
        />
      </div>
    </>
  );
}
