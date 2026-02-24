import { NextResponse } from 'next/server';
import { SignatureService } from '@/lib/services/signatureService';
import { auth } from '@/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;
        const decodedHn = decodeURIComponent(hn);

        const signature = await SignatureService.getSignatureForPatient(decodedHn);

        // It is perfectly valid for a patient to not have a signature yet (e.g. legacy records)
        return NextResponse.json({ signature: signature || null });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch signature' },
            { status: 500 }
        );
    }
}
