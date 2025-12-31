'use client';

import { useState, useEffect, Suspense } from 'react';
import { resetPassword } from '@/lib/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (password.length < 6) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (!token) {
            setError('ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน');
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPassword(token, password);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                    <p className="font-medium">ลิงก์ไม่ถูกต้อง</p>
                    <p className="text-sm">ไม่พบรหัสยืนยัน (Token) ในลิงก์นี้</p>
                </div>
                <Link href="/forgot-password" className="text-purple-600 hover:underline text-sm">
                    ขอลิงก์รีเซ็ตใหม่
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-6 animate-fadeIn">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">เปลี่ยนรหัสผ่านสำเร็จ</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที
                    </p>
                </div>
                <Link
                    href="/login"
                    className="w-full inline-flex justify-center items-center py-3 px-6 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-all"
                >
                    เข้าสู่ระบบ
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    รหัสผ่านใหม่
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-gray-400"
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center font-medium">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "เปลี่ยนรหัสผ่าน"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0f1115] flex items-center justify-center p-4 font-[family-name:var(--font-kanit)] transition-colors">
            <div className="bg-white dark:bg-[#1F2937] rounded-3xl shadow-xl w-full max-w-md p-8 md:p-10 transition-colors">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    {mounted ? (
                        <Image
                            src={resolvedTheme === 'dark' ? "/images/logo_d.png" : "/images/logo.png"}
                            alt="BloodLink Logo"
                            width={160}
                            height={70}
                            className="w-[160px] h-auto object-contain"
                            priority
                        />
                    ) : (
                        <div className="w-[160px] h-[70px]" />
                    )}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ตั้งรหัสผ่านใหม่</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        กำหนดรหัสผ่านใหม่ของคุณ
                    </p>
                </div>

                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out both;
                }
            `}</style>
        </div>
    );
}
