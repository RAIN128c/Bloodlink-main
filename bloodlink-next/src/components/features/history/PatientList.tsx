'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Patient } from '@/types';
import { Loader2, Upload, Users, CheckSquare, Square, Search, Filter, Trash2 } from 'lucide-react';
import { formatDateThai } from '@/lib/utils';
import { BulkImportModal } from '@/components/modals/BulkImportModal';
import { BulkAssignModal } from '@/components/modals/BulkAssignModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useSession, SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { deletePatient } from '@/lib/actions/patient'; // Import delete action
// Animation Imports
import { StaggerContainer, FadeIn, ListAnimatePresence } from '@/components/ui/MotionPrimitives';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';
import { PrintSummarySheet } from '@/components/features/history/PrintSummarySheet'; // Import Print Sheet
import { Printer } from 'lucide-react'; // Import Printer Icon
import { updatePatientStatus } from '@/lib/actions/patient'; // Import update action

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
    // removed local state missedPatients, will derive it from patients
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bulk action states
    const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Delete Modal State
    const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Print State
    const [isPrinting, setIsPrinting] = useState(false);

    // Filter State
    const [showOnlyMyPatients, setShowOnlyMyPatients] = useState(true);

    // Order Lab confirm modal state
    const [isOrderLabConfirmOpen, setIsOrderLabConfirmOpen] = useState(false);
    const [isOrderingLab, setIsOrderingLab] = useState(false);

    const { data: session } = useSession();
    const { effectiveRole: role } = useEffectiveRole();
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

                setPatients(activePatients);
                // setMissedPatients removed
            } catch (err) {
                console.error('Error fetching patients:', err);
                setError('ไม่สามารถโหลดข้อมูลได้');

                // Fallback to empty arrays
                setPatients([]);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPatients();

        // Real-time subscription
        const channel = supabase
            .channel('realtime-history-patients')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Only add if active status (or handle logic)
                        const newPatient = payload.new as Patient;
                        if (newPatient.status === 'ใช้งาน') {
                            setPatients((prev) => [newPatient, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setPatients((prev) =>
                            prev.map((p) => {
                                if (p.hn === (payload.new as Patient).hn) {
                                    // If updated to inactive, maybe remove? For now just update
                                    return payload.new as Patient;
                                }
                                return p;
                            }).filter(p => p.status === 'ใช้งาน') // Re-filter if status changed
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setPatients((prev) =>
                            prev.filter((p) => p.hn !== (payload.old as Patient).hn)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Derived state for missed appointments
    const missedPatients = useMemo(() => {
        return patients
            .map(p => ({
                ...p,
                daysOverdue: calculateDaysOverdue(p.appointmentDate)
            }))
            .filter(p => p.daysOverdue > 0 && p.process === 'นัดหมาย')
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .slice(0, 10);
    }, [patients]);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            // Since HN is empty string for these cases, we pass empty string to deletePatient
            // The service should handle it, or we might need to adjust logic if API needs something else.
            // But based on previous logic: deletePatient(patient.hn) where patient.hn was likely "" or null.
            const result = await deletePatient(''); // Empty HN

            if (result.success) {
                window.location.reload();
            } else {
                setError('ลบไม่สำเร็จ: ' + (result.error || 'Unknown error'));
                setPatientToDelete(null);
            }
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการลบ');
            setPatientToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };


    // Apply "My Patients" filter
    const filteredPatients = useMemo(() => {
        let result = patients;
        if (showOnlyMyPatients && session?.user?.email) {
            const userEmail = session.user.email.toLowerCase();
            result = result.filter(patient => {
                const isCreator = patient.creatorEmail && userEmail === patient.creatorEmail.toLowerCase();
                const isResponsible = patient.responsibleEmails?.some(email => email.toLowerCase() === userEmail);
                return isCreator || isResponsible;
            });
        }
        return result;
    }, [patients, showOnlyMyPatients, session]);

    // Computed states for Bulk Action logic
    const canOrderLab = useMemo(() => {
        return Array.from(selectedPatients).some(hn => {
            const p = patients.find(p => p.hn === hn);
            return p && (p.process === 'รอตรวจ' || p.process === 'นัดหมาย');
        });
    }, [selectedPatients, patients]);

    const canPrint = useMemo(() => {
        return Array.from(selectedPatients).some(hn => {
            const p = patients.find(p => p.hn === hn);
            // Printing is ONLY allowed if the order has been submitted to the lab or further
            return p && (p.process !== 'รอตรวจ' && p.process !== 'นัดหมาย');
        });
    }, [selectedPatients, patients]);

    const handlePrintSummary = () => {
        setIsPrinting(true);
        // Delay to allow component to render before printing
        setTimeout(async () => {
            window.print();
            setIsPrinting(false);
        }, 300); // slightly longer delay for rendering complex tables
    };

    const handleConfirmOrderLab = async () => {
        setIsOrderingLab(true);
        const selectedHns = Array.from(selectedPatients);
        let hasError = false;
        for (const hn of selectedHns) {
            try {
                const res = await updatePatientStatus(hn, 'รอแล็บรับเรื่อง', {});
                if (!res.success) hasError = true;
            } catch (err) {
                console.error(err);
                hasError = true;
            }
        }

        if (hasError) {
            alert('พบข้อผิดพลาดบางรายการ กรุณาตรวจสอบสถานะและลองใหม่หากจำเป็น');
        } else {
            setSelectedPatients(new Set());
            window.location.reload();
        }
        setIsOrderingLab(false);
        setIsOrderLabConfirmOpen(false);
    };

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
                            <h2 className="text-[16px] text-[#A59CFD] font-semibold flex items-center gap-2">
                                รายชื่อ ({filteredPatients.length} คน)
                                {selectedPatients.size > 0 && (
                                    <span className="text-indigo-600 dark:text-indigo-400">
                                        • เลือก {selectedPatients.size} คน
                                    </span>
                                )}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setShowOnlyMyPatients(!showOnlyMyPatients)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors hover-scale ${showOnlyMyPatients ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {showOnlyMyPatients ? 'เฉพาะที่ฉันรับผิดชอบ' : 'ดูแลทั้งหมด'}
                            </button>
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
                            {selectedPatients.size > 0 && canOrderLab && Permissions.isDoctorOrNurse(role) && (
                                <button
                                    onClick={() => setIsOrderLabConfirmOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[12px] font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors hover-scale"
                                >
                                    <Square className="w-3.5 h-3.5" />
                                    สั่งเจาะเลือด ({selectedPatients.size})
                                </button>
                            )}
                            {selectedPatients.size > 0 && canPrint && (
                                <button
                                    onClick={() => handlePrintSummary()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[12px] font-medium rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors hover-scale"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    พิมพ์ใบส่งตรวจ ({selectedPatients.size})
                                </button>
                            )}
                        </div>
                    </div>

                    <StaggerContainer className="overflow-y-auto pr-2 space-y-3 custom-scrollbar h-full">
                        <ListAnimatePresence>
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient, idx) => {
                                    const userEmail = session?.user?.email?.toLowerCase();
                                    const isCreator = userEmail && patient.creatorEmail && userEmail === patient.creatorEmail.toLowerCase();
                                    const isResponsible = userEmail && patient.responsibleEmails?.some(email => email.toLowerCase() === userEmail);
                                    const canSelect = isAdmin || isCreator || isResponsible;

                                    return (
                                        <FadeIn
                                            key={`${patient.hn}`}
                                            className="bg-white dark:bg-[#1F2937] rounded-[16px] p-4 shadow-sm flex gap-3 border border-gray-100 dark:border-gray-700 transition-colors card-animate hover-lift group"
                                        >
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
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[16px] font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            HN : {patient.hn}
                                                        </div>
                                                        {patient.process === 'กำลังจัดส่ง' ? (
                                                            <div title="เตรียมใบส่งตรวจแล้ว" className="flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1 rounded-md">
                                                                <Printer className="w-3.5 h-3.5" />
                                                            </div>
                                                        ) : patient.process === 'รอแล็บรับเรื่อง' ? (
                                                            <div title="ส่งคำขอแล้ว (รอแล็บอนุมัติ)" className="flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1 rounded-md border border-amber-200 dark:border-amber-800">
                                                                <Printer className="w-3.5 h-3.5 opacity-50" />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <StatusBadge status={patient.process} />
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
                                                {patient.hn ? (
                                                    <Link
                                                        href={`${basePath}/${patient.hn}`}
                                                        className="inline-block w-fit px-5 py-1.5 bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#4338CA] dark:text-indigo-300 text-[12px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-900 transition-colors mt-1"
                                                    >
                                                        ตรวจสอบ
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => setPatientToDelete('NO_HN_' + idx)}
                                                        className="inline-block w-fit px-5 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-[12px] font-medium rounded-[6px] hover:bg-red-200 dark:hover:bg-red-800 transition-colors mt-1"
                                                    >
                                                        ลบ (No HN)
                                                    </button>
                                                )}
                                            </div>
                                        </FadeIn>
                                    );
                                })
                            ) : (
                                <FadeIn className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <p>ไม่พบข้อมูลผู้ป่วย</p>
                                </FadeIn>
                            )}
                        </ListAnimatePresence>
                    </StaggerContainer>
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
            {/* Bulk Import Modal */}
            <BulkImportModal
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

            {/* Custom Confirm Modal for Delete */}
            <ConfirmModal
                isOpen={!!patientToDelete}
                onClose={() => setPatientToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="ยืนยันการลบข้อมูล"
                description="คุณต้องการลบข้อมูลผู้ป่วยที่ไม่มี HN รายนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้"
                confirmText="ลบข้อมูล"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Custom Confirm Modal for Ordering Lab */}
            <ConfirmModal
                isOpen={isOrderLabConfirmOpen}
                onClose={() => setIsOrderLabConfirmOpen(false)}
                onConfirm={handleConfirmOrderLab}
                title="ยืนยันการสั่งเจาะเลือด"
                description="ต้องการสั่งเจาะเลือดผู้ป่วยที่เลือกใช่หรือไม่? (ระบบจะส่งเรื่องไปที่ห้องแล็บเพื่อรอรับเรื่อง)"
                confirmText="สั่งเจาะเลือด"
                cancelText="ยกเลิก"
                variant="primary"
                isLoading={isOrderingLab}
            />

            {/* Print Summary Sheet - Rendered only when printing */}
            {
                isPrinting && (
                    <PrintSummarySheet
                        patients={patients.filter(p => selectedPatients.has(p.hn))}
                    />
                )
            }
        </>
    );
};

