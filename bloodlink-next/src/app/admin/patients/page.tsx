'use client';

import { Header } from '@/components/layout/Header';

import { PatientList } from '@/components/features/history/PatientList';

export default function AdminPatientsPage() {
    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} isAdminPage={true} />
            <PatientList basePath="/admin/patients" title="Patient List" />
        </div>
    );
}
