import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const hn = formData.get('hn') as string;
        const type = formData.get('type') as string; // 'request' or 'summary'

        if (!file || !hn || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = new Date().getTime();
        const fileName = `${type}_${hn}_${timestamp}.pdf`;
        const filePath = `${fileName}`;

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
        }

        // Upload to Supabase Storage 'request_sheets' bucket
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('request_sheets')
            .upload(filePath, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('request_sheets')
            .getPublicUrl(filePath);

        const fileUrl = publicUrlData.publicUrl;

        // If it's a request sheet, update the document_signatures table
        if (type === 'request') {
            const { error: dbError } = await supabaseAdmin
                .from('document_signatures')
                .update({ document_url: fileUrl })
                .eq('patient_hn', hn)
                .eq('document_type', 'request_sheet');

            if (dbError) {
                console.error('DB update error:', dbError);
                // Return success but log error
            }
        }

        return NextResponse.json({
            success: true,
            url: fileUrl,
            path: filePath
        });

    } catch (error: any) {
        console.error('PDF Upload API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
