'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionProvider, useSession } from 'next-auth/react';
import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import Link from 'next/link';
import { Edit2, Save, Send, X, FileText, Activity, User, Stethoscope, Building2, ClipboardList } from 'lucide-react';
import { formatDateTimeThai } from '@/lib/utils';
import { toast } from 'sonner';
import { LabAlert } from '@/components/ui/LabAlert';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

// Helper to check if value is outside range
const checkAbnormal = (val: string | undefined | null, range: string): boolean => {
    if (!val || val === '-' || !range) return false;

    // Clean value (remove commas, etc if any, though usually numeric string)
    // Handle cases like "< 0.5"? existing data seems to be numbers. Use parseFloat.
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return false;

    // Parse range "min-max"
    const parts = range.split('-');
    if (parts.length !== 2) return false;

    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);

    if (isNaN(min) || isNaN(max)) return false;

    return numVal < min || numVal > max;
};

interface LabResult {
    timestamp: string;
    hn: string;

    // Request Form Data
    doctor_name?: string;
    department?: string;
    diagnosis?: string;
    clinical_history?: string;
    specimen_type?: string;
    reporter_name?: string;

    wbc?: string; wbc_note?: string;
    rbc?: string; rbc_note?: string;
    hb?: string; hb_note?: string;
    hct?: string; hct_note?: string;
    mcv?: string; mcv_note?: string;
    mch?: string; mch_note?: string;
    mchc?: string; mchc_note?: string;
    plt?: string; plt_note?: string;
    neutrophil?: string; neutrophil_note?: string;
    lymphocyte?: string; lymphocyte_note?: string;
    monocyte?: string; monocyte_note?: string;
    eosinophil?: string; eosinophil_note?: string;
    basophil?: string; basophil_note?: string;
    plateletSmear?: string; plateletSmear_note?: string;
    nrbc?: string; nrbc_note?: string;
    rbcMorphology?: string; rbcMorphology_note?: string;

    // Vital Signs & Physical
    weight?: number;
    height?: number;
    waistLine?: number;
    bmi?: number;
    bpSys?: number;
    bpDia?: number;
    pulse?: number;
    respiration?: number;
    temperature?: number;

    // Chemistry
    fbs?: number; fbs_note?: string;
    uricAcid?: number;
    ast?: number;
    alt?: number;
    cholesterol?: number;
    triglyceride?: number;
    hdl?: number;
    ldl?: number;

    // Urine
    urineAlbumin?: string;
    urineSugar?: string;
    specimenStatus?: string;
}

interface PatientInfo {
    hn: string;
    name: string;
    surname: string;
    process?: string;
    age?: number;
    gender?: string;
    idCard?: string;
}

const LAB_TEST_ORDER = [
    'wbc', 'rbc', 'hb', 'hct', 'mcv', 'mch', 'mchc', 'plt',
    'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil',
    'plateletSmear', 'nrbc', 'rbcMorphology'
];

const CHEM_TEST_KEYS = ['fbs', 'uricAcid', 'ast', 'alt', 'cholesterol', 'triglyceride', 'hdl', 'ldl'];
const URINE_TEST_KEYS = ['urineAlbumin', 'urineSugar'];

// Configuration
const HOSPITAL_NAME = 'โรงพยาบาล'; // Change this if needed

const FALLBACK_RANGES: LabRange[] = [
    // CBC
    { test_key: 'wbc', test_name: 'WBC', min_value: 4.3, max_value: 9.07, unit: '10^3/uL' },
    { test_key: 'rbc', test_name: 'RBC', min_value: 4.63, max_value: 6.08, unit: '10^6/uL' },
    { test_key: 'hb', test_name: 'Hemoglobin', min_value: 13.7, max_value: 17.5, unit: 'g/dL' },
    { test_key: 'hct', test_name: 'Hematocrit', min_value: 40.1, max_value: 51, unit: '%' },
    { test_key: 'mcv', test_name: 'MCV', min_value: 79, max_value: 92.2, unit: 'fL' },
    { test_key: 'mch', test_name: 'MCH', min_value: 25.7, max_value: 32.2, unit: 'pg' },
    { test_key: 'mchc', test_name: 'MCHC', min_value: 32.3, max_value: 36.5, unit: 'g/dL' },
    { test_key: 'plt', test_name: 'Platelet count', min_value: 140, max_value: 400, unit: '10^3/uL' },
    { test_key: 'neutrophil', test_name: 'Neutrophil', min_value: 34, max_value: 67.9, unit: '%' },
    { test_key: 'lymphocyte', test_name: 'Lymphocyte', min_value: 21.8, max_value: 53.1, unit: '%' },
    { test_key: 'monocyte', test_name: 'Monocyte', min_value: 5.3, max_value: 12.2, unit: '%' },
    { test_key: 'eosinophil', test_name: 'Eosinophil', min_value: 0.8, max_value: 7, unit: '%' },
    { test_key: 'basophil', test_name: 'Basophil', min_value: 0.2, max_value: 1.2, unit: '%' },
    { test_key: 'nrbc', test_name: 'NRBC', min_value: null, max_value: null, unit: 'cell/100 WBC' },

    // Chemistry
    { test_key: 'fbs', test_name: 'FBS', min_value: 70, max_value: 100, unit: 'mg/dL' },
    { test_key: 'uricAcid', test_name: 'Uric Acid', min_value: 2.4, max_value: 6.0, unit: 'mg/dL' },
    { test_key: 'ast', test_name: 'AST (SGOT)', min_value: 0, max_value: 40, unit: 'U/L' },
    { test_key: 'alt', test_name: 'ALT (SGPT)', min_value: 0, max_value: 41, unit: 'U/L' },
    { test_key: 'cholesterol', test_name: 'Cholesterol', min_value: 0, max_value: 200, unit: 'mg/dL' },
    { test_key: 'triglyceride', test_name: 'Triglyceride', min_value: 0, max_value: 150, unit: 'mg/dL' },
    { test_key: 'hdl', test_name: 'HDL-C', min_value: 40, max_value: 60, unit: 'mg/dL' },
    { test_key: 'ldl', test_name: 'LDL-C', min_value: 0, max_value: 100, unit: 'mg/dL' },

    // Urine
    { test_key: 'urineAlbumin', test_name: 'Urine Albumin', min_value: null, max_value: null, unit: '' },
    { test_key: 'urineSugar', test_name: 'Urine Sugar', min_value: null, max_value: null, unit: '' }
];

interface LabRange {
    test_key: string;
    test_name: string;
    min_value: number | null;
    max_value: number | null;
    unit: string | null;
}

function BloodTestResultsContent() {
    const params = useParams();
    const hn = params.hn as string;

    const [patient, setPatient] = useState<PatientInfo | null>(null);
    const [labResults, setLabResults] = useState<LabResult | null>(null);
    const [editData, setEditData] = useState<LabResult | null>(null);
    const [ranges, setRanges] = useState<LabRange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'result' | 'request'>('result');

    // Permission check
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();
    const canEditLab = Permissions.canEditLab(effectiveRole);

    useEffect(() => {
        if (!hn) return;

        const fetchData = async () => {
            try {
                // Fetch Patient & Results
                const resultRes = await fetch(`/api/lab-results/${hn}`);
                // Fetch Reference Ranges
                const rangesRes = await fetch('/api/settings/lab-ranges');

                if (!resultRes.ok || !rangesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const resultData = await resultRes.json();
                const rangesData = await rangesRes.json();

                setPatient(resultData.patient);
                setLabResults(resultData.labResults);
                setEditData(resultData.labResults);
                setRanges(rangesData);

            } catch (err) {
                console.error('Fetch error:', err);
                setError('ไม่พบข้อมูลผลตรวจเลือด');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [hn]);

    const handlePrint = () => {
        setActiveTab('result');
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleStartEdit = () => {
        setEditData(labResults ? { ...labResults } : {
            hn: hn,
            timestamp: new Date().toISOString()
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditData(labResults ? { ...labResults } : null);
        setIsEditing(false);
    };

    const handleSave = async (notify: boolean = false) => {
        if (!editData) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/lab-results/${hn}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                // Include notify flag in the body, LabService handles separation
                body: JSON.stringify({ ...editData, notify }),
            });

            if (response.ok) {
                setLabResults({ ...editData });
                setIsEditing(false);
                setIsConfirmModalOpen(false);
                if (notify) {
                    toast.success('บันทึกและส่งแจ้งเตือนเรียบร้อยแล้ว');
                } else {
                    toast.success('บันทึกร่างเรียบร้อยแล้ว');
                }
            } else {
                const data = await response.json();
                toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveResult = async () => {
        if (!patient || !labResults) return;

        // Optimistic UI update (optional, but let's wait for API)
        const processPromise = async () => {
            const response = await fetch(`/api/patients/${hn}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'เสร็จสิ้น',
                    history: 'แพทย์ยืนยันผลการตรวจสอบ',
                    // We can pass user info if we had it from session here, 
                    // but the API usually handles it or we rely on session in API
                    changedByName: session?.user?.name,
                    changedByEmail: session?.user?.email,
                    changedByRole: effectiveRole
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update status');
            }

            // Update local patient state
            setPatient(prev => prev ? { ...prev, process: 'เสร็จสิ้น' } : null);
            return 'ยืนยันผลการตรวจสอบเรียบร้อย';
        };

        toast.promise(processPromise(), {
            loading: 'กำลังยืนยันผล...',
            success: (msg) => msg,
            error: (err) => err.message
        });
    };

    const handleInputChange = (key: string, value: string, isNote: boolean = false) => {
        if (!editData) return;
        const fieldKey = isNote ? `${key}_note` : key;
        setEditData({ ...editData, [fieldKey]: value });
    };

    const formatRange = (min: number | null, max: number | null) => {
        if (min !== null && max !== null) return `${min}-${max}`;
        if (min !== null) return `> ${min}`;
        if (max !== null) return `< ${max}`;
        return '';
    };

    const renderTestRow = (test: LabRange, separatorTop?: boolean, separatorBottom?: boolean) => {
        const value = labResults?.[test.test_key as keyof LabResult] || '-';
        const note = labResults?.[`${test.test_key}_note` as keyof LabResult] || '-';
        const editValue = editData?.[test.test_key as keyof LabResult] || '';
        const editNote = editData?.[`${test.test_key}_note` as keyof LabResult] || '';

        // Dynamic Range String
        const rangeStr = formatRange(test.min_value, test.max_value);

        let borderClasses = 'border-b border-gray-200 dark:border-gray-700';
        if (separatorTop) {
            borderClasses += ' border-t-2 border-t-gray-400 dark:border-t-gray-500';
        }
        if (separatorBottom) {
            borderClasses += ' border-b-2 border-b-gray-400 dark:border-b-gray-500';
        }

        return (
            <tr key={test.test_key} className={`${borderClasses} ${separatorTop ? 'border-t-4 border-gray-100 dark:border-gray-700' : ''}`}>
                <td className="py-2 px-4 print:py-0.5 print:px-1 print:border-b print:border-gray-200 text-[13px] print:text-[10px] text-gray-700 dark:text-gray-200 font-medium">{test.test_name}</td>
                <td className="py-2 px-4 print:py-0.5 print:px-1 print:border-b print:border-gray-200 text-[13px] print:text-[10px] text-gray-600 dark:text-gray-300">
                    {isEditing ? (
                        <input
                            type="text"
                            value={String(editValue)}
                            onChange={(e) => handleInputChange(test.test_key, e.target.value)}
                            className="w-full px-2 py-1 text-[13px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    ) : (
                        <LabAlert isAbnormal={checkAbnormal(String(value), rangeStr)} val={String(value)} />
                    )}
                </td>
                <td className="py-2 px-4 print:py-0.5 print:px-1 print:border-b print:border-gray-200 text-[13px] print:text-[10px] text-gray-500 dark:text-gray-400">{test.unit || ''}</td>
                <td className="py-2 px-4 print:py-0.5 print:px-1 print:border-b print:border-gray-200 text-[13px] print:text-[10px] text-gray-500 dark:text-gray-400">{rangeStr}</td>
                <td className="py-2 px-4 print:py-0.5 text-[13px] print:text-[10px] text-gray-500 dark:text-gray-400">
                    {isEditing ? (
                        <input
                            type="text"
                            value={String(editNote)}
                            onChange={(e) => handleInputChange(test.test_key, e.target.value, true)}
                            className="w-full px-2 py-1 text-[13px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="หมายเหตุ..."
                        />
                    ) : (
                        note
                    )}
                </td>
            </tr>
        );
    };

    // Filter and Sort Ranges
    const cbcTests = ranges.filter(r =>
        ['wbc', 'rbc', 'hb', 'hct', 'mcv', 'mch', 'mchc', 'plt'].includes(r.test_key)
    ).sort((a, b) => LAB_TEST_ORDER.indexOf(a.test_key) - LAB_TEST_ORDER.indexOf(b.test_key));

    const diffTests = ranges.filter(r =>
        ['neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'plateletSmear', 'nrbc', 'rbcMorphology'].includes(r.test_key)
    ).sort((a, b) => LAB_TEST_ORDER.indexOf(a.test_key) - LAB_TEST_ORDER.indexOf(b.test_key));

    // Combine DB ranges with Fallback for new tests
    const getTestRange = (key: string) => ranges.find(r => r.test_key === key) || FALLBACK_RANGES.find(r => r.test_key === key);

    const chemTests = CHEM_TEST_KEYS.map(key => getTestRange(key)).filter(Boolean) as LabRange[];
    const urineTests = URINE_TEST_KEYS.map(key => getTestRange(key)).filter(Boolean) as LabRange[];

    if (isLoading) {
        return (
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)]">
                <Sidebar />
                <div className="ml-0 md:ml-[195px] flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366F1]"></div>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)]">
                <Sidebar />
                <div className="ml-0 md:ml-[195px] flex-1 flex flex-col h-screen overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#0f1115] p-3 pt-0">
                        <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                            <Header />
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-red-500 mb-4">{error || 'ไม่พบข้อมูล'}</p>
                                    <Link href="/results" className="text-[#6366F1] hover:underline">
                                        กลับไปหน้าผลตรวจ
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    /* Print reset handled in globals.css */
                }
            `}</style>

            <div className="bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
                <div className="print-hide">
                    <Sidebar />
                </div>
                <div className="ml-0 md:ml-[195px] flex-1 flex flex-col min-h-screen print-container w-full overflow-x-hidden">
                    <main className="flex-1 bg-[#F3F4F6] dark:bg-[#0f1115] p-3 sm:p-6 lg:p-8 pt-0 transition-colors pb-8 print:p-0 print:pb-0">
                        <div className="w-full sm:max-w-[960px] mx-auto print-container print:w-full print:max-w-none">
                            <div className="print-hide">
                                <Header />
                            </div>

                            {/* Blood Test Card */}
                            <div className="bg-white dark:bg-[#1e1e2e] rounded-3xl shadow-sm overflow-hidden print-card border border-gray-100 dark:border-gray-700 print:rounded-none print:shadow-none print:border-none">
                                <div className="p-3 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-4 print:p-0 print:border-none print:flex-col">
                                    {/* Print Only Header (Medical Report Style) */}
                                    {/* Print Only Header (Medical Report Style) */}
                                    {/* Print Only Header (Medical Report Style - Compact) */}
                                    <div className="hidden print:block mb-2 border-b border-gray-800 pb-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {/* Logo Placeholder */}
                                                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-full border border-gray-300">
                                                    <Activity className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h1 className="text-lg font-bold text-gray-900 leading-tight">{HOSPITAL_NAME}</h1>
                                                    <p className="text-[10px] text-gray-600">123 Health Avenue, Medical District, Bangkok 10330</p>
                                                    <p className="text-[10px] text-gray-600">Tel: 02-123-4567 | www.bloodlink.com</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-base font-bold text-indigo-900">LAB REPORT</div>
                                                <div className="text-[10px] text-gray-500">ใบรายงานผลการตรวจ</div>
                                            </div>
                                        </div>

                                        {/* Patient Info Grid - Very Compact 3 Columns */}
                                        <div className="border border-gray-300 rounded px-2 py-1 bg-gray-50/50">
                                            <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px] text-gray-900">
                                                {/* Col 1 */}
                                                <div>
                                                    <div className="flex"><span className="text-gray-500 w-12">Name:</span> <span className="font-bold">{patient.name} {patient.surname}</span></div>
                                                    <div className="flex"><span className="text-gray-500 w-12">Gender:</span> <span>{patient.gender === 'Male' ? 'ชาย' : patient.gender === 'Female' ? 'หญิง' : '-'}</span></div>
                                                </div>
                                                {/* Col 2 */}
                                                <div>
                                                    <div className="flex"><span className="text-gray-500 w-8">HN:</span> <span className="font-mono font-bold">{patient.hn}</span></div>
                                                    <div className="flex"><span className="text-gray-500 w-8">ID:</span> <span className="font-mono font-bold tracking-tighter">{patient.idCard || '-'}</span></div>
                                                </div>
                                                {/* Col 3 */}
                                                <div>
                                                    <div className="flex"><span className="text-gray-500 w-10">Doctor:</span> <span>{labResults?.doctor_name?.slice(0, 15) || '-'}...</span></div>
                                                    <div className="flex"><span className="text-gray-500 w-10">Age:</span> <span>{patient.age || '-'} ปี</span></div>
                                                    <div className="flex"><span className="text-gray-500 w-10">Date:</span> <span>{labResults?.timestamp ? new Date(labResults.timestamp).toLocaleDateString('th-TH') : '-'}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="print-hide flex items-center gap-3 sm:gap-4">
                                        {/* Profile Icon */}
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#E8EEF5] dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-[#9CA3AF] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-lg sm:text-xl font-semibold text-[#1F2937] dark:text-white mb-2 break-all sm:break-normal">
                                                {patient.name} {patient.surname}
                                            </h1>
                                            {/* HN Digits in Boxes */}
                                            <div className="flex flex-wrap gap-1">
                                                {String(patient.hn).split('').map((digit, i) => (
                                                    <span
                                                        key={i}
                                                        className="w-6 h-6 bg-[#F3F4F6] dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300"
                                                    >
                                                        {digit}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="print-hide flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                                        {/* Doctor Approve Button */}
                                        {canEditLab && Permissions.isDoctor(effectiveRole) && patient?.process === 'กำลังตรวจ' && !isEditing && (
                                            <button
                                                onClick={handleApproveResult}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-medium"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                ยืนยันผลการตรวจสอบ
                                            </button>
                                        )}

                                        {canEditLab && !isEditing && (
                                            <button
                                                onClick={handleStartEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors text-sm font-medium"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                แก้ไข
                                            </button>
                                        )}
                                        {isEditing && (
                                            <>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                                >
                                                    <X className="w-4 h-4" />
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    onClick={() => handleSave(false)}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSaving ? '...' : 'บันทึกร่าง'}
                                                </button>
                                                <button
                                                    onClick={() => setIsConfirmModalOpen(true)}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors text-sm font-medium disabled:opacity-50 shadow-lg shadow-green-500/20"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {isSaving ? 'กำลังส่ง...' : 'ยืนยันและส่งผล'}
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                            </svg>
                                            Print
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Tab Switcher */}
                            <div className="print-hide flex border-b border-gray-100 dark:border-gray-700 px-6">
                                <button
                                    onClick={() => setActiveTab('result')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'result'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Activity className="w-4 h-4" />
                                    ผลการตรวจ (Result)
                                </button>
                                <button
                                    onClick={() => setActiveTab('request')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'request'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    ใบส่งตรวจ (Request)
                                </button>
                            </div>

                            {/* Content based on Active Tab */}
                            {activeTab === 'request' ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column: Requester Info */}
                                        <div className="space-y-6">
                                            <div className="pb-3 border-b border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <User className="w-5 h-5 text-indigo-500" />
                                                    ข้อมูลผู้ส่งตรวจ
                                                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium border ${patient.process === 'เสร็จสิ้น' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        patient.process === 'กำลังตรวจ' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}>
                                                        {patient.process === 'เสร็จสิ้น' ? 'Reported' :
                                                            patient.process === 'กำลังตรวจ' ? 'In Progress' : 'Pending'} ({patient.process})
                                                    </span>
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">แพทย์ผู้ส่งตรวจ (Doctor)</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editData?.doctor_name || ''}
                                                            onChange={(e) => setEditData({ ...editData!, doctor_name: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="ระบุชื่อแพทย์..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 font-medium">{labResults?.doctor_name || '-'}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">แผนก/หอผู้ป่วย (Department/Ward)</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editData?.department || ''}
                                                            onChange={(e) => setEditData({ ...editData!, department: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="ระบุแผนก..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 font-medium">{labResults?.department || '-'}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดสิ่งส่งตรวจ (Specimen Type)</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editData?.specimen_type || ''}
                                                            onChange={(e) => setEditData({ ...editData!, specimen_type: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="e.g. Clotted Blood, EDTA Blood..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 font-medium">{labResults?.specimen_type || '-'}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">เจ้าหน้าที่ห้องปฏิบัติการ (Lab Officer)</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editData?.reporter_name || ''}
                                                            onChange={(e) => setEditData({ ...editData!, reporter_name: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="ระบุชื่อผู้รายงานผล..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 font-medium">{labResults?.reporter_name || '-'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Clinical Info */}
                                        <div className="space-y-6">
                                            <div className="pb-3 border-b border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <Stethoscope className="w-5 h-5 text-indigo-500" />
                                                    ข้อมูลทางคลินิก
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">การวินิจฉัย (Diagnosis / ICD-10)</label>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={editData?.diagnosis || ''}
                                                            onChange={(e) => setEditData({ ...editData!, diagnosis: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="ระบุการวินิจฉัย..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 p-3 bg-gray-50 rounded-lg">{labResults?.diagnosis || '-'}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติคนไข้ (Clinical History)</label>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={editData?.clinical_history || ''}
                                                            onChange={(e) => setEditData({ ...editData!, clinical_history: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="ระบุประวัติ..."
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 p-3 bg-gray-50 rounded-lg">{labResults?.clinical_history || '-'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vital Signs Input Section */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-indigo-500" />
                                            สัญญาณชีพ (Vital Signs)
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[
                                                { label: 'BP (Sys)', key: 'bpSys', unit: 'mmHg' },
                                                { label: 'BP (Dia)', key: 'bpDia', unit: 'mmHg' },
                                                { label: 'Pulse', key: 'pulse', unit: 'bpm' },
                                                { label: 'RR', key: 'respiration', unit: '/min' },
                                                { label: 'Temp', key: 'temperature', unit: '°C' },
                                                { label: 'Wt', key: 'weight', unit: 'kg' },
                                                { label: 'Ht', key: 'height', unit: 'cm' },
                                                { label: 'Waist', key: 'waistLine', unit: 'cm' },
                                            ].map((field) => (
                                                <div key={field.key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editData?.[field.key as keyof LabResult] as number || ''}
                                                            onChange={(e) => setEditData({ ...editData!, [field.key]: parseFloat(e.target.value) })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder={field.unit}
                                                        />
                                                    ) : (
                                                        <div className="text-gray-900 font-medium p-2 bg-gray-50 rounded border border-gray-200">
                                                            {labResults?.[field.key as keyof LabResult] ? `${labResults[field.key as keyof LabResult]} ${field.unit}` : '-'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Vital Signs Section (Only in Result Mode) */}
                                    {/* Vital Signs (Read-Only View) */}
                                    {/* Vital Signs (Read-Only View) - Compact Inline for Print */}
                                    <div className="p-4 sm:p-6 print:p-0 print:border-none border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 print:bg-white print:mb-1">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 print:flex print:flex-wrap print:gap-x-4 print:gap-y-0 print:text-[10px] print:items-center">
                                            {[
                                                { label: 'BP', key: 'bpSys', unit: 'mmHg', value: (d: LabResult) => d.bpSys && d.bpDia ? `${d.bpSys}/${d.bpDia}` : '-' },
                                                { label: 'P', key: 'pulse', unit: 'bpm' },
                                                { label: 'R', key: 'respiration', unit: '/min' },
                                                { label: 'T', key: 'temperature', unit: '°C' },
                                                { label: 'Wt', key: 'weight', unit: 'kg' },
                                                { label: 'Ht', key: 'height', unit: 'cm' },
                                                { label: 'Waist', key: 'waistLine', unit: 'cm' },
                                            ].map((field) => (
                                                <div key={field.key} className="print:flex print:gap-1 print:whitespace-nowrap">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1 print:mb-0 print:font-bold print:text-black">{field.label}:</span>
                                                    <span className="font-medium text-sm print:text-black">
                                                        {
                                                            // @ts-ignore
                                                            field.value && labResults ? field.value(labResults) :
                                                                (labResults?.[field.key as keyof LabResult] ? `${labResults[field.key as keyof LabResult]}` : '-')
                                                        }
                                                        {/* @ts-ignore */}
                                                        {!field.value && labResults?.[field.key as keyof LabResult] && <span className="text-[10px] ml-0.5 text-gray-500 print:text-black">{field.unit}</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Specimen Status (Compact for Print) */}
                                    <div className="mb-6 print:mb-1 p-4 print:p-0 print:px-1 print:bg-transparent print:border-0 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg flex items-center gap-4">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 print:text-black print:text-xs">
                                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Specimen:
                                        </div>
                                        <div className="flex-1 print:text-xs">
                                            {isEditing ? (
                                                <div className="flex flex-wrap gap-4">
                                                    {['Normal', 'Clot', 'Hemolysis'].map((status) => (
                                                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="specimenStatus"
                                                                value={status}
                                                                checked={editData?.specimenStatus === status}
                                                                onChange={(e) => setEditData({ ...editData!, specimenStatus: e.target.value })}
                                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`px-3 py-1 print:px-0 print:py-0 print:bg-transparent rounded-full text-xs font-semibold ${labResults?.specimenStatus === 'Normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 print:text-black' :
                                                    labResults?.specimenStatus === 'Clot' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        labResults?.specimenStatus === 'Hemolysis' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {labResults?.specimenStatus || 'Not Specified'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 1. Lab Results Table (Merged for Print) */}
                                    <div className="border-t border-gray-100 dark:border-gray-700 mb-6 print:border-none print:mb-0">
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <table className="w-full min-w-[700px] print:min-w-0 print:w-full">
                                                <thead className="bg-gray-50/50 dark:bg-gray-800/50 print:bg-white print:border-b print:border-black">
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-3 px-4 print:py-0.5 print:px-1 text-[13px] print:text-[10px] font-semibold text-gray-700 dark:text-gray-200 w-[200px] print:w-auto">Test Name</th>
                                                        <th className="text-left py-3 px-4 print:py-0.5 print:px-1 text-[13px] print:text-[10px] font-semibold text-gray-700 dark:text-gray-200 w-[150px] print:w-auto">Result</th>
                                                        <th className="text-left py-3 px-4 print:py-0.5 print:px-1 text-[13px] print:text-[10px] font-semibold text-gray-700 dark:text-gray-200 w-[100px] print:w-auto">Unit</th>
                                                        <th className="text-left py-3 px-4 print:py-0.5 print:px-1 text-[13px] print:text-[10px] font-semibold text-gray-700 dark:text-gray-200 w-[120px] print:w-auto">Normal Range</th>
                                                        <th className="text-left py-3 px-4 print:py-0.5 print:px-1 text-[13px] print:text-[10px] font-semibold text-gray-700 dark:text-gray-200">Remark</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 print:divide-y-0">
                                                    {/* Hematology Section */}
                                                    <tr>
                                                        <td colSpan={5} className="py-2 px-4 print:py-0.5 print:px-1 text-sm print:text-[10px] font-bold text-gray-800 dark:text-gray-100 bg-gray-50/30 dark:bg-gray-800/30 print:bg-gray-100 print:border-y print:border-gray-300">
                                                            Hematology (CBC)
                                                        </td>
                                                    </tr>
                                                    {cbcTests.map((test) => renderTestRow(test))}
                                                    {diffTests.map((test) =>
                                                        renderTestRow(
                                                            test,
                                                            test.test_key === 'neutrophil',
                                                            test.test_key === 'lymphocyte'
                                                        )
                                                    )}

                                                    {/* Clinical Chemistry Section (Merged) */}
                                                    {chemTests.length > 0 && (
                                                        <>
                                                            <tr>
                                                                <td colSpan={5} className="py-2 px-4 print:py-0.5 print:px-1 text-sm print:text-[10px] font-bold text-gray-800 dark:text-gray-100 bg-gray-50/30 dark:bg-gray-800/30 print:bg-gray-100 print:border-y print:border-gray-300">
                                                                    Clinical Chemistry
                                                                </td>
                                                            </tr>
                                                            {chemTests.map((test) => renderTestRow(test))}
                                                        </>
                                                    )}

                                                    {/* Urinalysis Section (Merged) */}
                                                    {urineTests.length > 0 && (
                                                        <>
                                                            <tr>
                                                                <td colSpan={5} className="py-2 px-4 print:py-0.5 print:px-1 text-sm print:text-[10px] font-bold text-gray-800 dark:text-gray-100 bg-gray-50/30 dark:bg-gray-800/30 print:bg-gray-100 print:border-y print:border-gray-300">
                                                                    Urinalysis
                                                                </td>
                                                            </tr>
                                                            {urineTests.map((test) => renderTestRow(test))}
                                                        </>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Timestamp Footer */}
                                    {labResults?.timestamp && (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-right text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 print:hidden">
                                            วันที่รายงานผล: {formatDateTimeThai(labResults.timestamp)}
                                        </div>
                                    )}

                                    {/* Print Footer - Signature Block (Compact) */}
                                    <div className="hidden print:block mt-4 mb-2 px-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-center w-1/3">
                                                <div className="border-b border-gray-400 w-full mx-auto mb-1 relative h-8"></div>
                                                <div className="text-[10px] font-semibold text-gray-900">({labResults?.doctor_name || '................................................'})</div>
                                                <div className="text-[9px] text-gray-500">Physician / แพทย์ผู้สั่งตรวจ</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{labResults?.timestamp ? new Date(labResults.timestamp).toLocaleDateString('th-TH') : '..../..../.......'}</div>
                                            </div>
                                            <div className="text-center w-1/3">
                                                <div className="border-b border-gray-400 w-full mx-auto mb-1 relative h-8"></div>
                                                <div className="text-[10px] font-semibold text-gray-900">({labResults?.reporter_name || '................................................'})</div>
                                                <div className="text-[9px] text-gray-500">Lab Officer</div>
                                                <div className="text-[9px] text-gray-500 mt-0.5">{labResults?.timestamp ? new Date(labResults.timestamp).toLocaleDateString('th-TH') : '..../..../.......'}</div>
                                            </div>
                                        </div>
                                        <div className="text-center text-[8px] text-gray-400 mt-2 border-t border-gray-200 pt-1">
                                            Printed: {new Date().toLocaleString('th-TH')} | Software by Bloodlink
                                        </div>
                                    </div>

                                    {/* No Results Message */}
                                    {!labResults && (
                                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            ยังไม่มีผลตรวจเลือด
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Back Link */}
                        <div className="mt-4 print-hide">
                            <Link
                                href="/results"
                                className="inline-flex items-center gap-2 text-[#6366F1] hover:underline text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                กลับไปหน้ารายการผลตรวจ
                            </Link>
                        </div>
                    </main>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={() => handleSave(true)}
                title="ยืนยันการส่งผลตรวจ"
                description="คุณต้องการยืนยันและส่งผลการตรวจเลือดหรือไม่? เมื่อยืนยันแล้วระบบจะส่งการแจ้งเตือนไปยังแพทย์ผู้รับผิดชอบทันที"
                confirmText="ยืนยันและส่ง"
                cancelText="ตรวจสอบอีกครั้ง"
                variant="primary"
                isLoading={isSaving}
            />
        </>
    );
}

// Wrap with SessionProvider
export default function BloodTestResultsPage() {
    return (
        <SessionProvider>
            <BloodTestResultsContent />
            <div id="modal-root" />
        </SessionProvider>
    );
}
