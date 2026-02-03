'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PatientDetail } from '@/components/features/history/PatientDetail';
import { useParams } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

export default function HistoryDetailPage() {
    const params = useParams();
    const hn = params.hn as string;

    return (
        <SessionProvider>
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
                <Sidebar />
                <div className="ml-0 md:ml-[195px] flex-1 flex flex-col h-screen overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#0f1115] px-2 sm:p-3 pt-0 transition-colors">
                        <div className="w-full sm:max-w-[960px] mx-auto flex flex-col h-full">
                            <Header />
                            {hn && <PatientDetail hn={hn} backPath="/history" />}
                        </div>
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}

