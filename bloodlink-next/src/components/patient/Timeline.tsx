'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Calendar, Syringe, Truck, Activity, CheckCircle, Clock, User } from 'lucide-react';
import { STATUS_ORDER } from '@/lib/permissions';

// Steps for the visual timeline (excluding 'รอตรวจ' which is initial state)
const STEPS = STATUS_ORDER.filter(s => s !== 'รอตรวจ');
const ICONS = [Calendar, Syringe, Truck, Activity, CheckCircle];

export interface StatusHistoryEntry {
    toStatus: string;
    createdAt: string;
    changedBy?: string;
    role?: string;
}

export interface TimelineProps {
    currentStatus: string;
    history?: StatusHistoryEntry[];
}

// Format timestamp for display
function formatTimestamp(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoString;
    }
}

// Calculate time elapsed between two timestamps
function getTimeElapsed(start: string, end: string): string {
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} วัน ${diffHours % 24} ชม.`;
        }
        return `${diffHours} ชม.`;
    } catch {
        return '';
    }
}

export function Timeline({ currentStatus, history = [] }: TimelineProps) {
    const [hoveredStep, setHoveredStep] = useState<number | null>(null);

    const currentIndex = STEPS.indexOf(currentStatus as typeof STEPS[number]);
    // Handle 'รอตรวจ' status - show as before first step
    const activeIndex = currentStatus === 'รอตรวจ' ? -1 : currentIndex;

    // Build a map of status to history info
    const historyMap = new Map<string, StatusHistoryEntry>();
    history.forEach(entry => {
        historyMap.set(entry.toStatus, entry);
    });

    // Get previous step timestamp for calculating elapsed time
    const getPreviousTimestamp = (stepIndex: number): string | null => {
        if (stepIndex === 0) return null;
        const prevStatus = STEPS[stepIndex - 1];
        return historyMap.get(prevStatus)?.createdAt || null;
    };

    return (
        <div className="w-full bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 font-[family-name:var(--font-kanit)] transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8">Status Timeline</h3>
            <div className="relative flex justify-between">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700 -translate-y-1/2 z-0 rounded-full" />

                {/* Progress Line */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                    style={{ width: activeIndex >= 0 ? `${(activeIndex / (STEPS.length - 1)) * 100}%` : '0%' }}
                />

                {STEPS.map((step, index) => {
                    const Icon = ICONS[index];
                    const isCompleted = index <= activeIndex;
                    const isActive = index === activeIndex;
                    const historyEntry = historyMap.get(step);
                    const prevTimestamp = getPreviousTimestamp(index);
                    const timeElapsed = historyEntry && prevTimestamp
                        ? getTimeElapsed(prevTimestamp, historyEntry.createdAt)
                        : null;

                    return (
                        <div
                            key={step}
                            className="relative z-10 flex flex-col items-center group"
                            onMouseEnter={() => setHoveredStep(index)}
                            onMouseLeave={() => setHoveredStep(null)}
                        >
                            {/* Hover Tooltip */}
                            {hoveredStep === index && historyEntry && (
                                <div className="absolute -top-24 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-3 py-2 text-xs shadow-lg min-w-[160px] z-20">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTimestamp(historyEntry.createdAt)}</span>
                                    </div>
                                    {historyEntry.changedBy && (
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{historyEntry.changedBy}</span>
                                            {historyEntry.role && (
                                                <span className="text-gray-400">({historyEntry.role})</span>
                                            )}
                                        </div>
                                    )}
                                    {timeElapsed && (
                                        <div className="mt-1 text-gray-400">
                                            ⏱️ ใช้เวลา: {timeElapsed}
                                        </div>
                                    )}
                                    {/* Arrow */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                                </div>
                            )}

                            {/* Step Circle */}
                            <div className={clsx(
                                "h-12 w-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 cursor-pointer",
                                isCompleted
                                    ? "bg-blue-600 border-blue-100 dark:border-blue-900/50 text-white shadow-md scale-110"
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-500",
                                isActive && "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>

                            {/* Step Label */}
                            <span className={clsx(
                                "absolute -bottom-8 w-24 text-center text-xs font-medium transition-colors duration-300",
                                isActive ? "text-blue-600 dark:text-blue-400 font-bold" :
                                    isCompleted ? "text-gray-600 dark:text-gray-300" :
                                        "text-gray-400 dark:text-gray-500"
                            )}>
                                {step}
                            </span>

                            {/* Timestamp below label */}
                            {historyEntry && (
                                <span className="absolute -bottom-14 text-[10px] text-gray-400 dark:text-gray-500">
                                    {formatTimestamp(historyEntry.createdAt).split(' ').slice(0, 3).join(' ')}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-16 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    💡 เลื่อนเมาส์ไปที่แต่ละขั้นตอนเพื่อดูรายละเอียด
                </p>
            </div>
        </div>
    );
}
