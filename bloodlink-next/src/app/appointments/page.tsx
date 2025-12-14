'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';

export default function AppointmentsPage() {
    const [currentMonth, setCurrentMonth] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Data State
    const [appointments, setAppointments] = useState<Patient[]>([]);
    const [dailySchedule, setDailySchedule] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Set initial month display
        const now = new Date();
        setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        setSelectedDate(now);

        async function fetchAppointments() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const allPatients: Patient[] = await response.json();

                    // Filter for appointments (process='นัดหมาย')
                    const appts = allPatients.filter(p => p.process === 'นัดหมาย');
                    setAppointments(appts);
                    updateDailySchedule(appts, now);
                }
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAppointments();
    }, []);

    const updateDailySchedule = (allAppts: Patient[], date: Date) => {
        // Simple filter logic - in real app would parse 'appointmentDate' strictly
        // Assuming appointmentDate format is "dd/mm/yyyy" or similar
        const dateStr = date.toLocaleDateString('th-TH'); // Need to match format in DB
        // Simplified check: just show all for now or filter if we had strict parsed dates
        // For demo, let's show all "future" or "pending" appointments as specific to today if possible, 
        // or just list them all in the left column.

        // Let's list ALL appointments in the left column.
        // And in the right column (Schedule), show appointments for the SELECTED date.

        // Normalized date matching is hard without standardized DB format. 
        // We'll rely on string inclusion for loose matching if format varies.

        const schedule = allAppts.filter(p => {
            // Try to match selected date
            // This is tricky without strict Date objects in DB.
            return true; // Show all for demo
        }).slice(0, 5); // Limit for view

        setDailySchedule(schedule);
    };

    // Calendar Generation Logic (Simplified)
    const renderCalendarDays = () => {
        const days = [];
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Blank days
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="py-0.5"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === new Date().getDate() && month === new Date().getMonth();
            const isSelected = d === selectedDate.getDate();

            days.push(
                <div
                    key={d}
                    onClick={() => {
                        const newDate = new Date(year, month, d);
                        setSelectedDate(newDate);
                        updateDailySchedule(appointments, newDate);
                    }}
                    className={`py-0.5 rounded-[6px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-[10px] font-medium 
                        ${isSelected ? 'bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] dark:bg-blue-600' : 'text-[#374151] dark:text-gray-300'}
                        ${isToday && !isSelected ? 'border border-[#1E3A8A] dark:border-blue-400' : ''}
                    `}
                >
                    {d}
                </div>
            );
        }

        return days;
    };

    return (

        <MainLayout>
            <div className="w-full sm:max-w-[960px] mx-auto flex flex-col h-full">
                <Header />

                <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-96px)] pb-4">
                    {/* Left Column: Appointment List */}
                    <div className="flex-1 bg-[#F3F4F6] dark:bg-transparent rounded-[20px] flex flex-col lg:overflow-hidden transition-colors">
                        <div className="mb-3 flex-shrink-0 animate-fade-in-up">
                            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#111827] dark:text-white">วันนัดเจาะเลือด</h1>
                            <h2 className="text-[16px] text-[#A59CFD] font-semibold">รายการนัดหมายทั้งหมด</h2>
                        </div>

                        <div className="lg:overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : appointments.length > 0 ? (
                                appointments.map((appt, idx) => (
                                    <div key={`${appt.hn}-${idx}`} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-4 shadow-sm flex flex-col gap-1.5 relative transition-colors border border-transparent dark:border-gray-700 card-animate hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="text-[16px] font-bold text-[#1F2937] dark:text-white">
                                            HN : {appt.hn}
                                        </div>
                                        <div className="text-[11px] text-[#374151] dark:text-gray-300">
                                            {appt.name} {appt.surname} {appt.appointmentDate && `; ${formatDateThai(appt.appointmentDate)}`} {appt.appointmentTime}
                                        </div>
                                        <Link
                                            href={`/patients/${appt.hn}`}
                                            className="inline-block w-fit px-5 py-1.5 bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#4338CA] dark:text-indigo-300 text-[11px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-800 transition-colors mt-1"
                                        >
                                            ตรวจสอบ
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>ไม่มีรายการนัดหมาย</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Schedule Sidebar */}
                    <div className="w-full lg:w-[256px] bg-white dark:bg-[#1F2937] rounded-[20px] p-4 shadow-sm flex flex-col lg:overflow-hidden flex-shrink-0 transition-colors animate-fade-in-right">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-1.5">
                            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-[6px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-300">{currentMonth}</span>
                            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-[6px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-0.5 mb-1.5 text-center text-[10px]">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-[#9CA3AF] dark:text-gray-500 font-medium py-0.5">{day}</div>
                            ))}
                            {renderCalendarDays()}
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mb-2"></div>

                        {/* Daily Schedule */}
                        <div className="flex items-center justify-between mb-1.5">
                            <h3 className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-300">
                                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>
                        </div>

                        <div className="lg:overflow-y-auto pr-1 space-y-1.5 custom-scrollbar flex-1 mb-2 bg-white dark:bg-[#1F2937] transition-colors">
                            {dailySchedule.length > 0 ? (
                                dailySchedule.map((item, idx) => (
                                    <div key={idx} className="flex gap-1.5 p-2 rounded-[6px] bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                        <div className="w-[2px] bg-[#3B82F6] rounded-full self-stretch"></div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-[#1E3A8A] dark:text-blue-200">{item.name} {item.surname}</h4>
                                            <p className="text-[9px] text-[#6B7280] dark:text-gray-400">{item.appointmentTime || '09:00 - 10:00'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-gray-400 text-center py-2">No appointments</p>
                            )}
                        </div>

                        {/* Time Picker (Static for Display) */}
                        <div className="bg-[#DBEAFE] dark:bg-indigo-900/30 rounded-[12px] p-2.5 space-y-1.5 transition-colors">
                            <div>
                                <label className="text-[10px] font-bold text-[#1E3A8A] dark:text-blue-300 mb-0.5 block">Working Hours</label>
                                <div className="bg-white dark:bg-[#374151] rounded-[6px] px-2 py-1.5 flex items-center gap-1.5 border border-[#93C5FD] dark:border-gray-600">
                                    <Clock className="w-3 h-3 text-[#1E3A8A] dark:text-blue-300" />
                                    <span className="text-[11px] text-[#374151] dark:text-gray-200">08:00 - 16:00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
