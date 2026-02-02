'use client';

import { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Clock, Edit2, Save, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface DetailSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    data: Record<string, string | number>;
    headers: string[];
    onUpdate?: (values: string[]) => Promise<void>;
    type?: string;
    startInEditMode?: boolean;
}

export function DetailSidePanel({
    isOpen,
    onClose,
    data,
    headers,
    onUpdate,
    type = 'Registro',
    startInEditMode = false
}: DetailSidePanelProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(startInEditMode);
    const [editedValues, setEditedValues] = useState<Record<string, string>>(() => {
        if (startInEditMode) {
            const values: Record<string, string> = {};
            headers.forEach((header) => {
                values[header] = String(data[header] || '');
            });
            return values;
        }
        return {};
    });
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when panel opens/closes or startInEditMode changes
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen && startInEditMode) {
            setIsEditing(true);
            const values: Record<string, string> = {};
            headers.forEach((header) => {
                values[header] = String(data[header] || '');
            });
            setEditedValues(values);
        } else if (!isOpen) {
            setIsEditing(false);
            setEditedValues({});
        }
    }

    if (!isOpen) return null;

    // Filter internal fields
    const visibleHeaders = headers.filter(h => {
        const low = h.toLowerCase();
        return low !== 'id' && low !== 'rowindex';
    });

    const getIcon = (header: string) => {
        const h = header.toLowerCase();
        if (h.includes('nombre') || h.includes('cliente')) return <User className="w-4 h-4" />;
        if (h.includes('tel') || h.includes('móvil')) return <Phone className="w-4 h-4" />;
        if (h.includes('email') || h.includes('correo')) return <Mail className="w-4 h-4" />;
        if (h.includes('dirección') || h.includes('pueblo')) return <MapPin className="w-4 h-4" />;
        if (h.includes('fecha')) return <Calendar className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
    };

    const startEditing = () => {
        const values: Record<string, string> = {};
        headers.forEach((header) => {
            values[header] = String(data[header] || '');
        });
        setEditedValues(values);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedValues({});
    };

    const handleSave = async () => {
        if (!onUpdate) return;
        setIsSaving(true);
        try {
            const values = headers.map((header) => editedValues[header] || '');
            await onUpdate(values);
            toast({
                type: 'success',
                title: 'Registro actualizado',
                message: 'Los cambios se han guardado correctamente en Google Sheets.'
            });
            setIsEditing(false);
            setEditedValues({});
            onClose();
        } catch {
            toast({
                type: 'error',
                title: 'Error al guardar',
                message: 'No se pudieron guardar los cambios. Por favor, intenta de nuevo.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        setEditedValues({});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={handleClose}
            />

            {/* Side Panel */}
            <div className="relative w-full max-w-xl bg-white dark:bg-[#0a0a0a] shadow-2xl transition-transform duration-500 transform animate-in slide-in-from-right-full">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 dark:border-gold/10 flex items-center justify-between bg-gradient-to-r from-transparent to-gold/5">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="w-4 h-4 text-gold" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">
                                    {isEditing ? `Editando ${type}` : `${type} Detalle`}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                {isEditing
                                    ? (editedValues[headers.find(h => h.toLowerCase().includes('nombre')) || headers[0]] || 'Detalle')
                                    : String(data[headers.find(h => h.toLowerCase().includes('nombre')) || headers[0]] || 'Detalle')
                                }
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-3 bg-gray-50 dark:bg-white/5 hover:bg-gold/10 hover:text-gold rounded-2xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                        {/* Main Info Blocks */}
                        <div className="grid grid-cols-1 gap-6">
                            {visibleHeaders.map((header) => (
                                <div key={header} className="group">
                                    <div className="flex items-center gap-2 mb-2 text-gray-400 dark:text-gray-500 group-hover:text-gold transition-colors">
                                        {getIcon(header)}
                                        <label className="text-[10px] font-black uppercase tracking-widest">{header}</label>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedValues[header] || ''}
                                            onChange={(e) =>
                                                setEditedValues((prev) => ({
                                                    ...prev,
                                                    [header]: e.target.value,
                                                }))
                                            }
                                            className="w-full p-4 bg-gray-50 dark:bg-white/[0.05] border-2 border-gold/30 focus:border-gold rounded-2xl text-base font-bold text-gray-900 dark:text-white leading-relaxed focus:outline-none transition-colors"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gold/10 rounded-2xl">
                                            <p className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                                                {String(data[header] || '-')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions / Integration (only show when NOT editing) */}
                        {!isEditing && (
                            <div className="pt-6 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones Directas</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => toast({ type: 'info', title: 'Función en desarrollo', message: 'La integración con WhatsApp estará disponible pronto.' })}
                                        className="flex flex-col items-center justify-center p-6 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-2xl transition-all gap-2"
                                    >
                                        <Phone className="w-6 h-6 text-green-500" />
                                        <span className="text-[10px] font-black uppercase text-green-700 dark:text-green-500">WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(`mailto:${data[headers.find(h => h.toLowerCase().includes('email')) || '']}`, '_blank')}
                                        className="flex flex-col items-center justify-center p-6 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl transition-all gap-2"
                                    >
                                        <Mail className="w-6 h-6 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-500">Enviar Email</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-gray-100 dark:border-gold/10 bg-gray-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={startInEditMode ? handleClose : cancelEditing}
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Guardando...' : startInEditMode ? 'Crear' : 'Guardar Cambios'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-red-500/5 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        Cerrar
                                    </button>
                                    {onUpdate && (
                                        <button
                                            onClick={startEditing}
                                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
