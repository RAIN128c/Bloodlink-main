'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Image as ImageIcon, AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import imageCompression from 'browser-image-compression';

interface LabUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    patient: {
        hn: string;
        name: string;
        surname: string;
    };
}

// Traffic lights removed completely


export function LabUploadModal({ isOpen, onClose, onSuccess, patient }: LabUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelRenderRef = useRef<HTMLDivElement>(null);

    // Convert Excel ArrayBuffer to PNG File via html2canvas
    const convertExcelToImage = useCallback(async (excelFile: File): Promise<File | null> => {
        try {
            setIsConverting(true);
            const buffer = await excelFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];

            // Check if the sheet is completely empty
            if (!worksheet || !worksheet['!ref']) {
                throw new Error("ไม่พบข้อมูลในไฟล์ Excel (Empty Sheet)");
            }

            const htmlString = XLSX.utils.sheet_to_html(worksheet, { editable: false });

            // Create a temporary container for rendering
            const container = excelRenderRef.current;
            if (!container) return null;

            container.innerHTML = `
                <div style="padding:24px;background:#fff;font-family:'Segoe UI',sans-serif;min-width:600px;">
                    <h3 style="margin:0 0 12px;font-size:14px;color:#374151;">📄 ${excelFile.name}</h3>
                    <style>
                        table { border-collapse:collapse; width:100%; font-size:12px; }
                        th, td { border:1px solid #D1D5DB; padding:6px 10px; text-align:left; }
                        th { background:#F3F4F6; font-weight:600; color:#374151; }
                        tr:nth-child(even) { background:#F9FAFB; }
                    </style>
                    ${htmlString}
                </div>
            `;

            // Wait for DOM paint
            await new Promise((r) => setTimeout(r, 200));

            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
            });

            // Cleanup
            container.innerHTML = '';

            // Convert canvas to File
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return null;

            const pngName = excelFile.name.replace(/\.(xlsx?|xls)$/i, '.png');
            return new File([blob], pngName, { type: 'image/png' });
        } catch (err) {
            console.error('Excel conversion error:', err);
            toast.error('ไม่สามารถแปลงไฟล์ Excel ได้');
            return null;
        } finally {
            setIsConverting(false);
        }
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const excelTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];
        const isExcel = excelTypes.includes(selectedFile.type) || /\.(xlsx?|xls)$/i.test(selectedFile.name);

        if (!validTypes.includes(selectedFile.type) && !isExcel) {
            toast.error('รองรับเฉพาะไฟล์ JPEG, PNG, WebP, PDF, Excel เท่านั้น');
            return;
        }

        // Validate size (20MB)
        if (selectedFile.size > 20 * 1024 * 1024) {
            toast.error('ไฟล์ต้องมีขนาดไม่เกิน 20MB');
            return;
        }

        // If Excel, convert to PNG first
        if (isExcel) {
            const pngFile = await convertExcelToImage(selectedFile);
            if (!pngFile) {
                toast.error('แปลงไฟล์ Excel ไม่สำเร็จ กรุณาลองอีกครั้ง');
                return;
            }
            setFile(pngFile);
            // Generate preview
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(pngFile);
            toast.success('แปลงไฟล์ Excel เป็นรูปภาพเรียบร้อย');
            return;
        }

        setFile(selectedFile);

        // Preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error('กรุณาเลือกไฟล์เพื่ออัปโหลด');
            return;
        }

        setIsUploading(true);
        try {
            let processedFile = file;

            // Compress image if it's not a PDF
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 2, // Max 2MB to preserve print quality
                    maxWidthOrHeight: 2500, // Supports up to A4 300 DPI (approx 2480px width)
                    useWebWorker: true,
                    initialQuality: 0.9, // Higher initial quality for text readability
                };
                try {
                    toast.info('กำลังบีบอัดรูปภาพ...');
                    const compressedBlob = await imageCompression(file, options);
                    // Ensure the compressed file has the original name
                    processedFile = new File([compressedBlob], file.name, { type: file.type });
                } catch (compressionError) {
                    console.error('Compression failed, using original file:', compressionError);
                }
            }

            const formData = new FormData();
            formData.append('file', processedFile);
            formData.append('hn', patient.hn);
            formData.append('patientName', `${patient.name} ${patient.surname || ''}`.trim());

            const res = await fetch('/api/lab/upload', {
                method: 'POST',
                body: formData,
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(text || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            toast.success('อัปโหลดผลตรวจเรียบร้อย');
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">อัปโหลดผลตรวจ</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            HN: {patient.hn} — {patient.name} {patient.surname}
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ไฟล์ผลตรวจ (PDF / รูปภาพ / Excel)
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {!file ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isConverting}
                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                        <span className="text-sm text-blue-500">กำลังแปลงไฟล์ Excel เป็นรูปภาพ...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">คลิกเพื่อเลือกไฟล์</span>
                                        <span className="text-xs text-gray-400">PDF, JPEG, PNG, WebP, Excel (สูงสุด 20MB)</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg mb-3" />
                                ) : (
                                    <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <FileText className="w-8 h-8 text-red-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => { setFile(null); setPreview(null); fileInputRef.current?.click(); }}
                                    className="text-sm text-blue-500 hover:text-blue-600 transition"
                                >
                                    เปลี่ยนไฟล์
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Traffic Light Tagging - Removed per user request */}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isUploading}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                กำลังอัปโหลด...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                อัปโหลดผลตรวจ
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Hidden container for Excel-to-image rendering */}
            <div
                ref={excelRenderRef}
                style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}
            />
        </div>
    );
}
