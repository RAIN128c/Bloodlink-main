'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { AuthService } from './services/authService';

export async function authenticate(email: string, password: unknown) {
    try {
        await signIn('credentials', { email, password, redirect: false });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
                default:
                    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' };
            }
        }
        throw error;
    }
}

export async function register(data: any) {
    // Manual validation could happen here, but we trust the form roughly
    // Or we map formData to our object
    const result = await AuthService.registerUser({
        role: data.role,
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: data.password,
        hospitalType: data.hospitalType,
        hospitalName: data.hospitalName
    });

    if (!result.success) {
        return { error: result.error || 'Registration failed' };
    }

    return { success: true };
}
