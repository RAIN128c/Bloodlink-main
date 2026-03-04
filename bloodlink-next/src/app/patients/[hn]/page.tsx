'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientDetail } from '@/components/features/history/PatientDetail';
import { useParams } from 'next/navigation';


export default function PatientDetailPage() {
    const params = useParams();
    const hn = params.hn as string;

    return (
        <MainLayout>
            <title>ข้อมูลผู้ป่วย | BloodLink</title>
            <div className="w-full sm:max-w-[960px] mx-auto flex flex-col h-full">
                <Header />
                {/* Use PatientDetail component which fetches data via API */}
                {hn && <PatientDetail hn={hn} backPath="/dashboard" />}
            </div>
        </MainLayout>
    );
}
