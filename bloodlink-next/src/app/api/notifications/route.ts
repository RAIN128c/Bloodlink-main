import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface NotificationCounts {
    // ผลตรวจเลือด - count patients with results ready to view (process = 'ส่งผลตรวจ')
    resultsReady: number;
    // ประวัติผู้ป่วย - count new patients added since last viewed
    newPatients: number;
    // วันนัดหมาย - count upcoming appointments
    upcomingAppointments: number;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Get last viewed timestamps from query params (ISO strings)
        const lastViewedResults = searchParams.get('lastViewedResults');
        const lastViewedHistory = searchParams.get('lastViewedHistory');
        const lastViewedAppointments = searchParams.get('lastViewedAppointments');

        // 1. Count patients with results ready (process = 'ส่งผลตรวจ')
        // Only count if created after last viewed
        let resultsQuery = supabase
            .from('patients')
            .select('id', { count: 'exact' })
            .eq('process', 'ส่งผลตรวจ');

        if (lastViewedResults) {
            resultsQuery = resultsQuery.gt('updated_at', lastViewedResults);
        }

        const { data: resultsData, error: resultsError } = await resultsQuery;

        if (resultsError) {
            console.error('Results count error:', resultsError);
        }

        // 2. Count new patients added since last viewed
        let patientsQuery = supabase
            .from('patients')
            .select('id', { count: 'exact' });

        if (lastViewedHistory) {
            patientsQuery = patientsQuery.gt('created_at', lastViewedHistory);
        } else {
            // If never viewed, show patients from last 24 hours
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            patientsQuery = patientsQuery.gte('created_at', yesterday.toISOString());
        }

        const { data: newPatientsData, error: newPatientsError } = await patientsQuery;

        if (newPatientsError) {
            console.error('New patients count error:', newPatientsError);
        }

        // 3. Count upcoming appointments (process = 'นัดหมาย')
        let appointmentsQuery = supabase
            .from('patients')
            .select('id', { count: 'exact' })
            .eq('process', 'นัดหมาย');

        if (lastViewedAppointments) {
            appointmentsQuery = appointmentsQuery.gt('updated_at', lastViewedAppointments);
        }

        const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

        if (appointmentsError) {
            console.error('Appointments count error:', appointmentsError);
        }

        const counts: NotificationCounts = {
            resultsReady: resultsData?.length || 0,
            newPatients: newPatientsData?.length || 0,
            upcomingAppointments: appointmentsData?.length || 0
        };

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({
            resultsReady: 0,
            newPatients: 0,
            upcomingAppointments: 0
        });
    }
}
