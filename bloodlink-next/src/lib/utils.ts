import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDisplayId(userId: string | undefined, role: string | undefined): string {
    if (!userId) return '-';

    // Pad ID with zeros (e.g. 1 -> 001)
    const paddedId = userId.padStart(3, '0');

    const roleLower = role?.toLowerCase() || '';

    if (roleLower.includes('doctor') || roleLower.includes('แพทย์')) {
        return `DOC-${paddedId}`;
    }

    if (roleLower.includes('nurse') || roleLower.includes('พยาบาล')) {
        return `NUR-${paddedId}`;
    }

    if (roleLower.includes('lab') || roleLower.includes('แลป') || roleLower.includes('ปฏิบัติการ')) {
        return `LAB-${paddedId}`;
    }

    // Default for other staff
    return `STF-${paddedId}`;
}

/**
 * Format ISO timestamp to user-friendly format in user's local timezone
 * @param isoString - ISO 8601 timestamp string (e.g., "2025-12-11T23:32:38.583+00:00")
 * @param options - Formatting options
 * @returns Formatted date string in Thai locale
 */
export function formatDateTime(
    isoString: string | undefined | null,
    options: {
        includeTime?: boolean;
        short?: boolean;
    } = {}
): string {
    if (!isoString || isoString === '-') return '-';

    try {
        const date = new Date(isoString);

        // Check if valid date
        if (isNaN(date.getTime())) return isoString;

        const { includeTime = true, short = false } = options;

        if (short) {
            // Short format: DD/MM/YYYY
            return date.toLocaleDateString('th-TH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        if (includeTime) {
            // Full format with time: DD/MM/YYYY HH:mm
            return date.toLocaleString('th-TH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        // Date only: DD เดือน YYYY
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return isoString;
    }
}

/**
 * Format date for display in Thai format (วัน/เดือน/ปี)
 */
export function formatDateThai(dateString: string | undefined | null): string {
    return formatDateTime(dateString, { includeTime: false, short: true });
}

/**
 * Format date and time for display in Thai format
 */
export function formatDateTimeThai(dateString: string | undefined | null): string {
    return formatDateTime(dateString, { includeTime: true });
}

