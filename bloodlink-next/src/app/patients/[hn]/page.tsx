'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientDetail } from '@/components/features/history/PatientDetail';
import { useParams } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

export default function PatientDetailPage() {
    const params = useParams();
    const hn = params.hn as string;

    return (
        <SessionProvider>
            <MainLayout>
                <div className="w-full sm:max-w-[960px] mx-auto flex flex-col h-full">
                    <Header />
                    {/* Use PatientDetail component which fetches data via API */}
                    {hn && <PatientDetail hn={hn} backPath="/dashboard" />}
                </div>
            </MainLayout>
        </SessionProvider>
    );
}
