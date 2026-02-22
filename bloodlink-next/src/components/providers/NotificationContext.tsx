'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationType } from '@/components/shared/NotificationPopup';

interface NotificationContextType {
    // Current popup notification
    currentNotification: {
        isOpen: boolean;
        type: NotificationType;
        title: string;
        message: string;
        targetPath?: string;
    };

    // Actions
    notify: (type: NotificationType, title: string, message: string, targetPath?: string) => void;
    closePopup: () => void;
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

    const notify = useCallback((type: NotificationType, title: string, message: string, targetPath?: string) => {
        // Show popup
        setCurrentNotification({ isOpen: true, type, title, message, targetPath });
    }, []);

    // Close popup
    const closePopup = useCallback(() => {
        setCurrentNotification(prev => ({ ...prev, isOpen: false }));
    }, []);

    const value: NotificationContextType = {
        currentNotification,
        notify,
        closePopup,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
