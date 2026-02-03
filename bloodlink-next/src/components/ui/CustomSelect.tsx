'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    required = false,
    error,
    disabled = false,
    className = '',
    triggerClassName = ''
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (disabled) return;
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-white dark:bg-[#374151] border rounded-md transition-all duration-200 outline-none",
                    error ? 'border-red-500' : isOpen ? 'border-purple-600 ring-1 ring-purple-600 dark:border-purple-500 dark:ring-purple-500' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : 'cursor-pointer',
                    triggerClassName
                )}
                disabled={disabled}
            >
                <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Error Message */}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto animate-fade-in-down custom-scrollbar">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "px-3.5 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors",
                                    option.value === value
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                )}
                            >
                                <span>{option.label}</span>
                                {option.value === value && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-3.5 py-3 text-sm text-gray-500 text-center">No options available</div>
                    )}
                </div>
            )}
        </div>
    );
}
