import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getClientIp(req);
        const rateLimitResult = checkRateLimit(`upload:${ip}`, RATE_LIMIT_CONFIGS.upload);
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

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file size (50MB limit)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage using Admin Client (Bypasses RLS)
        const { error } = await supabaseAdmin.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('Supabase storage error:', error);
            return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 });
        }

        // Get Public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl
        });

    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
