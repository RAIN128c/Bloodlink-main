import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Attempt to connect to a reliable external service to verify internet connectivity
        // We use a simple fetch to 1.1.1.1 (Cloudflare) or fallback to google
        // Using fetch with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        // HEAD request to a highly available external service
        // Using 1.1.1.1 or 8.8.8.8 (DNS) is reliable
        // But fetch requires http/https
        // Let's try fetching a tiny resource or just google
        await fetch('https://www.google.com', {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeoutId);
        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        // If we can't reach the internet, return error
        return new NextResponse('No Internet Connection', { status: 503 });
    }
}
