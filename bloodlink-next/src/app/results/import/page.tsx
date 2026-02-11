'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ExcelParser, ParsedLabResult } from '@/lib/utils/excelParser';
import { LabResult } from '@/lib/services/labService';
import { importLabResults } from './actions';
import { toast } from 'sonner';
import { Loader2, Upload, AlertTriangle, CheckCircle, FileX, AlertOctagon, ChevronLeft, FileSpreadsheet, Trash2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';

interface ProcessingStatus {
    total: number;
    processed: number;
    success: number;
    errors: number;
    isProcessing: boolean;
}

export default function ImportPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [parsedResults, setParsedResults] = useState<ParsedLabResult[]>([]);
    const [status, setStatus] = useState<ProcessingStatus>({
        total: 0,
        processed: 0,
        success: 0,
        errors: 0,
        isProcessing: false
    });
    const [importLogs, setImportLogs] = useState<{ hn: string; message: string; type: 'success' | 'error' }[]>([]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);

        // Auto-parse on drop
        const newResults: ParsedLabResult[] = [];
        for (const file of acceptedFiles) {
            try {
                const result = await ExcelParser.parseFile(file);
                newResults.push(result);
            } catch (error: any) {
                toast.error(`Failed to parse ${file.name}: ${error.message}`);
            }
        }
        setParsedResults(prev => [...prev, ...newResults]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        }
    });

    const handleImport = async () => {
        if (parsedResults.length === 0) return;

        setStatus({
            total: parsedResults.length,
            processed: 0,
            success: 0,
            errors: 0,
            isProcessing: true
        });
        setImportLogs([]);

        // Convert parsed results to LabResult objects for Server Action
        const labResultsToImport = parsedResults.map(p => p.data as LabResult);

        try {
            const result = await importLabResults(labResultsToImport);

            if (result.success) {
                setStatus(prev => ({
                    ...prev,
                    processed: parsedResults.length,
                    success: result.successCount || 0,
                    errors: result.errors?.length || 0,
                    isProcessing: false
                }));

                const logs = [] as typeof importLogs;
                if (result.successCount) {
                    logs.push({ hn: 'Batch', message: `นำเข้าสำเร็จ ${result.successCount} รายการ`, type: 'success' });
                }
                result.errors?.forEach((err: any) => {
                    logs.push({ hn: err.hn, message: err.error, type: 'error' });
                });
                setImportLogs(prev => [...prev, ...logs]);

                if (result.errors?.length === 0) {
                    toast.success('นำเข้าข้อมูลทั้งหมดเรียบร้อยแล้ว');
                } else {
                    toast.warning(`นำเข้าเสร็จสิ้น แต่มีข้อผิดพลาด ${result.errors?.length} รายการ`);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error('Import failed:', error);
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
            setStatus(prev => ({ ...prev, isProcessing: false }));
        }
    };

    const handleClear = () => {
        setFiles([]);
        setParsedResults([]);
        setImportLogs([]);
        setStatus({ total: 0, processed: 0, success: 0, errors: 0, isProcessing: false });
    };

    const handleRemoveItem = (index: number) => {
        setParsedResults(prev => prev.filter((_, i) => i !== index));
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const criticalCount = parsedResults.filter(r => r.criticals.length > 0).length;

    return (
        <MainLayout>
            <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-fade-in-up font-[family-name:var(--font-kanit)]">

                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <Link href="/results" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors w-fit group">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        กลับสู่หน้าผลตรวจ
                    </Link>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            นำเข้าผลตรวจ (Bulk Import Station)
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            ระบบนำเข้าไฟล์ Excel อัจฉริยะ พร้อมตรวจสอบความถูกต้องของข้อมูลและแจ้งเตือนค่าวิกฤต
                        </p>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative overflow-hidden border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group",
                        isDragActive
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800",
                        status.isProcessing && "pointer-events-none opacity-50 grayscale"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className={cn(
                        "w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50 dark:ring-blue-900/10 transition-transform duration-300 group-hover:scale-110",
                        isDragActive && "animate-bounce"
                    )}>
                        <Upload className="h-10 w-10 text-primary" />
                    </div>

                    {isDragActive ? (
                        <div className="space-y-2">
                            <p className="text-2xl font-bold text-primary">วางไฟล์ได้เลย!</p>
                            <p className="text-muted-foreground">กำลังรอรับไฟล์...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                ลากไฟล์ Excel มาวางที่นี่
                            </p>
                            <p className="text-muted-foreground">
                                หรือ <span className="text-primary font-medium hover:underline">คลิกเพื่อเลือกไฟล์</span> จากเครื่องของคุณ
                            </p>
                            <p className="text-xs text-muted-foreground pt-4 flex items-center justify-center gap-2">
                                <FileSpreadsheet className="w-4 h-4" />
                                รองรับไฟล์ .xlsx, .xls
                            </p>
                        </div>
                    )}
                </div>

                {/* Processing Section */}
                {parsedResults.length > 0 && (
                    <div className="space-y-6 animate-fade-in-up stagger-1">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">รายการทั้งหมด</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{parsedResults.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">พบค่าวิกฤต</p>
                                    <p className={cn("text-3xl font-bold mt-1", criticalCount > 0 ? "text-red-600" : "text-gray-900 dark:text-white")}>
                                        {criticalCount}
                                    </p>
                                </div>
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", criticalCount > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-700/50")}>
                                    <AlertOctagon className={cn("w-6 h-6", criticalCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400")} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">ความพร้อมนำเข้า</p>
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100%</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                ตรวจสอบ HN และวันที่ให้อัตโนมัติ
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleClear}
                                    disabled={status.isProcessing}
                                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    ล้างรายการ
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={status.isProcessing}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {status.isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            กำลังบันทึกข้อมูล...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            ยืนยันการนำเข้าทั้งหมด
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">ไฟล์ต้นฉบับ</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">รหัส HN</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">วันที่ตรวจ</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">จำนวนค่า Lab</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200">สถานะ</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 text-right">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {parsedResults.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 max-w-[240px]">
                                                        <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                        <span className="truncate font-medium text-gray-700 dark:text-gray-200" title={item.rawFile}>
                                                            {item.rawFile}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        {item.hn}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString('th-TH') : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                        {Object.keys(item.data).length - 2} รายการ
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.criticals.length > 0 ? (
                                                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-md w-fit">
                                                            <AlertOctagon className="h-4 w-4" />
                                                            <span>พบค่าวิกฤต ({item.criticals.join(', ')})</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded-md w-fit">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span>ปกติ</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
                                                        title="ลบรายการนี้"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Activity Logs */}
                        {importLogs.length > 0 && (
                            <div className="bg-gray-900 text-gray-200 rounded-xl p-6 shadow-lg border border-gray-800">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Terminal Log
                                </h3>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-xs sm:text-sm">
                                    {importLogs.map((log, i) => (
                                        <div key={i} className={cn("flex gap-3", log.type === 'error' ? "text-red-400" : "text-emerald-400")}>
                                            <span className="opacity-50 select-none">{'>'}</span>
                                            <span className="opacity-70 min-w-[80px]">[{log.hn}]</span>
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
