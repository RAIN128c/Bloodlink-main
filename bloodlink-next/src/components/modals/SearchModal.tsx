'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [digits, setDigits] = useState<string[]>(Array(9).fill(''));
    const [error, setError] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setDigits(Array(9).fill(''));
            setError(false);
            // Focus first input after a short delay to allow render
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newDigits = [...digits];
        // Take only the last character if multiple entered (e.g. paste) or just the value
        newDigits[index] = value.slice(-1);
        setDigits(newDigits);
        setError(false);

        // Auto move to next input if value entered
        if (value && index < 8) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            handleSearch();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 9).replace(/\D/g, '');
        if (pastedData) {
            const newDigits = [...digits];
            pastedData.split('').forEach((char, i) => {
                if (i < 9) newDigits[i] = char;
            });
            setDigits(newDigits);
            // Focus the empty input after the pasted content or the last one
            const nextFocus = Math.min(pastedData.length, 8);
            inputRefs.current[nextFocus]?.focus();
        }
    };

    const handleSearch = () => {
        const hn = digits.join('');
        if (hn.length !== 9) {
            setError(true);
            return;
        }

        // Ideally here we would check if patient exists, for now we assume yes or handle 404 on page
        // Based on other files, route is /patients/[hn] (root level now) or /dashboard/patients/[hn] 
        // Recent restructuring moved patients to /patients/[hn]
        router.push(`/patients/${hn}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-[family-name:var(--font-kanit)]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] modal-backdrop"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white dark:bg-[#1F2937] w-[calc(100%-2rem)] sm:w-[450px] md:w-[500px] mx-4 rounded-[24px] p-5 sm:p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] relative z-10 modal-content border border-transparent dark:border-gray-700">
                {/* Close Button (Optional, not in legacy but good UX) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1F2937] dark:text-white mb-2">ค้นหา รหัสโรงพยาบาล(HN)</h2>
                    <p className="text-[#6B7280] dark:text-gray-400 text-[14px] sm:text-[16px]">ใส่รหัสโรงพยาบาล(HN) ของท่านเพื่อตรวจสอบผลตรวจเลือด</p>
                </div>

                <div className="flex justify-center gap-1 sm:gap-2 mb-2">
                    {digits.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-8 h-10 sm:w-10 sm:h-12 border rounded-lg text-center text-lg sm:text-xl font-bold bg-white dark:bg-[#374151] text-[#374151] dark:text-white focus:outline-none focus:ring-2 transition-all shadow-sm
                                ${error ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/30' : 'border-[#E5E7EB] dark:border-gray-600 focus:border-[#6366F1] focus:ring-[#E0E7FF] dark:focus:ring-indigo-500/30'}
                            `}
                        />
                    ))}
                </div>

                {error && (
                    <div className="text-red-500 dark:text-red-400 text-sm text-center mb-6 font-medium animate-pulse">
                        กรุณากรอกรหัส HN ให้ครบ 9 หลัก
                    </div>
                )}

                {!error && <div className="mb-8"></div>} {/* Spacer if no error */}

                <div className="text-center text-xs sm:text-sm text-[#6B7280] dark:text-gray-400 mb-6 sm:mb-8">
                    หากไม่พบรหัสโรงพยาบาลของคุณ <a href="#" className="text-[#3B82F6] dark:text-blue-400 hover:underline font-medium">โปรดติดต่อเรา</a>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 rounded-full bg-[#60A5FA] dark:bg-blue-600 text-white font-medium hover:bg-[#3B82F6] dark:hover:bg-blue-500 transition-all shadow-[0_4px_6px_-1px_rgba(96,165,250,0.4)] hover:shadow-[0_6px_8px_-1px_rgba(96,165,250,0.5)] active:translate-y-0.5 w-[120px]"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSearch}
                        className="px-8 py-2.5 rounded-full bg-[#60A5FA] dark:bg-blue-600 text-white font-medium hover:bg-[#3B82F6] dark:hover:bg-blue-500 transition-all shadow-[0_4px_6px_-1px_rgba(96,165,250,0.4)] hover:shadow-[0_6px_8px_-1px_rgba(96,165,250,0.5)] active:translate-y-0.5 w-[120px]"
                    >
                        ค้นหา
                    </button>
                </div>
            </div>
        </div>
    );
}
