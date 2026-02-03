'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientList } from '@/components/features/history/PatientList';

export default function HistoryPage() {
    return (
        <MainLayout>
            <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                <Header />
                <PatientList basePath="/history" />
            </div>
        </MainLayout>
    );
}
