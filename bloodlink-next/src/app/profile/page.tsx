'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProfileCard, UserProfile } from '@/components/profile/ProfileCard';
import { PinSetupSection } from '@/components/profile/PinSetupSection';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    setUser({
                        userId: data.userId,
                        name: data.name,
                        surname: data.surname,
                        email: data.email,
                        phone: data.phone,
                        position: data.position,
                        role: data.role,
                        bio: data.bio,
                        avatarUrl: data.avatarUrl,
                        professionalId: data.professionalId,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <MainLayout>
                <title>โปรไฟล์ | BloodLink</title>
                <div className="flex-1 flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center p-8">
                        <p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลโปรไฟล์</p>
                        <Link href="/login" className="mt-4 inline-block px-4 py-2 bg-indigo-500 text-white rounded-lg">
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                <Header hideSearch={true} />

                <div className="pb-6">
                    {/* Page Title & Back Button */}
                    <div className="flex items-center gap-4 mb-6 animate-fade-in-up">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1F2937] rounded-full border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover-scale"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-[20px] sm:text-[24px] font-bold text-[#111827] dark:text-white">โปรไฟล์ของฉัน</h1>
                    </div>

                    {/* Profile Card */}
                    <div className="animate-fade-in-up stagger-1">
                        <ProfileCard
                            user={user}
                            showEditButton={true}
                            editPath="/profile/edit"
                        />
                    </div>

                    {/* Additional Info Section */}
                    <div className="mt-6 bg-white dark:bg-[#111827] rounded-[24px] p-8 sm:p-10 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md animate-fade-in-up stagger-2">
                        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                            ข้อมูลระบบและบทบาท
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">บัญชีผู้ใช้ (อีเมล)</span>
                                <span className="text-[16px] font-medium text-gray-800 dark:text-gray-200">{user.email}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">บทบาทในระบบ</span>
                                <span className="text-[16px] font-medium text-gray-800 dark:text-gray-200 capitalize">{user.role}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">สถานะการใช้งาน</span>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                                        ปกติ (Active)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PIN Setup Section */}
                    <div className="animate-fade-in-up stagger-3">
                        <PinSetupSection />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
