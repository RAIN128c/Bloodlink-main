'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { PatientForm } from '@/components/patient/PatientForm';
import { addPatient } from '@/lib/actions/patient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Patient } from '@/types';

export default function AddPatientPage() {
    const router = useRouter();
    const handleConfirm = async (data: Partial<Patient>) => {
        try {
            const result = await addPatient(data);
            if (result && !result.success) {
                toast.error('ไม่สามารถเพิ่มผู้ป่วยได้', {
                    description: result.error || 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                    duration: 5000,
                });
                return;
            }
            toast.success('บันทึกข้อมูลสำเร็จ', {
                description: `เพิ่มข้อมูลผู้ป่วย ${data.name} ${data.surname} เรียบร้อยแล้ว`,
            });
            router.push('/history');
            router.refresh();
        } catch (error: unknown) {
            console.error('Error adding patient:', error);
            toast.error('เกิดข้อผิดพลาด', {
                description: (error as Error)?.message || 'ไม่สามารถบันทึกข้อมูลผู้ป่วยได้ กรุณาลองใหม่อีกครั้ง'
            });
        }
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    return (
        <MainLayout>
            <title>เพิ่มผู้ป่วย | BloodLink</title>
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
        </MainLayout>
    );
}
