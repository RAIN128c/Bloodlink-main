'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, CheckCircle, X, Trash2 } from 'lucide-react';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    targetPath?: string;
}

interface NotificationBellProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
}

const iconMap: Record<NotificationType, { Icon: React.ElementType; color: string }> = {
    resultReady: { Icon: CheckCircle, color: 'text-green-500' },
    time: { Icon: Clock, color: 'text-blue-500' },
    sentSuccess: { Icon: CheckCircle, color: 'text-lime-500' },
    success: { Icon: Check, color: 'text-green-500' },
    send: { Icon: Clock, color: 'text-purple-500' },
};

export function NotificationBell({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
}: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        // Optional: Navigate to targetPath if exists
        if (notification.targetPath) {
            window.location.href = notification.targetPath;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-[360px] max-h-[480px] bg-white dark:bg-[#1F2937] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">การแจ้งเตือน</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    อ่านทั้งหมด
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={onClearAll}
                                    className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                                    title="ล้างทั้งหมด"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[380px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                                <Bell className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const { Icon, color } = iconMap[notification.type] || iconMap.success;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${notification.isRead
                                                ? 'bg-white dark:bg-[#1F2937]'
                                                : 'bg-indigo-50 dark:bg-indigo-900/20'
                                            } hover:bg-gray-50 dark:hover:bg-gray-800`}
                                    >
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-800/50'}`}>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: th })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex items-center gap-1">
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full" title="ยังไม่ได้อ่าน" />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(notification.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded"
                                                title="ลบ"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
