import { createClient } from '@/utils/supabase/server';
import { PatientService } from '@/lib/services/patientService';
import { PrintRequestSheet } from '@/components/features/history/PrintRequestSheet';
import { PrintButtons } from './PrintButtons';
import { Patient } from '@/types';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';

interface PrintPageProps {
    params: Promise<{ hn: string }>;
}

export default async function PrintRequestSheetPage({ params }: PrintPageProps) {
    const { hn } = await params;
    const decodedHn = decodeURIComponent(hn);
    const hnList = decodedHn.split(',').map(h => h.trim()).filter(Boolean);

    if (hnList.length === 0) {
        return (
            <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900 flex flex-col items-center max-w-sm text-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ข้อมูลไม่ถูกต้อง</h2>
                    <p className="text-red-600 dark:text-red-400 font-medium mb-6">ไม่พบรหัส HN</p>
                    <PrintButtons showPrint={false} />
                </div>
            </div>
        );
    }

    const supabase = await createClient();

    const loadedPatients: Patient[] = [];
    const loadedSignatures: Record<string, { qr_token?: string; signature_text?: string; document_url?: string } | null> = {};
    const loadedVitals: Record<string, Record<string, unknown>> = {};

    let hospitalInfo = undefined;
    const session = await auth();
    if (session?.user?.email) {
        const currentUser = await AuthService.getUserByEmail(session.user.email);
        if (currentUser) {
            hospitalInfo = {
                hospitalType: currentUser.hospitalType,
                hospitalName: currentUser.hospitalName,
                district: currentUser.district,
                province: currentUser.province
            };
        }
    }

    let errorMessage = '';

    try {
        await Promise.all(hnList.map(async (currentHn) => {
            // 1. Fetch Patient
            const patient = await PatientService.getPatientByHn(currentHn, supabase);
            if (!patient) {
                throw new Error(`ไม่พบข้อมูลผู้ป่วย HN: ${currentHn}`);
            }
            loadedPatients.push(patient);

            // 2. Fetch Signature
            const { data: sig } = await supabase
                .from('document_signatures')
                .select('*')
                .eq('patient_hn', currentHn)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (sig && sig.signature_text) {
                loadedSignatures[currentHn] = {
                    qr_token: sig.qr_token,
                    signature_text: sig.signature_text,
                    document_url: sig.document_url
                };
            }

            // 3. Fetch Vitals (from appointments)
            const { data: vit } = await supabase
                .from('appointments')
                .select('start_time, weight, height, waist, bp, pulse, temperature, dtx')
                .eq('patient_hn', currentHn)
                .order('start_time', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (vit) {
                // Formatting time explicitly to match old logic
                let time = '';
                if (vit.start_time) {
                    const d = new Date(vit.start_time);
                    time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
                }
                loadedVitals[currentHn] = {
                    ...vit,
                    appointment_time: time
                } as Record<string, unknown>;
            }

            // 4. Fetch Creator Name (who set it to รอแล็บรับเรื่อง)
            const { data: creatorHistory } = await supabase
                .from('status_history')
                .select('changed_by_name')
                .eq('patient_hn', currentHn)
                .eq('to_status', 'รอแล็บรับเรื่อง')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (creatorHistory && creatorHistory.changed_by_name) {
                patient.creatorEmail = creatorHistory.changed_by_name;
            }
        }));
    } catch (err: unknown) {
        errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    }

    if (errorMessage || loadedPatients.length === 0) {
        return (
            <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900 flex flex-col items-center max-w-sm text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ไม่สามารถโหลดข้อมูลได้</h2>
                    <p className="text-red-600 dark:text-red-400 font-medium mb-6">{errorMessage || 'ไม่พบข้อมูลผู้ป่วย'}</p>
                    <PrintButtons showPrint={false} />
                </div>
            </div>
        );
    }

    // Sort to maintain requested order
    loadedPatients.sort((a, b) => hnList.indexOf(a.hn) - hnList.indexOf(b.hn));

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex flex-col items-center">
            {/* Print Tools (Hidden when printing) */}
            <div className="w-full bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <PrintButtons showPrint={false} />
                    <div className="ml-2">
                        <h1 className="font-bold text-gray-900">ดู/พิมพ์ ใบส่งตรวจ (Request Sheet)</h1>
                        {loadedPatients.length === 1 ? (
                            <p className="text-sm text-gray-500">HN: {loadedPatients[0].hn} - {loadedPatients[0].name} {loadedPatients[0].surname}</p>
                        ) : (
                            <p className="text-sm text-gray-500">กำลังดู {loadedPatients.length} รายการ</p>
                        )}
                    </div>
                </div>
                <PrintButtons showPrint={true} showBack={false} />
            </div>

            {/* Print Container */}
            <div className="w-full max-w-[210mm] print:max-w-none mx-auto bg-white my-8 print:my-0 shadow-xl print:shadow-none overflow-hidden flex flex-col gap-4">
                <PrintRequestSheet
                    patients={loadedPatients}
                    signatures={Object.keys(loadedSignatures).length > 0 ? loadedSignatures : undefined}
                    vitals={Object.keys(loadedVitals).length > 0 ? loadedVitals : undefined}
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
        </div >
    );
}
