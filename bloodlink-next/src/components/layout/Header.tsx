'use client';

import Link from 'next/link';
import { Home, Search, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

import { SearchModal } from '@/components/modals/SearchModal';
import { ProfileDropdown, CurrentUser } from '@/components/profile/ProfileDropdown';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { useNotifications } from '@/components/providers/NotificationContext';
import { useInbox } from '@/components/providers/InboxContext';

interface HeaderProps {
    hideSearch?: boolean;
    title?: string;
    isAdminPage?: boolean;
}

export function Header({ hideSearch = false, title, isAdminPage = false }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // Notifications
    const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
    const { unreadCount } = useInbox();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);

        // Fetch current user profile
        async function fetchProfile() {
            // Try load from cache first
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem('user_profile_cache');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setCurrentUser(parsed);
                    } catch (e) {
                        console.error('Failed to parse user cache', e);
                    }
                }
            }

            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    const user = {
                        id: data.id,
                        name: data.name,
                        surname: data.surname,
                        email: data.email,
                        position: data.position,
                        avatarUrl: data.avatarUrl,
                    };
                    setCurrentUser(user);
                    // Update cache
                    localStorage.setItem('user_profile_cache', JSON.stringify(user));
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                // Use fallback user only if no cache and fetch failed
                if (!localStorage.getItem('user_profile_cache')) {
                    setCurrentUser({
                        id: 'guest',
                        name: 'Guest',
                        surname: '',
                        email: 'guest@example.com',
                        position: 'ผู้ใช้ทั่วไป',
                    });
                }
            }
        }

        fetchProfile();
    }, []);

    if (!mounted) {
        return null; // Or a placeholder to prevent flicker
    }

    return (
        <div className="flex items-start mb-2 pt-0 flex-shrink-0 font-[family-name:var(--font-kanit)] pl-14 md:pl-0">
            {/* Home Button - Fixed to top edge */}
            <Link
                href={isAdminPage ? "/admin" : "/dashboard"}
                className="hidden sm:flex fixed top-0 left-[195px] md:left-[215px] lg:left-[315px] xl:left-[395px] z-40 w-[140px] md:w-[184px] h-[48px] md:h-[52px] rounded-b-[26px] bg-white dark:bg-[#1F2937] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] border-none items-center justify-center gap-2 text-[13px] md:text-[14px] font-semibold text-[#6366F1] dark:text-indigo-400 transition-all hover:translate-y-0.5 hover:shadow-[0_6px_8px_0_rgba(0,0,0,0.3)]"
            >
                <Home className="w-5 h-5" />
                <span>Home</span>
            </Link>

            {/* Spacer for fixed Home button */}
            <div className="hidden sm:block w-[140px] md:w-[184px] mr-4 md:mr-8 lg:mr-[120px] xl:mr-[200px] flex-shrink-0" />

            {/* Search Container */}
            {!hideSearch && (
                <div className="flex-1 sm:flex-none sm:w-[280px] md:w-[320px] h-[48px] md:h-[56px] flex items-center relative mt-3 md:mt-4 mr-2 md:mr-8">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="ค้นหา..."
                        className="w-full h-full p-[16px_16px_16px_48px] border-none rounded-[16px] text-[13px] text-[#3E3066] dark:text-gray-200 bg-white dark:bg-[#1F2937] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all focus:outline-none focus:shadow-[0_4px_12px_rgba(99,102,241,0.15)] placeholder-[#9CA3AF] cursor-pointer"
                        readOnly={true}
                        onClick={() => setIsSearchModalOpen(true)}
                    />
                </div>
            )}

            {/* Top Bar Actions */}
            <div className="flex items-center gap-3 md:gap-5 ml-auto mt-4 md:mt-[24px] mr-2 md:mr-0">
                {/* Dark Mode Toggle */}
                <label className="relative inline-block w-[42px] h-[26px]">
                    <input
                        type="checkbox"
                        className="opacity-0 w-0 h-0 peer"
                        checked={theme === 'dark'}
                        onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                    />
                    <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[#CBD5E1] dark:bg-gray-600 rounded-full transition duration-300 p-[2px_3px] peer-checked:bg-[#6750a4]"></span>
                    <span className="absolute h-5 w-5 left-[3px] bottom-[3px] bg-white rounded-full transition duration-300 peer-checked:translate-x-4"></span>
                </label>

                {/* Inbox Link */}
                <Link
                    href="/inbox"
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Inbox"
                >
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>

                {/* Notification Bell */}
                <NotificationBell
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onDelete={deleteNotification}
                    onClearAll={clearAll}
                />

                {/* Profile Dropdown */}
                {currentUser && <ProfileDropdown user={currentUser} />}
            </div>

            <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
        </div>
    );
}
