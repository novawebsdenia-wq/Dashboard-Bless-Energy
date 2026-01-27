'use client';

import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Nuevo lead recibido',
      message: 'Se ha registrado un nuevo lead desde la calculadora web',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Cliente contactado',
      message: 'El cliente Juan García ha sido contactado exitosamente',
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Lead pendiente',
      message: 'Hay 3 leads sin contactar desde hace más de 24 horas',
      timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
      read: true,
    },
  ]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
