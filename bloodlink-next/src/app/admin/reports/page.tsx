'use client';

import { Header } from '@/components/layout/Header';

import { Printer, Loader2, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { formatDateThai } from '@/lib/utils';

interface UserActivityLog {
    id: string;
    time: string;
    userName: string;
    userRole: string;
    userInitials: string;
    action: string;
    details: string;
    target: string;
}

interface SystemLog {
    id: string;
    time: string;
    event: string;
    status: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

interface DailySummaryOrder {
    id: string;
    patientHn: string;
    testType: string;
    time: string;
    status: 'Completed' | 'Processing' | 'Pending';
}

interface ReportsData {
    userActivityLogs: UserActivityLog[];
    systemLogs: SystemLog[];
    dailySummary: {
        totalOrders: number;
        completed: number;
        pending: number;
        orders: DailySummaryOrder[];
    };
}

const ACTION_COLORS: Record<string, string> = {
    'เข้าสู่ระบบ': 'bg-[#DEF7EC] dark:bg-green-900/30 text-[#03543F] dark:text-green-300',
    'View Result': 'bg-[#E1EFFE] dark:bg-blue-900/30 text-[#1E429F] dark:text-blue-300',
    'Edit Info': 'bg-[#FEF3C7] dark:bg-yellow-900/30 text-[#92400E] dark:text-yellow-300',
    'ดูผลเลือด': 'bg-[#E1EFFE] dark:bg-blue-900/30 text-[#1E429F] dark:text-blue-300',
    'แก้ไขข้อมูล': 'bg-[#FEF3C7] dark:bg-yellow-900/30 text-[#92400E] dark:text-yellow-300',
};

const STATUS_COLORS: Record<string, string> = {
    'success': 'bg-[#DEF7EC] dark:bg-green-900/30 text-[#03543F] dark:text-green-300',
    'error': 'bg-[#FDE8E8] dark:bg-red-900/30 text-[#9B1C1C] dark:text-red-300',
    'warning': 'bg-[#FEF3C7] dark:bg-yellow-900/30 text-[#92400E] dark:text-yellow-300',
    'info': 'bg-[#E1EFFE] dark:bg-blue-900/30 text-[#1E429F] dark:text-blue-300',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
    'Completed': 'bg-[#DEF7EC] dark:bg-green-900/30 text-[#03543F] dark:text-green-300',
    'Processing': 'bg-[#FEF3C7] dark:bg-yellow-900/30 text-[#92400E] dark:text-yellow-300',
    'Pending': 'bg-[#E1EFFE] dark:bg-blue-900/30 text-[#1E429F] dark:text-blue-300',
};

export default function AdminReportsPage() {
    const [activeTab, setActiveTab] = useState<'user-activity' | 'system-log' | 'daily-summary'>('user-activity');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ReportsData>({
        userActivityLogs: [],
        systemLogs: [],
        dailySummary: { totalOrders: 0, completed: 0, pending: 0, orders: [] }
    });

    useEffect(() => {
        async function fetchReports() {
            try {
                const response = await fetch('/api/admin/reports');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReports();
    }, []);

    const today = formatDateThai(new Date().toISOString());

    return (
        <div className="w-full sm:max-w-[1200px] mx-auto flex flex-col h-full">
            <Header hideSearch={true} />

            <div className="flex flex-col gap-6 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <h1 className="text-[18px] sm:text-[24px] font-bold text-[#111827] dark:text-white">รายงานเหตุการณ์ของระบบ (System Activity Report)</h1>
                    <span className="text-[14px] text-[#6B7280] dark:text-gray-400">วันนี้: {today}</span>
                </div>

                {/* Tabs */}
                <div className="border-b border-[#E5E7EB] dark:border-gray-700 mb-6">
                    <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-2">
                        {[
                            { id: 'user-activity', label: 'User Activity Log' },
                            { id: 'system-log', label: 'System Notifications Log' },
                            { id: 'daily-summary', label: 'Daily Summary' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'user-activity' | 'system-log' | 'daily-summary')}
                                className={clsx(
                                    'px-1 py-3 text-[14px] font-medium border-b-2 transition-all',
                                    activeTab === tab.id
                                        ? 'text-[#111827] dark:text-white border-[#111827] dark:border-white'
                                        : 'text-[#6B7280] dark:text-gray-400 border-transparent hover:text-[#374151] dark:hover:text-gray-300'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <>
                        {/* Tab Content: User Activity */}
                        {activeTab === 'user-activity' && (
                            <div className="bg-white dark:bg-[#1F2937] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 overflow-hidden transition-colors">
                                {data.userActivityLogs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[14px]">
                                            <thead className="bg-[#F9FAFB] dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400">
                                                <tr>
                                                    <th className="text-left px-6 py-3 font-medium">เวลา</th>
                                                    <th className="text-left px-6 py-3 font-medium">ผู้ใช้งาน</th>
                                                    <th className="text-left px-6 py-3 font-medium">การกระทำ</th>
                                                    <th className="text-left px-6 py-3 font-medium">รายละเอียด</th>
                                                    <th className="text-left px-6 py-3 font-medium">เป้าหมาย</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                                                {data.userActivityLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.time}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-[#E5E7EB] dark:bg-gray-700 flex items-center justify-center text-[12px] text-[#6B7280] dark:text-gray-400">{log.userInitials}</div>
                                                                <div>
                                                                    <div className="font-medium text-[#111827] dark:text-white">{log.userName}</div>
                                                                    <div className="text-[12px] text-[#6B7280] dark:text-gray-400">{log.userRole}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-[16px] text-[12px] font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.details}</td>
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.target || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>ไม่มีข้อมูลกิจกรรม</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: System Log */}
                        {activeTab === 'system-log' && (
                            <div className="bg-white dark:bg-[#1F2937] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 overflow-hidden transition-colors">
                                {data.systemLogs.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[14px]">
                                            <thead className="bg-[#F9FAFB] dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400">
                                                <tr>
                                                    <th className="text-left px-6 py-3 font-medium">เวลา</th>
                                                    <th className="text-left px-6 py-3 font-medium">เหตุการณ์</th>
                                                    <th className="text-left px-6 py-3 font-medium">สถานะ</th>
                                                    <th className="text-left px-6 py-3 font-medium">ข้อความระบบ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                                                {data.systemLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.time}</td>
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.event}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-[16px] text-[12px] font-medium capitalize ${STATUS_COLORS[log.status]}`}>
                                                                {log.status === 'success' ? 'Success' : log.status === 'error' ? 'Error' : log.status === 'warning' ? 'Warning' : 'Info'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{log.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>ไม่มีข้อมูลระบบ</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Daily Summary */}
                        {activeTab === 'daily-summary' && (
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                    <h2 className="text-[18px] font-semibold text-[#111827] dark:text-white">สรุปงานประจำวัน (Daily Report)</h2>
                                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1F2937] border border-[#D1D5DB] dark:border-gray-600 rounded-[6px] text-[#374151] dark:text-gray-200 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-700 transition-colors text-[14px]">
                                        <Printer className="w-5 h-5" />
                                        Print Report
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {[
                                        { label: 'Total Orders', value: data.dailySummary.totalOrders, color: 'text-[#111827] dark:text-white' },
                                        { label: 'Completed', value: data.dailySummary.completed, color: 'text-[#059669]' },
                                        { label: 'Pending', value: data.dailySummary.pending, color: 'text-[#D97706]' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-white dark:bg-[#1F2937] p-5 rounded-[12px] border border-[#E5E7EB] dark:border-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
                                            <div className="text-[14px] text-[#6B7280] dark:text-gray-400 mb-2">{stat.label}</div>
                                            <div className={`text-[24px] font-bold ${stat.color}`}>{stat.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white dark:bg-[#1F2937] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 overflow-hidden transition-colors">
                                    {data.dailySummary.orders.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[14px]">
                                                <thead className="bg-[#F9FAFB] dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 text-[#6B7280] dark:text-gray-400">
                                                    <tr>
                                                        <th className="text-left px-6 py-3 font-medium">Order ID</th>
                                                        <th className="text-left px-6 py-3 font-medium">Patient HN</th>
                                                        <th className="text-left px-6 py-3 font-medium">Test Type</th>
                                                        <th className="text-left px-6 py-3 font-medium">Time</th>
                                                        <th className="text-left px-6 py-3 font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                                                    {data.dailySummary.orders.map((order) => (
                                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{order.id}</td>
                                                            <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{order.patientHn}</td>
                                                            <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{order.testType}</td>
                                                            <td className="px-6 py-4 text-[#374151] dark:text-gray-300">{order.time}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-[16px] text-[12px] font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>ไม่มีข้อมูลคำสั่งซื้อวันนี้</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
