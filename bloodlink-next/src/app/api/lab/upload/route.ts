import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Permissions } from '@/lib/permissions';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getClientIp(req);
        const rateLimitResult = checkRateLimit(`lab-upload:${ip}`, RATE_LIMIT_CONFIGS.upload);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many uploads. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetInMs / 1000)) } }
            );
        }

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Lab Staff or Admin can upload lab results
        if (!Permissions.canEditLab(session.user.role) && !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Lab Staff or Admin only' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const hn = formData.get('hn') as string;
        const patientName = formData.get('patientName') as string;
        const resultSummary = formData.get('resultSummary') as string;

        if (!file || !hn) {
            return NextResponse.json({ error: 'File and HN are required' }, { status: 400 });
        }

        // Set default result summary if not provided
        const finalResultSummary = resultSummary || 'รอตรวจสอบ';

        // Validate file size (20MB limit for lab reports)
        const MAX_FILE_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 20MB.' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF.' }, { status: 400 });
        }

        // Upload to Private Bucket
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop() || 'bin';
        const fileName = `${hn}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('lab_reports')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Lab report upload error:', uploadError);
            return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
        }

        // Create lab_results record
        const { error: dbError } = await supabaseAdmin
            .from('lab_results')
            .insert({
                hn,
                timestamp: new Date().toISOString(),
                patient_name: patientName || null,
                file_url: fileName,
                file_type: file.type,
                result_summary: finalResultSummary,
                reporter_name: session.user.name || session.user.email,
            });

        if (dbError) {
            console.error('Lab result insert error:', dbError);
            // Cleanup uploaded file on DB error
            await supabaseAdmin.storage.from('lab_reports').remove([fileName]);
            return NextResponse.json({ error: 'Failed to save lab result' }, { status: 500 });
        }

        // Update patient process status to 'ส่งผลตรวจ' (Results Submitted)
        // This triggers the "ผลตรวจเลือด" badge in the sidebar notification system.
        // Doctor/Nurse will then approve → 'เสร็จสิ้น' → print → 'รายงานผล'
        const { error: patientError } = await supabaseAdmin
            .from('patients')
            .update({ process: 'ส่งผลตรวจ', updated_at: new Date().toISOString() })
            .eq('hn', hn);

        if (patientError) {
            console.error('Patient status update error:', patientError);
            // Non-critical - file is already uploaded
        }

        // Send notification to responsible staff
        try {
            const { data: responsibilities } = await supabaseAdmin
                .from('patient_responsibility')
                .select('user_email')
                .eq('patient_hn', hn)
                .eq('is_active', true);

            if (responsibilities && responsibilities.length > 0) {
                // Find user IDs from emails for messaging
                for (const resp of responsibilities) {
                    const { data: user } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('email', resp.user_email)
                        .single();

                    if (user) {
                        // Get sender user ID
                        const { data: sender } = await supabaseAdmin
                            .from('users')
                            .select('id')
                            .eq('email', session.user.email)
                            .single();

                        await supabaseAdmin.from('messages').insert({
                            sender_id: sender?.id || null,
                            receiver_id: user.id,
                            subject: `ผลตรวจเลือด HN: ${hn} พร้อมตรวจสอบ`,
                            content: `มีผลตรวจเลือดของผู้ป่วย HN: ${hn} (${patientName || '-'}) อัปโหลดเรียบร้อยแล้ว

กรุณาตรวจสอบและยืนยันผล: /test-status/${hn}`,
                            type: 'lab_result',
                        });
                    }
                }
            }
        } catch (notifError) {
            console.error('Notification error (non-critical):', notifError);
        }

        return NextResponse.json({
            success: true,
            message: 'Lab result uploaded successfully',
            filePath: fileName,
        });

    } catch (error) {
        console.error('Lab Upload API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// GET: Generate signed URL for viewing a lab report file, OR fetch recent results
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        // Handle fetch recent results
        if (searchParams.get('recent') === 'true') {
            const { data, error } = await supabaseAdmin
                .from('lab_results')
                .select('hn, patient_name, result_summary, timestamp, reporter_name')
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Fetch recent results error:', error);
                return NextResponse.json({ error: 'Failed to fetch recent results' }, { status: 500 });
            }

            // Map DB fields to what components expect
            const mappedResults = data?.map(row => ({
                hn: row.hn,
                patientName: row.patient_name,
                resultSummary: row.result_summary,
                createdAt: row.timestamp,
                reporterName: row.reporter_name
            })) || [];

            return NextResponse.json({ results: mappedResults });
        }

        // Handle generate signed URL
        const filePath = searchParams.get('path');

        if (!filePath) {
            return NextResponse.json({ error: 'File path required' }, { status: 400 });
        }

        // Generate a signed URL (expires in 1 hour)
        const { data, error } = await supabaseAdmin.storage
            .from('lab_reports')
            .createSignedUrl(filePath, 3600);

        if (error || !data) {
            console.error('Signed URL error:', error);
            return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 });
        }

        return NextResponse.json({ url: data.signedUrl });

    } catch (error) {
        console.error('Lab GET API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
