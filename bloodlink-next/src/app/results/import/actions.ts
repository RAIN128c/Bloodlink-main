'use server';

import { LabService, LabResult } from '@/lib/services/labService';

export async function importLabResults(results: LabResult[]) {
    try {
        const output = await LabService.processBatchImport(results, true); // Enable auto-status update
        return { success: true, ...output };
    } catch (error: any) {
        console.error('Import error:', error);
        return { success: false, error: error.message };
    }
}
