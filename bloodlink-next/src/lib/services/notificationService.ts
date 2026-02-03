import { supabaseAdmin } from '@/lib/supabase-admin';
import { MessageService } from './messageService';

// Status to notification message mapping with emojis
const STATUS_MESSAGES: Record<string, string> = {
    'รอตรวจ': '📋 สถานะ: รอตรวจ',
    'นัดหมาย': '📅 นัดหมายเจาะเลือดเรียบร้อย',
    'เจาะเลือด': '💉 เจาะเลือดเสร็จสิ้น รอส่งตรวจ',
    'กำลังจัดส่ง': '🚚 กำลังจัดส่งตัวอย่างไปห้องปฏิบัติการ',
    'กำลังตรวจ': '🔬 กำลังตรวจวิเคราะห์ผลเลือด',
    'เสร็จสิ้น': '✅ ผลเลือดออกแล้ว พร้อมรายงาน'
};

export class NotificationService {
    /**
     * Send notification to all responsible staff when patient status changes
     * Includes link to patient results for editing when applicable
     * @param patientHn - Patient HN
     * @param status - New status
     * @param patientName - Patient's full name
     */
    static async sendStatusNotification(
        patientHn: string,
        status: string,
        patientName: string,
        customSubject?: string,
        customMessage?: string
    ): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
        try {
            // 1. Get the notification message for this status
            const baseMessage = customMessage || STATUS_MESSAGES[status];
            if (!baseMessage) {
                console.log(`No notification message defined for status: ${status}`);
                return { success: true, notifiedCount: 0 };
            }

            // Add link to results page for statuses where editing/viewing results is relevant
            const resultsLink = `/results/${patientHn}`;
            let fullMessage = `${baseMessage}: ${patientName} (HN: ${patientHn})`;

            // Add specific action messages based on status
            if (status === 'กำลังตรวจ') {
                fullMessage += `\n\n📝 กรุณาตรวจสอบและบันทึกผลเลือด: ${resultsLink}`;
            } else if (status === 'เสร็จสิ้น') {
                fullMessage += `\n\n📊 ดูผลตรวจ: ${resultsLink}`;
            }



            const subject = customSubject || `อัปเดตสถานะผู้ป่วย - ${status}`;

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

    /**
     * Send notification to responsible doctors when LAB saves lab results
     * This is triggered when lab results are saved while patient status is 'กำลังตรวจ'
     * @param patientHn - Patient HN
     * @param patientName - Patient's full name
     * @param labTechName - Name of the lab technician who saved the results
     */
    static async sendLabResultReadyNotification(
        patientHn: string,
        patientName: string,
        labTechName?: string
    ): Promise<{ success: boolean; notifiedCount: number; error?: string }> {
        try {
            const message = `🔬 ผลเลือดของ ${patientName} (HN: ${patientHn}) พร้อมให้ตรวจสอบแล้ว${labTechName ? ` - บันทึกโดย ${labTechName}` : ''}\n\n📊 ตรวจสอบผลเลือด: /results/${patientHn}`;
            const subject = 'ผลเลือดพร้อมให้ตรวจสอบ';

            // Get responsible staff for this patient
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

            const emails = responsibilities.map(r => r.user_email);

            // Get users from emails (Strict role check removed to ensure notification delivery)
            const { data: doctors, error: usersError } = await supabaseAdmin
                .from('users')
                .select('id, email, role')
                .in('email', emails);

            if (usersError) {
                console.error('[NotificationService] Error fetching user IDs:', usersError);
                return { success: false, notifiedCount: 0, error: usersError.message };
            }

            if (!doctors || doctors.length === 0) {
                console.log(`[NotificationService] No users found for responsible emails for HN: ${patientHn}`);
                return { success: true, notifiedCount: 0 };
            }

            console.log(`[NotificationService] Notifying ${doctors.length} staff members about lab results for HN: ${patientHn}`);

            // Send notification to each doctor
            let notifiedCount = 0;
            for (const doctor of doctors) {
                const result = await MessageService.sendMessage(
                    'system',
                    doctor.id,
                    message,
                    subject,
                    'system_update'
                );
                if (result.success) {
                    notifiedCount++;
                }
            }

            console.log(`Sent ${notifiedCount} lab result notifications for patient ${patientHn}`);
            return { success: true, notifiedCount };

        } catch (error: any) {
            console.error('Error sending lab result notification:', error);
            return { success: false, notifiedCount: 0, error: error.message };
        }
    }
}

