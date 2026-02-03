import { z } from 'zod';

export const patientSchema = z.object({
    hn: z.string().min(1, 'กรุณากรอก HN'), // Allow alphanumeric HN for flexibility, but enforce requirement
    name: z.string().min(1, 'กรุณากรอกชื่อ'),
    surname: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other']),
    age: z.coerce.number().min(0, 'อายุต้องไม่ต่ำกว่า 0').max(120, 'อายุไม่ถูกต้อง'),
    bloodType: z.enum(['A', 'B', 'O', 'AB']),
    disease: z.string().optional(),
    allergies: z.string().optional(),
    medication: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
