/**
 * In-memory sliding window rate limiter
 * No external dependencies required
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetInMs: number;
}

// In-memory store — keyed by identifier (IP or route+IP)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Auto-cleanup interval (every 60s, remove expired entries)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
    if (cleanupInterval) return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now >= entry.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 60_000);
    // Prevent the interval from keeping the process alive in tests/serverless
    if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
        cleanupInterval.unref();
    }
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    startCleanup();

    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // If no entry or window expired, create fresh entry
    if (!entry || now >= entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetInMs: config.windowMs,
        };
    }

    // Within window — increment count
    entry.count++;

    if (entry.count > config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetInMs: entry.resetTime - now,
        };
    }

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetInMs: entry.resetTime - now,
    };
}

/**
 * Get client IP from request headers (supports proxies)
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }
    return '127.0.0.1';
}

// Preset configs for different route types
export const RATE_LIMIT_CONFIGS = {
    /** Auth routes (login, register): 10 attempts per 15 minutes */
    auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
    /** Upload routes: 20 uploads per 15 minutes */
    upload: { maxRequests: 20, windowMs: 15 * 60 * 1000 },
    /** Admin routes: 60 requests per minute */
    admin: { maxRequests: 60, windowMs: 60 * 1000 },
    /** General API: 100 requests per minute */
    general: { maxRequests: 100, windowMs: 60 * 1000 },
} as const;

// Export for testing
export { rateLimitStore };
