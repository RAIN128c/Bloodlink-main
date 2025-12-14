'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionProvider, useSession } from 'next-auth/react';
import { Permissions, getEffectiveRole } from '@/lib/permissions';
import Link from 'next/link';
import { Edit2, Save, X } from 'lucide-react';
import { formatDateTimeThai } from '@/lib/utils';
import { toast } from 'sonner';

interface LabResult {
    timestamp: string;
    hn: string;
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
}

interface PatientInfo {
    hn: string;
    name: string;
    surname: string;
}

const CBC_TESTS = [
    { name: 'WBC', key: 'wbc', unit: '10*3/μ', range: '4.23-9.07' },
    { name: 'RBC', key: 'rbc', unit: '10*6/μL', range: '4.63-6.08' },
    { name: 'Hemoglobin', key: 'hb', unit: 'g/dL', range: '13.7-17.5' },
    { name: 'Hematocrit', key: 'hct', unit: '%', range: '40.1-51' },
    { name: 'MCV', key: 'mcv', unit: 'fL', range: '79-92.2' },
    { name: 'MCH', key: 'mch', unit: 'pg', range: '25.7-32.2' },
    { name: 'MCHC', key: 'mchc', unit: 'g/dL', range: '32.3-36.5' },
    { name: 'Platelet count', key: 'plt', unit: '10*3/μL', range: '140-400' },
];

const DIFFERENTIAL_TESTS = [
    { name: 'Neutrophil', key: 'neutrophil', unit: '%', range: '34-67.9' },
    { name: 'Lymphocyte', key: 'lymphocyte', unit: '%', range: '21.8-53.1' },
    { name: 'Monocyte', key: 'monocyte', unit: '%', range: '5.3-12.2' },
    { name: 'Eosinophil', key: 'eosinophil', unit: '%', range: '0.8-7' },
    { name: 'Basophil', key: 'basophil', unit: '%', range: '0.2-1.2' },
    { name: 'Platelet from smear', key: 'plateletSmear', unit: '', range: '' },
    { name: 'NRBC (cell/100 WBC)', key: 'nrbc', unit: 'cell/100 WBC', range: '' },
    { name: 'RBC Morphology', key: 'rbcMorphology', unit: '', range: '' },
];

function BloodTestResultsContent() {
    const params = useParams();
    const hn = params.hn as string;

    const [patient, setPatient] = useState<PatientInfo | null>(null);
    const [labResults, setLabResults] = useState<LabResult | null>(null);
    const [editData, setEditData] = useState<LabResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Permission check
    const { data: session } = useSession();
    const effectiveRole = getEffectiveRole((session?.user as any)?.role);
    const canEditLab = Permissions.canEditLab(effectiveRole);

    useEffect(() => {
        if (!hn) return;

        const fetchData = async () => {
            try {
                const response = await fetch(`/api/lab-results/${hn}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
                const data = await response.json();
                setPatient(data.patient);
                setLabResults(data.labResults);
                setEditData(data.labResults);
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
        window.print();
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

    const handleSave = async () => {
        if (!editData) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/lab-results/${hn}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                setLabResults({ ...editData });
                setIsEditing(false);
                toast.success('บันทึกผลตรวจเรียบร้อยแล้ว');
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

    const handleInputChange = (key: string, value: string, isNote: boolean = false) => {
        if (!editData) return;
        const fieldKey = isNote ? `${key}_note` : key;
        setEditData({ ...editData, [fieldKey]: value });
    };

    const renderTestRow = (test: { name: string; key: string; unit: string; range: string }, separatorTop?: boolean, separatorBottom?: boolean) => {
        const value = labResults?.[test.key as keyof LabResult] || '-';
        const note = labResults?.[`${test.key}_note` as keyof LabResult] || '-';
        const editValue = editData?.[test.key as keyof LabResult] || '';
        const editNote = editData?.[`${test.key}_note` as keyof LabResult] || '';

        let borderClasses = 'border-b border-gray-200 dark:border-gray-700';
        if (separatorTop) {
            borderClasses += ' border-t-2 border-t-gray-400 dark:border-t-gray-500';
        }
        if (separatorBottom) {
            borderClasses += ' border-b-2 border-b-gray-400 dark:border-b-gray-500';
        }

        return (
            <tr key={test.key} className={borderClasses}>
                <td className="py-2 px-4 text-[13px] text-gray-700 dark:text-gray-200">{test.name}</td>
                <td className="py-2 px-4 text-[13px] text-gray-600 dark:text-gray-300">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => handleInputChange(test.key, e.target.value)}
                            className="w-full px-2 py-1 text-[13px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    ) : (
                        value
                    )}
                </td>
                <td className="py-2 px-4 text-[13px] text-gray-500 dark:text-gray-400">{test.unit}</td>
                <td className="py-2 px-4 text-[13px] text-gray-500 dark:text-gray-400">{test.range}</td>
                <td className="py-2 px-4 text-[13px] text-gray-500 dark:text-gray-400">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editNote}
                            onChange={(e) => handleInputChange(test.key, e.target.value, true)}
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
                    body { background: white !important; }
                    .sidebar, .header-components, .print-hide { display: none !important; }
                    .print-container { margin: 0 !important; padding: 20px !important; }
                    .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
                }
            `}</style>

            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
                <div className="print-hide">
                    <Sidebar />
                </div>
                <div className="ml-0 md:ml-[195px] print:ml-0 flex-1 flex flex-col min-h-screen print-container">
                    <main className="flex-1 bg-[#F3F4F6] dark:bg-[#0f1115] px-2 sm:p-3 pt-0 transition-colors print:bg-white pb-8">
                        <div className="w-full sm:max-w-[960px] mx-auto print:max-w-none">
                            <div className="print-hide">
                                <Header />
                            </div>

                            {/* Blood Test Card */}
                            <div className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-sm overflow-hidden print-card">
                                <div className="p-3 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        {/* Profile Icon */}
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#E8EEF5] dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-[#9CA3AF] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h1 className="text-lg sm:text-xl font-semibold text-[#1F2937] dark:text-white mb-2">
                                                {patient.name} {patient.surname}
                                            </h1>
                                            {/* HN Digits in Boxes */}
                                            <div className="flex gap-1">
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
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
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

                                {/* Results Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                                                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-700 dark:text-gray-200 w-[200px]">Test / Description</th>
                                                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-700 dark:text-gray-200 w-[150px]">Result</th>
                                                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-700 dark:text-gray-200 w-[100px]">Unit</th>
                                                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-700 dark:text-gray-200 w-[120px]">Normal Range</th>
                                                <th className="text-left py-3 px-4 text-[13px] font-semibold text-gray-700 dark:text-gray-200">หมายเหตุ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* CBC Section Header */}
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <td colSpan={5} className="py-2 px-4 text-[13px] font-semibold text-gray-800 dark:text-gray-200">CBC</td>
                                            </tr>

                                            {/* CBC Tests */}
                                            {CBC_TESTS.map((test) => renderTestRow(test))}

                                            {/* Differential Section with separator */}
                                            {DIFFERENTIAL_TESTS.map((test, index) => renderTestRow(test, index === 0, index === 1))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Timestamp Footer */}
                                {labResults?.timestamp && (
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-right text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                                        วันที่ตรวจ: {formatDateTimeThai(labResults.timestamp)}
                                    </div>
                                )}

                                {/* No Results Message */}
                                {!labResults && (
                                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        ยังไม่มีผลตรวจเลือด
                                    </div>
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
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

// Wrap with SessionProvider
export default function BloodTestResultsPage() {
    return (
        <SessionProvider>
            <BloodTestResultsContent />
        </SessionProvider>
    );
}
