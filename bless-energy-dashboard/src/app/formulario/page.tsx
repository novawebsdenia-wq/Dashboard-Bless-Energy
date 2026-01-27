'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import TabSelector from '@/components/TabSelector';
import * as XLSX from 'xlsx';

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
    XLSX.utils.book_append_sheet(wb, ws, 'Formulario Web');
    XLSX.writeFile(wb, `formulario_web_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const estadoKey = headers.find(h => h.toLowerCase().includes('estado')) || 'estado';

  return (
    <>
      <Header
        title="Formulario Web"
        subtitle="Contactos del formulario de la página web"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total registros</p>
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
