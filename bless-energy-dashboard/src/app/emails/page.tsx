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

export default function EmailsPage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState('mails');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `emails_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <Header
        title="Emails"
        subtitle="Gestión de correos electrónicos"
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        <TabSelector
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <DataTable
          headers={headers}
          rows={rows}
          onUpdate={handleUpdate}
          onExport={handleExport}
          isLoading={isLoading}
          pageType="emails"
        />
      </div>
    </>
  );
}
