'use server';

import { LabService } from '@/lib/services/labService';

export async function getLabResultsForExport() {
    try {
        const data = await LabService.getAllLabResults(1000); // Fetch last 1000 records
        return { success: true, data };
    } catch (error: any) {
        console.error('Export error:', error);
        return { success: false, error: error.message };
    }
}
