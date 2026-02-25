'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/providers/RoleGuard';
import { LabUploadModal } from '@/components/modals/LabUploadModal';
import { LabBulkUploadModal } from '@/components/modals/LabBulkUploadModal';
import { Upload, RefreshCw, Clock, Search, AlertCircle, CheckCircle, AlertTriangle, CheckSquare, Square, FileText, Eye, Printer, Download, Loader2, Thermometer, Droplet, ArrowDownSquare } from 'lucide-react';
import { LabService } from '@/lib/services/labService';
import { AppointmentService, Appointment } from '@/lib/services/appointmentService';
import { toast } from 'sonner';
import { useSession } from '@/components/providers/SupabaseAuthProvider';
import { PrintSummarySheet } from '@/components/features/history/PrintSummarySheet';
import { PrintRequestSheet } from '@/components/features/history/PrintRequestSheet';
import { PinVerificationModal } from '@/components/shared/PinVerificationModal';

interface PendingPatient {
    hn: string;
    name: string;
    surname: string;
    process: string;
    testType: string;
    updatedAt: string;
    caregiver: string;
}

interface CompletedResult {
    hn: string;
    patientName: string;
    createdAt: string;
    reporterName: string;
}

export default function LabQueuePage() {
    const { data: session } = useSession();
    const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
    const [allLabPatients, setAllLabPatients] = useState<PendingPatient[]>([]);
    const [myTasks, setMyTasks] = useState<PendingPatient[]>([]);
    const [recentResults, setRecentResults] = useState<CompletedResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

    // Preview Modal Data For PrintRequestSheet
    const [previewPatients, setPreviewPatients] = useState<PendingPatient[]>([]);
    const [previewSignatures, setPreviewSignatures] = useState<Record<string, any>>({});
    const [previewVitals, setPreviewVitals] = useState<Record<string, Partial<Appointment>>>({});
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [activeTab, setActiveTab] = useState<'new_requests' | 'my_tasks' | 'completed'>('new_requests');

    // Batch selection state
    const [selectedHns, setSelectedHns] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);

    // PIN Verification for receiving specimen
    const [showPinModal, setShowPinModal] = useState(false);
    const [selectedReceiveHn, setSelectedReceiveHn] = useState<string | null>(null);
    const [isVerifyingPin, setIsVerifyingPin] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch ALL pending lab patients (will be filtered locally for speed, or we can fetch separate)
            const patientsRes = await fetch('/api/patients?process=pending_lab');
            if (patientsRes.ok) {
                const data = await patientsRes.json();
                const allPending = data.patients || [];

                // Store ALL lab patients for the bulk upload modal
                setAllLabPatients(allPending);

                // คำขอใหม่: รอแล็บรับเรื่อง
                setPendingPatients(allPending.filter((p: any) => p.process === 'รอแล็บรับเรื่อง'));

                // งานของฉัน: รอจัดส่ง, กำลังจัดส่ง, กำลังตรวจ AND belongs to current user
                setMyTasks(allPending.filter((p: any) => {
                    const isMyStatus = ['รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ'].includes(p.process);
                    const isMine = session?.user?.email && p.responsibleEmails?.includes(session.user.email);
                    return isMyStatus && isMine;
                }));
            }

            // Fetch recent completed results
            const resultsRes = await fetch('/api/lab/upload?recent=true');
            if (resultsRes.ok) {
                const data = await resultsRes.json();
                setRecentResults(data.results || []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    }, [session?.user?.email]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUploadClick = (patient: PendingPatient) => {
        setSelectedPatient(patient);
        setShowUploadModal(true);
    };

    const handleUploadSuccess = () => {
        fetchData();
    };

    const handleStatusUpdate = async (hn: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/patients/${encodeURIComponent(hn)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: newStatus })
            });
            if (res.ok) {
                toast.success('อัปเดตสถานะสำเร็จ');
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'ไม่สามารถอัปเดตสถานะได้');
            }
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleVerifyPin = async (pin: string) => {
        if (!selectedReceiveHn) return;
        setIsVerifyingPin(true);
        try {
            // Verify PIN
            const res = await fetch('/api/profile/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (!res.ok) {
                toast.error('รหัส PIN ไม่ถูกต้อง');
                setIsVerifyingPin(false);
                return;
            }

            // Success PIN, now proceed to accept specimen
            setShowPinModal(false);
            await handleStatusUpdate(selectedReceiveHn, 'กำลังตรวจ');
            toast.success('ตรวจสอบ PIN สำเร็จ');
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN');
        } finally {
            setIsVerifyingPin(false);
            setSelectedReceiveHn(null);
        }
    };

    // Batch accept all selected
    const handleBatchAccept = async () => {
        if (selectedHns.size === 0) return;
        setBatchLoading(true);
        try {
            const results = await Promise.allSettled(
                Array.from(selectedHns).map(hn =>
                    fetch(`/api/patients/${encodeURIComponent(hn)}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ process: 'รอจัดส่ง' })
                    })
                )
            );
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            toast.success(`รับออร์เดอร์ ${successCount} รายการสำเร็จ`);
            setSelectedHns(new Set());
            fetchData();
        } catch {
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setBatchLoading(false);
        }
    };

    const toggleSelect = (hn: string) => {
        setSelectedHns(prev => {
            const next = new Set(prev);
            if (next.has(hn)) next.delete(hn);
            else next.add(hn);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedHns.size === filteredPatients.length) {
            setSelectedHns(new Set());
        } else {
            setSelectedHns(new Set(filteredPatients.map(p => p.hn)));
        }
    };

    const filteredPatients = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const sourceData = activeTab === 'new_requests' ? pendingPatients : myTasks;

        return sourceData.filter(p =>
            p.hn.toLowerCase().includes(lowerSearch) ||
            p.name.toLowerCase().includes(lowerSearch) ||
            p.surname.toLowerCase().includes(lowerSearch)
        );
    }, [pendingPatients, myTasks, searchTerm, activeTab]);


    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    const handleOpenPreview = async (patients: PendingPatient | PendingPatient[]) => {
        const patientArray = Array.isArray(patients) ? patients : [patients];

        try {
            // Check if there is a frozen PDF for the first patient.
            // If it's a batch, we might ideally merge PDFs, but for now, 
            // if it's a single patient, we open the PDF directly.
            if (patientArray.length === 1) {
                const hn = patientArray[0].hn;
                const sigRes = await fetch(`/api/patients/${encodeURIComponent(hn)}/signature`);
                if (sigRes.ok) {
                    const sigData = await sigRes.json();
                    if (sigData.signature?.document_url) {
                        window.open(sigData.signature.document_url, '_blank');
                        return; // Stop here, don't open dynamic modal
                    }
                }
            }

            // Fallback: Dynamic Modal Preview
            setPreviewPatients(patientArray);
            setPreviewSignatures({});
            setPreviewVitals({});
            setShowPreviewModal(true);

            // Fetch signatures and vitals for all patients
            const sigMap: Record<string, any> = {};
            const vitalsMap: Record<string, Partial<Appointment>> = {};
            await Promise.all(patientArray.map(async (p) => {
                const res = await fetch(`/api/patients/${encodeURIComponent(p.hn)}/signature`);
                if (res.ok) {
                    const data = await res.json();
                    sigMap[p.hn] = data.signature;
                }
                const appts = await AppointmentService.getAppointmentsByHn(p.hn);
                const latestAppt = appts.length > 0 ? appts[0] : null;
                if (latestAppt) {
                    vitalsMap[p.hn] = latestAppt;
                }
            }));
            setPreviewSignatures(sigMap);
            setPreviewVitals(vitalsMap);
        } catch (err) {
            console.error('Failed to fetch preview data', err);
            toast.error('เกิดข้อผิดพลาดในการโหลดใบส่งตรวจ');
        }
    };

    const handleBatchPreview = () => {
        const selected = filteredPatients.filter(p => selectedHns.has(p.hn));
        if (selected.length === 0) return;
        handleOpenPreview(selected);
    };

    return (
        <RoleGuard allowedRoles={['เจ้าหน้าที่ห้องปฏิบัติการ', 'ผู้ดูแลระบบ', 'admin']}>
            <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-[#0f1729] font-[family-name:var(--font-kanit)]">
                <Sidebar />
                <main className="flex-1 md:ml-[195px] print:m-0 print:w-full">
                    <Header />
                    <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-6 ${showPreviewModal ? 'print:hidden' : ''}`}>
                        {/* Page Title */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">คิวงาน Lab</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">รายการผู้ป่วยที่รอผลตรวจเลือด</p>
                            </div>
                            <div className="flex items-center gap-2 text-nowrap">
                                <button
                                    onClick={() => setShowBulkUploadModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    นำเข้าผลตรวจ (Bulk)
                                </button>
                                <button
                                    onClick={fetchData}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    รีเฟรช
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('new_requests')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'new_requests'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                คำขอใหม่ ({pendingPatients.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('my_tasks')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'my_tasks'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                งานของฉัน ({myTasks.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'completed'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                อัปโหลดแล้ว
                            </button>
                        </div>

                        {(activeTab === 'new_requests' || activeTab === 'my_tasks') && (
                            <>
                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="ค้นหาด้วย HN, ชื่อ..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Pending Queue Table */}
                                <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    {loading ? (
                                        <div className="flex items-center justify-center p-12">
                                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                    ) : filteredPatients.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                            <Clock className="w-12 h-12 mb-3 opacity-50" />
                                            <p className="text-sm">ไม่มีผู้ป่วยรอผลตรวจ</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                                        {activeTab === 'new_requests' && (
                                                            <th className="w-10 px-3 py-3.5">
                                                                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-500 transition">
                                                                    {selectedHns.size === filteredPatients.length && filteredPatients.length > 0
                                                                        ? <CheckSquare className="w-4 h-4 text-blue-500" />
                                                                        : <Square className="w-4 h-4" />}
                                                                </button>
                                                            </th>
                                                        )}
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HN</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ชื่อ-สกุล</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">ประเภทตรวจ</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">อัปเดตล่าสุด</th>
                                                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ดำเนินการ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                    {filteredPatients.map((patient) => (
                                                        <tr key={patient.hn} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${selectedHns.has(patient.hn) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                                            {activeTab === 'new_requests' && (
                                                                <td className="w-10 px-3 py-4">
                                                                    <button onClick={() => toggleSelect(patient.hn)} className="text-gray-400 hover:text-blue-500 transition">
                                                                        {selectedHns.has(patient.hn)
                                                                            ? <CheckSquare className="w-4 h-4 text-blue-500" />
                                                                            : <Square className="w-4 h-4" />}
                                                                    </button>
                                                                </td>
                                                            )}
                                                            <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900 dark:text-white">{patient.hn}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{patient.name} {patient.surname}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{patient.testType || '-'}</td>
                                                            <td className="px-5 py-4">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    {patient.process}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-xs text-gray-400 hidden md:table-cell">{patient.updatedAt ? formatDate(patient.updatedAt) : '-'}</td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex justify-end items-center gap-2">
                                                                    {patient.process === 'รอแล็บรับเรื่อง' && (
                                                                        <button
                                                                            onClick={() => handleOpenPreview(patient)}
                                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition shadow-sm"
                                                                        >
                                                                            <FileText className="w-3.5 h-3.5" />
                                                                            ดูใบส่งตรวจ
                                                                        </button>
                                                                    )}
                                                                    {patient.process === 'กำลังจัดส่ง' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedReceiveHn(patient.hn);
                                                                                setShowPinModal(true);
                                                                            }}
                                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-lg transition shadow-sm"
                                                                        >
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            รับตัวอย่างเลือด
                                                                        </button>
                                                                    )}
                                                                    {patient.process === 'รอจัดส่ง' && (
                                                                        <span className="text-xs text-gray-400 italic">รอต้นทางจัดส่ง</span>
                                                                    )}
                                                                    {patient.process === 'กำลังตรวจ' && (
                                                                        <button
                                                                            onClick={() => handleUploadClick(patient)}
                                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                                                                        >
                                                                            <Upload className="w-3.5 h-3.5" />
                                                                            อัปโหลดผล
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Batch action bar */}
                                    {activeTab === 'new_requests' && selectedHns.size > 0 && (
                                        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
                                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                                เลือกแล้ว {selectedHns.size} รายการ
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleBatchPreview}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-800/40 rounded-lg transition shadow-sm"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    ดูใบส่งตรวจ
                                                </button>
                                                <button
                                                    onClick={handleBatchAccept}
                                                    disabled={batchLoading}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition shadow-sm disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    {batchLoading ? 'กำลังดำเนินการ...' : `รับเรื่องทั้งหมด (${selectedHns.size})`}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'completed' && (
                            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                {recentResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                        <CheckCircle className="w-12 h-12 mb-3 opacity-50" />
                                        <p className="text-sm">ยังไม่มีผลตรวจที่อัปโหลด</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HN</th>
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ชื่อผู้ป่วย</th>
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ผู้อัปโหลด</th>
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">วันที่</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {recentResults.map((result, idx) => (
                                                    <tr key={`${result.hn}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                        <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900 dark:text-white">{result.hn}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{result.patientName || '-'}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{result.reporterName || '-'}</td>
                                                        <td className="px-5 py-4 text-xs text-gray-400">{result.createdAt ? formatDate(result.createdAt) : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {selectedPatient && (
                    <LabUploadModal
                        isOpen={showUploadModal}
                        onClose={() => {
                            setShowUploadModal(false);
                            setSelectedPatient(null);
                        }}
                        onSuccess={handleUploadSuccess}
                        patient={selectedPatient}
                    />
                )}

                {/* Bulk Upload Modal */}
                <LabBulkUploadModal
                    isOpen={showBulkUploadModal}
                    onClose={() => setShowBulkUploadModal(false)}
                    onSuccess={handleUploadSuccess}
                    queuePatients={allLabPatients as any}
                />

                {/* Digital Request Sheet Preview Modal */}
                {showPreviewModal && previewPatients.length > 0 && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in print:static print:bg-transparent print:p-0" onClick={() => setShowPreviewModal(false)}>
                        <div
                            className="bg-white dark:bg-gray-900 w-full max-w-[1200px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 print:overflow-visible print:max-h-none print:shadow-none print:w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    ตรวจสอบใบส่งตรวจ (Request Sheet)
                                    {previewPatients.length > 1 && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
                                            {previewPatients.length} รายการ
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition"
                                    >
                                        <Printer className="w-4 h-4" />
                                        พิมพ์ใบส่งตรวจ
                                    </button>
                                    <button
                                        onClick={() => setShowPreviewModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto print:overflow-visible p-4 print:p-0 bg-gray-200/50 dark:bg-gray-950/50 print:bg-transparent relative flex flex-col items-center gap-4">
                                {previewPatients.length > 1 && (
                                    <PrintSummarySheet patients={previewPatients as any} signature={previewSignatures[previewPatients[0]?.hn] || null} />
                                )}
                                <PrintRequestSheet patients={previewPatients as any} signatures={previewSignatures} vitals={previewVitals} />
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 flex-wrap">
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                                >
                                    ปิดหน้าต่าง
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 rounded-xl transition shadow-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ใบส่งตรวจ
                                </button>
                                <button
                                    onClick={async () => {
                                        for (const p of previewPatients) {
                                            await handleStatusUpdate(p.hn, 'รอจัดส่ง');
                                        }
                                        setShowPreviewModal(false);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    ยืนยันรับออร์เดอร์ {previewPatients.length > 1 ? `(${previewPatients.length} รายการ)` : '(ข้อมูลถูกต้อง)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PIN Verification Modal */}
                <PinVerificationModal
                    isOpen={showPinModal}
                    onClose={() => {
                        setShowPinModal(false);
                        setSelectedReceiveHn(null);
                    }}
                    onVerify={handleVerifyPin}
                    title="ยืนยันการรับตัวอย่างเลือด"
                    description="กรุณากรอกรหัส PIN 6 หลักเพื่อยืนยันตัวตนในการรับตัวอย่างเลือด (Electronic Signature)"
                />
            </div>
        </RoleGuard>
    );
}
