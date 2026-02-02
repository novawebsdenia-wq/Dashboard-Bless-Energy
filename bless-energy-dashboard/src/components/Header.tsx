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
      <header className="sticky top-0 z-30 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-gold/10 transition-all duration-300">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto px-4 sm:px-8 py-5">
          <div className="pl-12 lg:pl-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden sm:block text-[10px] font-medium text-gray-500 dark:text-gold/50 uppercase tracking-[0.2em]">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-1.5 sm:gap-2 pr-3 sm:pr-4 border-r border-gray-100 dark:border-gold/10 leading-none">
              {/* Refresh button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-2 sm:p-2.5 text-gray-400 hover:text-gold dark:hover:text-gold-light bg-gray-50 dark:bg-white/5 rounded-xl transition-all active:scale-95 disabled:opacity-50 group"
                  title="Actualizar datos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 h-4 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                </button>
              )}

              {/* Theme Toggle */}
              <div className="p-0.5 bg-gray-50 dark:bg-white/5 rounded-xl scale-90 sm:scale-100">
                <ThemeToggle />
              </div>

              {/* Notifications */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 sm:p-2.5 text-gray-400 hover:text-gold dark:hover:text-gold-light bg-gray-50 dark:bg-white/5 rounded-xl transition-all active:scale-95 group"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 h-4 transition-transform group-hover:shake" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-tr from-gold to-gold-light text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-lg shadow-gold/20">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile Preview */}
            <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Admin</p>
                <p className="text-[9px] text-gold font-bold mt-1 uppercase tracking-tighter">Bless Energy</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gold blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-gold/40 group-hover:border-gold transition-colors relative z-10 bg-black shadow-inner">
                  <Image
                    src="/logo.png"
                    alt="Bless Energy"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover p-1"
                  />
                </div>
              </div>
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
