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
    Calendar as CalendarIcon,
    User,
    Navigation,
    FileText
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

interface Client {
    nombre: string;
    id?: string;
}

export default function CalendarioPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch Calendar Events
            const calRes = await fetch('/api/calendar');
            const calData = await calRes.json();
            if (calData.success) {
                setEvents(calData.data);
            }

            // Fetch Clients for selector
            const clientRes = await fetch('/api/sheets?sheet=clientes');
            const clientData = await clientRes.json();
            if (clientData.success) {
                // Headers are first row, data from second
                const nombreIdx = clientData.headers.findIndex((h: string) => h.toLowerCase().includes('nombre'));
                const clientList = clientData.rows.map((row: string[]) => ({
                    nombre: row[nombreIdx] || 'S/N'
                })).filter((c: any) => c.nombre !== 'S/N');
                setClients(clientList);
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            toast({
                type: 'error',
                title: 'Error de Sincronización',
                message: 'No se pudieron cargar los datos. Verifica la conexión con Google API.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const clientName = formData.get('client') as string;
        const address = formData.get('address') as string;
        const time = formData.get('time') as string;
        const duration = formData.get('duration') as string;
        const notes = formData.get('notes') as string;

        // Calculate start/end time
        const startDateTime = new Date(selectedDate);
        const [hours, minutes] = time.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes));

        const endDateTime = new Date(startDateTime);
        if (duration === '1 hora') endDateTime.setHours(endDateTime.getHours() + 1);
        else if (duration === '2 horas') endDateTime.setHours(endDateTime.getHours() + 2);
        else if (duration === '3 horas') endDateTime.setHours(endDateTime.getHours() + 3);
        else endDateTime.setMinutes(endDateTime.getMinutes() + 30);

        const fullTitle = clientName ? `${title} - ${clientName}` : title;

        setIsLoading(true);
        try {
            const response = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary: fullTitle,
                    location: address,
                    description: notes,
                    start: { dateTime: startDateTime.toISOString() },
                    end: { dateTime: endDateTime.toISOString() }
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    type: 'success',
                    title: 'Cita guardada',
                    message: 'La cita se ha sincronizado correctamente con Google Calendar.'
                });
                setIsAddModalOpen(false);
                fetchData();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                type: 'error',
                title: 'Error al guardar',
                message: 'No se pudo crear la cita. Revisa los permisos de Google Cloud.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white capitalize tracking-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-gold/10 shadow-sm w-full sm:w-auto overflow-x-auto">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-gold" />
                </button>
                <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/10 rounded-xl transition-all"
                >
                    Hoy
                </button>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"
                >
                    <ChevronRight className="w-5 h-5 text-gold" />
                </button>
            </div>
        </div>
    );

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        const daysNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
                        className={`min-h-[80px] sm:min-h-[120px] p-2 border-t border-r border-gray-100 dark:border-gold/10 transition-all cursor-pointer relative group ${!isSameMonth(day, monthStart) ? 'hidden sm:block bg-gray-50/30 dark:bg-transparent opacity-20' : ''
                            } ${isSameDay(day, selectedDate) ? 'bg-gold/5 dark:bg-gold/5 ring-1 ring-inset ring-gold/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] sm:text-xs font-black ${isToday(day)
                                    ? 'w-6 h-6 flex items-center justify-center bg-gold text-black rounded-full'
                                    : isSameDay(day, selectedDate) ? 'text-gold' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                {format(day, 'd')}
                            </span>
                            <span className="sm:hidden text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                                {daysNames[i]}
                            </span>
                        </div>
                        <div className="space-y-1 overflow-hidden">
                            {dayEvents.slice(0, 3).map(event => (
                                <div
                                    key={event.id}
                                    className="px-1 py-0.5 bg-gold/10 border-l-2 border-gold rounded text-[8px] font-bold text-gray-900 dark:text-gray-300 truncate"
                                >
                                    {event.summary}
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[7px] font-black text-gold text-center uppercase tracking-widest pt-1">
                                    +{dayEvents.length - 3} más
                                </div>
                            )}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-1 sm:grid-cols-7 border-l border-gray-100 dark:border-gold/10 border-b">
                    {days}
                </div>
            );
            days = [];
        }
        return (
            <div className="border border-gray-200 dark:border-gold/20 rounded-3xl overflow-hidden bg-white dark:bg-black/40 shadow-xl shadow-black/5">
                <div className="hidden sm:grid grid-cols-7 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gold/10">
                    {daysNames.map(day => (
                        <div key={day} className="py-4 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:block h-[300px] sm:h-[600px] overflow-y-auto custom-scrollbar">
                    {rows}
                </div>
            </div>
        );
    };

    const selectedDayEvents = events.filter(event => {
        const eventDate = event.start.dateTime ? parseISO(event.start.dateTime) : (event.start.date ? parseISO(event.start.date) : null);
        return eventDate && isSameDay(eventDate, selectedDate);
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#050505] overflow-hidden">
            <Header
                title="Calendario"
                subtitle="Sincronizado con Google Calendar"
                onRefresh={fetchData}
                isLoading={isLoading}
            />

            <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8">
                    {/* Calendar Main Grid */}
                    <div className="flex-1 min-w-0">
                        {renderHeader()}
                        {renderCells()}
                    </div>

                    {/* Sidebar Agenda */}
                    <div className="w-full lg:w-96 shrink-0 order-first lg:order-last">
                        <div className="bg-white dark:bg-black p-8 rounded-[2.5rem] border border-gray-200 dark:border-gold/20 shadow-2xl sticky top-0">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2 flex items-center gap-2">
                                        <Navigation className="w-3 h-3" />
                                        Agenda del Día
                                    </p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {format(selectedDate, "d 'de' MMMM", { locale: es })}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="p-4 bg-gold text-black rounded-2xl shadow-lg shadow-gold/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[300px] sm:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="py-20 text-center opacity-40">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gold/10">
                                            <CalendarIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sin compromisos</p>
                                    </div>
                                ) : (
                                    selectedDayEvents.map(event => (
                                        <div key={event.id} className="group p-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gold/10 rounded-3xl hover:border-gold/40 hover:bg-gold-[rgba(212,175,55,0.05)] transition-all">
                                            <h4 className="font-black text-gray-900 dark:text-white mb-3 text-sm leading-tight group-hover:text-gold transition-colors">
                                                {event.summary}
                                            </h4>
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-wider">
                                                    <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center">
                                                        <Clock className="w-3 h-3 text-gold" />
                                                    </div>
                                                    <span>
                                                        {event.start.dateTime
                                                            ? format(parseISO(event.start.dateTime), 'HH:mm')
                                                            : 'Todo el día'}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                                        <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center">
                                                            <MapPin className="w-3 h-3 text-gold" />
                                                        </div>
                                                        <span className="truncate max-w-[200px]">{event.location}</span>
                                                    </div>
                                                )}
                                                {event.description && (
                                                    <div className="flex items-start gap-3 text-[10px] text-gray-500 dark:text-gray-400 font-bold pt-2 border-t border-gray-100 dark:border-gold/5 mt-2">
                                                        <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center mt-0.5">
                                                            <FileText className="w-3 h-3 text-gold" />
                                                        </div>
                                                        <p className="line-clamp-2 leading-relaxed">{event.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Enhanced Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[2.5rem] border border-gray-200 dark:border-gold/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 dark:border-gold/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Programar Cita</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Sincronización en tiempo real</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form className="p-8 space-y-5" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <AlignLeft className="w-3 h-3 text-gold" /> Título
                                    </label>
                                    <input name="title" type="text" required placeholder="Ej: Visita Instalación" className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <User className="w-3 h-3 text-gold" /> Cliente
                                    </label>
                                    <select name="client" className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold">
                                        <option value="">Seleccionar cliente...</option>
                                        {clients.map((c, i) => (
                                            <option key={i} value={c.nombre}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-gold" /> Dirección / Ubicación
                                </label>
                                <input name="address" type="text" placeholder="Calle, Número, Ciudad" className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold" />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-gold" /> Hora Inicio
                                    </label>
                                    <input name="time" type="time" required className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-gold" /> Duración
                                    </label>
                                    <select name="duration" className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold">
                                        <option value="30 min">30 min</option>
                                        <option value="1 hora">1 hora</option>
                                        <option value="2 horas">2 horas</option>
                                        <option value="3 horas">3 horas</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-gold" /> Notas Internas
                                </label>
                                <textarea name="notes" placeholder="Información relevante para la cita..." className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/10 rounded-2xl text-xs font-bold focus:outline-none focus:border-gold min-h-[100px] resize-none" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-gold to-gold-dark text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl mt-4 shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                {isLoading ? 'Sincronizando con Google...' : 'Confirmar y Guardar Cita'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
