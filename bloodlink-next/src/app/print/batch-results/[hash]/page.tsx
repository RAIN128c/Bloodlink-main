import { supabaseAdmin } from '@/lib/supabase-admin';
import { notFound } from 'next/navigation';
import { BatchPrintClient } from './BatchPrintClient';

interface PrintItem {
    hn: string;
    name: string;
    url: string;
    fileType?: string;
}

interface BatchSnapshotPayload {
    type: string;
    items: PrintItem[];
    snapshot_time: string;
}

interface BatchPrintPageProps {
    params: {
        hash: string;
    };
}

export const revalidate = 0;

export default async function BatchPrintPage({ params }: BatchPrintPageProps) {
    const { hash } = await params;

    if (!hash) {
        return notFound();
    }

    const { data: snapshot, error } = await supabaseAdmin
        .from('print_snapshots')
        .select('payload')
        .eq('document_hash', hash)
        .single();

    if (error || !snapshot) {
        console.error('Failed to load batch snapshot:', error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-medium p-8 text-center flex-col gap-4">
                <h2 className="text-xl font-bold">ไม่พบข้อมูลการพิมพ์</h2>
                <p>รหัสอ้างอิง ({hash}) ไม่ถูกต้อง หรือลิงก์หมดอายุแล้ว</p>
            </div>
        );
    }

    const payload = snapshot.payload as unknown as BatchSnapshotPayload;
    if (!payload?.items || payload.items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-medium">
                ไม่มีข้อมูลที่จะพิมพ์
            </div>
        );
    }

    return <BatchPrintClient items={payload.items} hash={hash} />;
}
