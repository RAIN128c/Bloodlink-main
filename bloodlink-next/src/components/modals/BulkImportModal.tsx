'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

interface ParsedPatient {
    hn: string;
    name: string;
    surname: string;
    gender: string;
    age: string;
    bloodType: string;
    disease?: string;
    allergy?: string;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
}

export function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedPatient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): ParsedPatient[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        // Skip header row
        const dataRows = lines.slice(1);

        return dataRows.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            return {
                hn: values[0] || '',
                name: values[1] || '',
                surname: values[2] || '',
                gender: values[3] || '',
                age: values[4] || '',
                bloodType: values[5] || '',
                disease: values[6] || '',
                allergy: values[7] || '',
            };
        }).filter(p => p.hn && p.name); // Filter out empty rows
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setResult(null);
        setIsParsing(true);

        try {
            const text = await selectedFile.text();
            const parsed = parseCSV(text);

            if (parsed.length === 0) {
                setError('ไม่พบข้อมูลในไฟล์ หรือรูปแบบไม่ถูกต้อง');
                setParsedData([]);
            } else {
                setParsedData(parsed);
            }
        } catch (err) {
            setError('ไม่สามารถอ่านไฟล์ได้');
            setParsedData([]);
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
            // Trigger file input change
            const dt = new DataTransfer();
            dt.items.add(droppedFile);
            if (fileInputRef.current) {
                fileInputRef.current.files = dt.files;
                fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }, []);

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/patients/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patients: parsedData }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Import failed');
            }

            setResult(data);

            if (data.success > 0) {
                onImportComplete();
            }
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้า');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm font-[family-name:var(--font-kanit)] modal-backdrop">
            <div className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[700px] max-h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col modal-content">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                        นำเข้าข้อมูลผู้ป่วย
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* File Upload Area */}
                    {!result && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                {file ? file.name : 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                รองรับไฟล์ CSV (คอลัมน์: HN, Name, Surname, Gender, Age, BloodType, Disease, Allergy)
                            </p>
                        </div>
                    )}

                    {/* Parsing Indicator */}
                    {isParsing && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังอ่านไฟล์...</span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && !result && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                ตัวอย่างข้อมูล ({parsedData.length} รายการ)
                            </h3>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">HN</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">ชื่อ</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">นามสกุล</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">เพศ</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">อายุ</th>
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">กรุ๊ปเลือด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {parsedData.slice(0, 10).map((patient, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-3 py-2 text-gray-900 dark:text-white font-mono">{patient.hn}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{patient.name}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{patient.surname}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{patient.gender}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{patient.age}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{patient.bloodType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 10 && (
                                    <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">
                                        และอีก {parsedData.length - 10} รายการ...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${result.failed === 0
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                }`}>
                                <CheckCircle className={`w-6 h-6 ${result.failed === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        นำเข้าสำเร็จ {result.success} รายการ
                                    </p>
                                    {result.failed > 0 && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            ล้มเหลว {result.failed} รายการ
                                        </p>
                                    )}
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                                    <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-sm font-medium text-red-700 dark:text-red-400">
                                        รายการที่ผิดพลาด
                                    </div>
                                    <div className="max-h-[150px] overflow-y-auto divide-y divide-red-100 dark:divide-red-900">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                                                แถว {err.row}: {err.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        {result ? 'ปิด' : 'ยกเลิก'}
                    </button>
                    {!result && parsedData.length > 0 && (
                        <button
                            onClick={handleImport}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            นำเข้า {parsedData.length} รายการ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
