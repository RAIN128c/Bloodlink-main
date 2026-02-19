'use server';

import { LabService, LabResult } from '@/lib/services/labService';

export async function importLabResults(results: LabResult[]) {
    try {
        const output = await LabService.processBatchImport(results, true); // Enable auto-status update
        return { success: true as const, ...output };
    } catch (error: any) {
        console.error('Import error:', error);
        return { success: false as const, error: error.message };
    }
}
