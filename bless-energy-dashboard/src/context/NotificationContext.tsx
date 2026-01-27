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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0);
  const previousCountsRef = useRef<{ calculadora: number; formulario: number; clientes: number } | null>(null);
  const isFirstLoadRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        const { recentActivity, counts } = data.data;
        
        // Check for new records (only after first load)
        if (!isFirstLoadRef.current && previousCountsRef.current) {
          const newCalc = counts.calculadora - previousCountsRef.current.calculadora;
          const newForm = counts.formulario - previousCountsRef.current.formulario;
          const newClientes = counts.clientes - previousCountsRef.current.clientes;
          
          const totalNew = Math.max(0, newCalc) + Math.max(0, newForm) + Math.max(0, newClientes);
          if (totalNew > 0) {
            setNewNotificationsCount(prev => prev + totalNew);
          }
        }
        
        // Update previous counts
        previousCountsRef.current = counts;
        isFirstLoadRef.current = false;
        
        // Get stored read notifications
        const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const storedSeen = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
        
        // Create notifications from recent activity
        const newNotifications: Notification[] = recentActivity.map((activity: any) => {
          // Create a unique ID based on the activity data
          const id = `${activity.source}-${activity.name}-${activity.date}`.replace(/[^a-zA-Z0-9]/g, '-');
          
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
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 15 seconds for better real-time updates
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!storedRead.includes(id)) {
      localStorage.setItem('readNotifications', JSON.stringify([...storedRead, id]));
    }
    setNewNotificationsCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNewNotificationsCount(0);
  }, [notifications]);

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
