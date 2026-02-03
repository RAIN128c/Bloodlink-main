'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { FileText, X, Check, Clock, Beaker, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Patient } from '@/types';
import { formatDateTimeThai } from '@/lib/utils';

// Map process status to indicator type
const getIndicator = (process: string): string => {
    switch (process) {
        case 'เสร็จสิ้น':
        case 'รายงานผล':
            return 'completed';
        case 'กำลังตรวจ':
            return 'testing';
        case 'กำลังจัดส่ง':
        case 'เจาะเลือด':
            return 'received';
        default:
            return 'pending';
    }
};

export default function TestStatusPage() {
    const [filter, setFilter] = useState('all');
    const [showSidebar, setShowSidebar] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [noTestPatients, setNoTestPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }));

        async function fetchData() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const allPatients: Patient[] = await response.json();

                    // Patients with test activity (not just appointments)
                    const withTests = allPatients.filter(p =>
                        p.process && p.process !== 'นัดหมาย'
                    );
                    setPatients(withTests);

                    // Patients waiting for tests (appointments only)
                    const waiting = allPatients.filter(p =>
                        p.process === 'นัดหมาย' || !p.process
                    );
                    setNoTestPatients(waiting);
                }
            } catch (error) {
                console.error('Failed to fetch patients:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const filteredPatients = filter === 'all'
        ? patients
        : patients.filter(p => getIndicator(p.process) === filter);

    const getStatusIcon = (indicator: string) => {
        switch (indicator) {
            case 'completed': return <CheckCircle className="w-6 h-6" />;
            case 'testing': return <Beaker className="w-6 h-6" />;
            case 'received': return <Clock className="w-6 h-6" />;
            default: return <Clock className="w-6 h-6" />;
        }
    };

    const getStatusColor = (indicator: string) => {
        switch (indicator) {
            case 'completed': return 'text-[#16a34a] bg-[#dcfce7]';
            case 'testing': return 'text-[#ca8a04] bg-[#fef9c3]';
            case 'received': return 'text-[#2563eb] bg-[#dbeafe]';
            default: return 'text-gray-500 bg-gray-100';
        }
    };

    return (
        <MainLayout>
            <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                <Header />

                <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-96px)] pb-4">
                    {/* Left Column: Status List */}
                    <div className="flex-1 bg-[#F3F4F6] dark:bg-transparent rounded-[20px] flex flex-col overflow-hidden transition-colors">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 animate-fade-in-up">
                            <h1 className="text-[26px] font-bold text-[#111827] dark:text-white">สถานะผลตรวจเลือด</h1>
                            <Link href="/results" className="flex items-center gap-1.5 text-[#6366F1] dark:text-indigo-400 font-semibold hover:text-[#4F46E5] dark:hover:text-indigo-300 transition-colors text-[13px]">
                                <FileText className="w-4 h-4" />
                                ไปหน้าผลตรวจเลือด
                            </Link>
                        </div>

                        <div className="flex flex-col mb-4 flex-shrink-0 animate-fade-in-up stagger-1">
                            <div className="flex justify-between items-end mb-1.5">
                                <h2 className="text-[16px] font-bold text-[#A59CFD]">
                                    {currentDate}
                                </h2>
                                <span className="text-[11px] text-[#9CA3AF] mb-0.5 mr-3">การเรียง</span>
                            </div>
                            <div className="flex items-center justify-end">
                                <div className="flex bg-white dark:bg-[#1F2937] rounded-[10px] p-0.5 shadow-sm transition-colors">
                                    {['all', 'received', 'testing', 'completed'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={clsx(
                                                'px-4 py-1.5 rounded-[6px] text-[11px] font-medium transition-all',
                                                filter === f ? 'bg-[#E5E7EB] dark:bg-gray-600 text-[#374151] dark:text-white' : 'text-[#6B7280] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            )}
                                        >
                                            {f === 'all' ? 'ทั้งหมด' : f === 'received' ? 'ได้รับเลือด' : f === 'testing' ? 'กำลังตรวจ' : 'เสร็จสิ้น'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : filteredPatients.length > 0 ? (
                                filteredPatients.map((patient, idx) => {
                                    const indicator = getIndicator(patient.process);
                                    return (
                                        <div key={`${patient.hn}-${idx}`} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-4 shadow-sm border border-transparent dark:border-gray-700 hover:shadow-md dark:hover:bg-gray-800 transition-all relative card-animate hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="text-[16px] font-bold text-[#1F2937] dark:text-white">
                                                    HN : {patient.hn}
                                                </div>
                                                <div className={clsx(
                                                    "w-8 h-8 rounded-[8px] flex items-center justify-center",
                                                    indicator === 'completed' ? "bg-[#4ADE80] text-white" : "bg-[#9CA3AF] text-white"
                                                )}>
                                                    {indicator === 'completed' ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[13px] text-[#374151] dark:text-gray-300 font-medium">
                                                    {patient.name} {patient.surname}
                                                </span>
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-[10px]",
                                                    indicator === 'completed' ? "bg-[#DCFCE7] text-[#16A34A] dark:bg-green-900/30 dark:text-green-400" : "bg-[#FEF3C7] text-[#D97706] dark:bg-yellow-900/30 dark:text-yellow-400"
                                                )}>
                                                    {patient.process}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-[#6B7280] dark:text-gray-500 mb-3">
                                                {formatDateTimeThai(patient.timestamp || patient.appointmentDate)}
                                            </div>

                                            <Link
                                                href={`/patients/${patient.hn}`}
                                                className="inline-block px-5 py-1.5 bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#4338CA] dark:text-indigo-300 text-[11px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-800 transition-colors"
                                            >
                                                ตรวจสอบ
                                            </Link>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>ไม่พบข้อมูลสถานะสำหรับตัวกรองนี้</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: No Test Sidebar */}
                    {showSidebar && (
                        <div className="w-full lg:w-[240px] bg-white dark:bg-[#1F2937] rounded-[20px] p-4 shadow-sm flex flex-col overflow-hidden flex-shrink-0 relative transition-colors animate-fade-in-right">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[13px] font-bold text-[#EF4444] leading-tight w-full">รายชื่อผู้ป่วยที่ยังไม่มีการตรวจ</h3>
                            </div>

                            <div className="text-[#6B7280] dark:text-gray-400 text-[11px] mb-3 bg-gray-50 dark:bg-gray-700/50 py-0.5 px-2 rounded-lg inline-block self-start">
                                {currentDate}
                            </div>

                            <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar flex-1">
                                {isLoading ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : noTestPatients.length > 0 ? (
                                    noTestPatients.map((patient, idx) => (
                                        <div key={`no-test-${patient.hn}-${idx}`} className="bg-gray-50 dark:bg-gray-800/50 border border-t-[3px] border-t-gray-300 dark:border-t-gray-600 border-x-transparent border-b-transparent rounded-[6px] p-2.5 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all">
                                            <h4 className="text-[11px] font-semibold text-[#1F2937] dark:text-gray-200">{patient.name} {patient.surname}</h4>
                                            <p className="text-[10px] text-[#6B7280] dark:text-gray-400">HN: {patient.hn}</p>
                                            <p className="text-[9px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">รอนัดหมาย</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5 text-green-600 dark:text-green-400">
                                        <p className="text-[11px]">✓ ผู้ป่วยทุกคนได้รับการตรวจแล้ว</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
