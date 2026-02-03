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
    FileText,
    CalendarDays
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

            // Fetch Clients for selector from the 'clientes' sheet
            const clientRes = await fetch('/api/sheets?sheet=clientes');
            const clientData = await clientRes.json();
            if (clientData.success && clientData.data) {
                // clientData.data mapping from api/sheets/route.ts returns { headers, rows }
                // where rows is an array of objects
                const clientList = clientData.data.rows.map((row: any) => ({
                    nombre: row['Nombre'] || row['nombre'] || row['TITLE'] || Object.values(row)[2] || 'S/N'
                })).filter((c: any) => c.nombre !== 'S/N');
                setClients(clientList);
            }
        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        } catch (error: any) {
            toast({
                type: 'error',
                title: 'Error de Sincronización',
                message: error.message || 'No se pudo añadir a Google Calendar. Verifica los permisos.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                    <CalendarDays className="w-6 h-6 text-gold" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white capitalize tracking-tighter">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión de Agenda</p>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-gray-100 dark:border-gold/10 shadow-sm w-full sm:w-auto">
                <button
                    onClick={prevMonth}
                    className="flex-1 sm:flex-none p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all flex justify-center"
                >
                    <ChevronLeft className="w-5 h-5 text-gold" />
                </button>
                <button
                    onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
                    className="flex-1 sm:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gold hover:bg-gold/10 rounded-xl transition-all"
                >
                    Hoy
                </button>
                <button
                    onClick={nextMonth}
                    className="flex-1 sm:flex-none p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all flex justify-center"
                >
                    <ChevronRight className="w-5 h-5 text-gold" />
                </button>
            </div>
        </div>
    );

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });

        const rows = [];
        let days = [];
        let day = startDate;

        const daysNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
                        className={`min-h-[100px] sm:min-h-[140px] p-2 sm:p-3 border-t border-r border-gray-100 dark:border-gold/10 transition-all cursor-pointer relative group ${!isSameMonth(day, monthStart) ? 'hidden sm:block bg-gray-50/30 dark:bg-transparent opacity-20' : ''
                            } ${isSameDay(day, selectedDate) ? 'bg-gold/5 dark:bg-gold/5 ring-2 ring-inset ring-gold/30' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs sm:text-sm font-black transition-transform group-hover:scale-110 ${isToday(day)
                                    ? 'w-7 h-7 flex items-center justify-center bg-gold text-black rounded-full shadow-lg shadow-gold/30'
                                    : isSameDay(day, selectedDate) ? 'text-gold scale-110' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                {format(day, 'd')}
                            </span>
                            <span className="sm:hidden text-[9px] font-black text-gold/40 uppercase tracking-tighter">
                                {daysNames[i]}
                            </span>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 overflow-hidden">
                            {dayEvents.slice(0, 3).map(event => (
                                <div
                                    key={event.id}
                                    className="px-2 py-1 bg-gold/10 border-l-[3px] border-gold rounded-md text-[9px] font-bold text-gray-900 dark:text-gray-200 truncate shadow-sm"
                                >
                                    {event.summary}
                                </div>
                            ))}
                            {dayEvents.length > 3 && (
                                <div className="text-[8px] font-black text-gold text-center uppercase tracking-[0.2em] pt-1 animate-pulse">
                                    +{dayEvents.length - 3} Eventos
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
            <div className="border border-gray-200 dark:border-gold/20 rounded-[2rem] overflow-hidden bg-white dark:bg-black/40 shadow-2xl">
                <div className="hidden sm:grid grid-cols-7 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gold/10">
                    {daysNames.map(day => (
                        <div key={day} className="py-4 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="custom-calendar-grid h-[500px] sm:h-[700px] overflow-y-auto custom-scrollbar">
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
                title="Calendario Profesional"
                subtitle="Sincronización con Google & Clientes"
                onRefresh={fetchData}
                isLoading={isLoading}
            />

            <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-8">
                    {/* Calendar Main Grid */}
                    <div className="flex-1 min-w-0">
                        {renderHeader()}
                        {renderCells()}
                    </div>

                    {/* Sidebar Agenda */}
                    <div className="w-full xl:w-[400px] shrink-0 border-t xl:border-t-0 xl:border-l border-gray-200 dark:border-gold/10 pt-8 xl:pt-0 xl:pl-8">
                        <div className="bg-white dark:bg-black p-8 rounded-[3rem] border border-gray-200 dark:border-gold/20 shadow-2xl sticky top-0 bg-opacity-80 backdrop-blur-xl">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gold rounded-full animate-ping"></span>
                                        Día Seleccionado
                                    </p>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                                        {format(selectedDate, "d 'de' MMMM", { locale: es })}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="p-5 bg-gold text-black rounded-2xl shadow-xl shadow-gold/20 hover:scale-110 active:scale-95 transition-all border-none"
                                >
                                    <Plus className="w-7 h-7" />
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar pr-3">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-100 dark:border-gold/10">
                                            <CalendarIcon className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cero compromisos</p>
                                    </div>
                                ) : (
                                    selectedDayEvents.map(event => (
                                        <div key={event.id} className="group p-6 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-gold/10 rounded-[2rem] hover:border-gold/40 hover:bg-gold/5 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight group-hover:text-gold transition-colors pr-4">
                                                    {event.summary}
                                                </h4>
                                                <div className="px-2 py-1 bg-gold/20 rounded-lg text-[9px] font-black text-gold uppercase tracking-widest">
                                                    {event.start.dateTime
                                                        ? format(parseISO(event.start.dateTime), 'HH:mm')
                                                        : 'Todo el día'}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {event.location && (
                                                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                                                        <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/10">
                                                            <MapPin className="w-4 h-4 text-gold" />
                                                        </div>
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                {event.description && (
                                                    <div className="flex items-start gap-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium pt-3 border-t border-gray-100 dark:border-gold/5 mt-3">
                                                        <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center mt-1 border border-gold/10 shrink-0">
                                                            <FileText className="w-4 h-4 text-gold" />
                                                        </div>
                                                        <p className="leading-relaxed opacity-80">{event.description}</p>
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
                <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#080808] w-full max-w-xl rounded-[3.5rem] border border-gray-200 dark:border-gold/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-10 border-b border-gray-100 dark:border-gold/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Nueva Cita</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Conexión Google Calendar activa
                                </p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-4 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-7 h-7 text-gray-400" />
                            </button>
                        </div>

                        <form className="p-10 space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <AlignLeft className="w-3 h-3 text-gold" /> Título de la Cita
                                    </label>
                                    <input name="title" type="text" required placeholder="Ej: Visita Instalación" className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:opacity-30" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <User className="w-3 h-3 text-gold" /> Seleccionar Cliente
                                    </label>
                                    <select name="client" className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 appearance-none transition-all">
                                        <option value="">Cita sin cliente vinculado</option>
                                        {clients.map((c, i) => (
                                            <option key={i} value={c.nombre}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-gold" /> Ubicación Exacta
                                </label>
                                <input name="address" type="text" placeholder="Calle, Número, Ciudad" className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all placeholder:opacity-30" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-gold" /> Hora de Inicio
                                    </label>
                                    <input name="time" type="time" required className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-gold" /> Duración Estimada
                                    </label>
                                    <select name="duration" className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 appearance-none transition-all">
                                        <option value="30 min">Relámpago (30 min)</option>
                                        <option value="1 hora">Estándar (1 hora)</option>
                                        <option value="2 horas">Extendida (2 horas)</option>
                                        <option value="3 horas">Día completo (3 horas)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-gold" /> Detalles y Notas
                                </label>
                                <textarea name="notes" placeholder="Información crítica para esta cita..." className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gold/20 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all min-h-[120px] resize-none placeholder:opacity-30" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full py-6 bg-gradient-to-br from-gold via-gold to-gold-dark text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-gold/30 hover:shadow-gold/50 hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-50">
                                {isLoading ? 'Sincronizando con la Nube...' : 'Publicar Cita en Google'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
