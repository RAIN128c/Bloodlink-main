'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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

type ResultSummary = 'Normal' | 'Abnormal' | 'Critical';

const SUMMARY_OPTIONS: { value: ResultSummary; label: string; icon: typeof CheckCircle; color: string; bgColor: string; borderColor: string }[] = [
    { value: 'Normal', label: '🟢 ปกติ', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-300 dark:border-emerald-600' },
    { value: 'Abnormal', label: '🟡 ผิดปกติ', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', borderColor: 'border-amber-300 dark:border-amber-600' },
    { value: 'Critical', label: '🔴 วิกฤต', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-300 dark:border-red-600' },
];

export function LabUploadModal({ isOpen, onClose, onSuccess, patient }: LabUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [resultSummary, setResultSummary] = useState<ResultSummary | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error('รองรับเฉพาะไฟล์ JPEG, PNG, WebP, PDF เท่านั้น');
            return;
        }

        // Validate size (20MB)
        if (selectedFile.size > 20 * 1024 * 1024) {
            toast.error('ไฟล์ต้องมีขนาดไม่เกิน 20MB');
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
        if (!file || !resultSummary) {
            toast.error('กรุณาเลือกไฟล์และระบุสถานะผลตรวจ');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('hn', patient.hn);
            formData.append('patientName', `${patient.name} ${patient.surname}`);
            formData.append('resultSummary', resultSummary);

            const res = await fetch('/api/lab/upload', {
                method: 'POST',
                body: formData,
            });

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
        setResultSummary(null);
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
                            ไฟล์ผลตรวจ (PDF / รูปภาพ)
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {!file ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                            >
                                <Upload className="w-10 h-10 text-gray-400" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">คลิกเพื่อเลือกไฟล์</span>
                                <span className="text-xs text-gray-400">PDF, JPEG, PNG, WebP (สูงสุด 20MB)</span>
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

                    {/* Traffic Light Tagging */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            สรุปผลตรวจ <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {SUMMARY_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setResultSummary(option.value)}
                                    className={`
                                        flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                                        ${resultSummary === option.value
                                            ? `${option.bgColor} ${option.borderColor} ${option.color} ring-2 ring-offset-1 ring-current`
                                            : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                        }
                                    `}
                                >
                                    <span className="text-xl">{option.label.split(' ')[0]}</span>
                                    <span className="text-xs font-medium">{option.label.split(' ')[1]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
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
                        disabled={!file || !resultSummary || isUploading}
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
        </div>
    );
}
