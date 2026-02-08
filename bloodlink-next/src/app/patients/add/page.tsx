'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientForm } from '@/components/patient/PatientForm';
import { addPatient } from '@/lib/actions/patient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SuccessPrintModal } from '@/components/modals/SuccessPrintModal';
import { RequestSheet } from '@/components/features/print/RequestSheet';
import { Patient } from '@/types';

export default function AddPatientPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedPatient, setSavedPatient] = useState<Patient | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleConfirm = async (data: any) => {
        setIsSubmitting(true);
        try {
            await addPatient(data);
            setSavedPatient(data as Patient); // Use submitted data for printing
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error adding patient:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    const handlePrintRequest = () => {
        // Trigger browser print
        // The RequestSheet component handles visibility via CSS
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleReset = () => {
        setShowSuccessModal(false);
        setSavedPatient(null);
        // Reset form by reloading or key change. 
        // Cheapest way: reload page or reset state if we lifted it up.
        // Since PatientForm manages its own state internally, remounting it works.
        // We can just reload the page for a fresh start.
        window.location.reload();
    };

    return (
        <MainLayout>
            <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center h-full print:hidden">
                <Header />

                <div className="w-full max-w-[960px] pb-8 pt-6 flex-1 overflow-y-auto custom-scrollbar">
                    <PatientForm
                        title="เพิ่มข้อมูลผู้ป่วย"
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                </div>
            </div>

            {/* Success Modal */}
            <SuccessPrintModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)} // Or do nothing
                onPrint={handlePrintRequest}
                onBack={() => router.push('/dashboard')} // Or /history
                onAddAnother={handleReset}
                patientName={savedPatient ? `${savedPatient.name} ${savedPatient.surname}` : ''}
            />

            {/* Hidden Request Sheet for Printing */}
            {savedPatient && <RequestSheet patient={savedPatient} />}
        </MainLayout>
    );
}
