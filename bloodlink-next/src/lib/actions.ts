'use server';

import { AuthService } from './services/authService';
import { loginSchema, registerSchema } from './validations/auth';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function authenticate(email: string, password: unknown, captchaToken?: string) {
    // Validate input using Zod
    const validatedFields = loginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
        return {
            error: 'ข้อมูลไม่ถูกต้อง',
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password as string,
            options: {
                captchaToken: captchaToken
            }
        });

        if (error) {
            console.error('Login error:', error.message);
            if (error.message.includes('Invalid login credentials')) {
                return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
            }
            // Return exactly what Supabase says for debugging
            return { error: `ข้อผิดพลาดจากเซิร์ฟเวอร์: ${error.message}` };
        }

        // Ensure user account is approved in public.users
        const { data: profile } = await supabase
            .from('users')
            .select('status, name, surname, role, position')
            .eq('id', data.user.id)
            .single();

        const validStatuses = ['approved', 'อนุมัติ', 'ผ่าน', 'ใช้งาน'];
        if (!profile || !validStatuses.includes(profile.status?.toLowerCase() || '')) {
            await supabase.auth.signOut(); // Revoke session
            return { error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ' };
        }

        // Log the login event
        await AuthService.recordLoginLog(
            email,
            `${profile.name} ${profile.surname || ''}`.trim(),
            profile.role,
            profile.position || ''
        );

        return { success: true };
    } catch (e) {
        console.error('Authentication Error:', e);
        return { error: 'ระบบทำงานผิดพลาด กรุณาลองใหม่อีกครั้ง' };
    }
}

export async function register(data: any) {
    // Validate input using Zod
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: 'ข้อมูลไม่ถูกต้อง',
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

    const { role, name, surname, email, password, hospitalType, hospitalName } = validatedFields.data;

    // Supabase Admin is required to create pre-verified users
    if (!supabaseAdmin) {
        return { error: 'ระบบไม่ได้ตั้งค่าการเชื่อมต่อผู้ดูแล (Supabase Admin)' };
    }

    const captchaToken = data.captchaToken;
    if (!captchaToken) {
        return { error: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ' };
    }

    // Since we use admin.createUser which bypasses public Supabase Auth rate limits/captchas,
    // we must manually verify the turnstile token here to protect our Next.js Server Action from bots
    if (process.env.TURNSTILE_SECRET_KEY) {
        const formData = new URLSearchParams();
        formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        formData.append('response', captchaToken);

        try {
            const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: formData
            });
            const cfData = await cfRes.json();
            if (!cfData.success) {
                return { error: 'การยืนยันสิทธิ์ล้มเหลว (CAPTCHA Invalid)' };
            }
        } catch (e) {
            console.error('Turnstile verification error:', e);
            // Optionally decide whether to fail open or fail closed
        }
    }

    try {
        // Create user in auth.users directly (Bypassing email confirmation for seamless UX currently)
        // This automatically triggers handle_new_user in Postgres to sync to public.users
        const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role,
                name,
                surname,
                hospitalType,
                hospitalName,
                status: 'รอตรวจสอบ'
            }
        });

        if (error) {
            console.error('Registration Supabase error:', error.message);
            if (error.message.includes('already registered')) {
                return { error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
            }
            return { error: 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง' };
        }

        // Send Welcome Email
        const { EmailService } = await import('./services/emailService');
        await EmailService.sendWelcomeEmail(email, name);

        return { success: true };
    } catch (e: any) {
        console.error('Registration Error:', e);
        return { error: `เกิดข้อผิดพลาด: ${e.message || 'ไม่ทราบสาเหตุ'}` };
    }
}
