'use client';

import { motion } from 'framer-motion';
import { useSafeAnimation } from '@/lib/animations/constraints';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface LabAlertProps {
    isAbnormal: boolean;
    val: string | number;
    unit?: string;
    className?: string;
}

export function LabAlert({ isAbnormal, val, unit, className }: LabAlertProps) {
    const { shouldAnimate } = useSafeAnimation();

    if (!isAbnormal) {
        return (
            <span className={cn("text-gray-900 dark:text-gray-100", className)}>
                {val} {unit && <span className="text-gray-500 text-xs ml-1">{unit}</span>}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className={cn("font-bold text-red-600 dark:text-red-400", className)}>
                {val} {unit && <span className="text-red-600/70 text-xs ml-1">{unit}</span>}
            </span>
            {shouldAnimate ? (
                <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: 2, // 3 pulses total (initial + 2 repeats)
                        repeatType: "reverse",
                        onComplete: () => ({ scale: 1, opacity: 1 }) // Settle state logic handled by style, frame keeps last frame? No, need to be careful.
                        // Actually easier: simply dont loop infinitely.
                    }}
                    className="flex items-center justify-center"
                >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                </motion.div>
            ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
            )}
        </div>
    );
}
