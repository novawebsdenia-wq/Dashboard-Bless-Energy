'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import Chart from '@/components/Chart';
import { Mail, Calculator, FileText, Users, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
  type: string;
  source: string;
  name: string;
  date: string;
  status: string;
}

interface Stats {
  totalEmails: number;
  totalLeads: number;
  totalFormulario: number;
  totalClientes: number;
  leadsPendientes: number;
  clientesNuevos: number;
  sourceData: { name: string; value: number }[];
  recentActivity: Activity[];
  todaysAppointments?: {
    count: number;
    nextAppointment?: {
      title: string;
      time: string;
      location?: string;
    };
  };
}

const ITEMS_PER_PAGE = 5;

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format time ago using calendar day comparison
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = Math.round((today.getTime() - dateDay.getTime()) / 86400000);

    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return 'Ayer';
    if (daysDiff < 7) return `Hace ${daysDiff} dias`;
    return date.toLocaleDateString('es-ES');
  };

  // Get icon for activity type/source
  const getActivityIcon = (source: string, type: string) => {
    if (type === 'email' || source.toLowerCase().includes('email')) {
      return Mail;
    }
    switch (source) {
      case 'Calculadora':
        return Calculator;
      case 'Formulario':
        return FileText;
      case 'Clientes':
        return Users;
      default:
        return Users;
    }
  };

  // Get activity label based on type and source
  const getActivityLabel = (activity: Activity) => {
    const source = activity.source?.toLowerCase() || '';
    const type = activity.type?.toLowerCase() || '';

    if (type === 'email' || source.includes('email')) {
      return 'Nuevo correo';
    }
    if (type === 'lead') {
      return 'Nuevo lead';
    }
    if (type === 'cliente' || source === 'Clientes') {
      return 'Nuevo cliente';
    }
    return 'Nueva entrada';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('contactado') || s.includes('activo')) return 'bg-green-500/10 text-green-600 dark:text-green-500';
    if (s.includes('proceso')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-500';
    return 'bg-gold/10 text-gold';
  };

  // Default data for charts when loading
  const defaultSourceData = [
    { name: 'Calculadora', value: 0 },
    { name: 'Formulario', value: 0 },
  ];

  // Pagination for activity
  const activities = stats?.recentActivity || [];
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const paginatedActivities = activities.slice(
    (activityPage - 1) * ITEMS_PER_PAGE,
    activityPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Dashboard"
        subtitle="Vista general de Bless Energy"
        onRefresh={fetchStats}
        isLoading={isLoading}
      />

      {/* TODAY'S APPOINTMENTS WIDGET */}
      {!isLoading && stats?.todaysAppointments && (
        <div className="px-8 pb-2">
          <div className="max-w-[1600px] mx-auto">
            <div className="bg-gradient-to-r from-gray-900 to-black dark:from-white/[0.05] dark:to-white/[0.02] rounded-3xl p-1 border border-gray-200 dark:border-gold/20 shadow-xl">
              <div className="bg-white dark:bg-[#080808] rounded-[1.4rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                  <div className="w-16 h-16 bg-gold text-black rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-gold/20 shrink-0">
                    <span className="text-2xl font-black leading-none">{stats.todaysAppointments.count}</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Citas</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Agenda de Hoy</h3>
                    {stats.todaysAppointments.nextAppointment ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1 text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                        <span className="text-xs font-bold bg-green-500/10 text-green-600 px-2 py-0.5 rounded-lg flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          {stats.todaysAppointments.nextAppointment.time}
                        </span>
                        <span className="text-xs font-bold whitespace-normal break-words leading-tight">
                          {stats.todaysAppointments.nextAppointment.title}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-gray-400 mt-1">No hay más citas próximas hoy.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                  {stats.todaysAppointments.nextAppointment?.location && (
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gold/10">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[150px]">
                        {stats.todaysAppointments.nextAppointment.location}
                      </span>
                    </div>
                  )}
                  <a href="/calendario" className="flex-1 sm:flex-none text-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                    Ver Calendario
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Emails"
              value={isLoading ? '...' : stats?.totalEmails || 0}
              icon={Mail}
              color="gold"
            />
            <StatsCard
              title="Leads Calculadora"
              value={isLoading ? '...' : stats?.totalLeads || 0}
              icon={Calculator}
              color="blue"
            />
            <StatsCard
              title="Formulario Web"
              value={isLoading ? '...' : stats?.totalFormulario || 0}
              icon={FileText}
              color="green"
            />
            <StatsCard
              title="Total Clientes"
              value={isLoading ? '...' : stats?.totalClientes || 0}
              icon={Users}
              color="gold"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <StatsCard
                title="Leads Pendientes"
                value={isLoading ? '...' : stats?.leadsPendientes || 0}
                icon={Clock}
                color="red"
              />
              <StatsCard
                title="Clientes Nuevos (7 dias)"
                value={isLoading ? '...' : stats?.clientesNuevos || 0}
                icon={TrendingUp}
                color="green"
              />
            </div>

            {/* Main Chart in between */}
            <div className="lg:col-span-2">
              <Chart
                data={stats?.sourceData || defaultSourceData}
                type="bar"
                dataKey="value"
                xAxisKey="name"
                title="Origen de leads"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pie Chart Distribution */}
            <div className="lg:col-span-1">
              <Chart
                data={stats?.sourceData || defaultSourceData}
                type="pie"
                dataKey="value"
                title="Distribución de leads"
              />
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 premium-card bg-white dark:bg-black/30 border border-gray-100 dark:border-gold/10 rounded-2xl overflow-hidden animate-fade-in flex flex-col">
              <div className="p-8 border-b border-gray-50 dark:border-gold/5 flex items-center justify-between bg-white/50 dark:bg-transparent backdrop-blur-sm">
                <div>
                  <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Actividad Reciente</h3>
                  <p className="text-[10px] text-gold font-bold uppercase mt-1">Live Feed</p>
                </div>
                {activities.length > 0 && (
                  <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm border border-gold/20">
                    {activities.length} Registros
                  </span>
                )}
              </div>

              <div className="p-6 flex-1">
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Sincronizando...</p>
                    </div>
                  ) : paginatedActivities.length > 0 ? (
                    paginatedActivities.map((activity, index) => {
                      const Icon = getActivityIcon(activity.source, activity.type);
                      const label = getActivityLabel(activity);
                      return (
                        <div
                          key={index}
                          className="group flex items-center gap-5 p-4 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gold/[0.03] dark:hover:bg-gold/[0.05] rounded-2xl border border-transparent hover:border-gold/20 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="relative z-10 w-12 h-12 bg-white dark:bg-black border border-gray-100 dark:border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform">
                            <Icon className="w-5 h-5 text-gold stroke-[1.5]" />
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gold opacity-80">{label}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gold/30"></span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{formatTimeAgo(activity.date)}</span>
                            </div>
                            <p className="text-gray-900 dark:text-white text-sm font-bold truncate leading-none mb-1.5">
                              {activity.name}
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium uppercase tracking-widest truncate">
                              Canal: {activity.source}
                            </p>
                          </div>
                          <div className="relative z-10 text-right">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(activity.status)}`}>
                              {activity.status || 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 opacity-30 flex flex-col items-center gap-2">
                      <Clock className="w-10 h-10 text-gray-400" />
                      <p className="text-[10px] uppercase font-black tracking-widest">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 bg-gray-50/20 dark:bg-white/[0.01] border-t border-gray-100 dark:border-gold/5 flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Página <span className="text-gold">{activityPage}</span> de {totalPages}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                      className="p-2.5 text-gray-400 hover:text-gold bg-white dark:bg-black/40 border border-gray-200 dark:border-gold/10 rounded-xl shadow-sm transition-all active:scale-90 disabled:opacity-30 group"
                    >
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
                      disabled={activityPage === totalPages}
                      className="p-2.5 text-gray-400 hover:text-gold bg-white dark:bg-black/40 border border-gray-200 dark:border-gold/10 rounded-xl shadow-sm transition-all active:scale-90 disabled:opacity-30 group"
                    >
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
