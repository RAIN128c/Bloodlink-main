import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'อีเมลไม่ถูกต้อง' }),
    password: z.string().min(1, { message: 'กรุณาระบุรหัสผ่าน' }),
});

export const registerSchema = z.object({
    role: z.enum(['แพทย์', 'พยาบาล', 'เจ้าหน้าที่ห้องปฏิบัติการ']),
    name: z.string().min(1, { message: 'กรุณาระบุชื่อ' }),
    surname: z.string().min(1, { message: 'กรุณาระบุนามสกุล' }),
    email: z.string().email({ message: 'อีเมลไม่ถูกต้อง' }),
    password: z
        .string()
        .min(8, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' })
        .regex(/[A-Z]/, { message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว' })
        .regex(/[a-z]/, { message: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว' })
        .regex(/[0-9]/, { message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' }),
    hospitalType: z.enum(['แม่ข่าย', 'ชุมชน', 'รพ.สต']),
    hospitalName: z.string().min(1, { message: 'กรุณาระบุชื่อโรงพยาบาล' }),
    professionalId: z.string().min(1, { message: 'กรุณาระบุเลขใบประกอบวิชาชีพ หรือ รหัสพนักงาน' }),
});

export const passwordSchema = z
    .string()
    .min(8, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' })
    .regex(/[A-Z]/, { message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว' })
    .regex(/[a-z]/, { message: 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว' })
    .regex(/[0-9]/, { message: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
