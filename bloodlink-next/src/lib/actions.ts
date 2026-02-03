'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { AuthService } from './services/authService';
import { loginSchema, registerSchema } from './validations/auth';

export async function authenticate(email: string, password: unknown) {
    // Validate input using Zod
    const validatedFields = loginSchema.safeParse({
        email,
        password,
    });

    if (!validatedFields.success) {
        return {
            error: 'ข้อมูลไม่ถูกต้อง',
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

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
    // Validate input using Zod
    const validatedFields = registerSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: 'ข้อมูลไม่ถูกต้อง',
            fieldErrors: validatedFields.error.flatten().fieldErrors
        };
    }

    const { role, name, surname, email, password, hospitalType, hospitalName } = validatedFields.data;

    const result = await AuthService.registerUser({
        role,
        name,
        surname,
        email,
        password,
        hospitalType,
        hospitalName
    });

    if (!result.success) {
        return { error: result.error || 'Registration failed' };
    }

    return { success: true };
}
