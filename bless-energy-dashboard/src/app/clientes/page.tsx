'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Tab {
  sheetId?: number;
  title?: string;
}

export default function ClientesPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'pdf'>('xlsx');

  const fetchTabs = async () => {
    try {
      const response = await fetch('/api/sheets/tabs?sheet=clientes');
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
      alert('Error al actualizar el registro');
    }
  };

  const handleExportExcel = () => {
    const exportData = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header) => {
        obj[header] = String(row[header] || '');
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.text('Bless Energy - Listado de Clientes', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, 30);

    // Prepare table data
    const tableData = rows.map((row) =>
      headers.map((header) => String(row[header] || ''))
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [212, 175, 55],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`clientes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      handleExportPDF();
    } else {
      handleExportExcel();
    }
  };

  const estadoKey = headers.find(h => h.toLowerCase().includes('estado')) || 'estado';

  return (
    <>
      <Header
        title="Clientes"
        subtitle="Base de datos de clientes"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total clientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{rows.length}</p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {rows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('pendiente')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Contactados</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-500">
              {rows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('contactado')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">En proceso</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              {rows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('proceso')).length}
            </p>
          </div>
          <div className="bg-white dark:bg-black/30 border border-green-200 dark:border-green-500/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Cerrados</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
              {rows.filter(r => String(r[estadoKey] || '').toLowerCase().includes('cerrado')).length}
            </p>
          </div>
        </div>

        {/* Tab selector if multiple tabs */}
        {tabs.length > 1 && (
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Export format selector */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Formato de exportación:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat('xlsx')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                exportFormat === 'xlsx'
                  ? 'bg-gold text-black'
                  : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/50'
              }`}
            >
              Excel
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                exportFormat === 'pdf'
                  ? 'bg-gold text-black'
                  : 'bg-gray-100 dark:bg-black/30 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gold/20 hover:border-gold/50'
              }`}
            >
              PDF
            </button>
          </div>
        </div>

        <DataTable
          headers={headers}
          rows={rows}
          onUpdate={handleUpdate}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
