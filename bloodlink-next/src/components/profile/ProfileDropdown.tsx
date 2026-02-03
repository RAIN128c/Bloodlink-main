'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

export interface CurrentUser {
    id: string;
    name: string;
    surname: string;
    email: string;
    position: string;
    avatarUrl?: string;
}

interface ProfileDropdownProps {
    user: CurrentUser;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-[34px] h-[34px] rounded-full bg-[#E0E7FF] dark:bg-[#374151] flex items-center justify-center transition-all hover:scale-105 hover:bg-[#C7D2FE] dark:hover:bg-[#4B5563] overflow-hidden"
            >
                {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.name} width={34} height={34} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-5 h-5 text-[#1E40AF] dark:text-gray-200" />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[280px] bg-white dark:bg-[#1F2937] rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-[#E5E7EB] dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-[#E5E7EB] dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#E5E7EB] dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt={user.name} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-[#9CA3AF] dark:text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[16px] font-semibold text-[#111827] dark:text-white truncate">
                                    {user.name} {user.surname}
                                </div>
                                <div className="text-[12px] text-[#6B7280] dark:text-gray-400 truncate">
                                    {user.position}
                                </div>
                                <div className="text-[11px] text-[#9CA3AF] dark:text-gray-500 truncate">
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between px-4 py-3 text-[14px] text-[#374151] dark:text-gray-200 hover:bg-[#F3F4F6] dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-[#6B7280] dark:text-gray-400" />
                                <span>ดูโปรไฟล์</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF] dark:text-gray-500" />
                        </Link>

                        <Link
                            href="/profile/edit"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between px-4 py-3 text-[14px] text-[#374151] dark:text-gray-200 hover:bg-[#F3F4F6] dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-[#6B7280] dark:text-gray-400" />
                                <span>ตั้งค่าบัญชี</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF] dark:text-gray-500" />
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#E5E7EB] dark:border-gray-700 py-2">
                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                await signOut({ callbackUrl: '/login' });
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
