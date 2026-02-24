'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, AlertCircle, FileText, ArrowLeft, Clock, RefreshCw, Eye, Printer, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { PrintSummarySheet } from '@/components/features/history/PrintSummarySheet';
import { PrintRequestSheet } from '@/components/features/history/PrintRequestSheet';
import { AppointmentService, Appointment } from '@/lib/services/appointmentService';

interface LabResult {
    id: number;
    hn: string;
    timestamp: string;
    patient_name?: string;
    file_url?: string;
    file_type?: string;
    result_summary?: string;
    reporter_name?: string;
    approver_name?: string;
    created_at: string;
}

interface PatientInfo {
    hn: string;
    name: string;
    surname: string;
    process: string;
}

export default function ResultPage() {
    const params = useParams();
    const hn = params?.hn as string;
    const { effectiveRole } = useEffectiveRole();

    const [latestResult, setLatestResult] = useState<LabResult | null>(null);
    const [history, setHistory] = useState<LabResult[]>([]);
    const [patient, setPatient] = useState<PatientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

    // For Digital Request Sheet
    const [showRequestSheet, setShowRequestSheet] = useState(false);
    const [requestSheetSignature, setRequestSheetSignature] = useState<{ qr_token: string, signature_text: string } | null>(null);
    const [requestSheetVitals, setRequestSheetVitals] = useState<Record<string, Partial<Appointment>>>({});

    const fetchData = useCallback(async () => {
        if (!hn) return;
        setLoading(true);
        try {
            // Fetch lab results history
            const labRes = await fetch(`/api/lab-results/${hn}`);
            if (labRes.ok) {
                const data = await labRes.json();
                const results = Array.isArray(data) ? data : data.results || [];
                setHistory(results);
                if (results.length > 0) {
                    setLatestResult(results[0]);
                    // Get signed URL for the latest result file
                    if (results[0].file_url) {
                        const signedRes = await fetch(`/api/lab/upload?path=${encodeURIComponent(results[0].file_url)}`);
                        if (signedRes.ok) {
                            const signedData = await signedRes.json();
                            setFileUrl(signedData.url);
                        }
                    }
                }
            }

            // Fetch patient info
            const patientRes = await fetch(`/api/patients/${hn}`);
            if (patientRes.ok) {
                const patientData = await patientRes.json();
                setPatient(patientData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    }, [hn]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async () => {
        if (!latestResult || !hn) return;
        setApproving(true);
        try {
            const res = await fetch(`/api/lab-results/${hn}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultId: latestResult.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Approval failed');
            }

            toast.success('อนุญาตให้พิมพ์ผลตรวจเรียบร้อย');
            fetchData(); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการอนุญาต');
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!latestResult || !hn) return;
        const reason = window.prompt("ระบุสาเหตุที่ต้องการตีกลับผลตรวจนี้ (เช่น ภาพไม่ชัด, ผิดคน):");
        if (reason === null) return; // User cancelled

        setApproving(true);
        try {
            const res = await fetch(`/api/lab-results/${hn}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultId: latestResult.id, reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Rejection failed');
            }

            toast.success('ตีกลับผลตรวจกลับไปยัง รพช. เรียบร้อยแล้ว');
            window.location.href = '/test-status'; // Redirect back to tracker
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการตีกลับ');
            setApproving(false);
        }
    };

    const handlePrint = async () => {
        if (!fileUrl || !hn) return;
        setPrinting(true);
        try {
            const isImage = latestResult?.file_type?.startsWith('image/');
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) {
                toast.error('กรุณาอนุญาต Pop-up เพื่อสั่งพิมพ์');
                return;
            }

            if (isImage) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html><head><title>พิมพ์ผลตรวจ - HN: ${hn}</title>
                    <style>
                        @page { size: A4 portrait; margin: 10mm; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { display: flex; flex-direction: column; align-items: center; min-height: 100vh; background: #fff; padding: 10mm; font-family: sans-serif; }
                        .header { text-align: center; margin-bottom: 12px; font-size: 14px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; width: 100%; }
                        img { max-width: 100%; height: auto; }
                        @media print { body { padding: 5mm; } }
                    </style></head><body>
                        <div class="header"><strong>ผลตรวจเลือด</strong><br/>HN: ${hn} — ${patient?.name} ${patient?.surname}</div>
                        <img src="${fileUrl}" onload="setTimeout(() => { window.print(); }, 500);" />
                    </body></html>
                `);
            } else {
                printWindow.location.href = fileUrl;
            }
            printWindow.document.close();

            // Update status to "เสร็จสิ้น" (printed)
            await fetch(`/api/patients/${hn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: 'เสร็จสิ้น' }),
            });

            setPatient(prev => prev ? { ...prev, process: 'เสร็จสิ้น' } : prev);
            toast.success('สั่งพิมพ์เรียบร้อย & อัปเดตสถานะ "เสร็จสิ้น"');
        } catch (err) {
            console.error('Print error:', err);
            toast.error('เกิดข้อผิดพลาดในการพิมพ์');
        } finally {
            setPrinting(false);
        }
    };

    const handleViewHistory = async (result: LabResult) => {
        setSelectedHistoryId(result.id);
        if (result.file_url) {
            try {
                const signedRes = await fetch(`/api/lab/upload?path=${encodeURIComponent(result.file_url)}`);
                if (signedRes.ok) {
                    const signedData = await signedRes.json();
                    setSelectedFileUrl(signedData.url);
                }
            } catch {
                setSelectedFileUrl(null);
            }
        } else {
            setSelectedFileUrl(null);
        }
    };


    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    const isApproved = !!latestResult?.approver_name;
    const canApprove = Permissions.isDoctorOrNurse(effectiveRole) || Permissions.isAdmin(effectiveRole);

    const handleViewRequestSheet = async () => {
        if (!hn) return;
        setShowRequestSheet(true);
        setRequestSheetSignature(null);
        try {
            // Fetch signature
            const sigRes = await fetch(`/api/patients/${encodeURIComponent(hn)}/signature`);
            if (sigRes.ok) {
                const sigData = await sigRes.json();
                setRequestSheetSignature(sigData.signature);
            }
            // Fetch latest appointment for vitals
            const appts = await AppointmentService.getAppointmentsByHn(hn);
            const latestAppt = appts.length > 0 ? appts[0] : null;
            if (latestAppt) {
                setRequestSheetVitals({ [hn]: latestAppt });
            }
        } catch (err) {
            console.error('Failed to load request sheet data', err);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-[#0f1729] font-[family-name:var(--font-kanit)]">
            <Sidebar />
            <main className="flex-1 md:ml-[195px]">
                <Header />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {/* Back Link */}
                    <Link href="/test-status" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition">
                        <ArrowLeft className="w-4 h-4" />
                        กลับไปหน้ารายการ
                    </Link>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Patient Info Header */}
                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {patient?.name} {patient?.surname}
                                            </h1>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                                HN: {hn}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            สถานะ: {patient?.process || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleViewRequestSheet}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 rounded-xl transition border border-indigo-200 dark:border-indigo-700"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            ดูใบส่งตรวจ
                                        </button>
                                        {isApproved && (
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">อนุมัติแล้ว</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Main Area: File Preview + Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* File Preview (Left: 2 columns) */}
                                <div className="lg:col-span-2 bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            ไฟล์ผลตรวจล่าสุด
                                        </h2>
                                    </div>
                                    <div className="p-4">
                                        {fileUrl ? (
                                            latestResult?.file_type?.startsWith('image/') ? (
                                                <img
                                                    src={fileUrl}
                                                    alt={`Lab result for ${hn}`}
                                                    className="w-full max-h-[600px] object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                                                />
                                            ) : (
                                                <iframe
                                                    src={fileUrl}
                                                    className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-700"
                                                    title={`Lab result for ${hn}`}
                                                />
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                                                <FileText className="w-16 h-16 mb-3 opacity-30" />
                                                <p className="text-sm">ยังไม่มีไฟล์ผลตรวจ</p>
                                                <p className="text-xs mt-1">รอเจ้าหน้าที่ Lab อัปโหลด</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Panel (Right: 1 column) */}
                                <div className="space-y-4">
                                    {/* Result Info Card */}
                                    <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">ข้อมูลผลตรวจ</h3>
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">วันที่ตรวจ</span>
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {latestResult?.timestamp ? formatDate(latestResult.timestamp) : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">ผู้รายงาน</span>
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {latestResult?.reporter_name || '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">ผู้อนุญาตพิมพ์</span>
                                                <span className={`font-medium ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                                    {latestResult?.approver_name || 'ยังไม่อนุญาต'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Authorize Print Button */}
                                    {canApprove && latestResult && !isApproved && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleReject}
                                                disabled={approving}
                                                className="w-1/3 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="ตีกลับให้ รพช. อัปโหลดใหม่"
                                            >
                                                <X className="w-4 h-4" />
                                                ตีกลับ
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={approving}
                                                className="w-2/3 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {approving ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        กำลังดำเนินการ...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        อนุญาตให้พิมพ์
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {isApproved && (
                                        <div className="space-y-3">
                                            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle className="w-4 h-4" />
                                                พร้อมพิมพ์
                                            </div>
                                            {patient?.process === 'เสร็จสิ้น' ? (
                                                <p className="text-xs text-center text-emerald-500 dark:text-emerald-400 font-medium">✅ กระบวนการเสร็จสิ้น</p>
                                            ) : isApproved ? (
                                                <p className="text-xs text-center text-blue-500 dark:text-blue-400 font-medium">✅ อนุมัติเรียบร้อย</p>
                                            ) : null}
                                        </div>
                                    )}

                                    {/* History */}
                                    {history.length > 1 && (
                                        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                ประวัติผลตรวจ
                                            </h3>
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                                {history.map((result, idx) => (
                                                    <button
                                                        key={result.id}
                                                        onClick={() => handleViewHistory(result)}
                                                        className={`w-full text-left p-3 rounded-lg border transition ${selectedHistoryId === result.id
                                                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {idx === 0 ? 'ล่าสุด' : `ครั้งที่ ${history.length - idx}`}
                                                            </span>
                                                            {result.approver_name ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> อนุมัติ</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"><Clock className="w-3 h-3" /> รออนุมัติ</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">{formatDate(result.created_at)}</p>
                                                        {result.file_url && (
                                                            <div className="flex items-center gap-1 mt-1 text-blue-500">
                                                                <Eye className="w-3 h-3" />
                                                                <span className="text-xs">มีไฟล์แนบ</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected History File Preview */}
                            {selectedHistoryId && selectedFileUrl && selectedHistoryId !== latestResult?.id && (
                                <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            ไฟล์ผลตรวจ (ประวัติ)
                                        </h2>
                                        <button
                                            onClick={() => { setSelectedHistoryId(null); setSelectedFileUrl(null); }}
                                            className="text-xs text-gray-400 hover:text-gray-600 transition"
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        {history.find(h => h.id === selectedHistoryId)?.file_type?.startsWith('image/') ? (
                                            <img
                                                src={selectedFileUrl}
                                                alt="Historical lab result"
                                                className="w-full max-h-[500px] object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <iframe
                                                src={selectedFileUrl}
                                                className="w-full h-[500px] rounded-lg border border-gray-200 dark:border-gray-700"
                                                title="Historical lab result"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Request Sheet Modal */}
                    {showRequestSheet && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-[95vw] max-w-3xl max-h-[90vh] overflow-auto">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        ใบส่งตรวจ (Request Sheet)
                                    </h2>
                                    <button
                                        onClick={() => setShowRequestSheet(false)}
                                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    {patient ? (
                                        <div className="flex-1 overflow-auto p-4 bg-gray-200/50 dark:bg-gray-950/50 relative flex flex-col items-center gap-4">
                                            <style>{`
                                                @media print {
                                                    body * { visibility: hidden; }
                                                    .print-area, .print-area * { visibility: visible; }
                                                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                                                }
                                                .print-only {
                                                    display: block !important;
                                                    position: relative !important;
                                                    inset: auto !important;
                                                    z-index: 10 !important;
                                                    background: transparent !important;
                                                }
                                                .request-sheet-container {
                                                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                                                    margin-bottom: 2rem;
                                                    background: white;
                                                }
                                            `}</style>
                                            <div className="print-area">
                                                <PrintRequestSheet patients={[patient as any]} signatures={requestSheetSignature ? { [patient.hn]: requestSheetSignature } : undefined} vitals={requestSheetVitals} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center p-12">
                                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
