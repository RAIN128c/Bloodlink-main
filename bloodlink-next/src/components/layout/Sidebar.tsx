'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { LayoutGrid, FileText, Calendar, LogOut, Plus, Menu, X, Home, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';

interface NotificationCounts {
    resultsReady: number;
    newPatients: number;
    upcomingAppointments: number;
}

interface LastViewedTimes {
    results: string | null;
    history: string | null;
    appointments: string | null;
}

const STORAGE_KEY = 'bloodlink_last_viewed';

export function Sidebar() {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { effectiveRole } = useEffectiveRole();

    useEffect(() => {
        setMounted(true);
    }, []);

    const [time, setTime] = useState('00:00');
    const [dateThai, setDateThai] = useState('Loading...');
    const [dateEng, setDateEng] = useState('Loading...');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState<NotificationCounts>({
        resultsReady: 0,
        newPatients: 0,
        upcomingAppointments: 0
    });

    // Refs for state that shouldn't trigger re-renders or dependency cycles
    const lastViewedRef = useRef<LastViewedTimes>({
        results: null,
        history: null,
        appointments: null
    });

    // Load initial state
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                lastViewedRef.current = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load last viewed times:', error);
        }
    }, []);

    // Initial fetch and Interval setup
    const fetchNotifications = useCallback(async () => {
        try {
            const currentViewed = lastViewedRef.current;
            const params = new URLSearchParams();
            if (currentViewed.results) params.set('lastViewedResults', currentViewed.results);
            if (currentViewed.history) params.set('lastViewedHistory', currentViewed.history);
            if (currentViewed.appointments) params.set('lastViewedAppointments', currentViewed.appointments);

            const response = await fetch(`/api/notifications?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();

                // If we are currently ON a page, force that count to 0 locally regardless of API
                // This handles the race condition where API might see "new" items due to clock skew
                // but we know we are looking at them right now.
                const path = window.location.pathname;
                if (path.startsWith('/results')) data.resultsReady = 0;
                if (path.startsWith('/history')) data.newPatients = 0;
                if (path.startsWith('/appointments')) data.upcomingAppointments = 0;

                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    // Set up interval - minimal dependencies to prevent reset
    useEffect(() => {
        fetchNotifications(); // Initial fetch
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Handle navigation actions
    useEffect(() => {
        if (!pathname) return;
        setIsMobileMenuOpen(false); // Close mobile menu

        const now = new Date().toISOString();
        let pageKey: keyof LastViewedTimes | null = null;
        let badgeKeyToClear: keyof NotificationCounts | null = null;

        if (pathname.startsWith('/results')) {
            pageKey = 'results';
            badgeKeyToClear = 'resultsReady';
        } else if (pathname.startsWith('/history')) {
            pageKey = 'history';
            badgeKeyToClear = 'newPatients';
        } else if (pathname.startsWith('/appointments')) {
            pageKey = 'appointments';
            badgeKeyToClear = 'upcomingAppointments';
        }

        if (pageKey) {
            // 1. Optimistically clear the visual badge immediately
            if (badgeKeyToClear) {
                setNotifications(prev => ({ ...prev, [badgeKeyToClear!]: 0 }));
            }

            // 2. Update the reference timestamp
            lastViewedRef.current = { ...lastViewedRef.current, [pageKey]: now };

            // 3. Persist to storage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(lastViewedRef.current));
            } catch (error) {
                console.error('Failed to save last viewed times:', error);
            }

            // 4. Trigger a fetch to sync (optional, but good to confirm)
            // fetchNotifications(); 
            // Commenting out explicit re-fetch on nav to avoid race condition flicker.
            // rely on optimistic update + interval.
        }
    }, [pathname]);


    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));

            const thaiOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            // @ts-ignore
            setDateThai(now.toLocaleDateString('th-TH', { ...thaiOptions, year: 'numeric' }).replace(now.getFullYear(), now.getFullYear() + 543));

            setDateEng(now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const navigation = [
        { name: 'แดชบอร์ด', href: '/dashboard', icon: Home, mobileOnly: true },
        { name: 'ผลตรวจเลือด', href: '/results', icon: FileText, badgeKey: 'resultsReady' as const },
        { name: 'ประวัติผู้ป่วย', href: '/history', icon: LayoutGrid, badgeKey: 'newPatients' as const },
        { name: 'วันนัดหมาย', href: '/appointments', icon: Calendar, badgeKey: 'upcomingAppointments' as const },
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    const getBadgeCount = (badgeKey?: 'resultsReady' | 'newPatients' | 'upcomingAppointments') => {
        if (!badgeKey) return 0;
        return notifications[badgeKey] || 0;
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-white dark:bg-[#1F2937] shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 active:scale-95"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                )}
            </button>

            {/* Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-[195px] bg-white dark:bg-[#111827] rounded-tr-[80px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] flex flex-col fixed left-0 top-0 bottom-0 z-50 font-[family-name:var(--font-kanit)] transition-transform duration-300",
                // Mobile: hidden by default (translate -full), show when menu open (translate 0)
                // Desktop: always show (translate 0)
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex flex-col h-full overflow-y-auto px-3 pt-4 pb-4 pl-[12px]">
                    {/* Logo Section */}
                    <div className="text-center mb-3 h-[56px]">
                        <Link href="/dashboard">
                            {mounted ? (
                                <Image
                                    src={resolvedTheme === 'dark' ? "/images/logo_d.png" : "/images/logo.png"}
                                    alt="BloodLink Logo"
                                    width={128}
                                    height={56}
                                    className="w-[128px] h-[56px] mx-auto object-contain"
                                    priority
                                />
                            ) : (
                                <div className="w-[128px] h-[56px] mx-auto" />
                            )}
                        </Link>
                    </div>

                    {/* Clock Widget */}
                    <div className="w-[153px] h-[80px] mx-auto mb-3 p-[5px_0_0_5px] rounded-[4px] bg-[#d7deec] dark:bg-[#1F2937]">
                        <div className="w-[148px] h-[75px] p-[8px_6px_6px] rounded-[4px] bg-[#f6f8fc] dark:bg-[#374151] text-center">
                            <div className="text-[22px] font-bold text-[#3E3066] dark:text-gray-100 font-mono tracking-widest leading-none mb-1">{time}</div>
                            <div className="text-[8px] text-[#6B7280] dark:text-gray-300">{dateThai}</div>
                            <div className="text-[7px] text-[#9CA3AF] dark:text-gray-400 mt-[1px]">{dateEng}</div>
                        </div>
                    </div>

                    {/* Add Button - Only for Doctor/Nurse/Admin */}
                    {Permissions.canAddPatient(effectiveRole) && (
                        <Link href="/patients/add" className="w-[38px] h-[38px] rounded-[11px] bg-[#60A5FA] flex items-center justify-center mx-auto mb-3 shadow-[0_3px_10px_rgba(96,165,250,0.3)] hover:bg-[#3B82F6] hover:-translate-y-0.5 transition-all text-white">
                            <Plus className="w-4 h-4" strokeWidth={3} />
                        </Link>
                    )}

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1 flex-1 pr-4">
                        {navigation.map((item) => {
                            const badgeCount = getBadgeCount(item.badgeKey);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        'flex items-center gap-2 px-4 py-3 rounded-[14px] text-[12px] font-medium transition-all duration-200',
                                        item.mobileOnly && 'md:hidden',
                                        isActive(item.href)
                                            ? 'bg-[#e1eafa] text-[#1E40AF] dark:bg-[#1E40AF] dark:text-white'
                                            : 'text-[#3E3066] dark:text-gray-300 hover:bg-[#e1eafa] dark:hover:bg-[#374151] hover:text-[#1E40AF] dark:hover:text-white'
                                    )}
                                >
                                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                    <span className="flex-1">{item.name}</span>
                                    {badgeCount > 0 && (
                                        <span className="bg-[#EF4444] text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-[8px] min-w-[18px] text-center">
                                            {badgeCount > 99 ? '99+' : badgeCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}

                        {/* Admin Settings Link - Visible to Admin/Lab Staff */}
                        {Permissions.canManageLabSettings(effectiveRole) && (
                            <Link
                                href="/admin/lab-settings"
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-3 rounded-[14px] text-[12px] font-medium transition-all duration-200',
                                    isActive('/admin/lab-settings')
                                        ? 'bg-[#e1eafa] text-[#1E40AF] dark:bg-[#1E40AF] dark:text-white'
                                        : 'text-[#3E3066] dark:text-gray-300 hover:bg-[#e1eafa] dark:hover:bg-[#374151] hover:text-[#1E40AF] dark:hover:text-white'
                                )}
                            >
                                <Settings className="w-[18px] h-[18px] flex-shrink-0" />
                                <span>ตั้งค่า Lab</span>
                            </Link>
                        )}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            await signOut({ callbackUrl: '/login' });
                        }}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 pr-4 text-[#3E3066] dark:text-gray-300 text-[11px] font-medium hover:bg-[#e1eafa] dark:hover:bg-[#374151] hover:text-[#1E40AF] dark:hover:text-white rounded-[14px] transition-all mt-auto mr-4"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>
        </>
    );
}


