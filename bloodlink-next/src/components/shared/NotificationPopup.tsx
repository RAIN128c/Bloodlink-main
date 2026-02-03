'use client';

import { Check, Clock, Send, CheckCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'time' | 'send' | 'sentSuccess' | 'resultReady';

interface NotificationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onAction?: () => void; // For "Open" button
    type: NotificationType;
    title: string;
    message: string;
    timestamp?: string;
}

const iconMap = {
    // Result Ready (Green Check)
    resultReady: { Icon: CheckCircle, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-[#84CC16] dark:text-green-400' },
    // Sending Sample / Collecting Sample (Blue Clock)
    time: { Icon: Clock, bgColor: 'bg-[#0EA5E9]', iconColor: 'text-white' },
    // Checking (Blue Clock - variation if needed, using same as time for now)
    checking: { Icon: Clock, bgColor: 'bg-[#0EA5E9]', iconColor: 'text-white' },
    // Sent Success (Green Check) - Component 52
    sentSuccess: { Icon: CheckCircle, bgColor: 'bg-[#84CC16] dark:bg-green-600', iconColor: 'text-white' },

    // Fallbacks
    success: { Icon: Check, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    send: { Icon: Send, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
};

export function NotificationPopup({ isOpen, onClose, onAction, type, title, message, timestamp }: NotificationPopupProps) {
    if (!isOpen) return null;

    const config = iconMap[type as keyof typeof iconMap] || iconMap.success;
    const { Icon, bgColor, iconColor } = config;

    const displayTime = timestamp || new Date().toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-[family-name:var(--font-kanit)]">
            <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#1F2937] rounded-[20px] shadow-xl dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] w-[320px] p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                {/* Close X */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Timestamp */}
                <div className="text-left text-[12px] text-gray-500 dark:text-gray-400 mb-2">
                    {displayTime}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-[18px] font-medium text-[#1E1B4B] dark:text-white mb-4">{title}</h2>

                    {/* Icon Container */}
                    <div className={`w-[60px] h-[60px] rounded-full ${bgColor} flex items-center justify-center mb-4 shadow-sm ring-4 ring-white dark:ring-gray-700`}>
                        <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={2.5} />
                    </div>

                    <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-8">{message}</p>
                </div>

                {/* Action Buttons */}
                {onAction && (
                    <button
                        onClick={onAction}
                        className="w-full py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-medium transition-colors shadow-sm dark:shadow-none"
                    >
                        เปิดดูรายการ
                    </button>
                )}
            </div>
        </div>
    );
}
