'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Global Error Component
 * Catches runtime errors in nested segments and displays a user-friendly UI.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Runtime Error caught by boundary:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111827] px-4 font-[family-name:var(--font-kanit)]">
            <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-[#1F2937] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300">

                {/* Error Icon */}
                <div className="w-20 h-20 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center ring-8 ring-red-50/50 dark:ring-red-900/10">
                    <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        มีข้อผิดพลาดเกิดขึ้น
                    </h2>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                        <p className="mb-2">ระบบไม่สามารถดำเนินการต่อได้ในขณะนี้</p>
                        <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs break-all mx-auto max-w-[300px] text-red-500">
                            {error.message || "Unknown Error"}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        ลองใหม่อีกครั้ง
                    </button>

                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Link>
                </div>

                {/* Tech Info */}
                {error.digest && (
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-6 uppercase tracking-widest">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
