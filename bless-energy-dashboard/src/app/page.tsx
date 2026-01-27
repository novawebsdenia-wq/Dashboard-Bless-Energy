'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import Chart from '@/components/Chart';
import { Mail, Calculator, FileText, Users, TrendingUp, Clock } from 'lucide-react';

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
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES');
  };

  // Get icon for activity type
  const getActivityIcon = (source: string) => {
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

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Vista general de Bless Energy"
        onRefresh={fetchStats}
        isLoading={isLoading}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Leads Pendientes"
            value={isLoading ? '...' : stats?.leadsPendientes || 0}
            icon={Clock}
            color="red"
          />
          <StatsCard
            title="Clientes Nuevos (7 días)"
            value={isLoading ? '...' : stats?.clientesNuevos || 0}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart
            data={stats?.sourceData || defaultSourceData}
            type="bar"
            dataKey="value"
            xAxisKey="name"
            title="Origen de leads"
          />
          <Chart
            data={stats?.sourceData || defaultSourceData}
            type="pie"
            dataKey="value"
            title="Distribución de leads"
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.source);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gold/10"
                  >
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white text-sm">
                        {activity.type === 'lead' ? 'Nuevo lead' : 'Nuevo cliente'}: <span className="font-medium">{activity.name}</span>
                      </p>
                      <p className="text-gray-500 text-xs">
                        {activity.source} - {formatTimeAgo(activity.date)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status || 'Pendiente'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
