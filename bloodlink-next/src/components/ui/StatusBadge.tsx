'use client';

import { motion } from 'framer-motion';
import { useSafeAnimation } from '@/lib/animations/constraints';
import { cn } from '@/lib/utils';

// Medical status colors (Standardized)
const STATUS_STYLES: Record<string, string> = {
    'รอตรวจ': 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
    'กำลังตรวจ': 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40',
    'เสร็จสิ้น': 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40',
    'ยกเลิก': 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40',
    'นัดหมาย': 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40',
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const { shouldAnimate } = useSafeAnimation();
    const safeStatus = status || 'ไม่ระบุ';
    const styleClass = STATUS_STYLES[safeStatus] || 'text-gray-500 bg-gray-50';

    if (!shouldAnimate) {
        return (
            <span className={cn(`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors duration-200`, styleClass, className)}>
                {safeStatus}
            </span>
        );
    }

    return (
        <motion.span
            layout // Smoothly resize if text length changes
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            key={safeStatus} // Re-animate when status changes
            className={cn(`px-2.5 py-0.5 rounded-full text-[10px] font-medium inline-block`, styleClass, className)}
        >
            {safeStatus}
        </motion.span>
    );
}
