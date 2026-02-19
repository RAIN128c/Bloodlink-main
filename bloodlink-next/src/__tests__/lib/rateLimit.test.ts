import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, rateLimitStore, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit'

describe('Rate Limiter', () => {
    beforeEach(() => {
        // Clear the store between tests
        rateLimitStore.clear()
    })

    describe('checkRateLimit', () => {
        it('should allow first request', () => {
            const result = checkRateLimit('test-ip', { maxRequests: 5, windowMs: 60000 })
            expect(result.success).toBe(true)
            expect(result.remaining).toBe(4)
        })

        it('should track remaining requests correctly', () => {
            const config = { maxRequests: 3, windowMs: 60000 }

            const r1 = checkRateLimit('test-ip', config)
            expect(r1.remaining).toBe(2)

            const r2 = checkRateLimit('test-ip', config)
            expect(r2.remaining).toBe(1)

            const r3 = checkRateLimit('test-ip', config)
            expect(r3.remaining).toBe(0)
        })

        it('should block after limit exceeded', () => {
            const config = { maxRequests: 2, windowMs: 60000 }

            checkRateLimit('test-ip', config) // 1st
            checkRateLimit('test-ip', config) // 2nd
            const r3 = checkRateLimit('test-ip', config) // 3rd — blocked

            expect(r3.success).toBe(false)
            expect(r3.remaining).toBe(0)
            expect(r3.resetInMs).toBeGreaterThan(0)
        })

        it('should isolate different identifiers', () => {
            const config = { maxRequests: 1, windowMs: 60000 }

            const r1 = checkRateLimit('ip-1', config)
            const r2 = checkRateLimit('ip-2', config)

            expect(r1.success).toBe(true)
            expect(r2.success).toBe(true)

            // Both should now be blocked
            expect(checkRateLimit('ip-1', config).success).toBe(false)
            expect(checkRateLimit('ip-2', config).success).toBe(false)
        })

        it('should reset after window expires', () => {
            const config = { maxRequests: 1, windowMs: 100 } // 100ms window

            checkRateLimit('test-ip', config)
            expect(checkRateLimit('test-ip', config).success).toBe(false)

            // Manually expire the entry
            const entry = rateLimitStore.get('test-ip')!
            entry.resetTime = Date.now() - 1

            expect(checkRateLimit('test-ip', config).success).toBe(true)
        })

        it('should return positive resetInMs for active entries', () => {
            const config = { maxRequests: 5, windowMs: 60000 }

            const result = checkRateLimit('test-ip', config)
            expect(result.resetInMs).toBeGreaterThan(0)
            expect(result.resetInMs).toBeLessThanOrEqual(60000)
        })
    })

    describe('RATE_LIMIT_CONFIGS', () => {
        it('should have auth config with restrictive limits', () => {
            expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBeLessThanOrEqual(15)
            expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBeGreaterThanOrEqual(60000)
        })

        it('should have upload config', () => {
            expect(RATE_LIMIT_CONFIGS.upload.maxRequests).toBeGreaterThan(0)
            expect(RATE_LIMIT_CONFIGS.upload.windowMs).toBeGreaterThan(0)
        })

        it('should have admin config', () => {
            expect(RATE_LIMIT_CONFIGS.admin.maxRequests).toBeGreaterThan(0)
            expect(RATE_LIMIT_CONFIGS.admin.windowMs).toBeGreaterThan(0)
        })

        it('should have general config', () => {
            expect(RATE_LIMIT_CONFIGS.general.maxRequests).toBeGreaterThan(0)
            expect(RATE_LIMIT_CONFIGS.general.windowMs).toBeGreaterThan(0)
        })
    })
})
