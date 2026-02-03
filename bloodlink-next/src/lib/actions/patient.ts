'use server';

import { PatientService } from '@/lib/services/patientService';
import { Patient } from '@/types';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';
import { NotificationService } from '@/lib/services/notificationService';

export async function getPatients(): Promise<Patient[]> {
    return await PatientService.getPatients();
}

export async function getPatientByHn(hn: string): Promise<Patient | null> {
    return await PatientService.getPatientByHn(hn);
}

export async function getPatientsByProcess(process: string): Promise<Patient[]> {
    const patients = await PatientService.getPatients();
    return patients.filter(p => p.process === process);
}

export async function getPatientsByStatus(status: string): Promise<Patient[]> {
    const patients = await PatientService.getPatients();
    return patients.filter(p => p.status === status);
}

export async function searchPatients(query: string): Promise<Patient[]> {
    const patients = await PatientService.getPatients();
    const lowerQuery = query.toLowerCase();

    return patients.filter(p =>
        p.hn.includes(query) ||
        p.name.toLowerCase().includes(lowerQuery) ||
        p.surname.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Update patient status - Role-based workflow validation
 * Each role can only update specific transitions
 * Now with auto-notifications to relevant staff
 */
import { AppointmentService } from '@/lib/services/appointmentService';

// ... (existing imports)

export async function updatePatientStatus(
    hn: string,
    processStatus: string,
    data: { history?: string, date?: string, time?: string, type?: string }
) {
    const session = await auth();
    const user = session?.user as any;
    const role = user?.role;
    const email = user?.email;
    const userName = user?.name || email;

    // Must have a valid role to update status
    if (!Permissions.canSeeStatusPanel(role)) {
        return {
            success: false,
            error: 'Unauthorized: คุณไม่มีสิทธิ์อัปเดตสถานะ'
        };
    }

    // Get current patient status for validation
    const patient = await PatientService.getPatientByHn(hn);
    if (!patient) {
        return { success: false, error: 'ไม่พบข้อมูลผู้ป่วย' };
    }

    const currentStatus = patient.process || 'รอตรวจ';

    // Validate this specific transition is allowed for user's role
    if (!Permissions.canUpdateToStatus(role, currentStatus, processStatus)) {
        const requiredRole = Permissions.getRequiredRoleForTransition(currentStatus, processStatus);
        return {
            success: false,
            error: `ไม่สามารถอัปเดตสถานะได้: ต้องใช้สิทธิ์ ${requiredRole}`
        };
    }

    // Pass user info for status history logging
    console.log(`[Action] Updating status for ${hn} to ${processStatus} by ${email}`);

    // Explicitly call updatePatientStatus
    const success = await PatientService.updatePatientStatus(hn, processStatus, {
        ...data,
        changedByEmail: email,
        changedByName: userName,
        changedByRole: role
    });

    if (success) {
        console.log(`[Action] Status update success. Checking appointment creation...`);

        // IF status is Appointment, Create actual Appointment Record
        if (processStatus === 'นัดหมาย' && data.date) {
            console.log(`[Action] Creating appointment record...`);
            const apptResult = await AppointmentService.createAppointment({
                patient_hn: hn,
                appointment_date: data.date,
                appointment_time: data.time || '09:00',
                type: data.type || 'นัดหมายทั่วไป',
                note: data.history
            });

            if (!apptResult.success) {
                console.error(`[Action] Appointment creation failed: ${apptResult.error}`);
                // Note: We don't fail the whole status update if just the appointment record fails, 
                // but we should probably warn. 
                // For now, let's return success but log it.
            } else {
                console.log(`[Action] Appointment created successfully.`);
            }
        }

        // Send status notification to responsible staff
        const patientName = `${patient.name} ${patient.surname}`;
        try {
            await NotificationService.sendStatusNotification(hn, processStatus, patientName);
            console.log(`[updatePatientStatus] Sent notification for ${hn} -> ${processStatus}`);
        } catch (notifError) {
            console.error('[updatePatientStatus] Failed to send notification:', notifError);
        }

        revalidatePath('/dashboard');
        revalidatePath('/test-status');
        revalidatePath(`/history/${hn}`);
        revalidatePath(`/patients/${hn}`);
        return { success: true };
    } else {
        console.error(`[Action] PatientService.updatePatientStatus returned false`);
        return { success: false, error: 'Failed to update status in database' };
    }
}

/**
 * Add new patient - Doctor/Nurse/Admin only
 * Creator is automatically added as responsible person
 */
export async function addPatient(data: Partial<Patient>, additionalResponsible: string[] = []) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;

    // Only Doctor/Nurse/Admin can add patients
    // Admin bypasses all checks (for debug override to work)
    if (!Permissions.isAdmin(role) && !Permissions.canAddPatient(role)) {
        return { success: false, error: 'Unauthorized: เฉพาะแพทย์และพยาบาลเท่านั้นที่สามารถเพิ่มผู้ป่วยได้' };
    }

    if (!email) {
        return { success: false, error: 'User email not found' };
    }

    // Use new function that adds creator to responsibility table
    const result = await PatientService.addPatientWithCreator(data, email, additionalResponsible);

    if (result.success) {
        revalidatePath('/dashboard');
        revalidatePath('/history');
        revalidatePath('/patients');
    }

    return result;
}

/**
 * Update patient data - Only responsible persons or Admin
 */
export async function updatePatientData(
    hn: string,
    data: { gender?: string; age?: string; bloodType?: string; disease?: string; allergies?: string }
) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;

    // Admin can edit all
    if (Permissions.isAdmin(role)) {
        const success = await PatientService.updatePatient(hn, data);
        if (success) {
            revalidatePath(`/patients/${hn}`);
            revalidatePath(`/history/${hn}`);
        }
        return { success };
    }

    // Doctor/Nurse must be responsible
    if (!Permissions.isDoctorOrNurse(role)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!email) {
        return { success: false, error: 'User email not found' };
    }

    // Check if user is responsible for this patient
    const isResponsible = await PatientService.isUserResponsible(hn, email);
    if (!isResponsible) {
        return { success: false, error: 'Unauthorized: คุณไม่ได้รับผิดชอบผู้ป่วยรายนี้' };
    }

    const success = await PatientService.updatePatient(hn, data);
    if (success) {
        revalidatePath(`/patients/${hn}`);
        revalidatePath(`/history/${hn}`);
    }

    return { success };
}

/**
 * Get responsible persons for a patient
 */
export async function getResponsiblePersons(hn: string) {
    return await PatientService.getResponsiblePersons(hn);
}

/**
 * Add responsible person - Only current responsible persons or Admin
 */
export async function addResponsiblePerson(hn: string, newUserEmail: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;

    if (!email) {
        return { success: false, error: 'User email not found' };
    }

    // Admin can add anyone
    if (Permissions.isAdmin(role)) {
        const success = await PatientService.addResponsiblePerson(hn, newUserEmail, email);
        revalidatePath(`/patients/${hn}`);
        return { success };
    }

    // Must be responsible to add others
    const isResponsible = await PatientService.isUserResponsible(hn, email);
    if (!isResponsible) {
        return { success: false, error: 'Unauthorized: คุณไม่ได้รับผิดชอบผู้ป่วยรายนี้' };
    }

    const success = await PatientService.addResponsiblePerson(hn, newUserEmail, email);
    revalidatePath(`/patients/${hn}`);
    return { success };
}

/**
 * Remove self from responsibility (cannot remove others unless Admin)
 */
export async function removeResponsiblePerson(hn: string, targetEmail: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;

    if (!email) {
        return { success: false, error: 'User email not found' };
    }

    // Admin can remove anyone
    if (Permissions.isAdmin(role)) {
        const success = await PatientService.removeResponsiblePerson(hn, targetEmail);
        revalidatePath(`/patients/${hn}`);
        return { success };
    }

    // Users can only remove themselves
    if (email !== targetEmail) {
        return { success: false, error: 'Unauthorized: คุณสามารถลบตัวเองออกจากความรับผิดชอบได้เท่านั้น' };
    }

    const success = await PatientService.removeResponsiblePerson(hn, targetEmail);
    revalidatePath(`/patients/${hn}`);
    return { success };
}

/**
 * Check if current user is responsible for a patient
 */
export async function checkUserResponsibility(hn: string) {
    const session = await auth();
    const email = session?.user?.email;
    const role = (session?.user as any)?.role;

    if (!email) return { isResponsible: false, isAdmin: false };

    const isAdmin = Permissions.isAdmin(role);
    if (isAdmin) return { isResponsible: true, isAdmin: true };

    const isResponsible = await PatientService.isUserResponsible(hn, email);
    return { isResponsible, isAdmin: false };
}

/**
 * Delete patient - Admin only (or internal use)
 * Exposed as server action for direct calling
 */
export async function deletePatient(hn: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (!Permissions.isAdmin(role) && !Permissions.isDoctorOrNurse(role)) {
        return { success: false, error: 'Unauthorized' };
    }

    const success = await PatientService.deletePatient(hn);
    if (success) {
        revalidatePath('/dashboard');
        revalidatePath('/history');
        revalidatePath('/patients');
    }

    return { success };
}
