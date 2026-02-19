import { handlers } from "@/auth";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';

export const { GET } = handlers;

// Wrap POST handler with rate limiting for login attempts
export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const result = checkRateLimit(`auth:${ip}`, RATE_LIMIT_CONFIGS.auth);

    if (!result.success) {
        return NextResponse.json(
            { error: 'Too many login attempts. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil(result.resetInMs / 1000)) } }
        );
    }

    return handlers.POST(req);
}
