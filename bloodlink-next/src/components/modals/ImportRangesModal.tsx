'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createWorker, PSM } from 'tesseract.js';
import Papa from 'papaparse';
import { X, Upload, FileText, Image as ImageIcon, Loader2, Check, AlertCircle, FileType } from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
    'cholesterol': 'cholesterol',
    'triglyceride': 'triglyceride', 'trig': 'triglyceride',
    'hdl': 'hdl', 'hdl-c': 'hdl',
    'ldl': 'ldl', 'ldl-c': 'ldl',
    'creatinine': 'creatinine', 'cr': 'creatinine',
    'gfr': 'gfr', 'egfr': 'gfr',
    'bun': 'bun',
    'sodium': 'sodium', 'na': 'sodium',
    'potassium': 'potassium', 'k': 'potassium',
    'chloride': 'chloride', 'cl': 'chloride',
    'bicarbonate': 'bicarbonate', 'co2': 'bicarbonate',
    'hba1c': 'hba1c', 'a1c': 'hba1c',
    'glucose': 'glucose', 'fbs': 'glucose',
    'sugar': 'glucose',
};

// --- Helper Functions (Pure) ---

const mapToKey = (name: string): string | null => {
    const lower = name.toLowerCase();
    for (const [keyText, internalKey] of Object.entries(TEST_KEY_MAPPING)) {
        if (lower.includes(keyText)) return internalKey;
    }
    return null;
};

// Heuristic to clean common OCR errors in numbers
const cleanOCRNumber = (str: string): number | null => {
    if (!str) return null;
    let clean = str.trim();

    // Remove noise chars that might be attached
    clean = clean.replace(/[^\d\.\-OoIlS]/g, '');

    // Replace common confusions
    clean = clean.replace(/[Oo]/g, '0');
    clean = clean.replace(/[lI|]/g, '1');
    clean = clean.replace(/[S]/g, '5');

    // Fix multiple dots e.g. 5..7 -> 5.7
    clean = clean.replace(/\.{2,}/g, '.');

    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
};

const extractUnit = (line: string): { unit: string | null, remainingText: string } => {
    let text = line.trim();
    let foundUnit: string | null = null;

    const exp3Regex = /([x×]?\s*10\s*[\^]?\s*3)(\s*[\/|]\s*(uL|mm3|mcL|L))?/i;
    const exp6Regex = /([x×]?\s*10\s*[\^]?\s*6)(\s*[\/|]\s*(uL|mm3|mcL|L))?/i;

    if (exp3Regex.test(text)) {
        const match = text.match(exp3Regex);
        foundUnit = '10^3/uL';
        if (match && match[2]) {
            foundUnit = `10^3${match[2].replace(/\s*[\/|]\s*/, '/')}`;
        }
        text = text.replace(exp3Regex, '');
    } else if (exp6Regex.test(text)) {
        const match = text.match(exp6Regex);
        foundUnit = '10^6/uL';
        if (match && match[2]) {
            foundUnit = `10^6${match[2].replace(/\s*[\/|]\s*/, '/')}`;
        }
        text = text.replace(exp6Regex, '');
    } else {
        const stdUnits = [
            'g/dL', 'mg/dL', 'fL', 'pg', 'mm/hr', 'mmol/L', 'mEq/L', 'U/L', 'ng/mL', 'ug/dL', 'mcg/dL', '%'
        ];
        stdUnits.sort((a, b) => b.length - a.length);

        for (const u of stdUnits) {
            const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`([\\d\\s]|^)(${esc})\\b|\\b(${esc})\\b`, 'i');

            if (re.test(text)) {
                foundUnit = u;
                text = text.replace(re, '$1');
                break;
            }
        }
    }

    if (!foundUnit) {
        const tokens = text.split(/\s+/);
        if (tokens.length > 0) {
            const lastToken = tokens[tokens.length - 1];
            if (lastToken.includes('/') || lastToken.includes('%')) {
                const match = lastToken.match(/^([\d\.\-\s]*)(.*)$/);
                if (match && match[2] && (match[2].includes('/') || match[2].includes('%'))) {
                    foundUnit = match[2];
                    tokens.pop();
                    if (match[1]) tokens.push(match[1]);
                    text = tokens.join(' ');
                }
            }
        }
    }

    return { unit: foundUnit, remainingText: text };
};

const parseOCRText = (text: string): ParsedRange[] => {
    const lines = text.split('\n');
    const data: ParsedRange[] = [];

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (!cleanLine) return;

        // Space normalization
        cleanLine = cleanLine.replace(/(\d+),(\d+)/g, '$1.$2');
        cleanLine = cleanLine.replace(/(\d+)\s+\.\s+(\d+)/g, '$1.$2');

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
            let min: number | null = null;
            let max: number | null = null;

            const { unit, remainingText } = extractUnit(cleanLine);

            // Regex now captures "potential number strings" which we then clean
            // Allows for chars like O, S, l in the number format
            // Pattern 1: X - Y
            const rangeMatchRegex = /([\d\.\-OolIS]+)\s*[-–—~]\s*([\d\.\-OolIS]+)/;
            const rangeMatch = remainingText.match(rangeMatchRegex);

            // Pattern 2: < X
            const lessThanRegex = /<\s*([\d\.\-OolIS]+)/;
            const lessThanMatch = remainingText.match(lessThanRegex);

            // Pattern 3: > X
            const greaterThanRegex = />\s*([\d\.\-OolIS]+)/;
            const greaterThanMatch = remainingText.match(greaterThanRegex);

            if (rangeMatch) {
                min = cleanOCRNumber(rangeMatch[1]);
                max = cleanOCRNumber(rangeMatch[2]);
            } else if (lessThanMatch) {
                min = 0;
                max = cleanOCRNumber(lessThanMatch[1]);
            } else if (greaterThanMatch) {
                min = cleanOCRNumber(greaterThanMatch[1]);
                max = null;
            } else {
                // Fallback: Find all sequences that look like numbers
                const numberCandidates = remainingText.match(/([\d\.\-OolIS]+)/g);
                if (numberCandidates && numberCandidates.length >= 2) {
                    const nums = numberCandidates.map(n => cleanOCRNumber(n)).filter(n => n !== null) as number[];
                    if (nums.length >= 2) {
                        const last = nums[nums.length - 1];
                        const secondLast = nums[nums.length - 2];
                        if (secondLast <= last) {
                            min = secondLast;
                            max = last;
                        } else {
                            min = Math.min(secondLast, last);
                            max = Math.max(secondLast, last);
                        }
                    }
                }
            }

            if (!data.find(d => d.test_key === foundKey)) {
                // Only add if we found at least one value or a unit
                // This prevents adding empty rows if OCR failed to find numbers
                if (min !== null || max !== null || unit) {
                    data.push({
                        test_key: foundKey,
                        test_name: foundName,
                        min_value: min ?? 0,
                        max_value: max ?? 0,
                        unit: unit,
                        original_text: cleanLine
                    });
                }
            }
        }
    });
    return data;
};

const preprocessImage = (file: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Increase scale factor for better OCR resolution (4x for small text)
            const scaleFactor = 4;
            canvas.width = img.width * scaleFactor;
            canvas.height = img.height * scaleFactor;

            if (ctx) {
                // Fill white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw image scaled
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Get image data for pixel manipulation
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Binarization (Thresholding) logic
                // Converts image to pure black and white to remove noise and sharpen text
                const threshold = 180; // value between 0-255, adjust based on document brightness

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Simple grayscale: (R + G + B) / 3
                    // Better grayscale (luminance): 0.299R + 0.587G + 0.114B
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                    // Apply threshold
                    const val = gray > threshold ? 255 : 0;

                    data[i] = val;     // R
                    data[i + 1] = val; // G
                    data[i + 2] = val; // B
                }

                ctx.putImageData(imageData, 0, 0);
            }
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = URL.createObjectURL(file);
    });
};

export function ImportRangesModal({ isOpen, onClose, onConfirm }: ImportRangesModalProps) {
    const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
    const [parsedData, setParsedData] = useState<ParsedRange[]>([]);
    const [progress, setProgress] = useState<string>('');

    const processCSV = useCallback((file: File) => {
        setProgress('กำลังอ่านไฟล์ CSV...');
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const data: ParsedRange[] = [];
                (results.data as unknown[]).forEach((r) => {
                    const row = r as Record<string, string>;
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
    }, []);

    const processPDF = useCallback(async (file: File) => {
        setProgress('กำลังอ่านไฟล์ PDF...');

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;

            const totalPages = pdf.numPages;
            const allParsedData: ParsedRange[] = [];

            const worker = await createWorker(['eng', 'tha']);
            await worker.setParameters({
                tessedit_pageseg_mode: PSM.AUTO,
            });

            for (let i = 1; i <= totalPages; i++) {
                setProgress(`กำลังประมวลผลหน้าที่ ${i}/${totalPages}...`);
                const page = await pdf.getPage(i);

                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) continue;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any).promise;

                // Convert canvas to blob for preprocessing
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) continue;

                const processedImageUrl = await preprocessImage(blob);
                const { data: { text } } = await worker.recognize(processedImageUrl);

                const pageData = parseOCRText(text);

                pageData.forEach(item => {
                    allParsedData.push(item);
                });
            }

            await worker.terminate();

            if (allParsedData.length > 0) {
                setParsedData(allParsedData);
                setStep('preview');
            } else {
                toast.error('ไม่พบข้อมูลแล็บที่รู้จักจาก PDF');
                setStep('upload');
            }

        } catch (error) {
            console.error('PDF Error:', error);
            toast.error('ไม่สามารถอ่านไฟล์ PDF ได้');
            setStep('upload');
        }
    }, []);

    const processImage = useCallback(async (file: File) => {
        setProgress('กำลังกำหนดค่า OCR (รองรับภาษาไทย)...');

        const worker = await createWorker(['eng', 'tha']);

        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });

        setProgress('กำลังปรับปรุงคุณภาพรูปภาพ (Scaling)...');
        const imageUrl = await preprocessImage(file);

        setProgress('กำลังสแกนข้อความจากรูปภาพ...');
        const { data: { text } } = await worker.recognize(imageUrl);

        await worker.terminate();

        const data = parseOCRText(text);

        if (data.length > 0) {
            setParsedData(data);
            setStep('preview');
        } else {
            toast.error('ไม่พบข้อมูลแล็บที่รู้จัก อาจเป็นเพราะแสงสว่างไม่พอหรือฟอร์แมตไม่ตรง');
            setStep('upload');
        }
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setStep('processing');
        setProgress('กำลังเตรียมไฟล์...');

        try {
            if (file.type.includes('image')) {
                await processImage(file);
            } else if (file.type.includes('pdf')) {
                await processPDF(file);
            } else if (file.type.includes('csv') || file.type.includes('spreadsheet')) {
                await processCSV(file);
            } else {
                toast.error('รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG), PDF หรือ CSV เท่านั้น');
                setStep('upload');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
            setStep('upload');
        }
    }, [processImage, processPDF, processCSV]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1
    });

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
                            รองรับไฟล์ PDF, รูปภาพ (OCR) และ CSV
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
                                รองรับไฟล์ PDF, รูปถ่ายใบผลแล็บ (.png, .jpg) หรือไฟล์ Excel (.csv)
                                ระบบจะพยายามอ่านค่า Min/Max ให้อัตโนมัติ
                            </p>
                            <div className="flex gap-4 mt-6 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><FileType className="w-4 h-4" /> PDF</span>
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
