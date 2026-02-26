'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Loader2, Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { useDropzone } from 'react-dropzone';
import { Patient } from '@/types';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import imageCompression from 'browser-image-compression';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface LabBulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    queuePatients: Patient[];
}

interface ProcessedFile {
    id: string;
    originalFile: File;
    processedImage: File | null;
    status: 'pending' | 'converting' | 'ocr' | 'ready' | 'uploading' | 'success' | 'error';
    extractedHn: string | null;
    matchedPatient: Patient | null;
    errorMsg?: string;
    previewUrl?: string;
}

export function LabBulkUploadModal({ isOpen, onClose, onSuccess, queuePatients }: LabBulkUploadModalProps) {
    const [files, setFiles] = useState<ProcessedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const excelRenderRef = useRef<HTMLDivElement>(null);

    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

    // Only allow uploading for patients currently in 'กำลังตรวจ' status
    const uploadableStatuses = ['กำลังตรวจ'];
    const activeQueue = queuePatients.filter(p => uploadableStatuses.includes(p.process));

    const handleClose = () => {
        if (isUploading || isProcessing) {
            setIsConfirmCloseOpen(true);
            return;
        }
        forceClose();
    };

    const forceClose = () => {
        files.forEach(f => {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setFiles([]);
        setIsConfirmCloseOpen(false);
        onClose();
    };

    const convertExcelToImage = async (excelFile: File): Promise<File> => {
        const buffer = await excelFile.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

        let worksheet;
        let sheetNameUsed = '';
        for (const sheetName of workbook.SheetNames) {
            if (workbook.Sheets[sheetName] && workbook.Sheets[sheetName]['!ref']) {
                worksheet = workbook.Sheets[sheetName];
                sheetNameUsed = sheetName;
                break;
            }
        }

        if (!worksheet) {
            throw new Error("ไม่พบข้อมูลในไฟล์ Excel (แผ่นงานว่างเปล่า)");
        }

        let htmlString = '';
        try {
            htmlString = XLSX.utils.sheet_to_html(worksheet, { id: 'data-table' });
        } catch (htmlErr) {
            console.warn('sheet_to_html failed, using fallback', htmlErr);
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!Array.isArray(rows) || rows.length === 0) throw new Error("ไม่สามารถแปลงข้อมูลใน Excel ได้");
            htmlString = '<table>' + rows.map((row: unknown) => '<tr>' + (Array.isArray(row) ? row : []).map((cell: unknown) => `<td>${cell || ''}</td>`).join('') + '</tr>').join('') + '</table>';
        }

        const container = excelRenderRef.current;
        if (!container) throw new Error("ไม่พบ Container สำหรับ Render");

        container.innerHTML = `
            <div style="padding:24px;background:#fff;min-width:600px;">
                <h3 style="margin:0 0 12px;font-size:14px;color:#374151;">📄 ${excelFile.name} (Sheet: ${sheetNameUsed})</h3>
                <style>
                    table { border-collapse:collapse; width:100%; font-size:12px; }
                    th, td { border:1px solid #D1D5DB; padding:6px 10px; text-align:left; }
                    th { background:#F3F4F6; font-weight:600; color:#374151; }
                    tr:nth-child(even) { background:#F9FAFB; }
                </style>
                ${htmlString}
            </div>
        `;

        await new Promise((r) => setTimeout(r, 200));
        const canvas = await html2canvas(container, { backgroundColor: '#ffffff', scale: 2, logging: false });
        container.innerHTML = '';

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error("ไม่สามารถสร้างรูปภาพจาก Excel ได้");

        const pngName = excelFile.name.replace(/\.(xlsx?|xls)$/i, '.png');
        return new File([blob], pngName, { type: 'image/png' });
    };

    const convertPdfToImage = async (pdfFile: File): Promise<File> => {
        const buffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(buffer).promise;
        const page = await pdf.getPage(1); // Only first page for OCR/Thumbnail

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("ไม่สามารถสร้าง Context รูปภาพได้");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport } as Parameters<typeof page.render>[0]).promise;

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error("ไม่สามารถสร้างรูปภาพจาก PDF ได้");

        const pngName = pdfFile.name.replace(/\.pdf$/i, '.png');
        return new File([blob], pngName, { type: 'image/png' });
    };

    const extractHnFromText = (text: string, filename: string): string | null => {
        // 1. Try finding matching HN in OCR text using regex (assuming Thai HN is usually numbers, maybe with dash)
        // Adjust regex based on expected HN format. For now, matching 6-13 digit numbers
        const matches = text.match(/\b\d{6,13}\b/g);

        let foundHn = null;

        if (matches) {
            // See if any OCR match exists in the active queue
            for (const match of matches) {
                if (activeQueue.some(p => p.hn === match)) {
                    return match; // Definite match in queue
                }
            }
            // If no exact queue match, just take the first plausible number
            foundHn = matches[0];
        }

        // 2. Fallback to extracting from filename (e.g. "123456.pdf" -> "123456")
        if (!foundHn) {
            const nameMatch = filename.match(/\b\d{6,13}\b/);
            if (nameMatch) {
                foundHn = nameMatch[0];
            }
        }

        return foundHn;
    };

    const processFile = async (item: ProcessedFile) => {
        const updateStatus = (updates: Partial<ProcessedFile>) => {
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, ...updates } : f));
        };

        try {
            updateStatus({ status: 'converting' });
            let finalImage: File | null = item.originalFile;
            const isExcel = item.originalFile.name.match(/\.(xlsx?|xls)$/i) || item.originalFile.type.includes('excel') || item.originalFile.type.includes('spreadsheetml');
            const isPdf = item.originalFile.type === 'application/pdf' || item.originalFile.name.toLowerCase().endsWith('.pdf');

            if (isExcel) {
                finalImage = await convertExcelToImage(item.originalFile);
            } else if (isPdf) {
                finalImage = await convertPdfToImage(item.originalFile);
            } else if (!finalImage.type.startsWith('image/')) {
                throw new Error('Unsupported file format');
            }

            if (!finalImage) throw new Error('Conversion failed');

            // Compress the image before OCR and upload
            const options = {
                maxSizeMB: 2, // Max 2MB to preserve print quality
                maxWidthOrHeight: 2500, // Supports up to A4 300 DPI (approx 2480px width)
                useWebWorker: true,
                initialQuality: 0.9, // Higher initial quality for text readability
            };
            try {
                const compressedBlob = await imageCompression(finalImage, options);
                finalImage = new File([compressedBlob], finalImage.name, { type: finalImage.type });
            } catch (compressionError) {
                console.error('Compression failed for bulk upload:', compressionError);
            }

            const previewUrl = URL.createObjectURL(finalImage);

            updateStatus({ status: 'ocr', processedImage: finalImage, previewUrl });

            // OCR phase
            const worker = await Tesseract.createWorker(['eng', 'tha']);
            const ret = await worker.recognize(finalImage);
            await worker.terminate();

            const extractedHn = extractHnFromText(ret.data.text, item.originalFile.name);
            const matchedPatient = activeQueue.find(p => p.hn === extractedHn) || null;

            updateStatus({
                status: 'ready',
                extractedHn,
                matchedPatient
            });

        } catch (error: unknown) {
            updateStatus({ status: 'error', errorMsg: (error as Error).message || 'Processing failed' });
        }
    };

    const processAllFiles = async (newFiles: ProcessedFile[]) => {
        setIsProcessing(true);
        // Process sequentially or batch to avoid blocking UI / high memory
        for (const file of newFiles) {
            if (file.status === 'pending') {
                await processFile(file);
            }
        }
        setIsProcessing(false);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newItems: ProcessedFile[] = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            originalFile: file,
            processedImage: null,
            status: 'pending',
            extractedHn: null,
            matchedPatient: null,
            previewUrl: undefined
        }));

        setFiles(prev => [...prev, ...newItems]);
        processAllFiles(newItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeQueue]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        }
    });

    const updatePatientMatch = (fileId: string, patientHn: string) => {
        const patient = activeQueue.find(p => p.hn === patientHn) || null;
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, matchedPatient: patient, extractedHn: patientHn } : f));
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
            return prev.filter(f => f.id !== id);
        });
    };

    const handleUploadAll = async () => {
        const readyFiles = files.filter(f => f.status === 'ready' && f.matchedPatient);
        if (readyFiles.length === 0) {
            toast.error('ไม่มีไฟล์ที่พร้อมอัปโหลด (ต้องระบุผู้ป่วยให้ครบต้วน)');
            return;
        }

        setIsUploading(true);
        let successCount = 0;

        for (const file of readyFiles) {
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'uploading' } : f));
            try {
                const formData = new FormData();
                if (!file.processedImage) throw new Error('Missing processed image');

                formData.append('file', file.processedImage);
                formData.append('hn', file.matchedPatient!.hn);
                formData.append('patientName', `${file.matchedPatient!.name} ${file.matchedPatient!.surname || ''}`.trim());

                const res = await fetch('/api/lab/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error('Upload failed');

                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'success' } : f));
                successCount++;
            } catch (err: unknown) {
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', errorMsg: (err as Error).message } : f));
            }
        }

        setIsUploading(false);
        if (successCount > 0) {
            toast.success(`อัปโหลดสำเร็จ ${successCount} รายการ`);
            onSuccess();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="bg-white dark:bg-[#1F2937] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">อัปโหลดผลตรวจแบบกลุ่ม (Bulk Import)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            อัปโหลดไฟล์ (PDF/Excel/รูปภาพ) พร้อมกันหลายไฟล์ ระบบจะแปลงเป็นภาพและอ่าน HN ให้อัตโนมัติ
                        </p>
                    </div>
                    <button onClick={handleClose} disabled={isProcessing || isUploading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6 space-y-6 flex flex-col">
                    {/* Upload Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer
                            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1F2937] hover:bg-gray-100 dark:hover:bg-gray-800'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <Upload className={`w-12 h-12 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">คลิก หรือ ลากไฟล์ลงที่นี่</p>
                        <p className="text-sm text-gray-500 mt-1">รองรับไฟล์ PDF, Excel, และรูปภาพ (JPG, PNG)</p>
                    </div>

                    {/* Files List */}
                    {files.length > 0 && (
                        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-y-auto flex flex-col min-h-[300px]">
                            <table className="w-full text-left text-sm whitespace-nowrap relative">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">ไฟล์</th>
                                        <th className="px-6 py-3 font-semibold w-[30%]">ผู้ป่วย (อิงจาก HN)</th>
                                        <th className="px-6 py-3 font-semibold w-32 text-center">สถานะ</th>
                                        <th className="px-6 py-3 font-semibold w-16 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {files.map(file => (
                                        <tr key={file.id} className="bg-white dark:bg-[#1F2937] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 relative overflow-hidden group border border-gray-200 dark:border-gray-700">
                                                        {file.previewUrl ? (
                                                            <>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                                <div
                                                                    className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
                                                                    onClick={() => setPreviewImage(file.previewUrl || null)}
                                                                    title="คลิกเพื่อดูภาพเต็ม"
                                                                >
                                                                    <Eye className="w-4 h-4 text-white" />
                                                                </div>
                                                            </>
                                                        ) : file.processedImage ? (
                                                            <ImageIcon className="w-5 h-5 text-indigo-500" />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="max-w-[200px] truncate" title={file.originalFile.name}>
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{file.originalFile.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {file.extractedHn ? `พบ HN: ${file.extractedHn}` : 'กำลังวิเคราะห์...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <CustomSelect
                                                    value={file.matchedPatient?.hn || ''}
                                                    onChange={(value) => updatePatientMatch(file.id, value)}
                                                    options={[
                                                        { value: '', label: '-- ระบุผู้ป่วย (ไม่พบ HN) --' },
                                                        ...activeQueue.map(p => ({
                                                            value: p.hn,
                                                            label: `${p.name} ${p.surname} (HN: ${p.hn})`
                                                        }))
                                                    ]}
                                                    placeholder="-- ระบุผู้ป่วย (ไม่พบ HN) --"
                                                    disabled={file.status === 'uploading' || file.status === 'success'}
                                                    className="w-full text-sm"
                                                />
                                                {!file.matchedPatient && file.status === 'ready' && (
                                                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> กรุณาเลือกผู้ป่วย
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {file.status === 'pending' || file.status === 'converting' || file.status === 'ocr' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-xs font-medium">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {file.status === 'ocr' ? 'กำลังอ่านข้อความ' : 'กำลังแปลงไฟล์'}
                                                    </span>
                                                ) : file.status === 'success' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3.5 h-3.5" /> สำเร็จ
                                                    </span>
                                                ) : file.status === 'error' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full text-xs font-medium" title={file.errorMsg}>
                                                        <AlertTriangle className="w-3.5 h-3.5" /> ล้มเหลว
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                                                        พร้อม
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    disabled={file.status === 'uploading'}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-500">
                        {files.filter(f => f.status === 'ready' && f.matchedPatient).length} / {files.length} รายการที่พร้อมอัปโหลด
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isUploading}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleUploadAll}
                            disabled={isProcessing || isUploading || files.length === 0 || files.filter(f => f.status === 'ready' && f.matchedPatient).length === 0}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" /> อัปโหลดทั้งหมด
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden container for Excel-to-image rendering */}
            <div ref={excelRenderRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }} />

            {/* Lightbox for Image Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] p-4 flex flex-col items-center justify-center">
                        <button
                            className="absolute -top-4 -right-4 p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(null);
                            }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImage}
                            alt="Full Preview"
                            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Confirm Close Modal */}
            <ConfirmModal
                isOpen={isConfirmCloseOpen}
                onClose={() => setIsConfirmCloseOpen(false)}
                onConfirm={forceClose}
                title="ยืนยันการยกเลิก"
                description="คุณต้องการยกเลิกการทำงานและปิดหน้าต่างใช่หรือไม่? ระบบกำลังทำงานอยู่และอาจส่งผลให้ข้อมูลสูญหาย"
                confirmText="ยืนยัน ยกเลิกและปิด"
                cancelText="ทำต่อ"
                variant="danger"
            />
        </div>
    );
}
