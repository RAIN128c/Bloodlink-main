'use client';

import { Header } from '@/components/layout/Header';

import { Printer, Loader2, Mail, Users, FileText, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateThai } from '@/lib/utils';
import { PrintReportModal, PrintSections } from '@/components/features/reports/PrintReportModal';

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

// Generate mock data for the chart based on the daily summary
const generateChartData = (total: number, completed: number, pending: number) => {
    // We spread the current day into 6 arbitrary time blocks for visualization purposes
    const data = [];
    const times = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

    // Distribute total numbers across the 6 blocks roughly
    let remCompleted = completed;
    let remPending = pending;

    for (let i = 0; i < times.length; i++) {
        const isLast = i === times.length - 1;

        let c = isLast ? remCompleted : Math.floor(Math.random() * (completed / 3));
        let p = isLast ? remPending : Math.floor(Math.random() * (pending / 3));

        // Ensure we don't drop below 0
        c = Math.min(c, remCompleted);
        p = Math.min(p, remPending);

        remCompleted -= c;
        remPending -= p;

        data.push({
            time: times[i],
            Completed: c,
            Processing: p
        });
    }
    return data;
};

export default function AdminReportsPage() {
    const [activeTab, setActiveTab] = useState<'user-activity' | 'system-log' | 'daily-summary'>('user-activity');
    const [isLoading, setIsLoading] = useState(true);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printSections, setPrintSections] = useState<PrintSections>({
        summary: true,
        orders: true,
        userActivity: true,
        systemLogs: false,
    });
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
    const chartData = !isLoading ? generateChartData(data.dailySummary.totalOrders, data.dailySummary.completed, data.dailySummary.pending) : [];

    const handlePrint = (sections: PrintSections) => {
        setPrintSections(sections);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    return (
        <div className="w-full sm:max-w-[1400px] mx-auto flex flex-col h-full bg-[#F3F4F6] dark:bg-[#0f1729] print:bg-white print:max-w-none">
            <div className="print:hidden">
                <Header hideSearch={true} />
            </div>

            <div className="flex flex-col gap-6 pb-6 px-4 md:px-8 print:px-0 print:gap-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 animate-fade-in-up print:flex-row print:mb-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#111827] dark:text-white print:text-black">รายงานเหตุการณ์ของระบบ</h1>
                        <p className="text-[14px] text-[#6B7280] dark:text-gray-400 mt-1 print:text-gray-600">สรุปข้อมูลประจำวัน: {today}</p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <button onClick={() => setIsPrintModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1F2937] border border-[#D1D5DB] dark:border-gray-600 rounded-xl text-[#374151] dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm text-sm">
                            <Printer className="w-4 h-4" />
                            Print Report
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <>
                        {/* Daily Summary Stat Cards */}
                        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${!printSections.summary ? 'print:hidden' : ''}`}>
                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors card-animate hover-lift delay-100 flex items-center justify-between print:border-gray-300 print:shadow-none print:break-inside-avoid">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">คำสั่งตรวจทั้งหมด (Total Orders)</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{data.dailySummary.totalOrders}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors card-animate hover-lift delay-200 flex items-center justify-between print:border-gray-300 print:shadow-none print:break-inside-avoid">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">เสร็จสิ้น (Completed)</p>
                                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.dailySummary.completed}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors card-animate hover-lift delay-300 flex items-center justify-between print:border-gray-300 print:shadow-none print:break-inside-avoid">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">อยู่ระหว่างดำเนินการ (Pending)</p>
                                    <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{data.dailySummary.pending}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Chart & System Logs */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">

                            {/* Chart Area */}
                            <div className={`lg:col-span-2 bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col animate-fade-in-up stagger-4 print:border-gray-300 print:shadow-none print:break-inside-avoid print:mb-6 print:min-h-[350px] ${!printSections.summary ? 'print:hidden' : ''}`}>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-black mb-6">อัตราการดำเนินการตรวจเลือด (Processing Flow)</h2>
                                <div className="flex-1 min-h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorProcessing" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="Completed" stackId="1" stroke="#10B981" fillOpacity={1} fill="url(#colorCompleted)" />
                                            <Area type="monotone" dataKey="Processing" stackId="1" stroke="#F59E0B" fillOpacity={1} fill="url(#colorProcessing)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* System Logs */}
                            <div className={`bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col animate-fade-in-up stagger-5 max-h-[400px] print:border-gray-300 print:shadow-none print:max-h-none print:break-inside-avoid print:mb-6 ${!printSections.systemLogs ? 'print:hidden' : ''}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white print:text-black">System Logs</h2>
                                    <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg print:hidden">
                                        <RefreshCw className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-4 print:overflow-visible">
                                    {data.systemLogs.length > 0 ? (
                                        data.systemLogs.map(log => (
                                            <div key={log.id} className="flex gap-3 items-start border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0">
                                                <div className={`mt-0.5 p-1.5 rounded-full ${STATUS_COLORS[log.status]}`}>
                                                    {log.status === 'error' ? <AlertCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[13px] font-medium text-gray-900 dark:text-white leading-snug">{log.event}</p>
                                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{log.message}</p>
                                                </div>
                                                <span className="text-[11px] text-gray-400 whitespace-nowrap">{log.time}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-sm text-gray-500">ไม่มีข้อมูลบันทึกระบบ</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                        {/* Bottom Section: Tables Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10 print:block">

                            {/* Daily Orders Table */}
                            <div className={`bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in-up stagger-6 flex flex-col print:border-gray-300 print:shadow-none print:break-inside-avoid print:mb-6 ${!printSections.orders ? 'print:hidden' : ''}`}>
                                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827]/50 print:bg-transparent print:border-b-2 print:border-gray-200">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white print:text-black">รายการคำสั่งตรวจ (Daily Orders)</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#F9FAFB] dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="text-left px-5 py-3 font-medium">Order ID / HN</th>
                                                <th className="text-left px-5 py-3 font-medium">Types</th>
                                                <th className="text-left px-5 py-3 font-medium">Status / Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {data.dailySummary.orders.slice(0, 10).map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-medium text-gray-900 dark:text-white mb-0.5">{order.id}</div>
                                                        <div className="text-xs text-gray-500">{order.patientHn}</div>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                                                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md text-xs font-medium">{order.testType}</span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${ORDER_STATUS_COLORS[order.status]}`}>
                                                                {order.status}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{order.time}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.dailySummary.orders.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-10 text-gray-500">
                                                        <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                                        ไม่มีคำสั่งตรวจ
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* User Activity Table */}
                            <div className={`bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in-up stagger-7 flex flex-col print:border-gray-300 print:shadow-none print:break-inside-avoid print:mb-6 ${!printSections.userActivity ? 'print:hidden' : ''}`}>
                                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111827]/50 print:bg-transparent print:border-b-2 print:border-gray-200">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white print:text-black">บันทึกกิจกรรมผู้ใช้ (User Activity)</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#F9FAFB] dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="text-left px-5 py-3 font-medium">User Profile</th>
                                                <th className="text-left px-5 py-3 font-medium">Activity</th>
                                                <th className="text-left px-5 py-3 font-medium">Time / Target</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {data.userActivityLogs.slice(0, 10).map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shadow-sm">
                                                                {log.userInitials}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">{log.userName}</div>
                                                                <div className="text-[11px] text-gray-500">{log.userRole}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                            {log.action}
                                                        </span>
                                                        <p className="text-[12px] text-gray-500 mt-1 line-clamp-1">{log.details}</p>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">{log.time}</div>
                                                        <div className="text-[11px] text-gray-400">{log.target || '-'}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.userActivityLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-10 text-gray-500">
                                                        <Users className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                                        ไม่มีบันทึกกิจกรรม
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>


                    </>
                )}
            </div>

            <PrintReportModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onPrint={handlePrint}
            />
        </div>
    );
}
