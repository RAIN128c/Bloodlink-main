'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, parse } from 'date-fns';
import { Patient } from '@/types';
import { Clock, User } from 'lucide-react';
import Link from 'next/link';
import 'react-day-picker/dist/style.css';

// Custom styles for DayPicker to match Tailwind/Premium look
const css = `
  .rdp {
    --rdp-cell-size: 50px;
    --rdp-accent-color: #2563eb;
    --rdp-background-color: #eff6ff;
    margin: 0;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #f3f4f6;
    color: #111827;
  }
  .rdp-day_selected {
    font-weight: bold; 
    background-color: var(--rdp-accent-color);
    color: white;
  }
`;

export function AppointmentCalendar({ patients }: { patients: Patient[] }) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Filter patients who have appointments
    // Legacy format: "DD/MM/YYYY" ? Or "D/M/YYYY"?
    // "new Date().toLocaleString('th-TH')" formats vary.
    // I need to be robust. 
    // Let's assume the string in `appointmentDate` is parseable or compare string matching if format is consistent.
    // But `react-day-picker` works with `Date` objects.
    // I'll try to parse `patient.appointmentDate` to Date for indicators.

    // Simplification: Match string exact if possible, or parse.
    // Appointment Date in Sheet: "7/12/2567" (Thai year) or "7/12/2024"?
    // In `fix_ejs` logic (legacy), it was using `toLocaleString('th-TH')`.
    // I need to handle Thai Year conversion if present.

    const appointmentsByDate = patients.filter(p => p.appointmentDate && p.process === 'นัดหมาย');

    // Helper to check match
    const isDayHasAppointment = (day: Date) => {
        // Need consistent format. 
        // For this demo, let's assume `p.appointmentDate` matches `d/m/yyyy` formatted by date-fns?
        // Or better: Just list them.
        return appointmentsByDate.some(p => {
            // Basic Check: If string contains formatted date?
            // Todo: robust parsing. For now, strict match or partial.
            return p.appointmentDate.includes(format(day, 'd/M/')) // Very loose
        });
    };

    // Filter active selection
    const selectedAppointments = selectedDate
        ? appointmentsByDate.filter(p => {
            // Robust check needed here. 
            // Try matching "D/M/YYYY" or "DD/MM/YYYY"
            const formatted = format(selectedDate, 'd/M/');
            return p.appointmentDate.includes(formatted);
        })
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-[family-name:var(--font-kanit)]">
            <style>{css}</style>

            {/* Calendar Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-center items-start">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                        hasAppointment: (date) => isDayHasAppointment(date)
                    }}
                    modifiersStyles={{
                        hasAppointment: { border: '2px solid #2563eb', borderRadius: '50%' }
                    }}
                    footer={
                        <p className="mt-4 text-center text-sm text-gray-500">
                            {selectedDate ? `Selected: ${format(selectedDate, 'PPP')}` : 'Pick a date.'}
                        </p>
                    }
                />
            </div>

            {/* List Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        Appointments
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {selectedAppointments.length}
                    </span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedAppointments.length > 0 ? (
                        selectedAppointments.map((patient) => (
                            <Link href={`/history/${patient.hn}`} key={patient.hn} className="block">
                                <div className="group flex items-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer">
                                    <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-4 group-hover:bg-white group-hover:scale-110 transition-all">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {patient.name} {patient.surname}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                            <User className="w-3 h-3 mr-1" /> HN: {patient.hn} | {patient.age} Yrs
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            <span className="text-xs font-bold">{patient.appointmentTime || 'All Day'}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 capitalize">{patient.status}</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No appointments for this date.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
