import { NextResponse } from 'next/server';
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
        const { type, items } = data;

        if (!type || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        const payload = {
            type,
            items,
            snapshot_time: new Date().toISOString(),
        };

        // Create a unique hash
        const rawString = `batch-${type}-${Date.now()}-${Math.random()}`;
        const documentHash = crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32);

        // Store using admin to bypass strict RLS if needed, ensuring it saves
        // Using an arbitrary hn like 'BATCH' since patient_hn is required by the schema 
        // We'll just define it as 'BATCH' or the first item's hn, 'BATCH' is safer.
        const { error } = await supabaseAdmin
            .from('print_snapshots')
            .insert({
                patient_hn: items.length > 0 ? items[0].hn : 'BATCH',
                document_hash: documentHash,
                payload: payload,
            });

        if (error) {
            console.error('Batch Snapshot insert error:', error);
            return NextResponse.json({ error: 'Failed to save batch snapshot' }, { status: 500 });
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
