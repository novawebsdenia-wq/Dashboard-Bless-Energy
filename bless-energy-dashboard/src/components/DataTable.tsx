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

// Status options for different fields
const STATUS_OPTIONS = ['Pendiente', 'Contactado', 'En proceso', 'Cerrado', 'Cancelado'];
const PRIORITY_OPTIONS_EMAIL = ['Baja', 'Normal', 'Media', 'Alta', 'Critica'];
const PRIORITY_OPTIONS_DEFAULT = ['Baja', 'Normal', 'Alta', 'Urgente'];
const CLIENT_STATUS_OPTIONS = ['Nuevo', 'Activo', 'En proceso', 'Inactivo'];

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
      onExport(filteredRows);
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
      <div className="md:hidden">
        {paginatedRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No se encontraron registros
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gold/10">
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
                  className="transition-colors"
                >
                  {/* Compact Preview - always visible */}
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer active:bg-gray-100 dark:active:bg-gold/10"
                    onClick={() => {
                      if (!isEditing) setExpandedCard(isExpanded ? null : actualRowIndex);
                    }}
                  >
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {nameValue}
                        </p>
                        {statusValue && !isExpanded && (
                          <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusClass(statusValue)}`}>
                            {statusValue}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {dateValue && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{dateValue}</span>
                        )}
                        {dateValue && emailValue && (
                          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                        )}
                        {emailValue && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{emailValue}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gold/10">
                        {/* Status selector (always show if available) */}
                        {statusHeader && (
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
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
                                className="px-3 py-1.5 bg-white dark:bg-black/50 border border-gold/30 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold"
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
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 ${getStatusClass(statusValue)}`}
                              >
                                <option value="">Seleccionar...</option>
                                {getOptionsForField(statusHeader).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(statusValue)}`}>
                                {statusValue || '-'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Other fields */}
                        {expandedHeaders.map((header) => {
                          const fieldType = getFieldType(header);
                          const options = getOptionsForField(header);
                          const currentValue = getCurrentValue(row, header);
                          const showAsBadge = shouldShowAsBadge(header);

                          return (
                            <div key={header} className="flex items-start justify-between gap-3">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-shrink-0 pt-1">
                                {header}
                              </label>
                              <div className="text-sm text-gray-900 dark:text-white text-right">
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
                                      className="px-3 py-1.5 bg-white dark:bg-black/50 border border-gold/30 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gold"
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
                                      className="w-full px-3 py-1.5 bg-white dark:bg-black/50 border border-gold/30 rounded-lg text-sm text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
                                    />
                                  )
                                ) : showAsBadge || (fieldType === 'priority' && pageType === 'emails') ? (
                                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityClass(currentValue)}`}>
                                    {currentValue || '-'}
                                  </span>
                                ) : fieldType !== 'text' && showStatusSelectors && onUpdate ? (
                                  <select
                                    value={currentValue}
                                    onChange={(e) => handleQuickStatusChange(row, header, e.target.value)}
                                    disabled={isSaving}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 ${getStatusClass(currentValue)}`}
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold rounded-lg text-xs font-medium hover:bg-gold/20 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Ver factura
                                  </a>
                                ) : (
                                  <span className="break-words">{currentValue || '-'}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Edit actions */}
                        {onUpdate && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gold/10 flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleCancel}
                                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSave(actualRowIndex)}
                                  disabled={isSaving}
                                  className="px-3 py-1.5 text-sm bg-gold text-black font-medium rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-50"
                                >
                                  Guardar
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(actualRowIndex, row);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gold hover:bg-gold/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
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
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-black/50">
              {visibleHeaders.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className="px-4 py-3 text-left text-sm font-semibold text-gold cursor-pointer hover:bg-gold/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    {sortConfig?.key === header && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {onUpdate && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gold">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleHeaders.length + (onUpdate ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const actualRowIndex = Number(row.rowIndex) || index + 2;
                const isEditing = editingRow === actualRowIndex;

                return (
                  <tr
                    key={row.id || index}
                    className="border-t border-gray-100 dark:border-gold/10 hover:bg-gray-50 dark:hover:bg-gold/5 transition-colors"
                  >
                    {visibleHeaders.map((header) => {
                      const fieldType = getFieldType(header);
                      const options = getOptionsForField(header);
                      const currentValue = getCurrentValue(row, header);
                      const showAsBadge = shouldShowAsBadge(header);

                      return (
                        <td key={header} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
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
                                className="w-full px-2 py-1 bg-gray-50 dark:bg-black/50 border border-gold/30 rounded text-gray-900 dark:text-white focus:outline-none focus:border-gold"
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
                                className="w-full px-2 py-1 bg-gray-50 dark:bg-black/50 border border-gold/30 rounded text-gray-900 dark:text-white focus:outline-none focus:border-gold"
                              />
                            )
                          ) : showAsBadge || (fieldType === 'priority' && pageType === 'emails') ? (
                            // Show as badge (read-only) for priorities in emails
                            <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getPriorityClass(currentValue)}`}>
                              {currentValue || '-'}
                            </span>
                          ) : fieldType !== 'text' && showStatusSelectors && onUpdate ? (
                            <select
                              value={currentValue}
                              onChange={(e) => handleQuickStatusChange(row, header, e.target.value)}
                              disabled={isSaving}
                              className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 ${getStatusClass(currentValue)}`}
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
                              className="inline-flex items-center gap-1 text-gold hover:text-gold/80 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver factura
                            </a>
                          ) : (
                            <span className="truncate max-w-xs block">
                              {currentValue || '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {onUpdate && (
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(actualRowIndex)}
                              disabled={isSaving}
                              className="p-1 text-green-500 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(actualRowIndex, row)}
                            className="p-1 text-gold hover:bg-gold/20 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
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
        <div className="p-4 border-t border-gray-200 dark:border-gold/20 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
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
