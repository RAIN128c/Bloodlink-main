'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientForm } from '@/components/patient/PatientForm';
import { addPatient } from '@/lib/actions/patient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddPatientPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async (data: any) => {
        setIsSubmitting(true);
        try {
            await addPatient(data);
            // Show success toast or redirect
            router.push('/dashboard');
        } catch (error) {
            console.error('Error adding patient:', error);
            // Show error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    return (
        <MainLayout>
            <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center h-full">
                <Header />

                <div className="w-full max-w-[960px] pb-8 pt-6 flex-1 overflow-y-auto custom-scrollbar">
                    <PatientForm
                        title="เพิ่มข้อมูลผู้ป่วย"
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </MainLayout>
    );
}
