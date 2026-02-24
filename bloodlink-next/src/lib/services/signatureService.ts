import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export class SignatureService {
    static async verifyPin(email: string, pin: string): Promise<boolean> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('pin_hash')
                .eq('email', email)
                .single();

            if (error || !user || !user.pin_hash) {
                return false;
            }

            return await bcrypt.compare(pin, user.pin_hash);
        } catch (error) {
            console.error('Verify PIN error:', error);
            return false;
        }
    }

    static async getSignatureForPatient(hn: string, documentType: string = 'request_sheet') {
        try {
            const { data, error } = await supabase
                .from('document_signatures')
                .select('signature_text, qr_token, signed_at')
                .eq('patient_hn', hn)
                .eq('document_type', documentType)
                .order('signed_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code !== 'PGRST116') { // not found
                    console.error('Fetch signature error:', error);
                }
                return null;
            }

            return data;
        } catch (error) {
            console.error('Get signature error:', error);
            return null;
        }
    }

    static async createSignature(data: {
        document_type: string;
        patient_hn: string;
        signer_email: string;
        signer_role: string;
    }): Promise<{ success: boolean; token?: string; error?: string }> {
        try {
            // Fetch signer info for the digital stamp text
            const { data: user } = await supabase
                .from('users')
                .select('name, surname, role, professional_id')
                .eq('email', data.signer_email)
                .single();

            if (!user) {
                return { success: false, error: 'ไม่พบข้อมูลผู้ลงนาม' };
            }

            if (!user.professional_id) {
                return { success: false, error: 'กรุณาระบุเลขใบประกอบวิชาชีพในโปรไฟล์ก่อนลงนาม' };
            }

            const qrToken = crypto.randomUUID();

            // Format: [Digitally Signed by: Name Surname (Role) | Pro. ID: XXXX | Ref: UUID]
            const signatureText = `[Digitally Signed by: ${user.name} ${user.surname || ''} (${user.role}) | Pro. ID: ${user.professional_id} | Ref: ${qrToken}]`;

            const { error: insertError } = await supabase
                .from('document_signatures')
                .insert([{
                    document_type: data.document_type,
                    patient_hn: data.patient_hn,
                    signer_email: data.signer_email,
                    signer_role: data.signer_role,
                    signature_text: signatureText,
                    qr_token: qrToken,
                    ip_address: 'System'
                }]);

            if (insertError) {
                console.error('Insert signature error:', insertError);
                return { success: false, error: 'ไม่สามารถบันทึกลายมือชื่ออิเล็กทรอนิกส์ได้' };
            }

            return { success: true, token: qrToken };
        } catch (error) {
            console.error('Create signature error:', error);
            return { success: false, error: 'เกิดข้อผิดพลาดในการลงนาม' };
        }
    }
}
