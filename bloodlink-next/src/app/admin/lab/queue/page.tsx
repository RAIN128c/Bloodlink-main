'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/providers/RoleGuard';
import { LabUploadModal } from '@/components/modals/LabUploadModal';
import { Upload, RefreshCw, Clock, Search, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
    resultSummary: string;
    createdAt: string;
    reporterName: string;
}

export default function LabQueuePage() {
    const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
    const [recentResults, setRecentResults] = useState<CompletedResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch pending patients (status: กำลังจัดส่ง or กำลังตรวจ)
            const patientsRes = await fetch('/api/patients?process=pending_lab');
            if (patientsRes.ok) {
                const data = await patientsRes.json();
                setPendingPatients(data.patients || []);
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
    }, []);

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

    const filteredPatients = pendingPatients.filter(p =>
        p.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.surname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSummaryBadge = (summary: string) => {
        switch (summary) {
            case 'Normal':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"><CheckCircle className="w-3 h-3" /> ปกติ</span>;
            case 'Abnormal':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"><AlertTriangle className="w-3 h-3" /> ผิดปกติ</span>;
            case 'Critical':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"><AlertCircle className="w-3 h-3" /> วิกฤต</span>;
            default:
                return <span className="text-xs text-gray-400">-</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    return (
        <RoleGuard allowedRoles={['เจ้าหน้าที่ห้องปฏิบัติการ', 'ผู้ดูแลระบบ', 'admin']}>
            <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-[#0f1729] font-[family-name:var(--font-kanit)]">
                <Sidebar />
                <main className="flex-1 md:ml-[195px]">
                    <Header />
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                        {/* Page Title */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">คิวงาน Lab</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">รายการผู้ป่วยที่รอผลตรวจเลือด</p>
                            </div>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                รีเฟรช
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'pending'
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                รอผลตรวจ ({pendingPatients.length})
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

                        {activeTab === 'pending' && (
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
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HN</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ชื่อ-สกุล</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ประเภทตรวจ</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
                                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">อัปเดตล่าสุด</th>
                                                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ดำเนินการ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                    {filteredPatients.map((patient) => (
                                                        <tr key={patient.hn} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                            <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900 dark:text-white">{patient.hn}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{patient.name} {patient.surname}</td>
                                                            <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{patient.testType || '-'}</td>
                                                            <td className="px-5 py-4">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    {patient.process}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-xs text-gray-400">{patient.updatedAt ? formatDate(patient.updatedAt) : '-'}</td>
                                                            <td className="px-5 py-4 text-right">
                                                                <button
                                                                    onClick={() => handleUploadClick(patient)}
                                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                                                                >
                                                                    <Upload className="w-3.5 h-3.5" />
                                                                    อัปโหลดผล
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สรุปผล</th>
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ผู้อัปโหลด</th>
                                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">วันที่</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {recentResults.map((result, idx) => (
                                                    <tr key={`${result.hn}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                        <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900 dark:text-white">{result.hn}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{result.patientName || '-'}</td>
                                                        <td className="px-5 py-4">{getSummaryBadge(result.resultSummary)}</td>
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

                {/* Upload Modal */}
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
            </div>
        </RoleGuard>
    );
}
