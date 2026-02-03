import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface UserActivityLog {
    id: string;
    time: string;
    userName: string;
    userRole: string;
    userInitials: string;
    action: string;
    details: string;
    target: string;
}

export interface SystemLog {
    id: string;
    time: string;
    event: string;
    status: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

export interface DailySummaryOrder {
    id: string;
    patientHn: string;
    testType: string;
    time: string;
    status: 'Completed' | 'Processing' | 'Pending';
}

export interface ReportsData {
    userActivityLogs: UserActivityLog[];
    systemLogs: SystemLog[];
    dailySummary: {
        totalOrders: number;
        completed: number;
        pending: number;
        orders: DailySummaryOrder[];
    };
}

export async function GET() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Fetch User Activity Logs from audit_logs
        const { data: auditLogs, error: auditError } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (auditError) {
            console.error('Audit logs fetch error:', auditError);
        }

        const userActivityLogs: UserActivityLog[] = (auditLogs || []).map(log => {
            const date = new Date(log.created_at);
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const name = log.name || 'ผู้ใช้';
            const initials = name.split(' ').map((n: string) => n.charAt(0).toUpperCase()).slice(0, 2).join('');

            // Map action to badge type
            let actionDisplay = log.action || 'Activity';

            return {
                id: log.id,
                time: timeStr,
                userName: name,
                userRole: log.position ? `${log.role}(${log.position})` : (log.role || ''),
                userInitials: initials,
                action: actionDisplay,
                details: log.details || log.action || '',
                target: log.target || ''
            };
        });

        // 2. Fetch System Logs from admin_inbox (notifications type) or system activity
        const { data: systemData, error: systemError } = await supabase
            .from('admin_inbox')
            .select('*')
            .eq('type', 'notification')
            .order('created_at', { ascending: false })
            .limit(20);

        if (systemError) {
            console.error('System logs fetch error:', systemError);
        }

        const systemLogs: SystemLog[] = (systemData || []).map(log => {
            const date = new Date(log.created_at);
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            // Determine status based on tags or subject
            let status: 'success' | 'error' | 'warning' | 'info' = 'info';
            const tags = log.tags || [];
            if (tags.includes('error') || log.subject?.toLowerCase().includes('error')) {
                status = 'error';
            } else if (tags.includes('warning') || log.subject?.toLowerCase().includes('warning')) {
                status = 'warning';
            } else if (tags.includes('success') || log.subject?.toLowerCase().includes('success')) {
                status = 'success';
            }

            return {
                id: log.id,
                time: timeStr,
                event: log.subject || 'System Event',
                status,
                message: log.message || ''
            };
        });

        // 3. Fetch Daily Summary from patients
        const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .order('created_at', { ascending: false });

        if (patientsError) {
            console.error('Patients fetch error:', patientsError);
        }

        // Also fetch all patients created today (or use appointment date)
        const { data: allPatientsToday } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        const patients = allPatientsToday || [];

        // Count by process status
        let completed = 0;
        let pending = 0;

        patients.forEach(p => {
            const process = p.process?.trim();
            if (process === 'ส่งผลตรวจ' || process === 'เสร็จสิ้น' || process === 'รับยาแล้ว') {
                completed++;
            } else if (process === 'นัดหมาย' || process === 'เจาะเลือด' || process === 'รอผล' || process === 'กำลังตรวจสอบ') {
                pending++;
            }
        });

        const orders: DailySummaryOrder[] = patients.slice(0, 20).map((p, index) => {
            const date = new Date(p.created_at || p.timestamp);
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            let status: 'Completed' | 'Processing' | 'Pending' = 'Pending';
            const process = p.process?.trim();
            if (process === 'ส่งผลตรวจ' || process === 'เสร็จสิ้น' || process === 'รับยาแล้ว') {
                status = 'Completed';
            } else if (process === 'เจาะเลือด' || process === 'รอผล' || process === 'กำลังตรวจสอบ') {
                status = 'Processing';
            }

            return {
                id: `#ORD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
                patientHn: p.hn || '-',
                testType: p.testType || 'CBC',
                time: timeStr,
                status
            };
        });

        const reportsData: ReportsData = {
            userActivityLogs,
            systemLogs,
            dailySummary: {
                totalOrders: patients.length,
                completed,
                pending: patients.length - completed,
                orders
            }
        };

        return NextResponse.json(reportsData);
    } catch (error) {
        console.error('Reports API error:', error);
        return NextResponse.json({
            userActivityLogs: [],
            systemLogs: [],
            dailySummary: {
                totalOrders: 0,
                completed: 0,
                pending: 0,
                orders: []
            }
        });
    }
}
