import React from 'react';
import Link from 'next/link';
import { Appointment } from '@/lib/services/appointmentService';
import { LabResult } from '@/lib/services/labService';
import { formatDateThai } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface PatientHistoryTabsProps {
    hn: string;
    appointmentHistory: Appointment[];
    labHistory: LabResult[];
    activeTab: 'appointments' | 'labs';
    setActiveTab: (tab: 'appointments' | 'labs') => void;
    apptLimit: number;
    setApptLimit: React.Dispatch<React.SetStateAction<number>>;
    labLimit: number;
    setLabLimit: React.Dispatch<React.SetStateAction<number>>;
}

export const PatientHistoryTabs: React.FC<PatientHistoryTabsProps> = ({
    hn,
    appointmentHistory,
    labHistory,
    activeTab,
    setActiveTab,
    apptLimit,
    setApptLimit,
    labLimit,
    setLabLimit
}) => {
    return (
        <div className="flex-1 flex flex-col min-h-0 gap-4 mt-6">
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appointments'
                        ? 'border-[#6366F1] text-[#6366F1] dark:text-[#818cf8]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    ประวัติการนัดหมาย
                </button>
                <button
                    onClick={() => setActiveTab('labs')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'labs'
                        ? 'border-[#6366F1] text-[#6366F1] dark:text-[#818cf8]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    ประวัติผลเลือด
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                        <div className={`overflow-x-auto ${apptLimit > 5 ? 'max-h-[500px] overflow-y-auto custom-scrollbar' : ''}`}>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800">วันที่</th>
                                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800">เวลา</th>
                                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800">ประเภท</th>
                                        <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {appointmentHistory.length > 0 ? (
                                        appointmentHistory.slice(0, apptLimit).map((dummy, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDateThai(dummy.appointment_date)}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{dummy.appointment_time}</td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">{dummy.type}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dummy.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                        dummy.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        }`}>
                                                        {dummy.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                ไม่พบประวัติการนัดหมาย
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {appointmentHistory.length > 5 && (
                            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between shrink-0 z-20 relative">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    แสดง {Math.min(apptLimit, appointmentHistory.length)} จาก {appointmentHistory.length} รายการ
                                </span>
                                <button
                                    onClick={() => setApptLimit(prev => prev > 5 ? 5 : appointmentHistory.length)}
                                    className="text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    {apptLimit > 5 ? 'ย่อรายการ' : 'ดูทั้งหมด'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Labs Tab - With Graph and Table */}
                {activeTab === 'labs' && (
                    <div className="space-y-4">
                        {/* Lab Table - Simplified */}
                        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className={`overflow-x-auto ${labLimit > 5 ? 'max-h-[500px] overflow-y-auto custom-scrollbar' : ''}`}>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 whitespace-nowrap">วันที่</th>
                                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 whitespace-nowrap">ผู้รายงาน</th>
                                            <th className="px-4 py-3 bg-gray-50 dark:bg-gray-800 whitespace-nowrap text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {labHistory.length > 0 ? (
                                            labHistory.slice(0, labLimit).map((lab, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                                                        {formatDateThai(lab.created_at || lab.timestamp)}
                                                    </td>

                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                        {lab.reporter_name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Link
                                                            href={`/test-status/${hn}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            ดูผล
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    ไม่พบประวัติผลเลือด
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {labHistory.length > 5 && (
                                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between shrink-0 z-20 relative">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        แสดง {Math.min(labLimit, labHistory.length)} จาก {labHistory.length} รายการ
                                    </span>
                                    <button
                                        onClick={() => setLabLimit(prev => prev > 5 ? 5 : labHistory.length)}
                                        className="text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        {labLimit > 5 ? 'ย่อรายการ' : 'ดูทั้งหมด'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
