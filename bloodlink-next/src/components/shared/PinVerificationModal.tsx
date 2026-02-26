'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';

interface PinVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => void;
    title?: string;
    description?: string;
}

export function PinVerificationModal({
    isOpen,
    onClose,
    onVerify,
    title = 'ยืนยันตัวตนด้วยรหัส PIN',
    description = 'กรุณากรอกรหัส PIN 6 หลักของคุณเพื่อยืนยันการลงเอกสาร E-Document'
}: PinVerificationModalProps) {
    const [pin, setPin] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPin('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 6) {
            setPin(val);
        }
    };

    const handleVerify = () => {
        if (pin.length === 6) {
            onVerify(pin);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length === 6) {
            handleVerify();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                        {description}
                    </p>

                    <div className="mb-6">
                        <input
                            ref={inputRef}
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={handlePinChange}
                            onKeyDown={handleKeyDown}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                            placeholder="••••••"
                            autoComplete="off"
                        />
                    </div>

                    {/* Consent Notice */}
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl text-left">
                        <p className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-300">
                            ⚠️ โดยการกดยืนยัน คุณยินยอมให้ระบบใช้ข้อมูลระบุตัวตนของคุณ (ชื่อ-นามสกุล, เลขใบประกอบฯ) พร้อมประทับเวลาและ IP Address ลงในเอกสารอิเล็กทรอนิกส์นี้ ผู้ที่สแกน QR Code ตรวจสอบจะเห็นข้อมูลบางส่วนเท่านั้น
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={pin.length !== 6}
                            className="flex-1 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" /> ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
