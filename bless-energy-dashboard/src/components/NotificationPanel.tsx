'use client';

import { Bell, X, Check, Calculator, FileText, Users, Mail } from 'lucide-react';
import { Notification } from '@/context/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const iconMap = {
  lead: FileText,
  cliente: Users,
  email: Mail,
  info: Bell,
};

const colorMap = {
  lead: 'text-blue-500 bg-blue-500/20',
  cliente: 'text-green-500 bg-green-500/20',
  email: 'text-gold bg-gold/20',
  info: 'text-gray-500 bg-gray-500/20',
};

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPanelProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#0a0a0a] border-l border-gray-200 dark:border-gold/20 z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-gold text-black text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="p-2 border-b border-gray-100 dark:border-gold/10">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-gold hover:underline transition-colors"
            >
              Marcar todas como leidas
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gold/10">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type] || Bell;
                const colorClass = colorMap[notification.type] || colorMap.info;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-gold/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 text-gold hover:bg-gold/20 rounded transition-colors flex-shrink-0"
                              title="Marcar como leida"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();

  // Check if the timestamp has real time precision (not midnight default)
  const hasTimePrecision = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

  if (hasTimePrecision) {
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
  }

  // Compare by calendar day for date-only timestamps
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.round((today.getTime() - dateDay.getTime()) / 86400000);

  if (daysDiff === 0) return 'Hoy';
  if (daysDiff === 1) return 'Ayer';
  if (daysDiff < 7) return `Hace ${daysDiff} dias`;
  return date.toLocaleDateString('es-ES');
}
