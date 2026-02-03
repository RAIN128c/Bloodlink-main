import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

interface PatientData {
    hn: string;
    name: string;
    surname: string;
    gender: string;
    age: string;
    bloodType: string;
    disease?: string;
    allergy?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { patients } = body as { patients: PatientData[] };

        if (!Array.isArray(patients) || patients.length === 0) {
            return NextResponse.json({ error: 'No patients provided' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as { row: number; message: string }[]
        };

        // Process each patient
        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            const rowNumber = i + 2; // +2 because of header row and 0-index

            // Validate required fields
            if (!patient.hn || !patient.name || !patient.surname) {
                results.failed++;
                results.errors.push({
                    row: rowNumber,
                    message: 'HN, ชื่อ หรือนามสกุลไม่ครบ'
                });
                continue;
            }

            // Check if HN already exists
            const { data: existing } = await supabase
                .from('patients')
                .select('hn')
                .eq('hn', patient.hn)
                .single();

            if (existing) {
                results.failed++;
                results.errors.push({
                    row: rowNumber,
                    message: `HN ${patient.hn} มีในระบบแล้ว`
                });
                continue;
            }

            // Parse disease and allergy (comma-separated to array)
            const diseaseArray = patient.disease
                ? patient.disease.split(',').map(d => d.trim()).filter(Boolean)
                : [];
            const allergyArray = patient.allergy
                ? patient.allergy.split(',').map(a => a.trim()).filter(Boolean)
                : [];

            // Insert patient
            const { error: insertError } = await supabase
                .from('patients')
                .insert({
                    hn: patient.hn,
                    name: patient.name,
                    surname: patient.surname,
                    gender: patient.gender || 'ไม่ระบุ',
                    age: patient.age || '0',
                    blood_type: patient.bloodType || 'ไม่ระบุ',
                    disease: diseaseArray.length > 0 ? diseaseArray.join(', ') : '-',
                    allergy: allergyArray.length > 0 ? allergyArray.join(', ') : '-',
                    ncd: '-',
                    status: 'ใช้งาน',
                    process: 'นัดหมาย',
                    last_check: new Date().toISOString().split('T')[0],
                    latest_receipt: '-',
                    creator_email: session.user.email,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                results.failed++;
                results.errors.push({
                    row: rowNumber,
                    message: insertError.message || 'Database error'
                });
            } else {
                results.success++;
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
