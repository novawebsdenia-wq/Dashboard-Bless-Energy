'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    AlignLeft,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    isToday,
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/context/ToastContext';

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
}

export default function CalendarioPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/calendar');
            const data = await response.json();
            if (data.success) {
                setEvents(data.data);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast({
                type: 'error',
                title: 'Error de Calendario',
                message: 'No se pudieron cargar las citas de Google Calendar.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all border border-gray-100 dark:border-gold/10"
                    >
                        <ChevronLeft className="w-5 h-5 text-gold" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gold hover:bg-gold/10 rounded-xl transition-all border border-gold/20"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all border border-gray-100 dark:border-gold/10"
                    >
                        <ChevronRight className="w-5 h-5 text-gold" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            {day}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const dayEvents = events.filter(event => {
                    const eventDate = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? parseISO(event.start.date) : null);
                    return eventDate && isSameDay(eventDate, cloneDay);
                });

                days.push(
                    <div
                        key={day.toString()}
                        className={`min-h-[120px] p-2 border-t border-r border-gray-100 dark:border-gold/10 transition-all cursor-pointer relative group ${!isSameMonth(day, monthStart) ? 'bg-gray-50/30 dark:bg-transparent opacity-20' : ''
                            } ${isSameDay(day, selectedDate) ? 'bg-gold/5 dark:bg-gold/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-black ${isToday(day)
                                    ? 'w-6 h-6 flex items-center justify-center bg-gold text-black rounded-full'
                                    : isSameDay(day, selectedDate) ? 'text-gold' : 'text-gray-500'
                                }`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                            {dayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="px-1.5 py-0.5 bg-gold/10 border-l-2 border-gold rounded text-[9px] font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1"
                                    title={event.summary}
                                >
                                    <Clock className="w-2 h-2 text-gold shrink-0" />
                                    <span className="truncate">{event.summary}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedDate(cloneDay); setIsAddModalOpen(true); }}
                            className="absolute bottom-2 right-2 p-1 bg-gold text-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 active:scale-95"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7 border-l border-gray-100 dark:border-gold/10 border-b">
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="border border-gray-100 dark:border-gold/10 rounded-2xl overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-md">{rows}</div>;
    };

    const selectedDayEvents = events.filter(event => {
        const eventDate = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? parseISO(event.start.date) : null);
        return eventDate && isSameDay(eventDate, selectedDate);
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-black overflow-hidden relative">
            <Header
                title="Calendario"
                subtitle="Gestión de citas y eventos"
                onRefresh={fetchEvents}
                isLoading={isLoading}
            />

            <main className="flex-1 p-8 overflow-y-auto custom-scrollbar flex gap-8">
                <div className="flex-1 max-w-[1200px]">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>

                {/* Side Panel for Selected Day */}
                <div className="w-80 shrink-0">
                    <div className="bg-white dark:bg-black p-6 rounded-3xl border border-gray-200 dark:border-gold/20 shadow-xl shadow-gold/5 sticky top-0">
                        <div className="mb-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-1">Agenda del Día</p>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                {format(selectedDate, "d 'de' MMMM", { locale: es })}
                            </h3>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {selectedDayEvents.length === 0 ? (
                                <div className="py-12 text-center opacity-40">
                                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500">No hay citas para hoy</p>
                                </div>
                            ) : (
                                selectedDayEvents.map(event => (
                                    <div key={event.id} className="group p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gold/10 rounded-2xl hover:border-gold/30 transition-all">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                            {event.summary}
                                        </h4>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                                <Clock className="w-3 h-3 text-gold" />
                                                <span>
                                                    {event.start.dateTime
                                                        ? format(parseISO(event.start.dateTime), 'HH:mm')
                                                        : 'Todo el día'}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                                    <MapPin className="w-3 h-3 text-gold" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                            {event.description && (
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                                    <AlignLeft className="w-3 h-3 text-gold" />
                                                    <span className="truncate">{event.description}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-gold to-gold-dark text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Cita
                        </button>
                    </div>
                </div>
            </main>

            {/* Basic Add Modal (for now) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-black w-full max-w-md rounded-3xl border border-gray-200 dark:border-gold/30 shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Nueva Cita</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast({ type: 'info', title: 'Funcionalidad en desarrollo', message: 'Estamos terminando la conexión de escritura con Google Calendar.' }); setIsAddModalOpen(false); }}>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Título</label>
                                <input type="text" required placeholder="Ej: Visita Instalación Sol" className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-gold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hora Inicio</label>
                                    <input type="time" required className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-gold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duración</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-sm font-bold focus:outline-none focus:border-gold">
                                        <option>30 min</option>
                                        <option>1 hora</option>
                                        <option>2 horas</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-gold text-black text-[10px] font-black uppercase tracking-widest rounded-2xl mt-4">
                                Confirmar Cita
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
