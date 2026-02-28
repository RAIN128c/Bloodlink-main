'use server';

import { PatientService } from '@/lib/services/patientService';
import { Patient } from '@/types';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';
import { SignatureService } from '@/lib/services/signatureService';
import { AppointmentService } from '@/lib/services/appointmentService';
import { supabaseAdmin } from '@/lib/supabase-admin';

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



export async function updatePatientStatus(
    hn: string,
    processStatus: string,
    data: {
        history?: string,
        date?: string,
        time?: string,
        type?: string,
        pin?: string,
        // Vital Signs
        weight?: string,
        height?: string,
        waist?: string,
        bp?: string,
        pulse?: string,
        temperature?: string,
        dtx?: string
    }
) {
    const session = await auth();
    const user = session?.user as { role?: string, email?: string, name?: string };
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

    // Validations for E-Signature Workflow (Sender & Receiver)
    const eSignatureStatuses = ['รอแล็บรับเรื่อง', 'รับออร์เดอร์', 'กำลังตรวจ'];
    let signatureToken = null;

    if (eSignatureStatuses.includes(processStatus)) {
        if (!data.pin) {
            return { success: false, error: 'กรุณาระบุรหัส PIN 6 หลักสำหรับการลงนามอิเล็กทรอนิกส์' };
        }

        // Verify PIN
        const isValidPin = await SignatureService.verifyPin(email as string, data.pin as string);
        if (!isValidPin) {
            return { success: false, error: 'รหัส PIN ไม่ถูกต้อง' };
        }
    }

    // Pass user info for status history logging

    // Explicitly call updatePatientStatus
    const success = await PatientService.updatePatientStatus(hn, processStatus, {
        ...data,
        changedByEmail: email,
        changedByName: userName,
        changedByRole: role
    });

    if (success) {

        // Extract Vitals
        const vitals = {
            weight: data.weight,
            height: data.height,
            waist: data.waist,
            bp: data.bp,
            pulse: data.pulse,
            temperature: data.temperature,
            dtx: data.dtx
        };

        // IF status is Appointment, Create actual Appointment Record
        if (processStatus === 'นัดหมาย' && data.date) {
            const apptResult = await AppointmentService.createAppointment({
                patient_hn: hn,
                appointment_date: data.date,
                appointment_time: data.time || '09:00',
                type: data.type || 'นัดหมายทั่วไป',
                note: data.history
            });

            if (!apptResult.success) {
                console.error(`[Action] Appointment creation failed: ${apptResult.error}`);
            }
        }

        // IF status is 'รอแล็บรับเรื่อง' (Lab Processing Started), Capture Vitals
        if (processStatus === 'รอแล็บรับเรื่อง') {

            // Check if there is an active pending appointment to attach these vitals to
            const pendingAppts = await AppointmentService.getAppointmentsByHn(hn);
            const activeAppt = pendingAppts.find(a => a.status === 'pending');

            if (activeAppt && activeAppt.id) {
                // Update existing appointment with V/S and set to completed
                await AppointmentService.updateStatus(activeAppt.id, 'completed', vitals);

                // Cancel any other lingering ones
                for (const appt of pendingAppts) {
                    if (appt.id && appt.id !== activeAppt.id && appt.status === 'pending') {
                        await AppointmentService.updateStatus(appt.id, 'cancelled');
                    }
                }
            } else {
                // Walk-in scenario: Create a completed appointment right now to hold the V/S
                const today = new Date();
                const apptResult = await AppointmentService.createAppointment({
                    patient_hn: hn,
                    appointment_date: today.toISOString().split('T')[0],
                    appointment_time: today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }),
                    type: 'ตรวจทั่วไป (Walk-in)',
                    note: data.history,
                    ...vitals
                });

                if (apptResult.success) {
                    // Fetch it again to mark it completed
                    const freshAppts = await AppointmentService.getAppointmentsByHn(hn);
                    const newAppt = freshAppts.find(a => a.status === 'pending');
                    if (newAppt && newAppt.id) {
                        await AppointmentService.updateStatus(newAppt.id, 'completed', vitals);
                    }
                }
            }
        }

        // Apply E-Signature if applicable
        if (eSignatureStatuses.includes(processStatus)) {
            const roleType = processStatus === 'รอแล็บรับเรื่อง' ? 'sender' : 'receiver';
            const signatureResult = await SignatureService.createSignature({
                patient_hn: hn,
                document_type: 'request_sheet',
                signer_email: email as string,
                signer_role: roleType,
            });

            if (!signatureResult.success) {
                // Return a warning but don't fail the entire status transaction if stamp generation fails halfway
                console.error(`[Action] E-Signature generation failed: ${signatureResult.error}`);
                return { success: true, warning: 'สถานะถูกอัปเดตแล้ว แต่ไม่สามารถสร้างลายเซ็นอิเล็กทรอนิกส์ได้: ' + signatureResult.error };
            }

            signatureToken = signatureResult.token;
        }

        // Notification is already handled inside PatientService.updatePatientStatus

        // If Lab is accepting the order or receiving the specimen, assign them to the task
        if ((processStatus === 'รอจัดส่ง' || processStatus === 'กำลังตรวจ') && email) {
            // Add the current user as a responsible person so it appears in ONLY THEIR "My Tasks"
            await PatientService.addResponsiblePerson(hn, email, email);
        }

        // If Lab has finished the process (uploaded results and status becomes เสร็จสิ้น), remove them from the responsibility list
        if (processStatus === 'เสร็จสิ้น' && email) {
            // Check if the user is a lab staff, then remove them so they don't linger on the patient's record
            if (Permissions.isLabStaff(role)) {
                await PatientService.removeResponsiblePerson(hn, email);
            }
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
    const role = (session?.user as { role?: string })?.role;
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
 * Update patient test type (Lab Request) - Pre-Lab only
 * Uses supabaseAdmin to bypass RLS issues on client
 */
export async function updatePatientTestType(
    hn: string,
    testType: string
) {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    const email = session?.user?.email;

    if (!email) {
        return { success: false, error: 'User email not found' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('patients')
            .update({
                test_type: testType,
                updated_at: new Date().toISOString()
            })
            .eq('hn', hn);

        if (error) {
            console.error('Update test_type error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/history/${hn}`);
        revalidatePath(`/patients/${hn}`);
        return { success: true };
    } catch (error) {
        console.error('Update updatePatientTestType exception:', error);
        return { success: false, error: 'System error' };
    }
}

/**
 * Update patient data - Only responsible persons or Admin
 */
export async function updatePatientData(
    hn: string,
    data: { gender?: string; age?: string; bloodType?: string; disease?: string; allergies?: string }
) {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
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
    const role = (session?.user as { role?: string })?.role;
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
    const role = (session?.user as { role?: string })?.role;
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
    const role = (session?.user as { role?: string })?.role;

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
    const role = (session?.user as { role?: string })?.role;

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
