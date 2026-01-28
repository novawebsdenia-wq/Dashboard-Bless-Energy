'use client';

import { Bell, RefreshCw } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationPanel from './NotificationPanel';
import Image from 'next/image';
import { useNotifications } from '@/context/NotificationContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Header({ title, subtitle, onRefresh, isLoading }: HeaderProps) {
  const {
    unreadCount,
    isOpen,
    setIsOpen,
    notifications,
    markAsRead,
    markAllAsRead,
    pushEnabled,
    pushPermission,
    togglePushNotifications,
  } = useNotifications();

  return (
    <>
      <header className="bg-white/80 dark:bg-black/50 backdrop-blur-sm border-b border-gray-200 dark:border-gold/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="pl-12 lg:pl-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gold transition-colors disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gold transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User avatar with logo */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold">
              <Image
                src="/logo.png"
                alt="Bless Energy"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        pushEnabled={pushEnabled}
        pushPermission={pushPermission}
        onTogglePush={togglePushNotifications}
      />
    </>
  );
}
