'use client';

import { Header } from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
    totalStaff: number;
    totalPatients: number;
    testedPatients: number;
    inProcessPatients: number;
    appointmentPatients: number;
    missedPatients: number;
    loginHistory: Array<{ name: string, time: string, letter: string, role: string }>;
}

interface ChartDataPoint {
    label: string;
    inProcess: number;
    tested: number;
    received: number;
}

type ChartScope = 'hour' | 'day' | 'week' | 'month' | 'year';

const scopeLabels: Record<ChartScope, string> = {
    hour: 'ชั่วโมง',
    day: 'วัน',
    week: 'สัปดาห์',
    month: 'เดือน',
    year: 'ปี'
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartScope, setChartScope] = useState<ChartScope>('month');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    // Fetch main stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Fetch chart data when scope changes
    const fetchChartData = useCallback(async (scope: ChartScope) => {
        setChartLoading(true);
        try {
            const res = await fetch(`/api/admin/chart?scope=${scope}`);
            if (res.ok) {
                const data = await res.json();
                setChartData(data.chartData || []);
            }
        } catch (error) {
            console.error('Failed to fetch chart data', error);
        } finally {
            setChartLoading(false);
        }
    }, []);

    // Fetch chart data on mount and when scope changes
    useEffect(() => {
        fetchChartData(chartScope);
    }, [chartScope, fetchChartData]);

    const statItems = [
        { label: 'บุคลากรทางการแพทย์ทั้งหมด', value: stats?.totalStaff || 0 },
        { label: 'ผู้ป่วยทั้งหมด', value: stats?.totalPatients || 0 },
        { label: 'ผู้ป่วยที่ได้รับการตรวจเลือด', value: stats?.testedPatients || 0 },
        { label: 'อยู่ระหว่างการตรวจเลือด', value: stats?.inProcessPatients || 0 },
        { label: 'ผู้ป่วยที่นัด', value: stats?.appointmentPatients || 0 },
        { label: 'ผู้ป่วยขาดนัด', value: stats?.missedPatients || 0 },
    ];

    const handleScopeChange = (scope: ChartScope) => {
        setChartScope(scope);
    };

    return (
        <div className="w-full sm:max-w-[1200px] mx-auto flex flex-col h-full">
            <Header hideSearch={true} />

            <div className="flex flex-col gap-6 pb-6">
                <h1 className="text-[24px] font-bold text-[#111827] dark:text-white animate-fade-in-up">แดชบอร์ด</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {statItems.map((stat, index) => (
                        <div key={stat.label} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-5 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col gap-2 transition-colors border border-transparent dark:border-gray-700 card-animate hover-lift" style={{ animationDelay: `${index * 0.08}s` }}>
                            <span className="text-[14px] font-medium text-[#6B7280] dark:text-gray-400">{stat.label}</span>
                            <div className="flex items-center gap-2">
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                                ) : (
                                    <span className="text-[24px] font-semibold text-[#111827] dark:text-white">{stat.value}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 min-h-[300px] lg:min-h-[420px]">
                    {/* Main Stacked Area Chart */}
                    <div className="bg-white dark:bg-[#1F2937] rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col relative transition-colors border border-transparent dark:border-gray-700 animate-fade-in-up stagger-6">
                        {/* Header with Scope Selector */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-[18px] font-semibold text-[#111827] dark:text-white">จำนวนการตรวจเลือดผู้ป่วย</h2>

                            {/* Scope Selector Buttons */}
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                {(Object.keys(scopeLabels) as ChartScope[]).map((scope) => (
                                    <button
                                        key={scope}
                                        onClick={() => handleScopeChange(scope)}
                                        disabled={chartLoading}
                                        className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${chartScope === scope
                                            ? 'bg-white dark:bg-gray-700 text-[#3B82F6] shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {scopeLabels[scope]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recharts Stacked Area Chart */}
                        <div className="flex-1 w-full" style={{ minHeight: '260px' }}>
                            {chartLoading || loading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    ไม่มีข้อมูลสำหรับช่วงเวลานี้
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorInProcess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F9A25C" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#F9A25C" stopOpacity={0.7} />
                                            </linearGradient>
                                            <linearGradient id="colorTested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.7} />
                                            </linearGradient>
                                            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.7} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 11 }}
                                            interval={0}
                                            angle={chartScope === 'hour' ? -45 : 0}
                                            textAnchor={chartScope === 'hour' ? 'end' : 'middle'}
                                            height={chartScope === 'hour' ? 50 : 30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickFormatter={(value) => value.toLocaleString()}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                            labelStyle={{ color: '#9CA3AF' }}
                                            formatter={(value: number, name: string) => {
                                                const labels: Record<string, string> = {
                                                    inProcess: 'กำลังตรวจเลือด',
                                                    tested: 'ผู้ป่วยที่ได้รับการตรวจเลือด',
                                                    received: 'ได้รับเลือด'
                                                };
                                                return [value.toLocaleString() + ' คน', labels[name] || name];
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="inProcess"
                                            stackId="1"
                                            stroke="#F9A25C"
                                            fill="url(#colorInProcess)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="tested"
                                            stackId="1"
                                            stroke="#2DD4BF"
                                            fill="url(#colorTested)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="received"
                                            stackId="1"
                                            stroke="#8B5CF6"
                                            fill="url(#colorReceived)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#F9A25C]"></span>
                                <span className="text-[12px] text-[#374151] dark:text-gray-300">กำลังตรวจเลือด</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#2DD4BF]"></span>
                                <span className="text-[12px] text-[#374151] dark:text-gray-300">ผู้ป่วยที่ได้รับการตรวจเลือด</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
                                <span className="text-[12px] text-[#374151] dark:text-gray-300">ได้รับเลือด</span>
                            </div>
                        </div>
                    </div>

                    {/* Login History */}
                    <div className="bg-white dark:bg-[#1F2937] rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col transition-colors border border-transparent dark:border-gray-700 animate-fade-in-up stagger-7">
                        <h2 className="text-[18px] font-semibold text-[#111827] dark:text-white mb-5">ประวัติการเข้าใช้</h2>
                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                            {stats?.loginHistory && stats.loginHistory.length > 0 ? (
                                stats.loginHistory.map((user, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] dark:border-gray-700 last:border-0">
                                        <div className="w-8 h-8 rounded-full bg-[#E0E7FF] dark:bg-indigo-900/50 flex items-center justify-center text-[#4F46E5] dark:text-indigo-300 text-[12px] font-semibold">
                                            {user.letter}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[14px] font-medium text-[#111827] dark:text-white">{user.name}</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-[12px] text-[#6B7280] dark:text-gray-400">{user.role}</div>
                                                <div className="text-[10px] text-[#9CA3AF] dark:text-gray-500">{user.time}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-4 text-sm">ไม่มีประวัติการเข้าใช้งาน</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
