import { supabaseAdmin } from '@/lib/supabase-admin';
import { PrintRequestSheet } from '@/components/features/history/PrintRequestSheet';
import { PrintButtons } from '../../request-sheet/[hn]/PrintButtons';
import { Patient } from '@/types';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface PrintSnapshotPageProps {
    params: {
        hash: string;
    };
}

interface SnapshotPayload {
    patient: Patient;
    signature?: { qr_token?: string; signature_text?: string; document_url?: string } | null;
    vitals?: Record<string, unknown>;
    hospitalInfo?: { hospitalType?: string; hospitalName?: string; district?: string; province?: string; } | null;
}

export default async function PrintSnapshotPage({ params }: PrintSnapshotPageProps) {
    // 1. Await params properly for Next.js 15
    const { hash } = await params;

    if (!hash) {
        return notFound();
    }

    const hashList = decodeURIComponent(hash).split(',');

    // 2. Fetch the snapshot using admin to ensure we don't hit RLS snags on public access
    const { data: snapshots, error } = await supabaseAdmin
        .from('print_snapshots')
        .select('*')
        .in('document_hash', hashList);

    if (error || !snapshots || snapshots.length === 0) {
        console.error('Failed to load snapshot:', error);
        return (
            <div className="min-h-screen bg-gray-200 flex flex-col items-center p-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-xl max-w-lg w-full text-center">
                    <h2 className="text-xl font-bold text-red-800 mb-2">ไม่พบข้อมูล หรือ ลิงก์หมดอายุ</h2>
                    <p className="text-red-600 mb-6">รหัสอ้างอิง ({hash}) ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง</p>
                    <PrintButtons showPrint={false} />
                </div>
            </div>
        );
    }

    // 3. Extract payload
    const loadedPatients: Patient[] = [];
    const loadedSignatures: Record<string, { qr_token?: string; signature_text?: string; document_url?: string } | null> = {};
    const loadedVitals: Record<string, Record<string, unknown>> = {};
    let hospitalInfo = null;

    for (const snap of snapshots) {
        const payload = snap.payload as unknown as SnapshotPayload;
        if (payload?.patient) {
            loadedPatients.push(payload.patient);

            if (payload.signature) {
                loadedSignatures[payload.patient.hn] = payload.signature;
            }
            if (payload.vitals) {
                loadedVitals[payload.patient.hn] = payload.vitals;
            }
            if (payload.hospitalInfo && !hospitalInfo) {
                hospitalInfo = payload.hospitalInfo;
            }
        }
    }

    // Convert back arrays for the component (maintain order of hashes)
    loadedPatients.sort((a, b) => {
        const aHash = snapshots.find(s => (s.payload as unknown as SnapshotPayload)?.patient?.hn === a.hn)?.document_hash || '';
        const bHash = snapshots.find(s => (s.payload as unknown as SnapshotPayload)?.patient?.hn === b.hn)?.document_hash || '';
        return hashList.indexOf(aHash) - hashList.indexOf(bHash);
    });

    const displaySubtitle = loadedPatients.length === 1
        ? `HN: ${loadedPatients[0].hn} - ${loadedPatients[0].name} ${loadedPatients[0].surname}`
        : `กำลังดู ${loadedPatients.length} รายการ`;

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex flex-col items-center">
            {/* Print Tools (Hidden when printing) */}
            <div className="w-full bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <PrintButtons showPrint={false} />
                    <div className="ml-2">
                        <h1 className="font-bold text-gray-900">ดู/พิมพ์ ใบส่งตรวจย้อนหลัง (Snapshot Mode)</h1>
                        <p className="text-sm text-gray-500">{displaySubtitle}</p>
                    </div>
                </div>
                <PrintButtons showPrint={true} showBack={false} />
            </div>

            {/* Print Container */}
            <div className="w-full max-w-[210mm] print:max-w-none mx-auto bg-white my-8 print:my-0 shadow-xl print:shadow-none overflow-hidden flex flex-col gap-4">
                <PrintRequestSheet
                    patients={loadedPatients}
                    signatures={loadedSignatures}
                    vitals={loadedVitals}
                    hospitalInfo={hospitalInfo}
                />
            </div>

            <style>{`
                /* Configure the print page format perfectly */
                @media print {
                    @page { 
                        size: A5 landscape; 
                        margin: 0; 
                    }
                    html, body { 
                        background: white !important; 
                        margin: 0; 
                    }
                    /* Ensure no overflow scrollbars ruin the print */
                    body {
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
