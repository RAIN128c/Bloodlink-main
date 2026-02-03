'use client';

import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="md:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-white dark:bg-[#1F2937] shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 active:scale-95"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
            {isOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            )}
        </button>
    );
}
