import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
    title: 'แดชบอร์ด',
}
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Patient } from '@/types';

// Force dynamic rendering since we want fresh data on every load for the dashboard
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // 1. Fetch all patients data server-side using admin client to bypass RLS for aggregate stats
    const { data: patientsData, error } = await supabaseAdmin
        .from('patients')
        .select('*');

    const patients = (patientsData || []) as Patient[];

    // 2. Calculate initial stats
    const initialStats = {
        totalPatients: patients.length,
        appointments: patients.filter(p => p.process === 'นัดหมาย').length,
        completed: patients.filter(p => p.process === 'เสร็จสิ้น').length,
        inProgress: patients.filter(p =>
            p.process && p.process !== 'นัดหมาย' && p.process !== 'เสร็จสิ้น'
        ).length
    };

    // 3. Process Live Queue (Recent Activity)
    // Filter active patients, sort by newest timestamp, take top 5
    const recentActivity = patients
        .filter(p => p.process && p.process !== 'เสร็จสิ้น' && p.process !== 'นัดหมาย')
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
        .slice(0, 5);

    // 4. Process Today's Appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = patients
        .filter(p => p.process === 'นัดหมาย' && p.appointmentDate)
        .filter(p => {
            const apptDate = new Date(p.appointmentDate as string);
            return apptDate >= today && apptDate < tomorrow;
        })
        .sort((a, b) => new Date(a.appointmentDate || '').getTime() - new Date(b.appointmentDate || '').getTime());

    return (
        <MainLayout>
            <div className="max-w-[900px] w-full mx-auto flex flex-col">
                <Header />
                <DashboardClient
                    initialStats={initialStats}
                    recentActivity={recentActivity}
                    todayAppointments={todayAppointments}
                />
            </div>
        </MainLayout>
    );
}
