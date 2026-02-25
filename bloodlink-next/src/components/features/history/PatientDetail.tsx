'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Patient } from '@/types';
import { LabService, LabResult } from '@/lib/services/labService';
import { AppointmentService, Appointment } from '@/lib/services/appointmentService';
import { PatientService } from '@/lib/services/patientService';
import { updatePatientStatus as updatePatientStatusAction } from '@/lib/actions/patient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PrintRequestSheet } from '@/components/features/history/PrintRequestSheet';

// ... (inside component)


import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { useSession, SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import {
    Calendar,
    Clock,
    FileText,
    Activity,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Phone,
    MapPin,
    User,
    Edit2,
    Trash2,
    X,
    Loader2,
    Share2,
    MoreVertical,
    History,
    Plus,
    UserPlus,
    ArrowLeft, MessageSquare, ShoppingCart, Eye, Check, Users, Search, Printer
} from 'lucide-react';
import { formatDateThai } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { PinVerificationModal } from '@/components/shared/PinVerificationModal';

// Timeline icons mapping
const STATUS_ICONS: Record<string, React.ReactNode> = {
    'นัดหมาย': <Calendar className="w-4 h-4" />,
    'รอแล็บรับเรื่อง': <MessageSquare className="w-4 h-4" />,
    'รอจัดส่ง': <ShoppingCart className="w-4 h-4" />,
    'กำลังจัดส่ง': <ShoppingCart className="w-4 h-4" />,
    'กำลังตรวจ': <Eye className="w-4 h-4" />,
    'เสร็จสิ้น': <Check className="w-4 h-4" />,
};

const STATUS_ORDER = ['นัดหมาย', 'รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'];

// NCD Mapping
const NCD_MAP: Record<string, string> = {
    '001': 'โรคเบาหวาน',
    '002': 'ความดันโลหิตสูง',
    '003': 'ไขมันในเลือดสูง',
    '004': 'โรคหัวใจ',
    '005': 'โรคไตวายเรื้อรัง'
};

interface PatientData {
    hn: string;
    name: string;
    surname: string;
    gender: string;
    age: string;
    bloodType: string;
    status: string;
    process: string;
    disease: string[];
    allergy: string[];
    ncd: string;
    lastCheck: string;
    registeredDate: string;
    latestReceipt: string;
    caregiver: string;
    appointmentDate?: string;
    appointmentTime?: string;
    idCard?: string;
    phone?: string;
    relativeName?: string;
    relativePhone?: string;
    relativeRelationship?: string;
}

interface PatientDetailProps {
    hn: string;
    backPath: string; // e.g., '/history' or '/admin/patients'
}

export const PatientDetail = ({ hn, backPath }: PatientDetailProps) => {
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<PatientData | null>(null);
    const [ncdInput, setNcdInput] = useState('');

    // Tag UI State
    const [modalTags, setModalTags] = useState<{ title: string, tags: string[] } | null>(null);

    // Status Modal State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [tempStatus, setTempStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [appointmentType, setAppointmentType] = useState('Check-up'); // Default type
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Vital Signs State (For 'รอแล็บรับเรื่อง')
    const [vsWeight, setVsWeight] = useState('');
    const [vsHeight, setVsHeight] = useState('');
    const [vsWaist, setVsWaist] = useState('');
    const [vsBp, setVsBp] = useState('');
    const [vsPulse, setVsPulse] = useState('');
    const [vsTemp, setVsTemp] = useState('');
    const [vsDtx, setVsDtx] = useState('');

    // Responsibility State
    const [responsiblePersons, setResponsiblePersons] = useState<{ email: string; role: string; assignedAt: string; name?: string; surname?: string }[]>([]);
    const [canEditPatientData, setCanEditPatientData] = useState(false);
    const [showAddResponsibleModal, setShowAddResponsibleModal] = useState(false);
    // Modal State
    const [staffList, setStaffList] = useState<{ doctors: any[], nurses: any[] }>({ doctors: [], nurses: [] });
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [modalActiveTab, setModalActiveTab] = useState<string>('doctor');
    const [selectedStaffEmail, setSelectedStaffEmail] = useState<string | null>(null);

    // Fetch staff list when modal opens
    useEffect(() => {
        if (showAddResponsibleModal) {
            setIsLoadingStaff(true);
            fetch('/api/users/staff')
                .then(res => res.json())
                .then(data => {
                    if (data.staff) {
                        // Filter doctors and nurses
                        // Filter doctors and nurses with loose matching
                        const doctors = data.staff.filter((u: any) => {
                            const r = (u.role || '').toLowerCase().trim();
                            return r.includes('แพทย์') || r.includes('doctor') || r.includes('med') || r === 'admin'; // Temporarily showing admin in doctors for visibility
                        });
                        const nurses = data.staff.filter((u: any) => {
                            const r = (u.role || '').toLowerCase().trim();
                            return r.includes('พยาบาล') || r.includes('nurse');
                        });
                        setStaffList({ doctors, nurses });
                    }
                })
                .catch(err => console.error('Failed to fetch staff:', err))
                .finally(() => setIsLoadingStaff(false));
        }
    }, [showAddResponsibleModal]);

    // Appointment History State
    const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Permission Checks - Use useEffectiveRole hook for debug override support
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();
    const currentUserEmail = session?.user?.email;

    // Derive ownership/responsibility from fetched state
    const userResponsibility = responsiblePersons.find(p => p.email === currentUserEmail);
    const isOwner = userResponsibility?.role === 'creator';
    const isResponsible = !!userResponsibility;

    // Calculate Permissions dynamically
    const canEditPatient = Permissions.canEditPatient(effectiveRole, isResponsible);
    // Updated: canManageStaff now uses isResponsible
    const canManageStaff = Permissions.canManageStaff(effectiveRole, isResponsible);
    const canDeleteRole = Permissions.canDeletePatient(effectiveRole, isOwner);
    const canUpdateStatus = patientData ? (
        Permissions.isAdmin(effectiveRole) ||
        Permissions.getNextAllowedStatus(effectiveRole, patientData.process) !== null
    ) : false;
    const canEditLab = Permissions.canEditLab(effectiveRole);

    // Lab History State
    const [labHistory, setLabHistory] = useState<LabResult[]>([]);

    // Tab State
    const [activeTab, setActiveTab] = useState<'appointments' | 'labs'>('appointments');

    // Confirm Modal Config
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
        variant?: 'danger' | 'warning' | 'primary';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        description: '',
        action: async () => { },
        variant: 'danger',
    });

    // Next-round modal: auto-shows when patient is เสร็จสิ้น
    const [showNextRoundModal, setShowNextRoundModal] = useState(false);
    const [nextRoundLoading, setNextRoundLoading] = useState(false);
    const [nextRoundDismissed, setNextRoundDismissed] = useState(false);

    // PIN Verification State
    const [showPinModal, setShowPinModal] = useState(false);

    // Trigger next-round modal when patient is เสร็จสิ้น and role can restart
    useEffect(() => {
        if (
            patientData?.process === 'เสร็จสิ้น' &&
            !nextRoundDismissed &&
            (Permissions.isDoctorOrNurse(effectiveRole) || Permissions.isAdmin(effectiveRole))
        ) {
            // Small delay so the page renders first
            const t = setTimeout(() => setShowNextRoundModal(true), 600);
            return () => clearTimeout(t);
        }
    }, [patientData?.process, effectiveRole, nextRoundDismissed]);

    const handleNextRound = async () => {
        setNextRoundLoading(true);
        try {
            const result = await updatePatientStatusAction(hn, 'รอตรวจ', { history: 'เริ่มการตรวจรอบใหม่' });
            if (result.success) {
                setPatientData(prev => prev ? { ...prev, process: 'รอตรวจ' } : null);
                setShowNextRoundModal(false);
                toast.success('เริ่มการตรวจรอบใหม่เรียบร้อย');
            } else {
                toast.error(result.error || 'ไม่สามารถเริ่มรอบใหม่');
            }
        } catch {
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setNextRoundLoading(false);
        }
    };

    useEffect(() => {
        async function fetchPatient(retries = 3, delay = 500) {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/patients/${hn}`);

                if (!response.ok) {
                    if (response.status === 404 && retries > 0) {
                        console.log(`Patient not found, retrying in ${delay}ms... (${retries} retries left)`);
                        setTimeout(() => fetchPatient(retries - 1, delay * 2), delay);
                        return;
                    }
                    throw new Error('Patient not found');
                }

                const data: Patient = await response.json();

                // Map API data to component state
                const mapped: PatientData = {
                    hn: data.hn,
                    name: data.name,
                    surname: data.surname,
                    gender: data.gender,
                    age: data.age,
                    bloodType: data.bloodType,
                    status: data.status || 'ใช้งาน',
                    process: data.process || 'นัดหมาย',
                    disease: data.disease && data.disease !== '-'
                        ? data.disease.split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== '-')
                        : [],
                    allergy: data.allergies && data.allergies !== '-'
                        ? data.allergies.split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== '-')
                        : [],
                    ncd: '-',
                    lastCheck: data.appointmentDate || data.timestamp || '-',
                    registeredDate: data.timestamp || '-',
                    latestReceipt: data.latestReceipt || '-',
                    caregiver: data.caregiver || '-',
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    idCard: data.idCard,
                    phone: data.phone,
                    relativeName: data.relativeName,
                    relativePhone: data.relativePhone,
                    relativeRelationship: data.relativeRelationship
                };

                setPatientData(mapped);
                setEditData(mapped);
                setTempStatus(mapped.process);

                // Fetch Appointment History
                try {
                    let appHistory = await AppointmentService.getAppointmentsByHn(hn);
                    setAppointmentHistory(appHistory);
                } catch (e) {
                    console.error('Failed to fetch appointments:', e);
                }

                // Fetch Lab History
                try {
                    let labHist = await LabService.getLabHistory(hn);
                    setLabHistory(labHist);
                } catch (e) {
                    console.error('Failed to fetch labs:', e);
                }

                setIsLoading(false); // Only set loading false on success or final failure
            } catch (err) {
                console.error('Failed to fetch patient:', err);
                if (retries === 0) {
                    setError('ไม่พบข้อมูลผู้ป่วย');
                    setIsLoading(false);
                }
            }
        }

        console.log('Fetching detail for HN:', hn);
        fetchPatient();

        // Check if user can delete
        if ((session?.user as any)?.role === 'admin' || (session?.user as any)?.role === 'staff') {
            // Check delete permissions logic if needed
        }
    }, [hn, session]);

    // Fetch responsibility data
    useEffect(() => {
        async function fetchResponsibility() {
            try {
                const response = await fetch(`/api/patients/${hn}/responsibility`);
                if (response.ok) {
                    const data = await response.json();
                    setResponsiblePersons(data.responsiblePersons || []);
                    setCanEditPatientData(data.canEdit || false);
                }
            } catch (error) {
                console.error('Failed to fetch responsibility:', error);
            }
        }
        fetchResponsibility();
    }, [hn]);

    // Handle add responsible person
    const handleAddResponsible = async (selectedEmail: string) => {
        if (!selectedEmail) return;

        try {
            const response = await fetch(`/api/patients/${hn}/responsibility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', targetEmail: selectedEmail.trim() })
            });

            if (response.ok) {
                toast.success('เพิ่มผู้รับผิดชอบเรียบร้อย');
                // Refresh list to show new person
                const respData = await fetch(`/api/patients/${hn}/responsibility`).then(r => r.json());
                setResponsiblePersons(respData.responsiblePersons || []);
                setShowAddResponsibleModal(false);
                setSelectedStaffEmail('');
                setSearchQuery('');
                setManualEmail('');
            } else {
                toast.error('ไม่สามารถเพิ่มผู้รับผิดชอบได้');
            }
        } catch (error) {
            console.error('Add responsible error:', error);
            toast.error('เกิดข้อผิดพลาดในการเพิ่มผู้รับผิดชอบ');
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    // New state for manual entry tab (can be controlled by tab button)
    // We can reuse modalActiveTab if we expand its type, but let's just cast it for simplicity
    // or better, just allow string on modalActiveTab state definition if it wasn't typed strictly.
    // It was initialized as 'doctor', let's stick to string.



    // Handle remove responsible person
    const handleRemoveResponsible = async (targetEmail: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบความรับผิดชอบ',
            description: 'คุณต้องการลบตัวเองออกจากความรับผิดชอบผู้ป่วยรายนี้หรือไม่?',
            variant: 'warning',
            confirmText: 'ยืนยัน',
            action: async () => {
                try {
                    const response = await fetch(`/api/patients/${hn}/responsibility`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'remove', targetEmail })
                    });
                    if (response.ok) {
                        toast.success('ลบผู้รับผิดชอบเรียบร้อย');
                        // Refresh list
                        const respData = await fetch(`/api/patients/${hn}/responsibility`).then(r => r.json());
                        setResponsiblePersons(respData.responsiblePersons || []);
                        setCanEditPatientData(respData.canEdit || false);
                    } else {
                        toast.error('ไม่สามารถลบผู้รับผิดชอบได้');
                    }
                } catch (error) {
                    console.error('Failed to remove responsible person:', error);
                    toast.error('เกิดข้อผิดพลาดในการลบผู้รับผิดชอบ');
                } finally {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const currentStepIndex = patientData ? STATUS_ORDER.indexOf(patientData.process) : 0;
    const [isSaving, setIsSaving] = useState(false);

    // Pagination Limits
    const [apptLimit, setApptLimit] = useState(5);
    const [labLimit, setLabLimit] = useState(5);

    // Calculate days since last LAB TEST (from labHistory)
    const daysSinceLabTest = (() => {
        if (!labHistory || labHistory.length === 0) return null;
        try {
            const latestLab = labHistory[0]; // Already sorted desc
            const labDate = new Date(latestLab.created_at || latestLab.timestamp);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - labDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch {
            return null;
        }
    })();
    const isLabOverdue = daysSinceLabTest !== null && daysSinceLabTest > 8;

    const handleSave = async () => {
        if (!editData || !patientData) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/patients/${patientData.hn}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender: editData.gender,
                    age: editData.age,
                    bloodType: editData.bloodType,
                    disease: editData.disease.join(', '),
                    allergies: editData.allergy.join(', '),
                    idCard: editData.idCard,
                    phone: editData.phone,
                    relativeName: editData.relativeName,
                    relativePhone: editData.relativePhone,
                    relativeRelationship: editData.relativeRelationship
                })
            });

            if (response.ok) {
                setPatientData({ ...editData });
                setIsEditing(false);
                setNcdInput('');
                toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
            } else {
                toast.error('เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePatient = async () => {
        if (!patientData) return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/patients/${patientData.hn}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('ลบผู้ป่วยเรียบร้อยแล้ว');
                router.push(backPath); // Return to list
                router.refresh();
            } else {
                toast.error('ไม่สามารถลบผู้ป่วยได้');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('เกิดข้อผิดพลาดในการลบ');
        } finally {
            setIsDeleting(false);
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const confirmDeletePatient = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบผู้ป่วย',
            description: `คุณแน่ใจหรือไม่ที่จะลบข้อมูลผู้ป่วย ${patientData?.name} ${patientData?.surname || ''} (HN: ${patientData?.hn})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            variant: 'danger',
            confirmText: 'ลบผู้ป่วย',
            action: handleDeletePatient
        });
    };

    const handleCancel = () => {
        if (patientData) {
            setEditData({ ...patientData });
        }
        setIsEditing(false);
        setNcdInput('');
    };

    // Tag Handlers
    const addTag = (field: 'disease' | 'allergy', value: string) => {
        if (editData && value.trim() && !editData[field].includes(value.trim())) {
            setEditData(prev => prev ? ({
                ...prev,
                [field]: [...prev[field], value.trim()]
            }) : null);
        }
    };

    const removeTag = (field: 'disease' | 'allergy', index: number) => {
        setEditData(prev => prev ? ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }) : null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'disease' | 'allergy') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(field, e.currentTarget.value);
            e.currentTarget.value = '';
        }
    };

    // NCD Handler
    const handleNCDKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = ncdInput.trim();
            if (NCD_MAP[code]) {
                addTag('disease', NCD_MAP[code]); // Add mapped disease
                setNcdInput('');
            } else {
                toast.warning('รหัส NCD ไม่ถูกต้อง');
            }
        }
    };

    // Update Status Handler - Uses server action with role validation
    const handleUpdateStatus = async () => {
        // Check if role can perform this transition
        const currentStatus = patientData?.process || 'รอตรวจ';
        if (!Permissions.canUpdateToStatus(effectiveRole, currentStatus, tempStatus)) {
            const requiredRole = Permissions.getRequiredRoleForTransition(currentStatus, tempStatus);
            toast.error(`ไม่สามารถอัปเดตสถานะได้: ต้องใช้สิทธิ์ ${requiredRole}`);
            return;
        }

        setIsUpdating(true);

        // Intercept E-Signature statuses
        const eSignatureStatuses = ['รอแล็บรับเรื่อง', 'รับออร์เดอร์', 'กำลังตรวจ'];
        if (eSignatureStatuses.includes(tempStatus)) {
            setShowPinModal(true);
            setIsUpdating(false);
            return;
        }

        await executeStatusUpdate();
    };

    const executeStatusUpdate = async (pin?: string) => {
        setIsUpdating(true);
        try {
            // Initialize data object with common properties
            const data: any = {
                history: statusNote,
                pin
            };

            if (tempStatus === 'นัดหมาย') {
                if (!appointmentDate) {
                    toast.error('กรุณาระบุวันที่นัดหมาย');
                    setIsUpdating(false);
                    return;
                }
                data.date = appointmentDate;
                data.time = appointmentTime;
                data.type = appointmentType;
            }

            if (tempStatus === 'รอแล็บรับเรื่อง') {
                data.weight = vsWeight;
                data.height = vsHeight;
                data.waist = vsWaist;
                data.bp = vsBp;
                data.pulse = vsPulse;
                data.temperature = vsTemp;
                data.dtx = vsDtx;

                // For existing appointments, we now do the assignment in the server action.
                // The server action will search for pending appointment and apply the V/S OR create a walk-in.
                // We no longer need to execute AppointmentService.updateStatus from the client side here.
            }

            // Use server action for role validation and status history logging
            const result = await updatePatientStatusAction(hn, tempStatus, data);

            if (result.success) {
                setPatientData((prev: PatientData | null) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        status: 'ใช้งาน',
                        process: tempStatus,
                        appointmentDate: tempStatus === 'นัดหมาย' ? appointmentDate : prev.appointmentDate,
                        appointmentTime: tempStatus === 'นัดหมาย' ? appointmentTime : prev.appointmentTime
                    };
                });
                setShowStatusModal(false);

                // Refresh history from server to show new appointment
                const history = await AppointmentService.getAppointmentsByHn(hn);
                setAppointmentHistory(history);

                toast.success('อัปเดตสถานะเรียบร้อย');
            } else {
                toast.error(result.error || 'ไม่สามารถอัปเดตสถานะได้');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        } finally {
            setIsUpdating(false);
        }
    };

    const renderTagsView = (tags: string[], title: string) => {
        if (tags.length === 0 || (tags.length === 1 && tags[0] === '-')) {
            return <span className="text-[14px] font-medium text-[#1e1b4b] dark:text-white">-</span>;
        }

        return (
            <div className="flex flex-wrap gap-1">
                <div className="px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e1b4b] dark:text-blue-300 rounded-full text-[12px] font-medium border border-[#DBEAFE] dark:border-blue-700">
                    {tags[0]}
                </div>
                {tags.length > 1 && (
                    <div
                        onClick={() => setModalTags({ title, tags })}
                        className="px-2 py-0.5 bg-[#F3F4F6] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 rounded-full text-[12px] font-medium cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-gray-600 border border-[#E5E7EB] dark:border-gray-600"
                    >
                        +{tags.length - 1}
                    </div>
                )}
            </div>
        );
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !patientData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 dark:text-red-400">{error || 'ไม่พบข้อมูลผู้ป่วย'}</p>
                <Link href={backPath} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                    กลับ
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Content Area */}
            <div className="flex-1 flex flex-col gap-3 pb-4">

                {/* Back Button */}
                <div className="flex-shrink-0 mt-1">
                    <Link href={backPath} className="inline-flex items-center px-3 py-1.5 bg-[#BAE6FD] dark:bg-sky-900/50 text-[#0369A1] dark:text-sky-300 rounded-[8px] text-[12px] font-medium hover:bg-[#7DD3FC] dark:hover:bg-sky-800/50 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        ย้อนกลับ
                    </Link>
                </div>

                {/* Patient Info Card - Compact */}
                <div className="bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm p-6 flex flex-col md:flex-row relative flex-shrink-0 min-h-[260px] transition-colors border border-transparent dark:border-gray-700">
                    {/* Status Update Button - Absolute Positioned for Response */}
                    <div className="absolute top-6 right-6 z-10">
                        <button
                            onClick={() => setShowStatusModal(true)}
                            disabled={!canUpdateStatus}
                            className={`w-8 h-8 rounded-[8px] flex items-center justify-center shadow-sm transition-transform active:scale-95 ${canUpdateStatus
                                ? 'bg-[#818cf8] text-white hover:bg-[#6366F1]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            title="อัปเดตสถานะ"
                        >
                            {STATUS_ICONS[patientData.process] || <ShoppingCart className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Left: Profile Section */}
                    <div className="w-full md:w-[280px] flex flex-col md:pr-6 shrink-0 mb-4 md:mb-0 relative">
                        <span className="text-[12px] text-[#6B7280] dark:text-gray-400 mb-4 block">
                            ตรวจเมื่อวันที่ {formatDateThai(patientData.lastCheck)}
                        </span>

                        <div className="w-[90px] h-[90px] bg-[#E5E7EB] dark:bg-gray-700 rounded-[14px] flex items-center justify-center mb-4 mx-0">
                            <User className="w-10 h-10 text-[#9CA3AF] dark:text-gray-400 stroke-[1.5]" />
                        </div>

                        <h1 className="text-[20px] font-bold text-[#1e1b4b] dark:text-white mb-1 leading-tight">
                            {patientData.name} {patientData.surname}
                        </h1>

                        <div className="flex gap-3 mb-4">
                            {patientData.hn.split('').map((digit, i) => (
                                <span key={i} className="text-[14px] font-bold text-[#6B7280] dark:text-gray-400">
                                    {digit}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    if (canEditPatient) {
                                        isEditing ? handleCancel() : setIsEditing(true);
                                    }
                                }}
                                disabled={!canEditPatient}
                                className={`w-fit px-5 py-1 rounded-[6px] border text-[11px] transition-colors font-medium ${!canEditPatient
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : isEditing
                                        ? 'border-red-400 dark:border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                        : 'border-[#60A5FA] dark:border-blue-500 text-[#60A5FA] dark:text-blue-400 hover:bg-[#EFF6FF] dark:hover:bg-blue-900/30'
                                    }`}
                            >
                                {isEditing ? 'ยกเลิก' : (canEditPatient ? 'แก้ไขข้อมูล' : 'ดูข้อมูล')}
                            </button>

                            {Permissions.isAdmin(effectiveRole) && (
                                <button
                                    onClick={confirmDeletePatient}
                                    className="w-fit px-3 py-1 rounded-[6px] border border-red-200 dark:border-red-800 text-[11px] transition-colors font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1"
                                    title="ลบผู้ป่วย (Admin Only)"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block w-[1px] bg-[#E5E7EB] dark:bg-gray-700 mx-2 self-stretch rounded-full my-1"></div>

                    {/* Right: Details Grid */}
                    <div className="flex-1 md:pl-6 pt-2 relative">


                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 mt-2">

                            {/* Gender */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เพศ</label>
                                {isEditing && editData ? (
                                    <div className="w-[100px]">
                                        <CustomSelect
                                            value={editData.gender}
                                            onChange={(val) => setEditData({ ...editData, gender: val })}
                                            options={[
                                                { label: 'ชาย', value: 'ชาย' },
                                                { label: 'หญิง', value: 'หญิง' }
                                            ]}
                                            className="min-w-[80px]"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.gender}</span>
                                )}
                            </div>

                            {/* Age */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">อายุ</label>
                                {isEditing && editData ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={editData.age}
                                            onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                                            className="text-[14px] font-bold text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-14 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                        />
                                        <span className="text-[14px] text-[#6B7280] dark:text-gray-400">ปี</span>
                                    </div>
                                ) : (
                                    <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.age} ปี</span>
                                )}
                            </div>

                            {/* Responsible Persons */}
                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-3">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> ผู้รับผิดชอบ
                                </label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {responsiblePersons.length > 0 ? (
                                        responsiblePersons.map((person, idx) => (
                                            <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e3a8a] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-700">
                                                <span>
                                                    {person.name ? `${person.name} ${person.surname || ''}` : person.email}
                                                </span>
                                                {person.role === 'creator' && <span className="text-[10px] text-gray-500">(ผู้สร้าง)</span>}
                                                {canEditPatientData && currentUserEmail === person.email && (
                                                    <button
                                                        onClick={() => handleRemoveResponsible(person.email)}
                                                        className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="ลบตัวเองออก"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[14px] text-gray-400 dark:text-gray-500">ไม่มีผู้รับผิดชอบ</span>
                                    )}
                                    {canEditPatientData && (
                                        <button
                                            onClick={() => setShowAddResponsibleModal(true)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#6366F1] hover:text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                        >
                                            <UserPlus className="w-3 h-3" /> เพิ่ม
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ID Card */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เลขบัตรประชาชน</label>
                                {isEditing && editData ? (
                                    <input
                                        type="text"
                                        value={editData.idCard || ''}
                                        onChange={(e) => setEditData({ ...editData, idCard: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                                        className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8] font-mono tracking-wide"
                                        placeholder="1234567890123"
                                    />
                                ) : (
                                    <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white font-mono tracking-wide">{patientData.idCard || '-'}</span>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เบอร์โทรศัพท์</label>
                                {isEditing && editData ? (
                                    <input
                                        type="tel"
                                        value={editData.phone || ''}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                        placeholder="0xx-xxx-xxxx"
                                    />
                                ) : (
                                    patientData.phone ? (
                                        <a href={`tel:${patientData.phone}`} className="text-[14px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {patientData.phone}
                                        </a>
                                    ) : <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">-</span>
                                )}
                            </div>

                            {/* Relative Info Section */}
                            <div className="col-span-2 md:col-span-3 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">ข้อมูลติดต่อฉุกเฉิน (ญาติ)</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                                    {/* Relative Name */}
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">ชื่อญาติ</label>
                                        {isEditing && editData ? (
                                            <input
                                                type="text"
                                                value={editData.relativeName || ''}
                                                onChange={(e) => setEditData({ ...editData, relativeName: e.target.value })}
                                                className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                            />
                                        ) : (
                                            <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.relativeName || '-'}</span>
                                        )}
                                    </div>

                                    {/* Sub-grid for Relation and Phone to keep alignment */}
                                    <div className="contents md:flex md:contents">
                                        {/* Relation */}
                                        <div className="flex flex-col gap-0.5">
                                            <label className="text-[12px] text-[#6B7280] dark:text-gray-400">ความสัมพันธ์</label>
                                            {isEditing && editData ? (
                                                <input
                                                    type="text"
                                                    value={editData.relativeRelationship || ''}
                                                    onChange={(e) => setEditData({ ...editData, relativeRelationship: e.target.value })}
                                                    className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                                    placeholder="เช่น บิดา, มารดา"
                                                />
                                            ) : (
                                                <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.relativeRelationship || '-'}</span>
                                            )}
                                        </div>

                                        {/* Relative Phone */}
                                        <div className="flex flex-col gap-0.5">
                                            <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เบอร์ญาติ</label>
                                            {isEditing && editData ? (
                                                <input
                                                    type="tel"
                                                    value={editData.relativePhone || ''}
                                                    onChange={(e) => setEditData({ ...editData, relativePhone: e.target.value })}
                                                    className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                                />
                                            ) : (
                                                patientData.relativePhone ? (
                                                    <a href={`tel:${patientData.relativePhone}`} className="text-[14px] font-bold text-red-600 hover:underline flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {patientData.relativePhone}
                                                    </a>
                                                ) : <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">-</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Blood Type (Existing) */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">หมู่เลือด</label>
                                {isEditing && editData ? (
                                    <div className="w-[100px]">
                                        <CustomSelect
                                            value={editData.bloodType}
                                            onChange={(val) => setEditData({ ...editData, bloodType: val })}
                                            options={[
                                                { label: 'A+', value: 'A+' },
                                                { label: 'A-', value: 'A-' },
                                                { label: 'B+', value: 'B+' },
                                                { label: 'B-', value: 'B-' },
                                                { label: 'AB+', value: 'AB+' },
                                                { label: 'AB-', value: 'AB-' },
                                                { label: 'O+', value: 'O+' },
                                                { label: 'O-', value: 'O-' }
                                            ]}
                                            className="min-w-[80px]"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.bloodType}</span>
                                )}
                            </div>

                            {/* Process Status */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">สถานะกระบวนการ</label>
                                <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.process}</span>
                            </div>

                            {/* Disease Tags */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">โรคประจำตัว</label>
                                {isEditing && editData ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-1">
                                            {editData.disease.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e1b4b] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-700">
                                                    {tag}
                                                    <button onClick={() => removeTag('disease', index)} className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            onKeyDown={(e) => handleKeyDown(e, 'disease')}
                                            className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                            placeholder="พิมพ์แล้ว Enter..."
                                        />
                                    </div>
                                ) : (
                                    renderTagsView(patientData.disease, 'โรคประจำตัว')
                                )}
                            </div>

                            {/* Allergy Tags */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">อาการแพ้</label>
                                {isEditing && editData ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-1">
                                            {editData.allergy.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-[#FEF2F2] dark:bg-red-900/30 text-[#991B1B] dark:text-red-300 border border-[#FECACA] dark:border-red-700">
                                                    {tag}
                                                    <button onClick={() => removeTag('allergy', index)} className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            onKeyDown={(e) => handleKeyDown(e, 'allergy')}
                                            className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                            placeholder="พิมพ์แล้ว Enter..."
                                        />
                                    </div>
                                ) : (
                                    renderTagsView(patientData.allergy, 'อาการแพ้')
                                )}
                            </div>

                            {/* Reg Date */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">วันที่ลงทะเบียน</label>
                                <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{formatDateThai(patientData.registeredDate)}</span>
                            </div>

                            {/* NCD - Only shown in Edit Mode */}
                            {isEditing && (
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[12px] text-[#6B7280] dark:text-gray-400">NCD</label>
                                    <input
                                        type="text"
                                        value={ncdInput}
                                        onChange={(e) => setNcdInput(e.target.value)}
                                        onKeyDown={handleNCDKeyDown}
                                        className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                        placeholder="ใส่รหัส (e.g. 001)"
                                    />
                                </div>
                            )}

                            {/* Save Button */}
                            {isEditing && (
                                <div className="flex items-end col-span-2 md:col-span-1">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full md:w-auto px-5 py-1.5 bg-[#6366F1] text-white rounded-[6px] text-[12px] font-medium hover:bg-[#4F46E5] transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
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

                {/* Timeline + Action Section */}
                <div className="flex justify-start -mb-2.5 z-10 relative pl-4 gap-2">
                    {canEditLab && canUpdateStatus && (
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="text-[#6366F1] dark:text-indigo-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:text-[#4F46E5] dark:hover:text-indigo-300 bg-[#F3F4F6] dark:bg-gray-800 px-2 py-0.5 rounded-full border-none outline-none"
                        >
                            <Edit2 className="w-3 h-3" /> อัปเดตสถานะ
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm p-4 flex-shrink-0 relative flex items-center justify-between transition-colors border border-transparent dark:border-gray-700">
                    <div className="flex items-center gap-1 w-full px-2">
                        <div className="flex-1 flex items-center justify-center gap-0">
                            {STATUS_ORDER.map((step, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isActive = index === currentStepIndex;
                                return (
                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                        <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-all relative z-10 ${isActive
                                            ? 'bg-[#60A5FA] text-white shadow-md scale-105'
                                            : isCompleted
                                                ? 'bg-[#4ADE80] text-white'
                                                : 'bg-[#9CA3AF] dark:bg-gray-600 text-white'
                                            }`}>
                                            {STATUS_ICONS[step]}
                                        </div>
                                        {index < STATUS_ORDER.length - 1 && (
                                            <div className="flex-1 h-[2px] mx-[-1px] bg-gray-200 dark:bg-gray-700 relative z-0">
                                                <div className={`h-full transition-all duration-500 ease-in-out ${index < currentStepIndex ? 'bg-[#4ADE80] w-full' : 'w-0'}`} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-4 border-l pl-4 border-gray-200 dark:border-gray-700 py-0.5">
                        <Link
                            href={`/test-status/${patientData.hn}`}
                            className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-5 py-1.5 rounded-[10px] font-bold transition-colors text-[13px] shadow-sm tracking-wide"
                        >
                            เช็คผลตรวจ
                        </Link>
                        {daysSinceLabTest !== null && (
                            <span className={`text-[10px] font-medium ${isLabOverdue
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-[#6B7280] dark:text-gray-400'
                                }`}>
                                {isLabOverdue && <AlertCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                                นับตั้งแต่วันตรวจ {daysSinceLabTest} วัน
                                {isLabOverdue && ' (เกิน 8 วัน)'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}>
                    <div
                        className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[400px] mx-4 shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 border border-transparent dark:border-gray-700 flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-[#1F2937] px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-lg font-bold text-[#1e1b4b] dark:text-white">อัปเดตสถานะ</h2>
                            <button onClick={() => setShowStatusModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['รอตรวจ', 'นัดหมาย', 'รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'].map((option) => {
                                    const isCurrentProcess = patientData?.process === option;
                                    const isAllowedNext = Permissions.canUpdateToStatus(effectiveRole, patientData?.process, option);
                                    const isDisabled = !isAllowedNext && !isCurrentProcess;
                                    return (
                                        <label
                                            key={option}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer'
                                                } ${tempStatus === option
                                                    ? 'bg-[#EFF6FF] dark:bg-blue-900/30 border-[#60A5FA] dark:border-blue-600 text-[#1e1b4b] dark:text-white'
                                                    : isDisabled
                                                        ? 'border-gray-200 dark:border-gray-700 text-gray-400'
                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                value={option}
                                                checked={tempStatus === option}
                                                onChange={(e) => setTempStatus(e.target.value)}
                                                className="w-4 h-4 text-[#60A5FA]"
                                                disabled={isDisabled}
                                            />
                                            <span className="text-sm font-medium">{option}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {tempStatus === 'นัดหมาย' && (
                                <div className="bg-[#F8FAFC] dark:bg-gray-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-gray-700 mb-4 animate-in slide-in-from-top-2">
                                    <label className="flex items-center gap-2 text-[#0F172A] dark:text-white font-medium text-sm mb-3">
                                        <Calendar className="w-4 h-4 text-[#6366F1] dark:text-indigo-400" />
                                        กำหนดวันเวลานัดหมาย
                                    </label>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">ประเภทนัดหมาย</label>
                                                <CustomSelect
                                                    value={appointmentType}
                                                    onChange={setAppointmentType}
                                                    options={[
                                                        { value: 'Check-up', label: 'ตรวจสุขภาพ (Check-up)' },
                                                        { value: 'Follow-up', label: 'ติดตามผล (Follow-up)' },
                                                        { value: 'Consultation', label: 'ปรึกษาแพทย์' },
                                                        { value: 'Other', label: 'อื่นๆ' }
                                                    ]}
                                                    placeholder="เลือกประเภท"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">วันที่</label>
                                                <CustomDatePicker
                                                    value={appointmentDate ? new Date(appointmentDate) : undefined}
                                                    onChange={(d) => {
                                                        if (d) {
                                                            // Force local YYYY-MM-DD string to avoid timezone shifts
                                                            const year = d.getFullYear();
                                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                                            const day = String(d.getDate()).padStart(2, '0');
                                                            setAppointmentDate(`${year}-${month}-${day}`);
                                                        } else {
                                                            setAppointmentDate('');
                                                        }
                                                    }}
                                                    placeholder="เลือกวันที่"
                                                    minDate={new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates (today allowed)
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">เวลา</label>
                                            <CustomTimePicker
                                                value={appointmentTime}
                                                onChange={setAppointmentTime}
                                                placeholder="เลือกเวลา"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tempStatus === 'รอแล็บรับเรื่อง' && (
                                <div className="bg-[#F8FAFC] dark:bg-gray-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-gray-700 mb-4 animate-in slide-in-from-top-2">
                                    <label className="flex items-center gap-2 text-[#0F172A] dark:text-white font-medium text-sm mb-3">
                                        <Calendar className="w-4 h-4 text-[#6366F1] dark:text-indigo-400" />
                                        ยืนยันการมาตามนัดหมาย
                                    </label>
                                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                                        {appointmentHistory
                                            .filter(appt => appt.status === 'pending' || appt.status === undefined)
                                            .length > 0 ? (
                                            appointmentHistory
                                                .filter(appt => appt.status === 'pending' || appt.status === undefined)
                                                .map((appt, idx) => (
                                                    <label key={idx} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === appt.id
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-200'
                                                        }`}>
                                                        <input
                                                            type="radio"
                                                            name="selectedAppointment"
                                                            checked={selectedAppointmentId === appt.id}
                                                            onChange={() => setSelectedAppointmentId(appt.id || null)}
                                                            className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {formatDateThai(appt.appointment_date)}
                                                                </span>
                                                                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                                    {appt.appointment_time}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{appt.type}</p>
                                                        </div>
                                                    </label>
                                                ))
                                        ) : (
                                            <div className="text-center text-gray-500 text-xs py-4">ไม่พบรายการนัดหมายที่รอดำเนินการ</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <input
                                            type="checkbox"
                                            id="noAppt"
                                            checked={selectedAppointmentId === null}
                                            onChange={(e) => e.target.checked && setSelectedAppointmentId(null)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 rounded"
                                        />
                                        <label htmlFor="noAppt" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                            ไม่ใช่การมาตามนัด (Walk-in) หรือ ไม่ระบุ
                                        </label>
                                    </div>

                                    {/* Vital Signs Input Block */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
                                        <label className="flex items-center gap-2 text-[#0F172A] dark:text-white font-medium text-sm mb-3">
                                            <Activity className="w-4 h-4 text-rose-500" />
                                            สัญญาณชีพรอบนี้ (Vital Signs) <span className="text-xs text-gray-500 font-normal ml-2">(ถ้ามี จะไปแสดงในใบนำส่ง)</span>
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">BP (mmHg)</label>
                                                <input type="text" value={vsBp} onChange={e => setVsBp(e.target.value)} placeholder="120/80" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Pulse (bpm)</label>
                                                <input type="text" value={vsPulse} onChange={e => setVsPulse(e.target.value.replace(/\D/g, ''))} placeholder="80" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Temp (°C)</label>
                                                <input type="text" value={vsTemp} onChange={e => setVsTemp(e.target.value.replace(/[^\d.]/g, ''))} placeholder="36.5" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">DTX (mg/dL)</label>
                                                <input type="text" value={vsDtx} onChange={e => setVsDtx(e.target.value.replace(/\D/g, ''))} placeholder="98" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">น้ำหนัก (kg)</label>
                                                <input type="text" value={vsWeight} onChange={e => setVsWeight(e.target.value.replace(/[^\d.]/g, ''))} placeholder="65" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">ส่วนสูง (cm)</label>
                                                <input type="text" value={vsHeight} onChange={e => setVsHeight(e.target.value.replace(/[^\d.]/g, ''))} placeholder="170" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">รอบเอว (นิ้ว)</label>
                                                <input type="text" value={vsWaist} onChange={e => setVsWaist(e.target.value.replace(/[^\d.]/g, ''))} placeholder="32" className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {tempStatus === 'กำลังจัดส่ง' && (
                                <div className="bg-[#FFFBEB] dark:bg-amber-900/20 p-4 rounded-xl border border-[#FDE68A] dark:border-amber-700/50 mb-4 animate-in slide-in-from-top-2">
                                    <label className="flex items-center gap-2 text-[#92400E] dark:text-amber-400 font-medium text-sm mb-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        สิ่งที่ต้องทำในขั้นตอน "กำลังจัดส่ง"
                                    </label>
                                    <ul className="text-sm text-[#B45309] dark:text-amber-300/80 list-disc list-inside space-y-1 ml-1">
                                        <li>พิมพ์ใบส่งตรวจเลือด (จากหน้ารายการคิวงาน)</li>
                                        <li>นำส่งตัวอย่างเลือดและใบส่งตรวจไปที่ห้อง Lab รพช.</li>
                                        <li>รอให้ทางเจ้าหน้าที่ Lab ตรวจและอัปโหลดผลเข้าระบบ</li>
                                    </ul>
                                </div>
                            )}

                            <div className="mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">หมายเหตุ</label>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="ระบุหมายเหตุ..."
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-lg hover:bg-[#4F46E5] shadow-sm disabled:opacity-50"
                            >
                                {isUpdating ? 'กำลังบันทึก...' : 'ยืนยัน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag View Modal */}
            {modalTags && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setModalTags(null)}>
                    <div className="bg-white dark:bg-[#1F2937] rounded-xl p-4 w-[calc(100%-2rem)] max-w-[300px] mx-4 shadow-lg dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 border border-transparent dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-[#1e1b4b] dark:text-white">{modalTags.title}ทั้งหมด</h3>
                            <button onClick={() => setModalTags(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {modalTags.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-[#F3F4F6] dark:bg-gray-700 text-[#1f2937] dark:text-gray-200 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Responsible Person Modal */}
            {/* Add Responsible Person Modal */}
            {showAddResponsibleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowAddResponsibleModal(false)}>
                    <div
                        className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[500px] mx-4 shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 overflow-hidden border border-transparent dark:border-gray-700 flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-[#1F2937] px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-[#6366F1]" />
                                เพิ่มผู้รับผิดชอบ
                            </h2>
                            <button onClick={() => setShowAddResponsibleModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
                            <button
                                onClick={() => setModalActiveTab('doctor')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'doctor'
                                    ? 'text-[#6366F1] dark:text-[#818cf8]'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                แพทย์ ({staffList.doctors.length})
                                {modalActiveTab === 'doctor' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                                )}
                            </button>
                            <button
                                onClick={() => setModalActiveTab('nurse')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'nurse'
                                    ? 'text-[#6366F1] dark:text-[#818cf8]'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                พยาบาล ({staffList.nurses.length})
                                {modalActiveTab === 'nurse' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                                )}
                            </button>
                            <button
                                onClick={() => setModalActiveTab('manual')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'manual'
                                    ? 'text-[#6366F1] dark:text-[#818cf8]'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                เพิ่มเติม
                                {modalActiveTab === 'manual' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                                )}
                            </button>
                        </div>

                        {/* Search Bar - Hide if manual tab */}
                        {modalActiveTab !== 'manual' && (
                            <div className="px-4 pt-4 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ หรืออีเมล..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* List Content */}
                        <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
                            {modalActiveTab === 'manual' ? (
                                <div className="flex flex-col h-full">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            กรุณากรอกอีเมลของผู้ใช้งานที่ต้องการเพิ่มเป็นผู้รับผิดชอบ (ต้องเป็นผู้ใช้งานในระบบแล้ว)
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                อีเมลผู้รับผิดชอบ
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={manualEmail}
                                                    onChange={(e) => setManualEmail(e.target.value)}
                                                    placeholder="example@bloodlink.com"
                                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : isLoadingStaff ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="text-sm">กำลังโหลดข้อมูล...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(modalActiveTab === 'doctor' ? staffList.doctors : staffList.nurses)
                                        .filter(user =>
                                            !searchQuery ||
                                            (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (user.surname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((user) => {
                                            const isAlreadyResponsible = responsiblePersons.some(p => p.email === user.email);
                                            const isSelected = selectedStaffEmail === user.email;

                                            return (
                                                <div
                                                    key={user.userId}
                                                    onClick={() => !isAlreadyResponsible && setSelectedStaffEmail(user.email)}
                                                    className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${isAlreadyResponsible
                                                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-[#6366F1] dark:border-[#6366F1]'
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isAlreadyResponsible ? 'bg-gray-200 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/30 text-[#6366F1] dark:text-indigo-400'
                                                        }`}>
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <User className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                            {user.name} {user.surname}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                    {isAlreadyResponsible ? (
                                                        <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">มีอยู่แล้ว</span>
                                                    ) : isSelected && (
                                                        <CheckCircle2 className="w-5 h-5 text-[#6366F1]" />
                                                    )}
                                                </div>
                                            );
                                        })}

                                    {(modalActiveTab === 'doctor' ? staffList.doctors : staffList.nurses).length === 0 && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                            ไม่พบข้อมูล{modalActiveTab === 'doctor' ? 'แพทย์' : 'พยาบาล'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedStaffEmail ? 'เลือกแล้ว 1 คน' : 'ยังไม่ได้เลือกผู้รับผิดชอบ'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddResponsibleModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleAddResponsible(modalActiveTab === 'manual' ? manualEmail : (selectedStaffEmail || ''))}
                                    disabled={(modalActiveTab === 'manual' ? !manualEmail : !selectedStaffEmail) || isLoadingStaff}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-lg hover:bg-[#4F46E5] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ยืนยันการเพิ่ม
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Next-Round Modal */}
            {showNextRoundModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">การตรวจรอบที่แล้วเสร็จสิ้น</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">HN: {hn}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                            ผู้ป่วยรายนี้ถูกตรวจเสร็จสิ้นแล้วในรอบก่อนหน้า ต้องการเริ่มการตรวจในรอบใหม่หรือไม่?
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleNextRound}
                                disabled={nextRoundLoading}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition disabled:opacity-50"
                            >
                                {nextRoundLoading ? 'กำลังดำเนินการ...' : 'ใช่ — เริ่มตรวจรอบใหม่ (Reset เป็น รอตรวจ)'}
                            </button>
                            <button
                                onClick={() => { setShowNextRoundModal(false); setNextRoundDismissed(true); }}
                                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition"
                            >
                                ไม่ — เก็บข้อมูลไว้ก่อน
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Patient Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => !isDeleting && setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.action}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText || "ยืนยัน"}
                cancelText="ยกเลิก"
                variant={confirmConfig.variant || "danger"}
                isLoading={isDeleting}
            />

            <PinVerificationModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onVerify={(pin) => {
                    setShowPinModal(false);
                    executeStatusUpdate(pin);
                }}
            />
        </>
    );
};
