'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Patient } from '@/types';
import { Loader2, Upload, Users, CheckSquare, Square } from 'lucide-react';
import { formatDateThai } from '@/lib/utils';
import { BulkImportModal } from '@/components/modals/BulkImportModal';
import { BulkAssignModal } from '@/components/modals/BulkAssignModal';
import { useSession } from 'next-auth/react';
import { Permissions, getEffectiveRole } from '@/lib/permissions';

// Severity color mapping based on days overdue
const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue >= 10) return 'bg-[#EF4444]'; // red
    if (daysOverdue >= 7) return 'bg-[#F59E0B]'; // yellow
    if (daysOverdue >= 3) return 'bg-[#3B82F6]'; // blue
    return 'bg-[#A855F7]'; // purple
};

const calculateDaysOverdue = (appointmentDate: string): number => {
    if (!appointmentDate) return 0;

    try {
        // Handle Thai date format (dd/mm/yyyy) or ISO format
        let date: Date;
        if (appointmentDate.includes('/')) {
            const parts = appointmentDate.split('/');
            // Convert Buddhist Era to Gregorian if needed
            let year = parseInt(parts[2]);
            if (year > 2500) year -= 543;
            date = new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
            date = new Date(appointmentDate);
        }

        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    } catch {
        return 0;
    }
};

interface PatientListProps {
    basePath: string; // e.g., '/history' or '/admin/patients'
    title?: string;
}

export const PatientList = ({ basePath, title = 'ประวัติผู้ป่วย' }: PatientListProps) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [missedPatients, setMissedPatients] = useState<(Patient & { daysOverdue: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bulk action states
    const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const { data: session } = useSession();
    const role = getEffectiveRole(session?.user?.role);
    const isAdmin = Permissions.isAdmin(role);
    // Base permission to even see the bulk tools
    const canUseBulkTools = Permissions.canBulkAssign(role);

    useEffect(() => {
        async function fetchPatients() {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch patients from API
                const response = await fetch('/api/patients');

                if (!response.ok) {
                    throw new Error('Failed to fetch patients');
                }

                const data: Patient[] = await response.json();

                // Filter active patients
                const activePatients = data.filter(p => p.status === 'ใช้งาน');
                setPatients(activePatients);

                // Calculate missed appointments (overdue patients)
                const overdue = activePatients
                    .map(p => ({
                        ...p,
                        daysOverdue: calculateDaysOverdue(p.appointmentDate)
                    }))
                    .filter(p => p.daysOverdue > 0 && p.process === 'นัดหมาย')
                    .sort((a, b) => b.daysOverdue - a.daysOverdue)
                    .slice(0, 10); // Limit to 10

                setMissedPatients(overdue);
            } catch (err) {
                console.error('Error fetching patients:', err);
                setError('ไม่สามารถโหลดข้อมูลได้');

                // Fallback to empty arrays
                setPatients([]);
                setMissedPatients([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPatients();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-96px)]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-96px)]">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                    <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-96px)] pb-4">
                {/* Left Column: Patient List */}
                <div className="flex-1 bg-[#F3F4F6] dark:bg-transparent rounded-[20px] flex flex-col overflow-hidden transition-colors">
                    <div className="mb-3 flex-shrink-0 flex items-start justify-between gap-4 animate-fade-in-up">
                        <div>
                            <h1 className="text-[26px] font-bold text-[#111827] dark:text-white">{title}</h1>
                            <h2 className="text-[16px] text-[#A59CFD] font-semibold">
                                รายชื่อ ({patients.length} คน)
                                {selectedPatients.size > 0 && (
                                    <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                                        • เลือก {selectedPatients.size} คน
                                    </span>
                                )}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {canUseBulkTools && selectedPatients.size > 0 && (
                                <button
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[12px] font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors hover-scale"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    มอบหมาย
                                </button>
                            )}
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[12px] font-medium rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors hover-scale"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                นำเข้า
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {patients.length > 0 ? (
                            patients.map((patient, idx) => {
                                const userEmail = session?.user?.email?.toLowerCase();
                                const isCreator = userEmail && patient.creatorEmail && userEmail === patient.creatorEmail.toLowerCase();
                                const isResponsible = userEmail && patient.responsibleEmails?.some(email => email.toLowerCase() === userEmail);
                                const canSelect = isAdmin || isCreator || isResponsible;

                                return (
                                    <div key={`${patient.hn}-${idx}`} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-4 shadow-sm flex gap-3 border border-gray-100 dark:border-gray-700 transition-colors card-animate hover-lift" style={{ animationDelay: `${idx * 0.03}s` }}>
                                        {/* Checkbox - Only show if Admin or Creator */}
                                        {canUseBulkTools && canSelect && (
                                            <button
                                                onClick={() => {
                                                    const newSelected = new Set(selectedPatients);
                                                    if (newSelected.has(patient.hn)) {
                                                        newSelected.delete(patient.hn);
                                                    } else {
                                                        newSelected.add(patient.hn);
                                                    }
                                                    setSelectedPatients(newSelected);
                                                }}
                                                className="flex-shrink-0 mt-0.5"
                                            >
                                                {selectedPatients.has(patient.hn) ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                                )}
                                            </button>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <div className="flex justify-between items-start">
                                                <div className="text-[16px] font-bold text-[#1F2937] dark:text-white">
                                                    HN : {patient.hn}
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${patient.process === 'เสร็จสิ้น'
                                                    ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30'
                                                    : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700'
                                                    }`}>
                                                    {patient.process || 'ไม่ระบุ'}
                                                </span>
                                            </div>
                                            <div className="text-[13px] text-[#374151] dark:text-gray-300">
                                                {patient.name} {patient.surname}
                                            </div>
                                            {patient.appointmentDate && (
                                                <div className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    นัดหมาย: {formatDateThai(patient.appointmentDate)} {patient.appointmentTime || ''}
                                                </div>
                                            )}
                                            {patient.caregiver && (
                                                <div className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    ผู้ดูแล: {patient.caregiver}
                                                </div>
                                            )}
                                            <Link
                                                href={`${basePath}/${patient.hn}`}
                                                className="inline-block w-fit px-5 py-1.5 bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#4338CA] dark:text-indigo-300 text-[12px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-900 transition-colors mt-1"
                                            >
                                                ตรวจสอบ
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p>ไม่พบข้อมูลผู้ป่วย</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Missed Appointment Sidebar */}
                <div className="w-full lg:w-[240px] bg-white dark:bg-[#1F2937] rounded-[20px] p-4 shadow-sm flex flex-col overflow-hidden flex-shrink-0 transition-colors animate-fade-in-right">
                    <div className="mb-3 flex-shrink-0">
                        <h3 className="text-[11px] font-semibold text-[#374151] dark:text-gray-300 leading-tight">รายชื่อผู้ป่วยที่เลยกำหนดการนัด</h3>
                    </div>

                    <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar flex-1">
                        {missedPatients.length > 0 ? (
                            missedPatients.map((patient, idx) => (
                                <Link
                                    key={`missed-${patient.hn}-${idx}`}
                                    href={`${basePath}/${patient.hn}`}
                                    className="block bg-gray-50 dark:bg-gray-800 rounded-[6px] p-2.5 relative hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${getSeverityColor(patient.daysOverdue)}`}></div>
                                    <div className="pl-2.5">
                                        <h4 className="text-[11px] font-bold text-[#1E3A8A] dark:text-blue-300">
                                            {patient.name} {patient.surname}
                                        </h4>
                                        <p className="text-[10px] text-[#6B7280] dark:text-gray-400">
                                            {patient.daysOverdue >= 7 ? 'เลยกำหนดการนัดหลายวัน' : `เลยกำหนดการนัด ${patient.daysOverdue} วัน`}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                                <p className="text-[11px]">ไม่มีผู้ป่วยที่เลยกำหนดการนัด</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Bulk Import Modal */}
            < BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={() => {
                    setIsImportModalOpen(false);
                    window.location.reload();
                }}
            />

            {/* Bulk Assign Modal */}
            <BulkAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                selectedPatients={patients.filter(p => selectedPatients.has(p.hn))}
                onAssignComplete={() => {
                    setIsAssignModalOpen(false);
                    setSelectedPatients(new Set());
                }}
            />
        </>
    );
};
