'use client';

import { Check } from 'lucide-react';

interface CustomCheckboxProps {
    label: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function CustomCheckbox({
    label,
    checked,
    onChange,
    error,
    disabled = false,
    className = ''
}: CustomCheckboxProps) {
    return (
        <div className={`flex items-start ${className}`}>
            <div className="flex items-center h-5">
                <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => !disabled && onChange(!checked)}
                    disabled={disabled}
                    className={`
                        w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900
                        ${checked
                            ? 'bg-purple-600 border-purple-600 hover:bg-purple-700'
                            : 'bg-white dark:bg-[#374151] border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${error ? 'border-red-500' : ''}
                    `}
                >
                    {checked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </button>
            </div>
            <div className="ml-2 text-sm leading-5">
                <label
                    className={`font-medium select-none cursor-pointer ${disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => !disabled && onChange(!checked)}
                >
                    {label}
                </label>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    );
}
