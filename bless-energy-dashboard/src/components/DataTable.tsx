'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Save,
  X,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useNotifications } from '@/context/NotificationContext';
import { DetailSidePanel } from './DetailSidePanel';

import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS_EMAIL,
  PRIORITY_OPTIONS_DEFAULT,
  CLIENT_STATUS_OPTIONS
} from '@/lib/constants';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string | number>[];
  onUpdate?: (rowIndex: number, values: string[]) => Promise<void>;
  onExport?: (displayedRows?: Record<string, string | number>[]) => void;
  isLoading?: boolean;
  showStatusSelectors?: boolean;
  pageType?: 'emails' | 'clientes' | 'formulario' | 'calculadora' | 'contabilidad' | 'default';
}

export default function DataTable({
  headers,
  rows,
  onUpdate,
  onExport,
  isLoading,
  showStatusSelectors = true,
  pageType = 'default',
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  // Optimistic updates - store temporary values while saving
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { refreshNotifications } = useNotifications();

  // Detail View State
  const [selectedRowForDetail, setSelectedRowForDetail] = useState<Record<string, string | number> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const rowsPerPage = 10;

  // Determine which fields should have special rendering
  const getFieldType = (header: string): 'text' | 'status' | 'priority' => {
    const h = header.toLowerCase();
    if (h.includes('estado')) return 'status';
    if (h.includes('prioridad')) return 'priority';
    return 'text';
  };

  // Check if this is a priority/status field that should show as badge (read-only display)
  const shouldShowAsBadge = (header: string): boolean => {
    const h = header.toLowerCase();
    // For emails page, priority should be displayed as badge (from sheet data)
    if (pageType === 'emails' && h.includes('prioridad')) return true;
    return false;
  };

  const getOptionsForField = (header: string): string[] => {
    const h = header.toLowerCase();
    if (h.includes('estado')) {
      if (headers.some(hdr => hdr.toLowerCase().includes('direccion'))) {
        return CLIENT_STATUS_OPTIONS;
      }
      return STATUS_OPTIONS;
    }
    if (h.includes('prioridad')) {
      // For emails, use the extended priority options
      if (pageType === 'emails') {
        return PRIORITY_OPTIONS_EMAIL;
      }
      return PRIORITY_OPTIONS_DEFAULT;
    }
    return [];
  };

  // Filter internal fields that shouldn't be displayed
  const isInternalField = (header: string): boolean => {
    const h = header.toLowerCase();
    return h === 'id' || h === 'rowindex';
  };

  // Check if a value is a URL
  const isUrl = (value: string): boolean => {
    return /^https?:\/\/.+/i.test(value.trim());
  };

  // Check if a header is a link-type field
  const isLinkField = (header: string): boolean => {
    const h = header.toLowerCase();
    return h.includes('link') || h.includes('url') || h.includes('enlace');
  };

  // Get visible headers (excluding internal fields)
  const visibleHeaders = useMemo(() => {
    return headers.filter(h => !isInternalField(h));
  }, [headers]);

  // Filter and sort data
  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = String(a[sortConfig.key] || '');
        const bVal = String(b[sortConfig.key] || '');
        if (sortConfig.direction === 'asc') {
          return aVal.localeCompare(bVal);
        }
        return bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [rows, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleEdit = (rowIndex: number, row: Record<string, string | number>) => {
    setEditingRow(rowIndex);
    const values: Record<string, string> = {};
    headers.forEach((header) => {
      values[header] = String(row[header] || '');
    });
    setEditedValues(values);
  };

  const handleSave = async (rowIndex: number) => {
    if (onUpdate) {
      setIsSaving(true);
      try {
        const values = headers.map((header) => editedValues[header] || '');
        await onUpdate(rowIndex, values);
        refreshNotifications();
        toast({
          type: 'success',
          title: 'Registro actualizado',
          message: 'Los cambios se han guardado correctamente en Google Sheets.'
        });
      } catch {
        toast({
          type: 'error',
          title: 'Error al guardar',
          message: 'No se pudieron guardar los cambios. Por favor, intenta de nuevo.'
        });
      } finally {
        setIsSaving(false);
      }
    }
    setEditingRow(null);
    setEditedValues({});
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedValues({});
  };

  // Quick status change without full edit mode
  const handleQuickStatusChange = async (
    row: Record<string, string | number>,
    header: string,
    newValue: string
  ) => {
    if (!onUpdate) return;

    const rowIndex = Number(row.rowIndex) || 0;
    const optimisticKey = `${rowIndex}-${header}`;

    // Set optimistic update immediately for instant UI feedback
    setOptimisticUpdates(prev => ({ ...prev, [optimisticKey]: newValue }));

    const values = headers.map((h) => {
      if (h === header) return newValue;
      return String(row[h] || '');
    });

    setIsSaving(true);
    try {
      await onUpdate(rowIndex, values);
      refreshNotifications();
    } finally {
      setIsSaving(false);
      // Clear optimistic update after save completes (data will be refreshed)
      setOptimisticUpdates(prev => {
        const updated = { ...prev };
        delete updated[optimisticKey];
        return updated;
      });
    }
  };

  // Helper to get the current value (optimistic or actual)
  const getCurrentValue = (row: Record<string, string | number>, header: string): string => {
    const rowIndex = Number(row.rowIndex) || 0;
    const optimisticKey = `${rowIndex}-${header}`;
    if (optimisticUpdates[optimisticKey] !== undefined) {
      return optimisticUpdates[optimisticKey];
    }
    return String(row[header] || '');
  };

  const handleExportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExport) {
      toast({
        type: 'info',
        title: 'Iniciando exportación',
        message: 'Estamos preparando tu archivo de descarga...'
      });
      onExport(filteredRows);
      toast({
        type: 'success',
        title: 'Exportación completada',
        message: 'El archivo se ha generado correctamente.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gold/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gold/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredRows.length} registros
          </span>
          {onExport && (
            <button
              type="button"
              onClick={handleExportClick}
              className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-gold hover:bg-gold/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gold/10">
        {paginatedRows.length === 0 ? (
          <div className="p-12 text-center text-gray-500 opacity-50 font-medium">
            No se encontraron registros
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gold/5">
            {paginatedRows.map((row, index) => {
              const actualRowIndex = Number(row.rowIndex) || index + 2;
              const isEditing = editingRow === actualRowIndex;
              const isExpanded = expandedCard === actualRowIndex || isEditing;

              // Find key fields for compact preview
              const nameHeader = visibleHeaders.find(h => h.toLowerCase().includes('nombre') || h.toLowerCase().includes('proveedor')) || visibleHeaders[0];
              const dateHeader = visibleHeaders.find(h => h.toLowerCase().includes('fecha'));
              const emailHeader = visibleHeaders.find(h => h.toLowerCase().includes('email') || h.toLowerCase().includes('correo'));
              const statusHeader = visibleHeaders.find(h => h.toLowerCase().includes('estado'));

              const nameValue = String(row[nameHeader] || '-');
              const dateValue = dateHeader ? String(row[dateHeader] || '') : '';
              const emailValue = emailHeader ? String(row[emailHeader] || '') : '';
              const statusValue = statusHeader ? getCurrentValue(row, statusHeader) : '';

              // Fields to show in expanded view (exclude those already in preview)
              const previewKeys = new Set([nameHeader, dateHeader, emailHeader, statusHeader].filter(Boolean));
              const expandedHeaders = visibleHeaders.filter(h => !previewKeys.has(h));

              return (
                <div
                  key={row.id || index}
                  className="animate-fade-in"
                >
                  {/* Compact Preview */}
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer active:bg-gold/5"
                    onClick={() => {
                      if (!isEditing) setExpandedCard(isExpanded ? null : actualRowIndex);
                    }}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate uppercase tracking-tight">
                          {nameValue}
                        </p>
                        {statusValue && !isExpanded && (
                          <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm ${getStatusClass(statusValue)}`}>
                            {statusValue}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {dateValue && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateValue}</p>
                        )}
                        {emailValue && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate italic">{emailValue}</p>
                        )}
                      </div>
                    </div>

                    <div className={`p-2 rounded-xl bg-gray-50 dark:bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-gold/10' : ''}`}>
                      <ChevronDown className={`w-4 h-4 text-gray-400 ${isExpanded ? 'text-gold' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="glass rounded-2xl p-5 space-y-4 shadow-xl shadow-black/5 animate-in slide-in-from-top-2 duration-300">
                        {/* Status selector (always show if available) */}
                        {statusHeader && (
                          <div className="flex items-center justify-between gap-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                              {statusHeader}
                            </label>
                            {isEditing ? (
                              <select
                                value={editedValues[statusHeader] || ''}
                                onChange={(e) =>
                                  setEditedValues((prev) => ({
                                    ...prev,
                                    [statusHeader]: e.target.value,
                                  }))
                                }
                                className="px-3 py-2 bg-white dark:bg-black/60 border border-gold/30 rounded-xl text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white focus:outline-none"
                              >
                                <option value="">Seleccionar...</option>
                                {getOptionsForField(statusHeader).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : onUpdate ? (
                              <select
                                value={statusValue}
                                onChange={(e) => handleQuickStatusChange(row, statusHeader, e.target.value)}
                                disabled={isSaving}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border-0 cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-gold/10 ${getStatusClass(statusValue)}`}
                              >
                                <option value="">Seleccionar...</option>
                                {getOptionsForField(statusHeader).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getStatusClass(statusValue)}`}>
                                {statusValue || '-'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Other fields */}
                        <div className="grid grid-cols-1 gap-4 pt-2">
                          {expandedHeaders.map((header) => {
                            const fieldType = getFieldType(header);
                            const options = getOptionsForField(header);
                            const currentValue = getCurrentValue(row, header);
                            const showAsBadge = shouldShowAsBadge(header);

                            return (
                              <div key={header} className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                                  {header}
                                </label>
                                <div className="text-sm font-medium">
                                  {isEditing ? (
                                    fieldType !== 'text' && showStatusSelectors ? (
                                      <select
                                        value={editedValues[header] || ''}
                                        onChange={(e) =>
                                          setEditedValues((prev) => ({
                                            ...prev,
                                            [header]: e.target.value,
                                          }))
                                        }
                                        className="w-full px-3 py-2 bg-white dark:bg-black/60 border border-gold/30 rounded-xl text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white focus:outline-none"
                                      >
                                        <option value="">Seleccionar...</option>
                                        {options.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={editedValues[header] || ''}
                                        onChange={(e) =>
                                          setEditedValues((prev) => ({
                                            ...prev,
                                            [header]: e.target.value,
                                          }))
                                        }
                                        className="w-full px-3 py-2 bg-white dark:bg-black/60 border border-gold/30 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
                                      />
                                    )
                                  ) : showAsBadge || (fieldType === 'priority' && pageType === 'emails') ? (
                                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm ${getPriorityClass(currentValue)}`}>
                                      {currentValue || '-'}
                                    </span>
                                  ) : fieldType !== 'text' && showStatusSelectors && onUpdate ? (
                                    <select
                                      value={currentValue}
                                      onChange={(e) => handleQuickStatusChange(row, header, e.target.value)}
                                      disabled={isSaving}
                                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border-0 shadow-sm focus:outline-none ${getStatusClass(currentValue)}`}
                                    >
                                      <option value="">Seleccionar...</option>
                                      {options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (isLinkField(header) || isUrl(currentValue)) && currentValue ? (
                                    <a
                                      href={currentValue}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 text-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold/20 transition-all active:scale-95"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Ver factura
                                    </a>
                                  ) : (
                                    <p className="text-gray-900 dark:text-gray-100 break-words leading-relaxed text-sm">
                                      {currentValue || '-'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Edit actions */}
                        {onUpdate && (
                          <div className="pt-4 border-t border-gray-100 dark:border-gold/10 flex justify-end gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleCancel}
                                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSave(actualRowIndex)}
                                  disabled={isSaving}
                                  className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-gold to-gold-dark text-black rounded-xl shadow-lg shadow-gold/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(actualRowIndex, row);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 rounded-xl hover:bg-gold/20 transition-all active:scale-95"
                              >
                                <Edit2 className="w-3 h-3" />
                                Editar Registro
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gold/10">
              {visibleHeaders.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className="px-6 py-4 text-left group cursor-pointer transition-colors hover:bg-gold/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover:text-gold transition-colors">
                      {header}
                    </span>
                    {sortConfig?.key === header ? (
                      <span className="text-gold animate-in fade-in slide-in-from-bottom-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-all" />
                    )}
                  </div>
                </th>
              ))}
              {onUpdate && (
                <th className="px-6 py-4 text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                    Acciones
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gold/5">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleHeaders.length + (onUpdate ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <Search className="w-8 h-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-500">No se encontraron registros</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const actualRowIndex = Number(row.rowIndex) || index + 2;
                const isEditing = editingRow === actualRowIndex;

                return (
                  <tr
                    key={row.id || index}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedRowForDetail(row);
                        setIsDetailOpen(true);
                      }
                    }}
                    className="group hover:bg-gold/[0.02] dark:hover:bg-gold/[0.03] transition-colors cursor-pointer"
                  >
                    {visibleHeaders.map((header) => {
                      const fieldType = getFieldType(header);
                      const options = getOptionsForField(header);
                      const currentValue = getCurrentValue(row, header);
                      const showAsBadge = shouldShowAsBadge(header);

                      return (
                        <td key={header} className="px-6 py-4 transition-transform duration-300 group-hover:translate-x-0.5">
                          {isEditing ? (
                            (() => {
                              const options = getOptionsForField(header);
                              if (options.length > 0) {
                                return (
                                  <select
                                    value={editedValues[header] || ''}
                                    onChange={(e) =>
                                      setEditedValues((prev) => ({
                                        ...prev,
                                        [header]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-1.5 bg-white dark:bg-black/60 border border-gold/30 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/20"
                                  >
                                    <option value="">Seleccionar...</option>
                                    {options.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                );
                              }
                              return (
                                <input
                                  type="text"
                                  value={editedValues[header] || ''}
                                  onChange={(e) =>
                                    setEditedValues((prev) => ({
                                      ...prev,
                                      [header]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-1.5 bg-white dark:bg-black/60 border border-gold/30 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/20"
                                />
                              );
                            })()
                          ) : showAsBadge || (fieldType === 'priority' && pageType === 'emails') ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm ${getPriorityClass(currentValue)}`}>
                              {currentValue || '-'}
                            </span>
                          ) : fieldType !== 'text' && showStatusSelectors && onUpdate ? (
                            <select
                              value={currentValue}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => { e.stopPropagation(); handleQuickStatusChange(row, header, e.target.value); }}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-tight border-0 cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gold/10 ${getStatusClass(currentValue)}`}
                            >
                              <option value="">Seleccionar...</option>
                              {options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (isLinkField(header) || isUrl(currentValue)) && currentValue ? (
                            <a
                              href={currentValue}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-gold font-bold hover:text-gold-light transition-all hover:translate-x-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-xs uppercase tracking-widest">Factura</span>
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs block leading-relaxed">
                              {currentValue || '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {onUpdate && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(actualRowIndex)}
                                disabled={isSaving}
                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(actualRowIndex, row)}
                              className="p-2.5 text-gold hover:bg-gold/10 rounded-xl transition-all active:scale-90"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 bg-gray-50/30 dark:bg-white/[0.01] border-t border-gray-100 dark:border-gold/5 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Página <span className="text-gold">{currentPage}</span> de {totalPages}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 text-gray-400 hover:text-gold dark:hover:text-gold-light bg-white dark:bg-black/40 border border-gray-200 dark:border-gold/10 rounded-xl shadow-sm transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 text-gray-400 hover:text-gold dark:hover:text-gold-light bg-white dark:bg-black/40 border border-gray-200 dark:border-gold/10 rounded-xl shadow-sm transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Slide-over */}
      {selectedRowForDetail && (
        <DetailSidePanel
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={selectedRowForDetail}
          headers={headers}
          type={pageType === 'emails' ? 'Email' : pageType === 'clientes' ? 'Cliente' : 'Lead'}
          onUpdate={onUpdate ? async (values) => {
            const rowIndex = Number(selectedRowForDetail.rowIndex) || 0;
            await onUpdate(rowIndex, values);
          } : undefined}
        />
      )}
    </div>
  );
}

// Get class for priority badges (for emails)
function getPriorityClass(priority: string): string {
  const p = priority?.toLowerCase() || '';

  if (p.includes('critica') || p.includes('crítica')) {
    return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
  }
  if (p.includes('urgente')) {
    return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
  }
  if (p.includes('alta')) {
    return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  }
  if (p.includes('media')) {
    return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400';
  }
  if (p.includes('normal')) {
    return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
  }
  if (p.includes('baja')) {
    return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
  }
  return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
}

// Get class for status selectors
function getStatusClass(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s.includes('contactado') || s.includes('activo') || s.includes('cerrado')) {
    return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
  }
  if (s.includes('proceso')) {
    return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
  }
  if (s.includes('pendiente') || s.includes('nuevo')) {
    return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
  }
  if (s.includes('cancelado') || s.includes('inactivo')) {
    return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  }
  // Priority colors for selectors
  if (s.includes('critica') || s.includes('crítica') || s.includes('urgente')) {
    return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
  }
  if (s.includes('alta')) {
    return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  }
  if (s.includes('media')) {
    return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400';
  }
  if (s.includes('normal')) {
    return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
  }
  if (s.includes('baja')) {
    return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
  }
  return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
}
