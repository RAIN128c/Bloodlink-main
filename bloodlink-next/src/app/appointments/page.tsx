'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';

export default function AppointmentsPage() {
    // State
    const [viewDate, setViewDate] = useState<Date>(new Date()); // For the calendar grid
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Data State
    const [appointments, setAppointments] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        async function fetchAppointments() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const allPatients: Patient[] = await response.json();
                    console.log('Fetched Patients:', allPatients); // DEBUG

                    // Filter for appointments (process='นัดหมาย')
                    // And potentially ensure they have a valid appointmentDate
                    const appts = allPatients.filter(p => p.process === 'นัดหมาย' && p.appointmentDate);
                    console.log('Filtered Appointments:', appts); // DEBUG
                    setAppointments(appts);
                }
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAppointments();
    }, []);

    // Derived State
    const currentMonthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Filter today's schedule
    const dailySchedule = appointments.filter(appt => {
        if (!appt.appointmentDate) return false;

        const apptDate = new Date(appt.appointmentDate);
        // Valid date check
        if (isNaN(apptDate.getTime())) return false;

        return (
            apptDate.getDate() === selectedDate.getDate() &&
            apptDate.getMonth() === selectedDate.getMonth() &&
            apptDate.getFullYear() === selectedDate.getFullYear()
        );
    });

    // Helper to check if a day has appointments
    const hasAppointment = (day: number, currentViewDate: Date) => {
        return appointments.some(appt => {
            if (!appt.appointmentDate) return false;

            const apptDate = new Date(appt.appointmentDate);
            if (isNaN(apptDate.getTime())) return false;

            return (
                apptDate.getDate() === day &&
                apptDate.getMonth() === currentViewDate.getMonth() &&
                apptDate.getFullYear() === currentViewDate.getFullYear()
            );
        });
    };

    // Navigation Handlers
    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Calendar Generation Logic
    const renderCalendarDays = () => {
        const days = [];
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Blank days
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="py-2"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateToCheck = new Date(year, month, d);
            const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
            const hasAppt = hasAppointment(d, viewDate);

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDate(dateToCheck)}
                    className={`py-1.5 rounded-[8px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-xs font-medium flex flex-col items-center justify-center relative
                        ${isSelected ? 'bg-[#1E3A8A] text-white hover:bg-[#1E3A8A] dark:bg-blue-600 shadow-sm' : 'text-[#374151] dark:text-gray-300'}
                        ${isToday && !isSelected ? 'border border-[#1E3A8A] dark:border-blue-400 font-bold' : ''}
                    `}
                >
                    <span>{d}</span>
                    {hasAppt && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-1"></span>
                    )}
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
                            <h2 className="text-[16px] text-[#A59CFD] font-semibold">รายการนัดหมายทั้งหมด ({appointments.length})</h2>
                        </div>

                        <div className="lg:overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : appointments.length > 0 ? (
                                appointments.slice().sort((a, b) => (a.appointmentDate || '') > (b.appointmentDate || '') ? 1 : -1).map((appt, idx) => (
                                    <div key={`${appt.hn}-${idx}`} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-4 shadow-sm flex flex-col gap-1.5 relative transition-colors border border-transparent dark:border-gray-700 card-animate hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="flex justify-between items-start">
                                            <div className="text-[16px] font-bold text-[#1F2937] dark:text-white">
                                                HN : {appt.hn}
                                            </div>
                                            {appt.appointmentDate && (
                                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                    {formatDateThai(appt.appointmentDate)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[12px] text-[#374151] dark:text-gray-300">
                                            <span className="font-semibold">{appt.name} {appt.surname}</span>
                                            <div className="mt-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {appt.appointmentTime || 'ไม่ระบุเวลา'}
                                            </div>
                                        </div>
                                        {/* History display removed as property does not exist on Patient type */}
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
                    <div className="w-full lg:w-[280px] bg-white dark:bg-[#1F2937] rounded-[20px] p-4 shadow-sm flex flex-col lg:overflow-hidden flex-shrink-0 transition-colors animate-fade-in-right">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePrevMonth}
                                className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-[#1E3A8A] dark:text-blue-300">{currentMonthLabel}</span>
                            <button
                                onClick={handleNextMonth}
                                className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-[8px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-4 text-center text-[11px]">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-[#9CA3AF] dark:text-gray-500 font-medium py-1">{day}</div>
                            ))}
                            {renderCalendarDays()}
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mb-4"></div>

                        {/* Daily Schedule */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-[#1E3A8A] dark:text-blue-300">
                                {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {dailySchedule.length} ราย
                            </span>
                        </div>

                        <div className="lg:overflow-y-auto pr-1 space-y-2 custom-scrollbar flex-1 mb-2 bg-white dark:bg-[#1F2937] transition-colors">
                            {dailySchedule.length > 0 ? (
                                dailySchedule.map((item, idx) => (
                                    <Link key={idx} href={`/patients/${item.hn}`} className="block">
                                        <div className="flex gap-2 p-2.5 rounded-[10px] bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900">
                                            <div className="w-[3px] bg-[#3B82F6] rounded-full self-stretch"></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-200 truncate">{item.name} {item.surname}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <p className="text-[10px] text-[#6B7280] dark:text-gray-400">{item.appointmentTime || 'ไม่ระบุ'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 flex flex-col items-center gap-2">
                                    <Clock className="w-6 h-6 opacity-20" />
                                    <p className="text-[10px]">ไม่มีการนัดหมายวันนี้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
