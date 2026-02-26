'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Appointment } from '@/lib/services/appointmentService';
import { revalidatePath } from 'next/cache';

export async function createAppointmentAction(data: Appointment): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        let start_time = null;
        if (data.appointment_date) {
            // "10:00" -> "10:00:00"
            const timeStr = data.appointment_time ? (data.appointment_time.length === 5 ? `${data.appointment_time}:00` : data.appointment_time) : '00:00:00';
            start_time = `${data.appointment_date}T${timeStr}+07:00`;
        }

        const dbData = {
            patient_hn: data.patient_hn,
            title: data.type || 'นัดหมาย',
            description: data.note,
            start_time: start_time,
            weight: data.weight,
            height: data.height,
            waist: data.waist,
            bp: data.bp,
            bp2: data.bp2,
            rr: data.rr,
            historical_labs: data.historical_labs || {},
            pulse: data.pulse,
            temperature: data.temperature,
            dtx: data.dtx
        };

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('appointments')
            .insert([dbData])
            .select()
            .single();

        if (insertError) {
            console.error('Insert Appointment Admin Error:', insertError);
            return { success: false, error: insertError.message };
        }

        // Update patient's latest appointment info (Sync)
        const { error: updateError } = await supabaseAdmin
            .from('patients')
            .update({
                appointment_date: data.appointment_date,
                process: 'นัดหมาย',
                updated_at: new Date().toISOString()
            })
            .eq('hn', data.patient_hn);

        if (updateError) {
            console.warn('Failed to sync patient appointment date in admin action:', updateError);
        }

        revalidatePath('/history');
        revalidatePath(`/history/${data.patient_hn}`);

        return { success: true, id: insertData.id };
    } catch (error) {
        console.error('Error creating appointment via admin:', error);
        return { success: false, error: 'System error' };
    }
}

export async function updateAppointmentStatusAction(id: string, status: string, vitals?: Partial<Appointment>): Promise<boolean> {
    try {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            status: status
        };

        if (vitals) {
            if (vitals.weight !== undefined) updateData.weight = vitals.weight;
            if (vitals.height !== undefined) updateData.height = vitals.height;
            if (vitals.waist !== undefined) updateData.waist = vitals.waist;
            if (vitals.bp !== undefined) updateData.bp = vitals.bp;
            if (vitals.bp2 !== undefined) updateData.bp2 = vitals.bp2;
            if (vitals.rr !== undefined) updateData.rr = vitals.rr;
            if (vitals.historical_labs !== undefined) updateData.historical_labs = vitals.historical_labs;
            if (vitals.pulse !== undefined) updateData.pulse = vitals.pulse;
            if (vitals.temperature !== undefined) updateData.temperature = vitals.temperature;
            if (vitals.dtx !== undefined) updateData.dtx = vitals.dtx;
        }

        const { error } = await supabaseAdmin
            .from('appointments')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Update appointment status admin error:', error);
            return false;
        }

        revalidatePath('/history');

        return true;
    } catch (error) {
        console.error('Update status admins exception:', error);
        return false;
    }
}
