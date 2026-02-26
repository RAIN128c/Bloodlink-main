import { supabaseAdmin } from '@/lib/supabase-admin';
import { ShieldCheck, Calendar, User, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatDateThai } from '@/lib/utils';
import Link from 'next/link';

interface VerifyPageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
    const { token } = await params;

    // --- PDPA Masking Utilities ---
    const maskEmail = (email: string) => {
        if (!email) return '-';
        const [local, domain] = email.split('@');
        if (!domain || local.length <= 3) return email;
        return `${local[0]}********${local.slice(-2)}@${domain}`;
    };

    const maskName = (name: string) => {
        if (!name) return '-';
        const parts = name.split(' ');
        if (parts.length < 2) return name;
        const surname = parts[1];
        const maskedSurname = surname ? `${surname[0]}***` : '';
        return `${parts[0]} ${maskedSurname} ${parts.slice(2).join(' ')}`.trim();
    };

    const maskHN = (hn: string) => {
        if (!hn) return '-';
        if (hn.length < 4) return hn;
        return `${hn.slice(0, 2)}*****${hn.slice(-2)}`;
    };

    const maskID = (id: string) => {
        if (!id || id === '-') return id;
        if (id.length <= 3) return id;
        return `**${id.slice(-3)}`;
    };

    const maskToken = (t: string) => {
        if (!t) return '-';
        const parts = t.split('-');
        if (parts.length === 1) return t; // not a UUID?
        return parts.map((p, i) => (i === 0 || i === parts.length - 1) ? p : '*'.repeat(p.length)).join('-');
    };

    const maskPayload = (payload: string) => {
        if (!payload) return '-';
        // Payload has format: [Digitally Signed by: Name Surname (Role) | Pro. ID: XXXXX | Ref: UUID]
        // Let's just do a simple regex or string replace to hide Pro. ID and UUID parts
        let masked = payload;
        // Mask ID
        masked = masked.replace(/Pro\. ID:\s*([^\s|\]]+)/g, (match, p1) => `Pro. ID: ${maskID(p1)}`);
        // Mask Ref
        masked = masked.replace(/Ref:\s*([^\s|\]]+)/g, (match, p1) => `Ref: ${maskToken(p1)}`);
        // Mask Name/Surname in Payload (a bit tricky due to format, but let's just leave Name or apply a simple replace if possible, but the signature text itself is already proof)
        // For PDPA, obscuring ID and Ref is usually enough for the payload block, or we can just mask the whole string
        return masked;
    };
    // ------------------------------

    // Fetch signature using supabaseAdmin to bypass RLS since this is a public verification page
    const { data: signature, error } = await supabaseAdmin
        .from('document_signatures')
        .select('*')
        .eq('qr_token', token)
        .maybeSingle();

    if (error) console.error("Verify Page Error:", error);

    if (!signature) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลลายมือชื่อ</h1>
                    <p className="text-gray-500 mb-8">
                        รหัสอ้างอิงนี้ไม่ถูกต้อง หรือเอกสารอาจถูกยกเลิกไปแล้ว กรุณาตรวจสอบ QR Code อีกครั้ง
                    </p>
                    <Link href="/" className="inline-block bg-gray-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors">
                        กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    // Since we didn't setup foreign key for users explicitly in the planner, 
    // let's fetch the user manually if the join fails or just safely use the email.
    let signerName = signature.signer_email;
    let signerRole = signature.signer_role === 'sender' ? 'ผู้ส่งตรวจ (รพ.สต.)' : 'ผู้รับตรวจ (Lab)';
    let professionalId = '-';

    // If join worked
    if (signature.users) {
        signerName = `${signature.users.name} ${signature.users.surname || ''}`;
        signerRole = signature.users.role;
        professionalId = signature.users.professional_id || '-';
    } else {
        // Fallback fetch
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('name, surname, role, professional_id')
            .eq('email', signature.signer_email)
            .single();

        if (user) {
            signerName = `${user.name} ${user.surname || ''}`;
            signerRole = user.role;
            professionalId = user.professional_id || '-';
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-md mb-4 shadow-inner">
                            <ShieldCheck className="w-16 h-16 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">ลายมือชื่ออิเล็กทรอนิกส์ถูกต้อง</h1>
                        <p className="text-emerald-50 font-medium text-lg opacity-90">
                            เอกสารฉบับนี้ได้รับการลงนามทางอิเล็กทรอนิกส์ผ่านระบบ Bloodlink
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Signer Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">ข้อมูลผู้ลงนาม</h3>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-1">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">ชื่อ-สกุล / อีเมล</p>
                                    <p className="font-bold text-gray-900 text-lg">{maskName(signerName)}</p>
                                    <p className="text-sm text-gray-600">{maskEmail(signature.signer_email)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0 mt-1">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">ตำแหน่ง / เลขประกอบวิชาชีพ</p>
                                    <p className="font-bold text-gray-900">{signerRole}</p>
                                    <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">ID: {maskID(professionalId)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">ข้อมูลเอกสาร</h3>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-1">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">ประเภทเอกสาร</p>
                                    <p className="font-bold text-gray-900">
                                        {signature.document_type === 'request_sheet' ? 'ใบส่งตรวจทางห้องปฏิบัติการ (Request Sheet)' : signature.document_type}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">HN ผู้ป่วย: <span className="font-mono font-bold">{maskHN(signature.patient_hn)}</span></p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-1">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">วันเวลาที่ลงนาม</p>
                                    <p className="font-bold text-gray-900">{formatDateThai(signature.created_at)}</p>
                                    <p className="text-sm text-gray-600 mt-1">IP: {signature.ip_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authenticity Hash / Log Block */}
                    <div className="mt-10 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <h4 className="font-bold text-gray-900">บันทึกธุรกรรมอิเล็กทรอนิกส์</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            ลายมือชื่อนี้ถูกสร้างและบันทึกด้วยการยืนยันตัวตนผ่านรหัสผ่านส่วนตัว (PIN)
                            ระบบได้บันทึก IP Address และประทับเวลา (Timestamp) ไว้เป็นหลักฐานเพื่อการตรวจสอบย้อนหลัง
                            ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์
                        </p>
                        <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg overflow-x-auto">
                            Payload: {maskPayload(signature.signature_text)}
                            <br />
                            Token: {maskToken(signature.qr_token)}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <span>Bloodlink E-Document System</span>
                    <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        หน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
