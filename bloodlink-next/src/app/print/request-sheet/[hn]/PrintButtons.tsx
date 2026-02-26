'use client';

import { Printer, ArrowLeft } from 'lucide-react';

export function PrintButtons({ showPrint = true, showBack = true }: { showPrint?: boolean, showBack?: boolean }) {
    return (
        <div className="flex items-center gap-4">
            {showBack && (
                <button
                    onClick={() => window.close()}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    title="ปิดหน้าต่าง"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="sr-only">ปิดหน้าต่าง</span>
                </button>
            )}

            {showPrint && (
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm ml-4"
                >
                    <Printer className="w-5 h-5" />
                    สั่งพิมพ์เอกสาร
                </button>
            )}
        </div>
    );
}
