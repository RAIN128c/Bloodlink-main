'use client';

import { useState, useEffect } from 'react';
import { requestPasswordReset } from '@/lib/actions/auth';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function ForgotPasswordPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const result = await requestPasswordReset(email);
            if (result.success) {
                setMessage(result.message || 'ส่งลิงก์เรียบร้อย');
            } else {
                setError(result.error || 'เกิดข้อผิดพลาด');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ลืมรหัสผ่าน?</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่านใหม่
                    </p>
                </div>

                {message ? (
                    <div className="text-center space-y-6">
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-100 dark:border-green-800">
                            <div className="flex justify-center mb-2">
                                <Mail className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-green-800 dark:text-green-300 font-medium mb-1">ส่งลิงก์สำเร็จ</h3>
                            <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                อีเมล
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 px-4 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all placeholder:text-gray-400"
                                placeholder="name@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-6 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "ส่งลิงก์รีเซ็ต"}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                ยกเลิก
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
