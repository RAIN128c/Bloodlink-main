import { supabase } from '@/lib/supabase';

export interface StatusHistoryEntry {
    id: string;
    patientHn: string;
    fromStatus: string;
    toStatus: string;
    changedByEmail: string;
    changedByName?: string;
    changedByRole?: string;
    note?: string;
    createdAt: string;
}

export class StatusHistoryService {
    /**
     * Log a status change to history
     */
    static async logStatusChange(
        patientHn: string,
        fromStatus: string,
        toStatus: string,
        changedByEmail: string,
        changedByName?: string,
        changedByRole?: string,
        note?: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('status_history')
                .insert([{
                    patient_hn: patientHn,
                    from_status: fromStatus,
                    to_status: toStatus,
                    changed_by_email: changedByEmail,
                    changed_by_name: changedByName,
                    changed_by_role: changedByRole,
                    note: note || null
                }]);

            if (error) {
                console.error('Error logging status change:', error);
                return false;
            }

            console.log(`[StatusHistory] Logged: ${patientHn} ${fromStatus} → ${toStatus} by ${changedByEmail}`);
            return true;
        } catch (error) {
            console.error('Error logging status change:', error);
            return false;
        }
    }

    /**
     * Get status history for a patient
     */
    static async getHistoryByHn(patientHn: string): Promise<StatusHistoryEntry[]> {
        try {
            const { data, error } = await supabase
                .from('status_history')
                .select('*')
                .eq('patient_hn', patientHn)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching status history:', error);
                return [];
            }

            return (data || []).map(row => ({
                id: row.id,
                patientHn: row.patient_hn,
                fromStatus: row.from_status,
                toStatus: row.to_status,
                changedByEmail: row.changed_by_email,
                changedByName: row.changed_by_name,
                changedByRole: row.changed_by_role,
                note: row.note,
                createdAt: row.created_at
            }));
        } catch (error) {
            console.error('Error fetching status history:', error);
            return [];
        }
    }

    /**
     * Get the timestamp when a specific status was reached
     * Used for timeline display
     */
    static async getStatusTimestamp(patientHn: string, status: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('status_history')
                .select('created_at')
                .eq('patient_hn', patientHn)
                .eq('to_status', status)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return null;
            }

            return data.created_at;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get timeline data with timestamps for each completed status
     */
    static async getTimelineData(patientHn: string): Promise<Map<string, { timestamp: string; changedBy: string; role?: string }>> {
        const history = await this.getHistoryByHn(patientHn);
        const timeline = new Map<string, { timestamp: string; changedBy: string; role?: string }>();

        for (const entry of history) {
            // Store the latest entry for each toStatus
            timeline.set(entry.toStatus, {
                timestamp: entry.createdAt,
                changedBy: entry.changedByName || entry.changedByEmail,
                role: entry.changedByRole
            });
        }

        return timeline;
    }
}
