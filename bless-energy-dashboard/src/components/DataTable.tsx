'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
  Download,
} from 'lucide-react';

// Status options for different fields
const STATUS_OPTIONS = ['Pendiente', 'Contactado', 'En proceso', 'Cerrado', 'Cancelado'];
const PRIORITY_OPTIONS_EMAIL = ['Baja', 'Normal', 'Media', 'Alta', 'Critica'];
const PRIORITY_OPTIONS_DEFAULT = ['Baja', 'Media', 'Alta'];
const CLIENT_STATUS_OPTIONS = ['Nuevo', 'Activo', 'En proceso', 'Inactivo'];

interface DataTableProps {
  headers: string[];
  rows: Record<string, string | number>[];
  onUpdate?: (rowIndex: number, values: string[]) => Promise<void>;
  onExport?: () => void;
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
    const values = headers.map((h) => {
      if (h === header) return newValue;
      return String(row[h] || '');
    });

    setIsSaving(true);
    try {
      await onUpdate(rowIndex, values);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExport) {
      onExport();
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

              // Get first visible field as card title
              const titleHeader = visibleHeaders[0];
              const titleValue = String(row[titleHeader] || '-');

              return (
                <div
                  key={row.id || index}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gold/5 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gold/10">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      {titleValue}
                    </h3>
                    {onUpdate && (
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSave(actualRowIndex)}
                              disabled={isSaving}
                              className="p-1.5 text-green-500 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1.5 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(actualRowIndex, row)}
                            className="p-1.5 text-gold hover:bg-gold/20 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Fields */}
                  <div className="space-y-3">
                    {visibleHeaders.slice(1).map((header) => {
                      const fieldType = getFieldType(header);
                      const options = getOptionsForField(header);
                      const currentValue = String(row[header] || '');
                      const showAsBadge = shouldShowAsBadge(header);

                      return (
                        <div key={header} className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {header}
                          </label>
                          <div className="text-sm text-gray-900 dark:text-white">
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
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gold/30 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gold"
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
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/50 border border-gold/30 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gold"
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
                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 ${getStatusClass(currentValue)}`}
                              >
                                <option value="">Seleccionar...</option>
                                {options.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="break-words">
                                {currentValue || '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      const currentValue = String(row[header] || '');
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
  if (s.includes('critica') || s.includes('crítica')) {
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
