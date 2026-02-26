import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { hn, patientData, signatures, vitals, hospitalInfo } = data;

        if (!hn || !patientData) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const payload = {
            patient: patientData,
            signature: signatures ? signatures[hn] : null,
            vitals: vitals ? vitals[hn] : null,
            hospitalInfo: hospitalInfo || null,
            snapshot_time: new Date().toISOString(),
        };

        // Create a unique hash
        const rawString = `${hn}-${Date.now()}-${Math.random()}`;
        const documentHash = crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32);

        // Store using admin to bypass strict RLS if needed, ensuring it saves
        const { error } = await supabaseAdmin
            .from('print_snapshots')
            .insert({
                patient_hn: hn,
                document_hash: documentHash,
                payload: payload,
            });

        if (error) {
            console.error('Snapshot insert error:', error);
            return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
        }

        return NextResponse.json({ success: true, hash: documentHash });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
