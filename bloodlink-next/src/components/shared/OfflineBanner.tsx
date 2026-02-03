'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-6 left-6 z-[100] animate-slide-up-fade">
            <div className="bg-red-500/90 dark:bg-red-600/90 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.3)] flex items-center gap-4 border border-white/10">
                <div className="p-2.5 bg-white/20 rounded-xl animate-pulse">
                    <WifiOff className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight">ขาดการเชื่อมต่ออินเทอร์เน็ต</h3>
                    <p className="text-sm text-white/90 mt-0.5">ระบบกำลังพยายามเชื่อมต่อใหม่...</p>
                </div>
            </div>
        </div>
    );
}
