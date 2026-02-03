'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { Heart, UserPlus, FileText, Search, ShieldCheck, Database, Calendar, Smartphone, Settings, Users, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Patient } from '@/types';
import { useSession } from 'next-auth/react';
import { Permissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { CountUp } from '@/components/ui/CountUp';

import packageJson from '../../../package.json';

interface DashboardStats {
    totalPatients: number;
    appointments: number;
    completed: number;
    inProgress: number;
}

interface SystemInfo {
    dbStatus: 'connected' | 'error' | 'checking';
    lastUpdated: string;
    version: string;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();
    const [stats, setStats] = useState<DashboardStats>({
        totalPatients: 0,
        appointments: 0,
        completed: 0,
        inProgress: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        dbStatus: 'checking',
        lastUpdated: '-',
        version: packageJson.version
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const patients: Patient[] = await response.json();

                    setStats({
                        totalPatients: patients.length,
                        appointments: patients.filter(p => p.process === 'นัดหมาย').length,
                        completed: patients.filter(p => p.process === 'เสร็จสิ้น' || p.process === 'รายงานผล').length,
                        inProgress: patients.filter(p =>
                            p.process && p.process !== 'นัดหมาย' && p.process !== 'เสร็จสิ้น' && p.process !== 'รายงานผล'
                        ).length
                    });

                    // Find the latest timestamp
                    let latestTime = '-';
                    if (patients.length > 0) {
                        const timestamps = patients
                            .filter(p => p.timestamp)
                            .map(p => new Date(p.timestamp).getTime());

                        if (timestamps.length > 0) {
                            const maxTime = Math.max(...timestamps);
                            latestTime = new Date(maxTime).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    }

                    // Update system info with successful connection
                    setSystemInfo(prev => ({
                        ...prev,
                        dbStatus: 'connected',
                        lastUpdated: latestTime !== '-' ? latestTime : new Date().toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }));
                } else {
                    setSystemInfo(prev => ({ ...prev, dbStatus: 'error' }));
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                setSystemInfo(prev => ({ ...prev, dbStatus: 'error' }));
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();

        // Real-time subscription for Stats
        const channel = supabase
            .channel('realtime-dashboard-stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                () => {
                    console.log('Real-time update: Refreshing dashboard stats...');
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);



    return (
        <MainLayout>
            <div className="max-w-[900px] w-full mx-auto flex flex-col">
                <Header />

                <div className="flex flex-col gap-4 pb-5">
                    {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-[20px] p-[28px_32px] bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] shadow-[0_10px_40px_rgba(99,102,241,0.3)] dark:shadow-[0_10px_40px_rgba(99,102,241,0.15)] animate-fade-in-up">
                        {/* Decorative Circles */}
                        <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-white/10 rounded-full"></div>
                        <div className="absolute bottom-[-30%] left-[10%] w-[200px] h-[200px] bg-white/5 rounded-full"></div>

                        <div className="relative z-10 flex justify-between items-center text-white">
                            <div>
                                <h1 className="text-[20px] sm:text-[26px] font-bold mb-1.5">ยินดีต้อนรับสู่ BloodLink</h1>
                                <p className="text-[12px] sm:text-[14px] font-normal opacity-90">ระบบจัดการข้อมูลผู้ป่วยและการตรวจเลือด</p>
                            </div>
                            <div className="text-white/80 animate-float">
                                <Heart className="w-16 h-16 sm:w-20 sm:h-20" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm card-animate stagger-1 hover-lift">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[22px] font-bold text-gray-800 dark:text-white">
                                        {isLoading ? '-' : <CountUp value={stats.totalPatients} />}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">ผู้ป่วยทั้งหมด</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm card-animate stagger-2 hover-lift">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[22px] font-bold text-gray-800 dark:text-white">
                                        {isLoading ? '-' : <CountUp value={stats.appointments} />}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">นัดหมาย</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm card-animate stagger-3 hover-lift">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[22px] font-bold text-gray-800 dark:text-white">
                                        {isLoading ? '-' : <CountUp value={stats.inProgress} />}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">กำลังดำเนินการ</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm card-animate stagger-4 hover-lift">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[22px] font-bold text-gray-800 dark:text-white">
                                        {isLoading ? '-' : <CountUp value={stats.completed} />}
                                    </div>
                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">เสร็จสิ้น</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Add Patient */}
                        <Link href="/patients/add" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-5 hover-lift">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-l"></div>
                            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-indigo-900/30 dark:to-indigo-800/30 text-[#6366F1] dark:text-indigo-400 flex-shrink-0">
                                <UserPlus className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">เพิ่มผู้ป่วยใหม่</h3>
                                <p className="text-[13px] text-[#6B7280] dark:text-gray-400">ลงทะเบียนผู้ป่วยเข้าสู่ระบบ</p>
                            </div>
                        </Link>

                        {/* Results */}
                        <Link href="/results" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-6 hover-lift">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#10B981] to-[#34D399] rounded-l"></div>
                            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] dark:from-emerald-900/30 dark:to-emerald-800/30 text-[#10B981] dark:text-emerald-400 flex-shrink-0">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">ผลการตรวจ</h3>
                                <p className="text-[13px] text-[#6B7280] dark:text-gray-400">ดูและจัดการผลตรวจเลือด</p>
                            </div>
                        </Link>

                        {/* History */}
                        <Link href="/history" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-7 hover-lift">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] rounded-l"></div>
                            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-blue-900/30 dark:to-blue-800/30 text-[#3B82F6] dark:text-blue-400 flex-shrink-0">
                                <Search className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">ประวัติผู้ป่วย</h3>
                                <p className="text-[13px] text-[#6B7280] dark:text-gray-400">ค้นหาและดูประวัติผู้ป่วย</p>
                            </div>
                        </Link>
                    </div>

                    {/* Info Panel & Quick Actions Panel */}
                    <div className="space-y-4">
                        {/* Info Panel */}
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors card-animate stagger-8 hover-lift">
                            <h2 className="text-[18px] font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">ข้อมูลระบบ</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Supabase Database</div>
                                        <div className={`text-sm font-semibold ${systemInfo.dbStatus === 'connected'
                                            ? 'text-green-600 dark:text-green-400'
                                            : systemInfo.dbStatus === 'error'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-yellow-600 dark:text-yellow-400'
                                            }`}>
                                            {systemInfo.dbStatus === 'connected' ? 'เชื่อมต่อแล้ว' :
                                                systemInfo.dbStatus === 'error' ? 'การเชื่อมต่อล้มเหลว' : 'กำลังตรวจสอบ...'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">ระบบรักษาความปลอดภัย</div>
                                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">ปกติ</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">เวอร์ชัน</div>
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">v{systemInfo.version}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">อัปเดตล่าสุด</div>
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{systemInfo.lastUpdated}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Panel (Shortcuts) */}
                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors animate-fade-in-up duration-slow">
                            <h2 className="text-[18px] font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">ทางลัด</h2>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/appointments" className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                    นัดหมาย
                                </Link>
                                <Link href="/test-status" className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Smartphone className="w-4 h-4" />
                                    ติดตามสถานะ
                                </Link>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1 self-center"></div>
                                {/* Admin Link - Only visible to admins (ผู้ดูแล) - respects Role Override */}
                                {Permissions.isAdmin(effectiveRole) && (
                                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                                        <Settings className="w-4 h-4" />
                                        จัดการระบบ (Admin)
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
