'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface CustomTimePickerProps {
    value: string; // Format "HH:mm"
    onChange: (time: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CustomTimePicker({
    value,
    onChange,
    placeholder = 'Select time',
    disabled = false,
    className
}: CustomTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Split value into Hour/Minute
    const [selectedHour, selectedMinute] = value ? value.split(':') : ['', ''];

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 5 min interval for cleaner UI

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
        let newHour = selectedHour || '09'; // Default start
        let newMinute = selectedMinute || '00';

        if (type === 'hour') newHour = val;
        if (type === 'minute') newMinute = val;

        onChange(`${newHour}:${newMinute}`);
    };

    return (
        <div className={clsx("relative w-full", className)}>
            {/* Trigger */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-[14px] py-[10px] rounded-[12px] border text-[14px] transition-all bg-[#F9FAFB] dark:bg-[#374151]",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer bg-white dark:bg-gray-700",
                    isOpen
                        ? "border-[#6366F1] ring-1 ring-[#6366F1]/20"
                        : "border-[#E5E7EB] dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                )}
            >
                <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className={clsx(value ? "text-[#111827] dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-[#1F2937] p-4 rounded-[20px] shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200 w-full max-w-[320px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-center text-lg font-bold text-gray-900 dark:text-white mb-4">เลือกเวลา</h3>

                        <div className="flex gap-4 h-[250px] mb-4">
                            {/* Hours Column */}
                            <div className="flex-1 border rounded-xl border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col">
                                <span className="text-xs font-medium text-center bg-gray-50 dark:bg-gray-800 py-2 border-b border-gray-200 dark:border-gray-600 block text-gray-500">ชั่วโมง</span>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                    {hours.map(h => (
                                        <button
                                            key={h}
                                            onClick={() => handleTimeChange('hour', h)}
                                            className={clsx(
                                                "w-full px-2 py-2 text-center text-sm rounded-lg transition-colors",
                                                selectedHour === h
                                                    ? "bg-[#6366F1] text-white font-bold shadow-sm"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Minutes Column */}
                            <div className="flex-1 border rounded-xl border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col">
                                <span className="text-xs font-medium text-center bg-gray-50 dark:bg-gray-800 py-2 border-b border-gray-200 dark:border-gray-600 block text-gray-500">นาที</span>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                    {minutes.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => handleTimeChange('minute', m)}
                                            className={clsx(
                                                "w-full px-2 py-2 text-center text-sm rounded-lg transition-colors",
                                                selectedMinute === m
                                                    ? "bg-[#6366F1] text-white font-bold shadow-sm"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl transition-colors shadow-sm"
                            >
                                ตกลง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
