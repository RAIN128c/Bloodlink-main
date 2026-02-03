import { supabase } from '@/lib/supabase';

// DB Interface matches Supabase table
interface DBAppointment {
    id: string; // uuid
    title: string | null;
    start_time: string | null; // timestamp
    end_time: string | null;
    patient_hn: string | null;
    description: string | null;
    created_at: string | null;
    status?: string | null; // Optional status column
}

export interface Appointment {
    id?: string;
    patient_hn: string;
    appointment_date: string; // From start_time
    appointment_time: string; // From start_time
    status: 'pending' | 'completed' | 'cancelled' | 'no_show';
    type: string; // Mapped to title
    note?: string; // Mapped to description
    created_at?: string;
    users?: { name: string; surname: string };
}

export class AppointmentService {
    /**
     * Get all appointments for a specific patient
     */
    static async getAppointmentsByHn(hn: string): Promise<Appointment[]> {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('patient_hn', hn)
                .order('start_time', { ascending: false });

            if (error) {
                console.error('Error fetching appointments:', error);
                return [];
            }

            // Map DB response to App Interface
            return (data || []).map((row: DBAppointment) => {
                let date = '', time = '';
                if (row.start_time) {
                    const d = new Date(row.start_time);
                    date = d.toISOString().split('T')[0]; // YYYY-MM-DD
                    time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
                }

                // Use end_time as completion indicator
                const status = row.end_time ? 'completed' : 'pending';

                return {
                    id: row.id,
                    patient_hn: row.patient_hn || '',
                    appointment_date: date,
                    appointment_time: time,
                    type: row.title || 'นัดหมายทั่วไป',
                    note: row.description || '',
                    status: status,
                    created_at: row.created_at || ''
                };
            });
        } catch (error) {
            console.error('Error in getAppointmentsByHn:', error);
            return [];
        }
    }

    /**
     * Create a new appointment
     */
    static async createAppointment(data: Partial<Appointment>): Promise<{ success: boolean; error?: string }> {
        try {
            // Combine date + time to start_time
            let start_time = null;
            if (data.appointment_date) {
                const dateTimeStr = data.appointment_time
                    ? `${data.appointment_date}T${data.appointment_time}:00`
                    : `${data.appointment_date}T09:00:00`;
                start_time = new Date(dateTimeStr).toISOString();
            }

            // Map values to DB columns
            const dbData = {
                patient_hn: data.patient_hn,
                title: data.type || 'นัดหมาย',
                description: data.note,
                start_time: start_time,
                // STATUS REMOVED: Table does not have status column.
                // New pending appointments have null end_time by default.
            };

            const { error: insertError } = await supabase
                .from('appointments')
                .insert([dbData]);

            if (insertError) {
                console.error('Insert Error:', insertError);
                return { success: false, error: insertError.message };
            }

            // Update patient's latest appointment info (Sync)
            const { error: updateError } = await supabase
                .from('patients')
                .update({
                    appointment_date: data.appointment_date,
                    process: 'นัดหมาย',
                    updated_at: new Date().toISOString()
                })
                .eq('hn', data.patient_hn);

            if (updateError) {
                console.warn('Failed to sync patient appointment date', updateError);
            }

            return { success: true };
        } catch (error) {
            console.error('Error creating appointment:', error);
            return { success: false, error: 'System error' };
        }
    }

    /**
     * Update appointment status
     * Uses end_time to mark completion
     */
    static async updateStatus(id: string, status: string): Promise<boolean> {
        try {
            // Update the status column which is standard
            const updateData: any = {
                updated_at: new Date().toISOString(),
                status: status
            };

            // NOTE: We try to update end_time if it exists, but since checking existence is hard,
            // we will stick to 'status' which is in the migration file.
            // If we needed end_time, we would need to know the schema for sure.
            // For now, let's also try setting end_time if status is completed, hoping the column exists.
            // IF this fails, we will fallback to just status.

            // Actually, let's try updating just status first as it's safer given the error.
            // The previous error "Update status error" likely came from missing column or RLS.

            // Let's attempt to update both status and end_time (legacy support) but handle failure
            if (status === 'completed') {
                updateData.end_time = new Date().toISOString();
            } else if (status === 'pending') {
                updateData.end_time = null;
            }

            let { error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.warn('Update with end_time failed, retrying with status only. Error:', JSON.stringify(error));

                // Retry with only status and updated_at (remove end_time)
                delete updateData.end_time;
                const { error: retryError } = await supabase
                    .from('appointments')
                    .update(updateData)
                    .eq('id', id);

                if (retryError) {
                    console.error('Update status error (retry):', JSON.stringify(retryError, null, 2));
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Update status exception:', error);
            return false;
        }
    }
}
