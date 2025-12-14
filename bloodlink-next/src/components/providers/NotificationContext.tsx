'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { Notification } from '@/components/shared/NotificationBell';

interface NotificationContextType {
    // Current popup notification
    currentNotification: {
        isOpen: boolean;
        type: NotificationType;
        title: string;
        message: string;
        targetPath?: string;
    };

    // Notification history
    notifications: Notification[];

    // Actions
    notify: (type: NotificationType, title: string, message: string, targetPath?: string) => void;
    closePopup: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    // Current popup notification state
    const [currentNotification, setCurrentNotification] = useState<{
        isOpen: boolean;
        type: NotificationType;
        title: string;
        message: string;
        targetPath?: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        targetPath: ''
    });

    // Notification history state
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Generate unique ID
    const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Trigger a new notification (shows popup and adds to history)
    const notify = useCallback((type: NotificationType, title: string, message: string, targetPath?: string) => {
        // Show popup
        setCurrentNotification({ isOpen: true, type, title, message, targetPath });

        // Add to history
        const newNotification: Notification = {
            id: generateId(),
            type,
            title,
            message,
            timestamp: new Date(),
            isRead: false,
            targetPath
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    // Close popup
    const closePopup = useCallback(() => {
        setCurrentNotification(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Mark a notification as read
    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    // Delete a notification
    const deleteNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const value: NotificationContextType = {
        currentNotification,
        notifications,
        notify,
        closePopup,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
