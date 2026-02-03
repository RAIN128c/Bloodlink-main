import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111827] px-4 font-[family-name:var(--font-kanit)]">
            <div className="max-w-md w-full text-center space-y-8 p-8 bg-white dark:bg-[#1F2937] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300">

                {/* Icon */}
                <div className="relative">
                    <div className="w-24 h-24 mx-auto bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center ring-8 ring-indigo-50/50 dark:ring-indigo-900/10">
                        <FileQuestion className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1F2937] px-3 py-1 rounded-full text-sm font-bold text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm">
                        404
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        ไม่พบหน้านี้
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        ขออภัย เราไม่พบหน้าที่คุณกำลังค้นหา <br />
                        อาจมีการพิมพ์ URL ผิดหรือหน้านี้ถูกลบไปแล้ว
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Link>

                    {/* Note: In a real app, you might want a 'Back' button using router.back(), 
              but Link is safer for 404s to avoid loops */}
                </div>
            </div>
        </div>
    );
}
