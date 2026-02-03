'use client';

import { use } from 'react';
import { Header } from '@/components/layout/Header';

import { PatientDetail } from '@/components/features/history/PatientDetail';

export default function AdminPatientDetailPage({ params }: { params: Promise<{ hn: string }> }) {
    const { hn } = use(params);
    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} isAdminPage={true} />
            <PatientDetail hn={hn} backPath="/admin/patients" />
        </div>
    );
}
