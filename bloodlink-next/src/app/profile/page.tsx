'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProfileCard, UserProfile } from '@/components/profile/ProfileCard';
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
                    <div className="mt-6 bg-white dark:bg-[#1F2937] rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 transition-colors animate-fade-in-up stagger-2 hover-lift">
                        <h2 className="text-[18px] font-bold text-[#111827] dark:text-white mb-4">ข้อมูลการเข้าสู่ระบบ</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400 block mb-1">อีเมล</label>
                                <span className="text-[14px] font-medium text-[#374151] dark:text-white">{user.email}</span>
                            </div>
                            <div>
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400 block mb-1">บทบาท</label>
                                <span className="text-[14px] font-medium text-[#374151] dark:text-white">{user.position}</span>
                            </div>
                            <div>
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400 block mb-1">สถานะ</label>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                    ใช้งาน
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
