'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { Activity, Loader2, Printer, FileImage, CheckCircle, X, Eye, CheckSquare, Square, Lock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Patient } from '@/types';
import { formatDateTimeThai } from '@/lib/utils';
import { toast } from 'sonner';

interface LabFileInfo {
    file_url: string;
    file_type?: string;
    result_summary?: string;
    timestamp?: string;
    approver_name?: string;
}

export default function ResultsPage() {
    const [currentDate, setCurrentDate] = useState('');
    const [checkDay, setCheckDay] = useState('');
    const [checkMonth, setCheckMonth] = useState('');
    const [checkYear, setCheckYear] = useState('');
    const [resultState, setResultState] = useState<'hidden' | 'future' | 'today' | 'past'>('hidden');
    const [diffDays, setDiffDays] = useState(0);

    // Data State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [latestFiles, setLatestFiles] = useState<Record<string, LabFileInfo>>({});

    // Selection State
    const [selectedHns, setSelectedHns] = useState<Set<string>>(new Set());

    // Print Preview Modal
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ hn: string; name: string; url: string; fileType?: string }[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Individual print
    const [printingHn, setPrintingHn] = useState<string | null>(null);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }));

        async function fetchResults() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const allPatients: Patient[] = await response.json();
                    const resultPatients = allPatients.filter(p =>
                        p.process === 'เสร็จสิ้น' || p.process === 'รายงานผล'
                    );
                    setPatients(resultPatients);

                    const fileMap: Record<string, LabFileInfo> = {};
                    await Promise.allSettled(
                        resultPatients.map(async (p) => {
                            try {
                                const res = await fetch(`/api/lab-results/${p.hn}`);
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data.results && data.results.length > 0) {
                                        const withFile = data.results.find((r: any) => r.file_url);
                                        if (withFile) {
                                            fileMap[p.hn] = {
                                                file_url: withFile.file_url,
                                                file_type: withFile.file_type,
                                                result_summary: withFile.result_summary,
                                                timestamp: withFile.timestamp,
                                                approver_name: withFile.approver_name,
                                            };
                                        }
                                    }
                                }
                            } catch { /* skip */ }
                        })
                    );
                    setLatestFiles(fileMap);
                }
            } catch (error) {
                console.error('Failed to fetch patients:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchResults();
    }, []);

    const handleCheck = () => {
        if (!checkDay || !checkMonth || !checkYear) {
            toast.warning('กรุณากรอกวันที่ให้ครบถ้วน');
            return;
        }
        const yearNum = parseInt(checkYear);
        const fullBeYear = yearNum < 100 ? 2500 + yearNum : yearNum;
        const adYear = fullBeYear - 543;
        const inputDate = new Date(adYear, parseInt(checkMonth) - 1, parseInt(checkDay));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - inputDate.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDiffDays(days);
        if (days < 0) setResultState('future');
        else if (days === 0) setResultState('today');
        else setResultState('past');
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void, nextId?: string) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setter(val);
        if (val.length >= e.target.maxLength && nextId) {
            document.getElementById(nextId)?.focus();
        }
    };

    // Selection helpers — only approved results can be selected/printed
    const patientsWithFiles = patients.filter(p => latestFiles[p.hn] && latestFiles[p.hn].approver_name);

    const toggleSelect = (hn: string) => {
        setSelectedHns(prev => {
            const next = new Set(prev);
            if (next.has(hn)) next.delete(hn);
            else next.add(hn);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedHns.size === patientsWithFiles.length) {
            setSelectedHns(new Set());
        } else {
            setSelectedHns(new Set(patientsWithFiles.map(p => p.hn)));
        }
    };

    // Update patient status after printing
    const markAsReported = async (hn: string) => {
        try {
            await fetch(`/api/patients/${hn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ process: 'รายงานผล' }),
            });
        } catch (err) {
            console.error(`Failed to update status for ${hn}:`, err);
        }
    };

    // Individual print with preview
    const handlePrintSingle = useCallback(async (hn: string) => {
        const fileInfo = latestFiles[hn];
        if (!fileInfo) { toast.error('ไม่พบไฟล์ผลตรวจ'); return; }

        const patient = patients.find(p => p.hn === hn);
        setPrintingHn(hn);

        try {
            const res = await fetch(`/api/lab/upload?path=${encodeURIComponent(fileInfo.file_url)}`);
            if (!res.ok) throw new Error('Failed');
            const { url } = await res.json();

            // Show preview modal for single print
            setPreviewData([{
                hn,
                name: patient ? `${patient.name} ${patient.surname}` : hn,
                url,
                fileType: fileInfo.file_type,
            }]);
            setShowPreview(true);
        } catch {
            toast.error('ไม่สามารถโหลดไฟล์ได้');
        } finally {
            setPrintingHn(null);
        }
    }, [latestFiles, patients]);

    // Batch print preview
    const handleBatchPreview = useCallback(async () => {
        const selected = patientsWithFiles.filter(p => selectedHns.has(p.hn));
        if (selected.length === 0) { toast.warning('กรุณาเลือกผู้ป่วยก่อน'); return; }

        setPreviewLoading(true);

        try {
            const results = await Promise.allSettled(
                selected.map(async (p) => {
                    const res = await fetch(`/api/lab/upload?path=${encodeURIComponent(latestFiles[p.hn].file_url)}`);
                    if (!res.ok) throw new Error('Failed');
                    const { url } = await res.json();
                    return { hn: p.hn, name: `${p.name} ${p.surname}`, url, fileType: latestFiles[p.hn].file_type };
                })
            );

            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<{ hn: string; name: string; url: string; fileType?: string }>).value);

            if (successful.length === 0) { toast.error('ไม่สามารถโหลดไฟล์ได้'); return; }

            setPreviewData(successful);
            setShowPreview(true);
        } catch {
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setPreviewLoading(false);
        }
    }, [patientsWithFiles, selectedHns, latestFiles]);

    // Confirm and print from preview modal
    const handleConfirmPrint = useCallback(async () => {
        if (previewData.length === 0) return;

        const imageItems = previewData.filter(u => u.fileType?.startsWith('image/'));

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) { toast.error('กรุณาอนุญาต Pop-up เพื่อสั่งพิมพ์'); return; }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>พิมพ์ผลตรวจ (${previewData.length} รายการ)</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { background: #fff; font-family: sans-serif; }
                    .page { page-break-after: always; padding: 10mm; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
                    .page:last-child { page-break-after: auto; }
                    .header { text-align: center; margin-bottom: 12px; font-size: 14px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; width: 100%; }
                    .header strong { font-size: 16px; }
                    img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                    @media print { .page { padding: 5mm; } }
                </style>
            </head>
            <body>
                ${imageItems.map(item => `
                    <div class="page">
                        <div class="header">
                            <strong>ผลตรวจเลือด</strong><br/>
                            HN: ${item.hn} — ${item.name}
                        </div>
                        <img src="${item.url}" />
                    </div>
                `).join('')}
                <script>
                    let loaded = 0;
                    const images = document.querySelectorAll('img');
                    const total = images.length;
                    images.forEach(img => {
                        if (img.complete) { loaded++; if (loaded >= total) setTimeout(() => window.print(), 500); }
                        else { img.onload = () => { loaded++; if (loaded >= total) setTimeout(() => window.print(), 500); }; }
                    });
                    if (total === 0) setTimeout(() => window.print(), 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();

        // Mark all printed patients as "รายงานผล"
        await Promise.allSettled(previewData.map(item => markAsReported(item.hn)));

        // Update local state
        setPatients(prev => prev.map(p =>
            previewData.some(d => d.hn === p.hn) ? { ...p, process: 'รายงานผล' } : p
        ));

        toast.success(`สั่งพิมพ์ ${previewData.length} รายการ & อัปเดตสถานะ "รายงานผล" แล้ว`);
        setShowPreview(false);
        setPreviewData([]);
        setSelectedHns(new Set());
    }, [previewData]);

    // Summary badge helper
    const getSummaryDot = (summary?: string) => {
        switch (summary) {
            case 'Normal': return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" title="ปกติ" />;
            case 'Abnormal': return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" title="ผิดปกติ" />;
            case 'Critical': return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" title="วิกฤต" />;
            default: return null;
        }
    };

    return (
        <MainLayout>
            <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                <Header />

                <div className="flex flex-col-reverse lg:flex-row gap-4 h-auto lg:h-[calc(100vh-96px)] pb-4">
                    {/* Left Column: Results List */}
                    <div className="flex-1 bg-[#F3F4F6] dark:bg-transparent rounded-[20px] flex flex-col overflow-hidden transition-colors min-h-[500px]">
                        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 animate-fade-in-up">
                            <h1 className="text-[22px] font-bold text-[#111827] dark:text-white">ผลตรวจเลือด</h1>
                            <div className="flex items-center gap-3">
                                <Link href="/test-status" className="flex items-center gap-1.5 text-[#6366F1] dark:text-indigo-400 font-semibold hover:text-[#4F46E5] dark:hover:text-indigo-300 transition-colors text-[13px]">
                                    <Activity className="w-4 h-4" />
                                    สถานะผลตรวจเลือด
                                </Link>
                            </div>
                        </div>

                        <div className="mb-3 animate-fade-in-up stagger-1">
                            <div className="flex items-center justify-between mb-1.5">
                                <h2 className="text-[16px] font-semibold text-[#8B5CF6] dark:text-violet-400">{currentDate}</h2>
                                {patientsWithFiles.length > 0 && (
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {selectedHns.size === patientsWithFiles.length ? (
                                            <CheckSquare className="w-3.5 h-3.5" />
                                        ) : (
                                            <Square className="w-3.5 h-3.5" />
                                        )}
                                        {selectedHns.size === patientsWithFiles.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                                    </button>
                                )}
                            </div>
                            <div className="h-[3px] w-full bg-[#E0E7FF] dark:bg-gray-700 rounded-full"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : patients.length > 0 ? (
                                patients.map((patient, idx) => {
                                    const hasFile = !!latestFiles[patient.hn];
                                    const isApproved = !!latestFiles[patient.hn]?.approver_name;
                                    const canPrint = hasFile && isApproved;
                                    const isSelected = selectedHns.has(patient.hn);
                                    return (
                                        <div
                                            key={`${patient.hn}-${idx}`}
                                            className={`bg-white dark:bg-[#1F2937] rounded-[12px] p-4 flex items-center gap-3 shadow-sm border transition-all group card-animate hover-lift ${isSelected ? 'border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10' : 'border-transparent hover:border-[#E0E7FF] dark:hover:border-gray-600'}`}
                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                        >
                                            {/* Checkbox — only if approved */}
                                            {canPrint && (
                                                <button
                                                    onClick={() => toggleSelect(patient.hn)}
                                                    className="flex-shrink-0 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Patient info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[16px] font-bold text-[#1F2937] dark:text-white">
                                                        HN : {patient.hn}
                                                    </div>
                                                    {getSummaryDot(latestFiles[patient.hn]?.result_summary)}
                                                    {patient.process === 'รายงานผล' && (
                                                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-medium">พิมพ์แล้ว</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#4B5563] dark:text-gray-400 truncate">
                                                    {patient.name} {patient.surname} {patient.timestamp && `; ${formatDateTimeThai(patient.timestamp)}`}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {canPrint ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handlePrintSingle(patient.hn); }}
                                                        disabled={printingHn === patient.hn}
                                                        className="h-7 px-2.5 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium rounded-[6px] hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors disabled:opacity-50"
                                                        title="ดูตัวอย่างและพิมพ์"
                                                    >
                                                        {printingHn === patient.hn ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Eye className="w-3.5 h-3.5" />
                                                        )}
                                                        พิมพ์
                                                    </button>
                                                ) : hasFile && !isApproved ? (
                                                    <span className="h-7 px-2.5 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[11px] font-medium rounded-[6px]" title="รอแพทย์อนุมัติก่อนพิมพ์">
                                                        <Lock className="w-3.5 h-3.5" />
                                                        รออนุมัติ
                                                    </span>
                                                ) : null}
                                                <Link
                                                    href={`/results/${patient.hn}`}
                                                    className="w-14 h-7 flex items-center justify-center bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#374151] dark:text-indigo-200 text-[11px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-800 transition-colors"
                                                >
                                                    ดูผล
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>ไม่พบรายการผลตรวจเลือด</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Panels */}
                    <div className="w-full lg:w-[260px] flex flex-col gap-3 flex-shrink-0 animate-fade-in-right">
                        {/* Print Panel */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#1F2937] dark:to-[#1F2937] rounded-[20px] p-4 transition-colors shadow-sm border border-amber-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Printer className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                </div>
                                <h3 className="text-[14px] font-bold text-[#1F2937] dark:text-white">สั่งพิมพ์ผลตรวจ</h3>
                            </div>

                            <div className="bg-white dark:bg-[#374151] rounded-[12px] p-3 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <FileImage className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300">มีไฟล์ผลตรวจ</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                                        {patientsWithFiles.length}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300">เลือกแล้ว</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400">
                                        {selectedHns.size}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-[11px] text-gray-600 dark:text-gray-300">ทั้งหมด</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
                                        {patients.length}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                                    <button
                                        onClick={handleBatchPreview}
                                        disabled={selectedHns.size === 0 || previewLoading}
                                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-[8px] shadow-sm transition-all text-[12px] flex items-center justify-center gap-1.5 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
                                    >
                                        {previewLoading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                กำลังโหลด...
                                            </>
                                        ) : (
                                            <>
                                                <Printer className="w-3.5 h-3.5" />
                                                ดูตัวอย่าง & พิมพ์ ({selectedHns.size})
                                            </>
                                        )}
                                    </button>
                                </div>

                                <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                                    เลือกผู้ป่วย → ดูตัวอย่าง → กดพิมพ์<br />
                                    พิมพ์แล้วอัปเดตสถานะ &quot;รายงานผล&quot; อัตโนมัติ
                                </p>
                            </div>
                        </div>

                        {/* Date Check Widget */}
                        <div className="bg-[#E9EFFD] dark:bg-[#1F2937] rounded-[20px] p-4 flex flex-col items-center text-center transition-colors shadow-sm lg:shadow-none">
                            <div className="bg-white dark:bg-[#374151] rounded-[16px] p-4 w-full shadow-sm flex flex-col items-center transition-colors">
                                <h3 className="text-[14px] font-bold text-[#1F2937] dark:text-white mb-1.5 leading-tight">เช็ควันและประเภท<br />ในการตรวจที่ผ่านมา</h3>
                                <div className="w-full mb-2">
                                    <div className="text-[10px] text-[#6B7280] dark:text-gray-300 mb-1 text-left w-full pl-1">วันที่</div>
                                    <div className="flex items-center justify-center gap-1 mb-1.5">
                                        <input id="inputDay" type="text" placeholder="dd" maxLength={2} value={checkDay} onChange={(e) => handleDateInput(e, setCheckDay, 'inputMonth')} className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300" />
                                        <span className="text-[#1F2937] dark:text-gray-300 font-semibold text-[12px]">/</span>
                                        <input id="inputMonth" type="text" placeholder="mm" maxLength={2} value={checkMonth} onChange={(e) => handleDateInput(e, setCheckMonth, 'inputYear')} className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300" />
                                        <span className="text-[#1F2937] dark:text-gray-300 font-semibold text-[12px]">/</span>
                                        <input id="inputYear" type="text" placeholder="yy" maxLength={4} value={checkYear} onChange={(e) => handleDateInput(e, setCheckYear)} className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300" />
                                    </div>
                                    <p className="text-[9px] text-[#9CA3AF] dark:text-gray-400 text-center">กรุณากรอกวันที่เพื่อตรวจสอบ</p>
                                </div>
                                <div className={`w-full rounded-[10px] p-3 min-h-[96px] flex flex-col items-center justify-center transition-all duration-300 mb-3 bg-[#E1EAFA] dark:bg-[#4B5563]`}>
                                    {resultState === 'hidden' ? (
                                        <p className="text-[10px] text-[#6B7280] dark:text-gray-300">กรอกวันที่และกดเช็คเพื่อดูผล</p>
                                    ) : (
                                        <div className="flex flex-col items-center text-[#374151] dark:text-gray-200 text-center">
                                            <div className="text-[11px] mb-0.5">
                                                {resultState === 'future' ? 'วันที่ในอนาคต' :
                                                    resultState === 'today' ? 'วันนี้' :
                                                        <>ได้ผ่านการตรวจมาแล้ว <span className="font-bold">{diffDays}</span> วัน</>}
                                            </div>
                                            <div className="text-[11px] font-semibold text-[#1F2937] dark:text-white">ประเภทการตรวจ : CBC</div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleCheck} className="w-[80px] py-1.5 bg-[#5FABE7] hover:bg-[#4B9CD8] text-white font-medium rounded-[6px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-colors text-[11px]">
                                    เช็ค
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">ตัวอย่างก่อนพิมพ์</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{previewData.length} รายการ — แต่ละคนจะพิมพ์แยกหน้า</p>
                            </div>
                            <button onClick={() => { setShowPreview(false); setPreviewData([]); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable previews */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {previewData.map((item, idx) => (
                                <div key={item.hn} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center justify-between">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <span className="text-gray-400 mr-2">หน้า {idx + 1}</span>
                                            HN: {item.hn} — {item.name}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-900 flex justify-center">
                                        {item.fileType?.startsWith('image/') ? (
                                            <img src={item.url} alt={`Lab result ${item.hn}`} className="max-h-[400px] object-contain rounded-lg" />
                                        ) : (
                                            <iframe src={item.url} className="w-full h-[400px] rounded-lg" title={`Lab result ${item.hn}`} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                ⚠️ กดพิมพ์จะอัปเดตสถานะ &quot;รายงานผล&quot; ทุกคนที่เลือก
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewData([]); }}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleConfirmPrint}
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-2 text-sm hover:shadow-md active:scale-[0.98]"
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ ({previewData.length} รายการ)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
