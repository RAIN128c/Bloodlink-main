'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createWorker, PSM } from 'tesseract.js';
import Papa from 'papaparse';
import { X, Upload, FileText, Image as ImageIcon, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedRange {
    test_key: string;
    test_name: string;
    min_value: number | null;
    max_value: number | null;
    unit: string | null;
    original_text?: string; // For debugging
}

interface ImportRangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ParsedRange[]) => Promise<void>;
}

// Mapping Dictionary: Text found in OCR -> Internal Key
const TEST_KEY_MAPPING: Record<string, string> = {
    'wbc': 'wbc', 'white blood': 'wbc', 'leukocyte': 'wbc',
    'rbc': 'rbc', 'red blood': 'rbc', 'erythrocyte': 'rbc',
    'hb': 'hb', 'hemoglobin': 'hb', 'hgb': 'hb',
    'hct': 'hct', 'hematocrit': 'hct',
    'mcv': 'mcv',
    'mch': 'mch',
    'mchc': 'mchc',
    'plt': 'plt', 'platelet': 'plt', 'thrombocyte': 'plt',
    'neutrophil': 'neutrophil', 'neu': 'neutrophil', 'poly': 'neutrophil', 'pmn': 'neutrophil',
    'lymphocyte': 'lymphocyte', 'lym': 'lymphocyte',
    'monocyte': 'monocyte', 'mono': 'monocyte',
    'eosinophil': 'eosinophil', 'eos': 'eosinophil',
    'basophil': 'basophil', 'baso': 'basophil',
    'band': 'band', 'stab': 'band',
    'rdw': 'rdw', 'rdw-cv': 'rdw', 'rdw-sd': 'rdw',
    'mpv': 'mpv',
    'pdw': 'pdw',
    'pct': 'pct',
    'retic': 'retic', 'reticulocyte': 'retic',
    'nrbc': 'nrbc', 'nucleated': 'nrbc',
    'blast': 'blast',
    'atypical': 'atypical', 'alc': 'atypical',
    // Add more as needed
};

export function ImportRangesModal({ isOpen, onClose, onConfirm }: ImportRangesModalProps) {
    const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
    const [parsedData, setParsedData] = useState<ParsedRange[]>([]);
    const [progress, setProgress] = useState<string>('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setStep('processing');
        setProgress('กำลังเตรียมไฟล์...');

        try {
            if (file.type.includes('image')) {
                await processImage(file);
            } else if (file.type.includes('csv') || file.type.includes('spreadsheet')) {
                await processCSV(file);
            } else {
                toast.error('รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG) หรือ CSV เท่านั้น');
                setStep('upload');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
            setStep('upload');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    const processCSV = (file: File) => {
        setProgress('กำลังอ่านไฟล์ CSV...');
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const data: ParsedRange[] = [];
                results.data.forEach((row: any) => {
                    const name = row['Test'] || row['Name'] || row['Item'] || '';
                    const key = mapToKey(name);

                    if (key) {
                        data.push({
                            test_key: key,
                            test_name: name,
                            min_value: parseFloat(row['Min'] || row['Low'] || '0') || null,
                            max_value: parseFloat(row['Max'] || row['High'] || '0') || null,
                            unit: row['Unit'] || null
                        });
                    }
                });

                if (data.length > 0) {
                    setParsedData(data);
                    setStep('preview');
                } else {
                    toast.error('ไม่พบข้อมูลที่อ่านได้จากไฟล์ CSV');
                    setStep('upload');
                }
            },
            error: () => {
                toast.error('อ่านไฟล์ CSV ไม่สำเร็จ');
                setStep('upload');
            }
        });
    };

    const preprocessImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Upscale 2x
                const scaleFactor = 2;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                if (ctx) {
                    // Draw white background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Simple contrast filter
                    ctx.filter = 'contrast(1.2) brightness(1.05)';

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    // Helper: Extract Unit and return remaining text
    // This prevents numbers inside the unit (like 10^3) from being parsed as Range Min/Max
    const extractUnit = (line: string): { unit: string | null, remainingText: string } => {
        let text = line.trim();
        let foundUnit: string | null = null;

        // 1. Complex Units (High Priority uses Regex)
        // Matches 10^3, 10 3, x10^3, 103/uL variants
        // We use capturing group for the WHOLE match to replace it
        const exp3Regex = /([x×]?\s*10\s*[\^]?\s*3)(\s*[\/|]\s*(uL|mm3|mcL|L))?/i;
        const exp6Regex = /([x×]?\s*10\s*[\^]?\s*6)(\s*[\/|]\s*(uL|mm3|mcL|L))?/i;

        if (exp3Regex.test(text)) {
            const match = text.match(exp3Regex);
            foundUnit = '10^3/uL'; // Default to common form
            if (match && match[2]) { // If a specific /uL variant was found
                foundUnit = `10^3${match[2].replace(/\s*[\/|]\s*/, '/')}`;
            }
            text = text.replace(exp3Regex, ''); // Remove from text
        } else if (exp6Regex.test(text)) {
            const match = text.match(exp6Regex);
            foundUnit = '10^6/uL'; // Default to common form
            if (match && match[2]) { // If a specific /uL variant was found
                foundUnit = `10^6${match[2].replace(/\s*[\/|]\s*/, '/')}`;
            }
            text = text.replace(exp6Regex, '');
        } else {
            // 2. Standard Units (Case Insensitive)
            // List of units to check
            const stdUnits = [
                'g/dL', 'mg/dL', 'fL', 'pg', 'mm/hr', 'mmol/L', 'mEq/L', 'U/L', 'ng/mL', 'ug/dL', 'mcg/dL', '%'
            ];

            // Sort by length desc to match longest first
            stdUnits.sort((a, b) => b.length - a.length);

            for (const u of stdUnits) {
                const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Pattern: Word boundary OR attached to end of string/number
                const re = new RegExp(`([\\d\\s]|^)(${esc})\\b|\\b(${esc})\\b`, 'i');

                if (re.test(text)) {
                    foundUnit = u;
                    text = text.replace(re, '$1'); // $1 is the prefix (number or space) or empty.
                    break;
                }
            }
        }

        // 3. Generic Fallback: Check LAST token
        if (!foundUnit) {
            const tokens = text.split(/\s+/);
            if (tokens.length > 0) {
                const lastToken = tokens[tokens.length - 1];

                // Check for attached unit logic (e.g. 15.5%)
                if (lastToken.includes('/') || lastToken.includes('%')) {
                    // Try to separate number from unit
                    const match = lastToken.match(/^([\d\.\-\s]*)(.*)$/);
                    if (match && match[2] && (match[2].includes('/') || match[2].includes('%'))) {
                        // match[1] is the number part (maybe), match[2] is the unit part
                        // If match[1] exists, we keep it in text. We only remove match[2].

                        foundUnit = match[2];
                        // Replace the last token in the text with just the number part
                        // To be safe, just reconstruct text check

                        // Remove last token from tokens
                        tokens.pop();
                        // Add back the number part if it exists
                        if (match[1]) tokens.push(match[1]);

                        text = tokens.join(' ');
                    }
                }
            }
        }

        return { unit: foundUnit, remainingText: text };
    };

    const processImage = async (file: File) => {
        setProgress('กำลังกำหนดค่า OCR (รองรับภาษาไทย)...');

        const worker = await createWorker(['eng', 'tha']);

        // PSM 6 = Assume a single uniform block of text.
        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });

        setProgress('กำลังปรับปรุงคุณภาพรูปภาพ (Scaling)...');
        // Preprocess logic: Upscale + Contrast
        const imageUrl = await preprocessImage(file);

        setProgress('กำลังสแกนข้อความจากรูปภาพ...');
        const { data: { text } } = await worker.recognize(imageUrl);

        console.log('OCR Raw Text:', text);

        const lines = text.split('\n');
        const data: ParsedRange[] = [];

        lines.forEach(line => {
            let cleanLine = line.trim();
            if (!cleanLine) return;

            // OCR Normalization Fixes:
            cleanLine = cleanLine.replace(/(\d+),(\d+)/g, '$1.$2');
            cleanLine = cleanLine.replace(/(\d+)\s+\.\s+(\d+)/g, '$1.$2');

            // Find Key
            let foundKey = '';
            let foundName = '';
            const lowerLine = cleanLine.toLowerCase();

            for (const [keyText, internalKey] of Object.entries(TEST_KEY_MAPPING)) {
                if (lowerLine.includes(keyText)) {
                    foundKey = internalKey;
                    foundName = keyText.toUpperCase();
                    break;
                }
            }

            if (foundKey) {
                // Improved Logic v10: Extraction Strategy

                let min: number | null = null;
                let max: number | null = null;

                // 1. EXTRACT Unit first (remove it from line)
                const { unit, remainingText } = extractUnit(cleanLine);

                // 2. Parse Range from the REMAINING text
                // This prevents "10^3" from being seen as "10" and "3" by the number parser

                // First, check explicit hyphenated range
                const rangeMatchRegex = /(\d+\.?\d*)\s*[-–—~]\s*(\d+\.?\d*)/;
                const rangeMatch = remainingText.match(rangeMatchRegex);

                if (rangeMatch) {
                    min = parseFloat(rangeMatch[1]);
                    max = parseFloat(rangeMatch[2]);
                } else {
                    // Fallback: Find all numbers
                    const numbers = remainingText.match(/(\d+\.?\d*)/g);

                    if (numbers && numbers.length >= 2) {
                        const nums = numbers.map(n => parseFloat(n));

                        // Use LAST TWO numbers found
                        const last = nums[nums.length - 1];
                        const secondLast = nums[nums.length - 2];

                        // Sanity Check: min <= max
                        if (secondLast <= last) {
                            min = secondLast;
                            max = last;
                        } else {
                            min = Math.min(secondLast, last);
                            max = Math.max(secondLast, last);
                        }
                    }
                }

                // Improved Logic v11: Always push if key found, regardless of range success
                // This ensures items like 'Baso < 1' (which might fail regex) still show up for manual edit
                if (!data.find(d => d.test_key === foundKey)) {
                    data.push({
                        test_key: foundKey,
                        test_name: foundName,
                        min_value: min ?? 0,
                        max_value: max ?? 0,
                        unit: unit,
                        original_text: cleanLine // Keep original for debug
                    });
                }
            }
        });

        await worker.terminate();

        if (data.length > 0) {
            setParsedData(data);
            setStep('preview');
        } else {
            console.error('OCR Processed but no keys matched. Raw 5 lines:', lines.slice(0, 5));
            toast.error('ไม่พบข้อมูลแล็บที่รู้จัก อาจเป็นเพราะแสงสว่างไม่พอหรือฟอร์แมตไม่ตรง');
            setStep('upload');
        }
    };

    const mapToKey = (name: string): string | null => {
        const lower = name.toLowerCase();
        for (const [keyText, internalKey] of Object.entries(TEST_KEY_MAPPING)) {
            if (lower.includes(keyText)) return internalKey;
        }
        return null;
    };

    const handleConfirm = async () => {
        setProgress('กำลังบันทึกข้อมูล...');
        setStep('processing');
        await onConfirm(parsedData);
        onClose();
        setStep('upload');
    };

    const handleRemoveItem = (index: number) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditItem = (index: number, field: keyof ParsedRange, value: string) => {
        setParsedData(prev => prev.map((item, i) => {
            if (i !== index) return item;
            if (field === 'min_value' || field === 'max_value') {
                return { ...item, [field]: parseFloat(value) || 0 };
            }
            return { ...item, [field]: value };
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            นำเข้าค่าปกติอัตโนมัติ (Smart Import)
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            รองรับไฟล์รูปภาพ (OCR) และ CSV
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div
                            {...getRootProps()}
                            className={`border-3 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all
                                ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                รองรับรูปถ่ายใบผลแล็บ (.png, .jpg) หรือไฟล์ Excel (.csv)
                                ระบบจะพยายามอ่านค่า Min/Max ให้อัตโนมัติ
                            </p>
                            <div className="flex gap-4 mt-6 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Images</span>
                                <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> CSV</span>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white animate-pulse">{progress}</p>
                            <p className="text-sm text-gray-500 mt-2">กำลังประมวลผลด้วย AI...</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
                                <AlertCircle className="w-4 h-4" />
                                กรุณาตรวจสอบข้อมูลก่อนบันทึก ระบบ OCR อาจมีความผิดพลาดได้
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">รายการ (Detected)</th>
                                            <th className="px-4 py-3">Mapping Key</th>
                                            <th className="px-4 py-3 text-right">Min</th>
                                            <th className="px-4 py-3 text-right">Max</th>
                                            <th className="px-4 py-3">Unit</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {parsedData.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-2 font-medium">
                                                    <div>{item.test_name}</div>
                                                    <div className="text-[10px] text-gray-300 font-mono truncate max-w-[150px]" title={item.original_text}>{item.original_text}</div>
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{item.test_key}</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.min_value ?? ''}
                                                        onChange={(e) => handleEditItem(index, 'min_value', e.target.value)}
                                                        className="w-20 text-right p-1 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.max_value ?? ''}
                                                        onChange={(e) => handleEditItem(index, 'max_value', e.target.value)}
                                                        className="w-20 text-right p-1 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.unit ?? ''}
                                                        onChange={(e) => handleEditItem(index, 'unit', e.target.value)}
                                                        className="w-16 p-1 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {step === 'preview' && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={() => setStep('upload')}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                        >
                            เริ่มใหม่
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-indigo-500/20"
                        >
                            <Check className="w-4 h-4" />
                            บันทึกข้อมูล ({parsedData.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
