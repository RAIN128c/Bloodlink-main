'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'primary',
    isLoading = false
}: ConfirmModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 0);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconBg: 'bg-red-100 dark:bg-red-900/30',
                    iconColor: 'text-red-600 dark:text-red-400',
                    buttonBg: 'bg-red-600 hover:bg-red-700 text-white',
                    buttonRing: 'focus:ring-red-500'
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    iconColor: 'text-amber-600 dark:text-amber-400',
                    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
                    buttonRing: 'focus:ring-amber-500'
                };
            default: // primary
                return {
                    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                    buttonRing: 'focus:ring-indigo-500'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 font-[family-name:var(--font-prompt)] ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                <div className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                            <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            {description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full mt-2">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center justify-center gap-2 ${styles.buttonBg} ${styles.buttonRing}`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>กำลังดำเนินการ...</span>
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
