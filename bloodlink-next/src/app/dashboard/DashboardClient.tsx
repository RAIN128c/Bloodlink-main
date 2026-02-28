'use client';

import { Heart, UserPlus, FileText, Search, Calendar, Smartphone, Settings, Users, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Patient } from '@/types';
import { useSession } from '@/components/providers/SupabaseAuthProvider';
import { Permissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { CountUp } from '@/components/ui/CountUp';

interface DashboardStats {
    totalPatients: number;
    appointments: number;
    completed: number;
    inProgress: number;
}

interface DashboardClientProps {
    initialStats: DashboardStats;
    recentActivity: Patient[];
    todayAppointments: Patient[];
}

export function DashboardClient({ initialStats, recentActivity, todayAppointments }: DashboardClientProps) {
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();
    const [stats, setStats] = useState<DashboardStats>(initialStats);
    const [liveRecentActivity, setLiveRecentActivity] = useState<Patient[]>(recentActivity);
    const [isLoading, setIsLoading] = useState(false); // Initially false because we have server data

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const patients: Patient[] = await response.json();

                    setStats({
                        totalPatients: patients.length,
                        appointments: patients.filter(p => p.process === 'นัดหมาย').length,
                        completed: patients.filter(p => p.process === 'เสร็จสิ้น').length,
                        inProgress: patients.filter(p =>
                            p.process && p.process !== 'นัดหมาย' && p.process !== 'เสร็จสิ้น'
                        ).length
                    });

                    // Update Recent Activity (exclude 'เสร็จสิ้น' and 'นัดหมาย' for actionable queue)
                    const activePatients = patients
                        .filter(p => p.process && p.process !== 'เสร็จสิ้น' && p.process !== 'นัดหมาย')
                        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
                        .slice(0, 5);
                    setLiveRecentActivity(activePatients);
                }
            } catch (error) {
                console.error('Failed to fetch stats for realtime update:', error);
            }
        }

        // Real-time subscription for Stats
        const channel = supabase
            .channel('realtime-dashboard-stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                () => {
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="flex flex-col gap-5 pb-5 w-full">
            {/* Shortcuts Row (MOVED TO TOP) */}
            <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors animate-fade-in-up duration-slow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 14 6-6a2 2 0 1 1 2.828 2.828l-6 6" /><path d="m13 14-6 6a2 2 0 1 1-2.828-2.828l6-6" /><path d="m13 14 3 3" /><path d="m13 14-3-3" /><path d="M10 20v2" /><path d="M14 2v2" /><path d="M22 10h-2" /><path d="M2 14h2" /></svg>
                    </div>
                    <span className="text-[15px] font-bold text-gray-800 dark:text-gray-200">เข้าถึงด่วน</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/appointments" className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Calendar className="w-4 h-4" />
                        นัดหมาย
                    </Link>
                    <Link href="/test-status" className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Smartphone className="w-4 h-4" />
                        ติดตามสถานะ
                    </Link>

                    {/* Admin Link - Only visible to admins */}
                    {Permissions.isAdmin(effectiveRole) && (
                        <>
                            <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                            <Link href="/admin" className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                                <Settings className="w-4 h-4" />
                                จัดการระบบ (Admin)
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[20px] p-[28px_32px] bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7] shadow-[0_10px_40px_rgba(99,102,241,0.3)] dark:shadow-[0_10px_40px_rgba(99,102,241,0.15)] animate-fade-in-up">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/patients/add" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-5 hover-lift">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-l"></div>
                    <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] dark:from-indigo-900/30 dark:to-indigo-800/30 text-[#6366F1] dark:text-indigo-400 flex-shrink-0">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">เพิ่มผู้ป่วยใหม่</h3>
                        <p className="text-[13px] text-[#6B7280] dark:text-gray-400">ลงทะเบียนผู้ป่วย</p>
                    </div>
                </Link>

                <Link href="/results" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-6 hover-lift">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#10B981] to-[#34D399] rounded-l"></div>
                    <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] dark:from-emerald-900/30 dark:to-emerald-800/30 text-[#10B981] dark:text-emerald-400 flex-shrink-0">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">ผลการตรวจ</h3>
                        <p className="text-[13px] text-[#6B7280] dark:text-gray-400">จัดการผลตรวจ</p>
                    </div>
                </Link>

                <Link href="/history" className="group relative bg-white dark:bg-[#1F2937] rounded-2xl p-5 flex items-center gap-4 border border-[#F3F4F6] dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden card-animate stagger-7 hover-lift">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] rounded-l"></div>
                    <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-blue-900/30 dark:to-blue-800/30 text-[#3B82F6] dark:text-blue-400 flex-shrink-0">
                        <Search className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[16px] font-semibold text-[#1F2937] dark:text-white mb-1">ประวัติผู้ป่วย</h3>
                        <p className="text-[13px] text-[#6B7280] dark:text-gray-400">ค้นหาประวัติ</p>
                    </div>
                </Link>
            </div>

            {/* Smart Views Area (Recent Activity & Appointments) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 card-animate stagger-8 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h2 className="text-[17px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            คิวงานล่าสุดวันนี้
                        </h2>
                        <span className="text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">รอการอัปเดต</span>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {liveRecentActivity.length > 0 ? (
                            liveRecentActivity.map(patient => (
                                <Link href={`/patients/${patient.hn}`} key={patient.hn} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {patient.name} {patient.surname}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">HN: {patient.hn}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium
                                            ${patient.process === 'รอเจาะเลือด' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                patient.process === 'รอแล็บรับเรื่อง' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    patient.process === 'กำลังตรวจ' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                            {patient.process || 'เริ่มใหม่'}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                                <CheckCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm font-medium">ไม่มีคิวงานค้างในขณะนี้</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Appointments */}
                <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 card-animate stagger-9 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                        <h2 className="text-[17px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            นัดหมายวันนี้
                        </h2>
                        <Link href="/appointments" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                            ดูทั้งหมด
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {todayAppointments.length > 0 ? (
                            todayAppointments.map(patient => (
                                <Link href={`/patients/${patient.hn}`} key={patient.hn} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {patient.name} {patient.surname}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">HN: {patient.hn}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                                <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm font-medium">ไม่มีนัดหมายสำหรับวันนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
