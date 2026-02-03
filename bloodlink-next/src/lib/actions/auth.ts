'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { AuthService } from '@/lib/services/authService';
import { EmailService } from '@/lib/services/emailService';
import { randomUUID } from 'crypto';

/**
 * Request a password reset link
 * Generates a token and logs the link to the console (simulating email)
 */
export async function requestPasswordReset(email: string) {
    try {
        // 1. Verify user exists
        const user = await AuthService.getUserByEmail(email);
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return { success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้คุณแล้ว' };
        }

        // 2. Generate Token
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

        // 3. Save to DB (user_tokens table)
        // using supabaseAdmin to bypass RLS or access protected table
        const { error } = await supabaseAdmin
            .from('user_tokens')
            .insert({
                email,
                token,
                type: 'password_reset',
                expires_at: expiresAt.toISOString()
            });

        if (error) {
            console.error('Failed to create reset token:', error);
            return { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' };
        }

        // 4. Send Email via EmailService
        const emailResult = await EmailService.sendPasswordResetEmail(email, token);

        if (!emailResult.success) {
            return { success: false, error: 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง' };
        }

        return { success: true, message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' };

    } catch (error) {
        console.error('requestPasswordReset error:', error);
        return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ' };
    }
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(token: string, newPassword: string) {
    try {
        // 1. Validate Token
        const { data: tokenData, error } = await supabaseAdmin
            .from('user_tokens')
            .select('*')
            .eq('token', token)
            .eq('type', 'password_reset')
            .single();

        if (error || !tokenData) {
            return { success: false, error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ' };
        }

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            return { success: false, error: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว' };
        }

        // 2. Update Password
        const updateSuccess = await AuthService.updateUserPassword(tokenData.email, newPassword);
        if (!updateSuccess) {
            return { success: false, error: 'ไม่สามารถอัปเดตรหัสผ่านได้' };
        }

        // 3. Delete Token (Consume it)
        await supabaseAdmin
            .from('user_tokens')
            .delete()
            .eq('id', tokenData.id);

        return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' };

    } catch (error) {
        console.error('resetPassword error:', error);
        return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
    }
}
