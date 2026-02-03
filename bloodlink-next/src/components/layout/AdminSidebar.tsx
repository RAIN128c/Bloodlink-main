'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LayoutGrid, Users, Stethoscope, Mail, FileText, LogOut, Menu, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useInbox } from '@/components/providers/InboxContext';
import { useTheme } from 'next-themes';

export function AdminSidebar() {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [time, setTime] = useState('00:00');
    const [dateThai, setDateThai] = useState('Loading...');
    const [dateEng, setDateEng] = useState('Loading...');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Use InboxContext for unread count
    const { unreadCount } = useInbox();

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
        { name: 'แดชบอร์ด', href: '/admin', icon: LayoutGrid },
        { name: 'แพทย์', href: '/admin/doctors', icon: Stethoscope },
        { name: 'ผู้ป่วย', href: '/admin/patients', icon: Users },
        { name: 'Inbox', href: '/admin/inbox', icon: Mail, showBadge: true },
        { name: 'รายงาน', href: '/admin/reports', icon: FileText },
    ];

    const isActive = (path: string) => pathname === path || (path !== '/admin' && pathname?.startsWith(path));

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
                "w-[195px] bg-white dark:bg-[#111827] rounded-tr-[80px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] flex flex-col fixed left-0 top-0 bottom-0 z-50 font-[family-name:var(--font-kanit)] transition-all duration-300",
                // Mobile: hidden by default, show when menu open
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex flex-col h-full overflow-y-auto px-3 pt-4 pb-4 pl-[12px]">
                    {/* Logo Section */}
                    <div className="text-center mb-3 h-[56px]">
                        <Link href="/admin">
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

                    {/* Navigation Menu */}
                    <nav className="flex flex-col gap-1 flex-1 pr-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-3 rounded-[14px] text-[12px] font-medium transition-all duration-200 relative',
                                    isActive(item.href)
                                        ? 'bg-[#e1eafa] text-[#1E40AF] dark:bg-[#1E40AF] dark:text-white'
                                        : 'text-[#3E3066] dark:text-gray-300 hover:bg-[#e1eafa] dark:hover:bg-[#374151] hover:text-[#1E40AF] dark:hover:text-white'
                                )}
                            >
                                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                <span className="flex-1">{item.name}</span>
                                {item.showBadge && unreadCount > 0 && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        ))}
                        {/* Back to App Link */}
                        <Link
                            href="/dashboard"
                            className="flex sm:hidden items-center gap-2 px-4 py-3 rounded-[14px] text-[12px] font-medium text-[#3E3066] dark:text-gray-300 hover:bg-[#e1eafa] dark:hover:bg-[#374151] hover:text-[#1E40AF] dark:hover:text-white transition-all duration-200 mr-4 border-t border-gray-100 dark:border-gray-700 mt-2 pt-4"
                        >
                            <LayoutGrid className="w-[18px] h-[18px] flex-shrink-0" />
                            <span className="flex-1">กลับหน้าหลัก</span>
                        </Link>
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

