'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  type: 'lead' | 'cliente' | 'email' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  newNotificationsCount: number;
  // Push notification settings
  pushEnabled: boolean;
  pushPermission: NotificationPermission;
  togglePushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const PUSH_SETTINGS_KEY = 'bless-push-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const previousCountsRef = useRef<{ calculadora: number; formulario: number; clientes: number; emails: number } | null>(null);
  const isFirstLoadRef = useRef(true);

  // Load push settings on mount
  useEffect(() => {
    const initPushSettings = () => {
      if (typeof window === 'undefined') return;

      const savedSettings = localStorage.getItem(PUSH_SETTINGS_KEY);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setPushEnabled(settings.enabled || false);
        } catch {
          // Ignore parse errors
        }
      }

      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    };

    initPushSettings();
  }, []);

  // Show browser push notification
  const showPushNotification = useCallback((title: string, body: string) => {
    if (!pushEnabled || Notification.permission !== 'granted') return;

    // Try service worker notification first (works in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        tag: 'bless-new-records',
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon-32x32.png',
        tag: 'bless-new-records',
      });
    }
  }, [pushEnabled]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success) {
        const { recentActivity, counts } = data.data;

        // Check for new records (only after first load)
        if (!isFirstLoadRef.current && previousCountsRef.current) {
          const newCalc = Math.max(0, counts.calculadora - previousCountsRef.current.calculadora);
          const newForm = Math.max(0, counts.formulario - previousCountsRef.current.formulario);
          const newClientes = Math.max(0, counts.clientes - previousCountsRef.current.clientes);
          const newEmails = Math.max(0, counts.emails - previousCountsRef.current.emails);

          const totalNew = newCalc + newForm + newClientes + newEmails;

          if (totalNew > 0) {
            setNewNotificationsCount(prev => prev + totalNew);

            // Show push notification
            const parts: string[] = [];
            if (newCalc > 0) parts.push(`${newCalc} lead${newCalc > 1 ? 's' : ''} de calculadora`);
            if (newForm > 0) parts.push(`${newForm} solicitud${newForm > 1 ? 'es' : ''} de formulario`);
            if (newClientes > 0) parts.push(`${newClientes} cliente${newClientes > 1 ? 's' : ''} nuevo${newClientes > 1 ? 's' : ''}`);
            if (newEmails > 0) parts.push(`${newEmails} email${newEmails > 1 ? 's' : ''} nuevo${newEmails > 1 ? 's' : ''}`);

            showPushNotification(
              `Bless Energy: ${totalNew} nuevo${totalNew > 1 ? 's' : ''}`,
              parts.join(', ')
            );
          }
        }

        // Update previous counts
        previousCountsRef.current = counts;
        isFirstLoadRef.current = false;

        // Get stored read notifications
        const storedRead: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');

        // Create notifications from recent activity
        const newNotifications: Notification[] = recentActivity.map((activity: { source: string; name: string; date: string; status: string }) => {
          // Create a stable ID based on source + name
          const id = `${activity.source}-${activity.name}`.replace(/[^a-zA-Z0-9]/g, '-');

          let title = 'Nueva entrada';
          let type: 'lead' | 'cliente' | 'email' = 'lead';

          if (activity.source === 'Calculadora') {
            title = 'Nuevo lead - Calculadora';
            type = 'lead';
          } else if (activity.source === 'Formulario') {
            title = 'Nuevo lead - Formulario';
            type = 'lead';
          } else if (activity.source === 'Clientes') {
            title = 'Nuevo cliente';
            type = 'cliente';
          } else if (activity.source === 'Email') {
            title = 'Nuevo email';
            type = 'email';
          }

          return {
            id,
            type,
            title,
            message: activity.name || 'Sin nombre',
            source: activity.source,
            timestamp: activity.date,
            read: storedRead.includes(id),
          };
        });

        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [showPushNotification]);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds for faster notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const storedRead: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!storedRead.includes(id)) {
      localStorage.setItem('readNotifications', JSON.stringify([...storedRead, id]));
    }
    setNewNotificationsCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const storedRead: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const allIds = new Set([...storedRead, ...prev.map((n) => n.id)]);
      localStorage.setItem('readNotifications', JSON.stringify([...allIds]));
      return prev.map((n) => ({ ...n, read: true }));
    });
    setNewNotificationsCount(0);
  }, []);

  // Toggle push notifications
  const togglePushNotifications = useCallback(async () => {
    if (pushEnabled) {
      // Disable
      setPushEnabled(false);
      localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify({ enabled: false }));
    } else {
      // Enable - request permission if needed
      if (!('Notification' in window)) {
        alert('Tu navegador no soporta notificaciones');
        return;
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        setPushPermission(permission);
      }

      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify({ enabled: true }));

        // Show test notification
        new Notification('Notificaciones activadas', {
          body: 'Recibirás alertas cuando lleguen nuevos clientes, leads o emails.',
          icon: '/icons/icon-192x192.png',
        });
      } else if (permission === 'denied') {
        alert('Has bloqueado las notificaciones. Para activarlas, ve a la configuracion de tu navegador.');
      }
    }
  }, [pushEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        newNotificationsCount,
        pushEnabled,
        pushPermission,
        togglePushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
