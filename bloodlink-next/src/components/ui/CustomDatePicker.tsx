'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import clsx from 'clsx';
import 'react-day-picker/dist/style.css';

interface CustomDatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    minDate?: Date;
}

// Custom styles override for DayPicker
const css = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #6366F1;
    --rdp-background-color: #E0E7FF;
    margin: 0;
  }
  .rdp-caption_label {
    font-family: var(--font-kanit), sans-serif;
    font-weight: 600;
    font-size: 16px;
  }
  .rdp-head_cell {
    font-family: var(--font-kanit), sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #6B7280;
  }
  .rdp-day {
    font-family: var(--font-kanit), sans-serif;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .rdp-day_selected:not([disabled]) { 
    background-color: var(--rdp-accent-color);
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #F3F4F6;
    color: #111827;
  }
`;

export function CustomDatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    disabled = false,
    className,
    minDate
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Format display Date
    const displayDate = value ? format(value, 'dd/MM/yyyy', { locale: th }) : '';

    // Simple backdrop click handler logic is done via the overlay div now

    return (
        <div className={clsx("relative w-full", className)}>
            <style>{css}</style>

            {/* Trigger Input */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center px-[14px] py-[10px] rounded-[12px] border text-[14px] transition-all bg-[#F9FAFB] dark:bg-[#374151]",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer bg-white dark:bg-gray-700",
                    isOpen
                        ? "border-[#6366F1] ring-1 ring-[#6366F1]/20"
                        : "border-[#E5E7EB] dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                )}
            >
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <span className={clsx(value ? "text-[#111827] dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                    {displayDate || placeholder}
                </span>
            </div>

            {/* Modal Content */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-[#1F2937] p-4 rounded-[20px] shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DayPicker
                            mode="single"
                            selected={value}
                            onSelect={(date) => {
                                onChange(date);
                                setIsOpen(false);
                            }}
                            disabled={minDate ? { before: minDate } : undefined}
                            showOutsideDays
                            fixedWeeks
                            weekStartsOn={1} // Monday
                            locale={th}
                            formatters={{
                                formatCaption: (date, options) => {
                                    // Thai Year override for caption
                                    const year = date.getFullYear() + 543;
                                    return `${format(date, 'MMMM', options)} ${year}`;
                                }
                            }}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
