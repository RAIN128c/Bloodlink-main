import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/patients/check?hn=xxx or ?idCard=xxx
 * Check if a patient with the given HN or ID card already exists.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hn = searchParams.get('hn');
    const idCard = searchParams.get('idCard');

    if (!hn && !idCard) {
        return NextResponse.json({ error: 'hn or idCard query param required' }, { status: 400 });
    }

    try {
        if (hn) {
            const { data } = await supabaseAdmin
                .from('patients')
                .select('hn, name, surname')
                .eq('hn', hn)
                .maybeSingle();

            return NextResponse.json({
                exists: !!data,
                patient: data ? { hn: data.hn, name: `${data.name} ${data.surname}` } : null,
            });
        }

        if (idCard) {
            const { data } = await supabaseAdmin
                .from('patients')
                .select('hn, name, surname, id_card')
                .eq('id_card', idCard)
                .maybeSingle();

            return NextResponse.json({
                exists: !!data,
                patient: data ? { hn: data.hn, name: `${data.name} ${data.surname}` } : null,
            });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        console.error('Patient check error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
