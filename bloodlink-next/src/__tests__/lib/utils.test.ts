import { describe, it, expect } from 'vitest'
import { formatDateThai, formatDateTimeThai } from '@/lib/utils'

describe('Utils', () => {
    describe('formatDateThai', () => {
        it('should format date string correctly', () => {
            const date = '2024-01-15'
            const result = formatDateThai(date)
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })

        it('should handle invalid date', () => {
            const result = formatDateThai('')
            expect(result).toBe('-')
        })
    })

    describe('formatDateTimeThai', () => {
        it('should format datetime string correctly', () => {
            const datetime = '2024-01-15T10:30:00'
            const result = formatDateTimeThai(datetime)
            expect(result).toBeTruthy()
            expect(typeof result).toBe('string')
        })
    })
})
