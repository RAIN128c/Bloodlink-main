import { supabaseAdmin } from '@/lib/supabase-admin';
import { MessageService } from './messageService';

// Status to notification message mapping
const STATUS_MESSAGES: Record<string, string> = {
    'รอตรวจ': 'ได้เพิ่มผู้ป่วยแล้ว',
    'นัดหมาย': 'นัดหมายเจาะเลือด',
    'เจาะเลือด': 'ถึงเวลาเจาะเลือด',
    'กำลังจัดส่ง': 'กำลังจัดส่งผลเลือด',
    'กำลังตรวจ': 'ส่งผลเลือดสำเร็จ กำลังตรวจสอบ',
    'เสร็จสิ้น': 'ผลเลือดออกแล้ว'
};

export class NotificationService {
    /**
     * Send notification to all responsible staff when patient status changes
     * @param patientHn - Patient HN
     * @param status - New status
     * @param patientName - Patient's full name
     */
    static async sendStatusNotification(
        patientHn: string,
        status: string,
        patientName: string
    ): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
        try {
            // 1. Get the notification message for this status
            const baseMessage = STATUS_MESSAGES[status];
            if (!baseMessage) {
                console.log(`No notification message defined for status: ${status}`);
                return { success: true, notifiedCount: 0 };
            }

            const fullMessage = `${baseMessage}: ${patientName} (HN: ${patientHn})`;
            const subject = `อัปเดตสถานะผู้ป่วย - ${status}`;

            // 2. Get responsible staff for this patient
            const { data: responsibilities, error: respError } = await supabaseAdmin
                .from('patient_responsibility')
                .select('user_email')
                .eq('patient_hn', patientHn);

            if (respError) {
                console.error('Error fetching responsibilities:', respError);
                return { success: false, notifiedCount: 0, error: respError.message };
            }

            if (!responsibilities || responsibilities.length === 0) {
                console.log(`[NotificationService] No responsible staff found for patient HN: ${patientHn}`);
                return { success: true, notifiedCount: 0 };
            }

            // 3. Get user IDs from emails
            const emails = responsibilities.map(r => r.user_email);
            console.log(`[NotificationService] Found responsible emails for HN ${patientHn}:`, emails);

            const { data: users, error: usersError } = await supabaseAdmin
                .from('users')
                .select('id, email')
                .in('email', emails);

            if (usersError) {
                console.error('[NotificationService] Error fetching user IDs:', usersError);
                return { success: false, notifiedCount: 0, error: usersError.message };
            }

            console.log(`[NotificationService] Found matched users in DB:`, users?.map(u => u.email));

            if (!users || users.length === 0) {
                console.log(`[NotificationService] No matching users found in users table for emails:`, emails);
                return { success: true, notifiedCount: 0 };
            }

            // 4. Send notification to each responsible user
            let notifiedCount = 0;
            for (const user of users) {
                const result = await MessageService.sendMessage(
                    'system', // sender_id for system notifications
                    user.id,
                    fullMessage,
                    subject,
                    'system_update' // Changed to system_update for Inbox filtering
                );
                if (result.success) {
                    notifiedCount++;
                }
            }

            console.log(`Sent ${notifiedCount} notifications for patient ${patientHn} status: ${status}`);
            return { success: true, notifiedCount };

        } catch (error: any) {
            console.error('Error sending status notification:', error);
            return { success: false, notifiedCount: 0, error: error.message };
        }
    }

    /**
     * Send a global notification to all staff (Doctors and Nurses)
     * @param message - Notification message
     * @param subject - Subject line
     */
    static async sendGlobalNotification(
        message: string,
        subject: string = 'แจ้งเตือนระบบ'
    ): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
        try {
            // Get all approved doctors and nurses
            const { data: staff, error } = await supabaseAdmin
                .from('users')
                .select('id')
                .in('role', ['แพทย์', 'พยาบาล', 'doctor', 'nurse'])
                .eq('status', 'approved');

            if (error) {
                return { success: false, notifiedCount: 0, error: error.message };
            }

            if (!staff || staff.length === 0) {
                return { success: true, notifiedCount: 0 };
            }

            let notifiedCount = 0;
            for (const user of staff) {
                const result = await MessageService.sendMessage(
                    'system',
                    user.id,
                    message,
                    subject,
                    'notification'
                );
                if (result.success) {
                    notifiedCount++;
                }
            }

            return { success: true, notifiedCount };
        } catch (error: any) {
            console.error('Error sending global notification:', error);
            return { success: false, notifiedCount: 0, error: error.message };
        }
    }
}
