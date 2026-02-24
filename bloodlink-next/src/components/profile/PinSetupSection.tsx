'use client';

import { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function PinSetupSection() {
    const [hasPin, setHasPin] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    useEffect(() => {
        async function checkPinStatus() {
            try {
                const res = await fetch('/api/profile/pin');
                if (res.ok) {
                    const data = await res.json();
                    setHasPin(data.hasPin);
                }
            } catch (error) {
                console.error('Failed to check PIN status', error);
            } finally {
                setIsLoading(false);
            }
        }
        checkPinStatus();
    }, []);

    const handleSavePin = async () => {
        if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            toast.error('รหัส PIN ต้องเป็นตัวเลข 6 หลัก');
            return;
        }
        if (newPin !== confirmPin) {
            toast.error('รหัส PIN ใหม่และยืนยันรหัส PIN ไม่ตรงกัน');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/profile/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPin })
            });

            if (res.ok) {
                toast.success(hasPin ? 'เปลี่ยนรหัส PIN สำหรับ E-Document สำเร็จ' : 'ตั้งค่ารหัส PIN สำหรับ E-Document สำเร็จ');
                setHasPin(true);
                setIsEditing(false);
                setNewPin('');
                setConfirmPin('');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'ไม่สามารถตั้งค่ารหัส PIN ได้');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-[24px]"></div>;
    }

    return (
        <div className="mt-6 bg-white dark:bg-[#111827] rounded-[24px] p-8 sm:p-10 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                    ตั้งค่า E-Document PIN
                </h2>
                {!isEditing && hasPin && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                    >
                        เปลี่ยนรหัส PIN
                    </button>
                )}
            </div>

            {!isEditing && (
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className={`p-3 rounded-xl ${hasPin ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {hasPin ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className={`text-lg font-semibold ${hasPin ? 'text-gray-900 dark:text-white' : 'text-red-700 dark:text-red-400'}`}>
                            {hasPin ? 'ตั้งค่ารหัส PIN แล้ว' : 'ยังไม่ได้ตั้งค่ารหัส PIN'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            รหัส PIN 6 หลัก ใช้สำหรับยืนยันตัวตนในการลงนามเอกสาร E-Document (เช่น ใบสั่งตรวจแล็บ) เพื่อความปลอดภัยและเป็นไปตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์
                        </p>
                        {!hasPin && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                เริ่มตั้งค่ารหัส PIN
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex flex-col gap-6 max-w-md">
                    <div className="form-group flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">รหัส PIN ใหม่ (6 หลัก)</label>
                        <input
                            type="password"
                            value={newPin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                                if (val.length <= 6) setNewPin(val);
                            }}
                            placeholder="••••••"
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-lg tracking-[0.5em] text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono"
                        />
                    </div>

                    <div className="form-group flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ยืนยันรหัส PIN ใหม่</label>
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 6) setConfirmPin(val);
                            }}
                            placeholder="••••••"
                            className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-lg tracking-[0.5em] text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono"
                        />
                    </div>

                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={handleSavePin}
                            disabled={isSaving}
                            className={`flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึก PIN'}
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setNewPin('');
                                setConfirmPin('');
                            }}
                            className="flex-1 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
