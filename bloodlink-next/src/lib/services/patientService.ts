/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types';
import { StatusHistoryService } from './statusHistoryService';

export class PatientService {
    static async getPatients(): Promise<Patient[]> {
        try {
            // 1. Fetch Patients
            const { data: patients, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .order('updated_at', { ascending: false });

            if (patientError) {
                console.error('Error fetching patients:', patientError);
                return [];
            }

            if (!patients || patients.length === 0) return [];

            // 2. Fetch Responsibilities for these patients
            const patientHns = patients.map(p => p.hn);
            const { data: responsibilities } = await supabase
                .from('patient_responsibility')
                .select('patient_hn, user_email, role')
                .in('patient_hn', patientHns)
                .eq('is_active', true);

            // 3. Collect emails to fetch names
            const emails = new Set<string>();
            responsibilities?.forEach(r => {
                if (r.user_email) emails.add(r.user_email);
            });

            const userMap = new Map<string, { name: string; surname: string }>();

            if (emails.size > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('email, name, surname')
                    .in('email', Array.from(emails));

                users?.forEach(u => {
                    userMap.set(u.email, { name: u.name, surname: u.surname || '' });
                });
            }

            // 4. Fetch actual appointment times for patients with an appointment date
            const appointmentHns = patients.filter(p => p.appointment_date).map(p => p.hn);
            const appointmentTimeMap = new Map<string, string>();

            if (appointmentHns.length > 0) {
                const { data: appts } = await supabase
                    .from('appointments')
                    .select('patient_hn, start_time')
                    .in('patient_hn', appointmentHns)
                    .order('start_time', { ascending: false });

                appts?.forEach(a => {
                    if (a.start_time && !appointmentTimeMap.has(a.patient_hn)) {
                        const d = new Date(a.start_time);
                        appointmentTimeMap.set(a.patient_hn, d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }));
                    }
                });
            }

            // 5. Map data
            return patients.map((p: any) => {
                const patientResps = responsibilities?.filter(r => r.patient_hn === p.hn) || [];
                const responsible = patientResps.find(r => r.role === 'creator') || patientResps[0];
                const creator = patientResps.find(r => r.role === 'creator');

                let caregiverName = p.caregiver || '';

                if (responsible && responsible.user_email) {
                    const user = userMap.get(responsible.user_email);
                    if (user) {
                        caregiverName = `${user.name} ${user.surname || ''}`.trim();
                    } else {
                        caregiverName = responsible.user_email;
                    }
                }

                const allResponsible = patientResps.map(r => r.user_email);

                return {
                    hn: p.hn,
                    name: p.name,
                    surname: p.surname,
                    gender: p.gender,
                    age: p.age?.toString() || '',
                    bloodType: p.blood_type,
                    disease: p.disease || '-',
                    medication: p.medication || '-',
                    allergies: p.allergies || '-',
                    latestReceipt: p.latest_receipt || '-',
                    testType: p.test_type || '',
                    status: p.status || 'ใช้งาน',
                    process: p.process || 'รอตรวจ',
                    appointmentDate: p.appointment_date,
                    timestamp: p.updated_at,
                    caregiver: caregiverName,
                    creatorEmail: creator?.user_email,
                    responsibleEmails: allResponsible,
                    appointmentTime: appointmentTimeMap.get(p.hn) || '',
                    // New fields mapping
                    idCard: p.id_card,
                    phone: p.phone,
                    relativeName: p.relative_name,
                    relativePhone: p.relative_phone,
                    relativeRelationship: p.relative_relationship
                };
            });
        } catch (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }


    static async getPatientByHn(hn: string, client = supabase): Promise<Patient | null> {
        try {
            const { data: patient, error } = await client
                .from('patients')
                .select('*')
                .eq('hn', hn)
                .single();

            if (error) {
                console.error(`Error getting patient by HN (${hn}):`, error);

                // If using single(), it returns error if no rows found
                if (error.code === 'PGRST116') {
                    return null;
                }
            }

            if (!patient) return null;

            // Fetch actual appointment time if this patient has an appointment
            let actualTime = '';
            if (patient.appointment_date) {
                const { data: latestAppt } = await client
                    .from('appointments')
                    .select('start_time')
                    .eq('patient_hn', hn)
                    .order('start_time', { ascending: false })
                    .limit(1)
                    .single();

                if (latestAppt && latestAppt.start_time) {
                    actualTime = new Date(latestAppt.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
                }
            }

            return {
                hn: patient.hn,
                name: patient.name,
                surname: patient.surname,
                gender: patient.gender,
                age: patient.age?.toString() || '',
                bloodType: patient.blood_type,
                disease: patient.disease || '-',
                medication: patient.medication || '-',
                allergies: patient.allergies || '-',
                latestReceipt: patient.latest_receipt || '-',
                testType: patient.test_type || '',
                status: patient.status || 'ใช้งาน',
                process: patient.process || 'รอตรวจ',
                appointmentDate: patient.appointment_date,
                timestamp: patient.updated_at,
                caregiver: patient.caregiver || '',
                appointmentTime: actualTime,
                // New fields mapping
                idCard: patient.id_card,
                phone: patient.phone,
                relativeName: patient.relative_name,
                relativePhone: patient.relative_phone,
                relativeRelationship: patient.relative_relationship
            };
        } catch (error) {
            console.error('Error getting patient by HN:', error);
            return null;
        }
    }

    static async addPatient(data: Partial<Patient>): Promise<{ success: boolean; error?: string }> {
        try {
            // Check for duplicate HN
            if (data.hn) {
                const existingPatient = await this.getPatientByHn(data.hn);
                if (existingPatient) {
                    return { success: false, error: 'มีผู้ป่วยหมายเลข HN นี้แล้วในระบบ' };
                }
            }

            // Check for duplicate ID Card if provided
            if (data.idCard) {
                const { data: existingId } = await supabase
                    .from('patients')
                    .select('hn')
                    .eq('id_card', data.idCard)
                    .maybeSingle();

                if (existingId) {
                    return { success: false, error: 'มีผู้ป่วยที่ใช้เลขบัตรประชาชนนี้แล้วในระบบ' };
                }
            }

            const { error } = await supabase
                .from('patients')
                .insert([
                    {
                        hn: data.hn,
                        name: data.name,
                        surname: data.surname,
                        gender: data.gender,
                        age: data.age ? parseInt(data.age) : null,
                        blood_type: data.bloodType,
                        disease: data.disease || '-',
                        medication: data.medication || '-',
                        allergies: data.allergies || '-',
                        test_type: data.testType || 'ตรวจสุขภาพ',
                        status: 'ใช้งาน',
                        process: 'รอตรวจ',
                        appointment_date: data.appointmentDate || null,
                        caregiver: data.caregiver || '',
                        latest_receipt: '',
                        // New Fields
                        id_card: data.idCard || null,
                        phone: data.phone || null,
                        relative_name: data.relativeName || null,
                        relative_phone: data.relativePhone || null,
                        relative_relationship: data.relativeRelationship || null
                    }
                ]);

            if (error) {
                console.error('Add patient error:', error);
                return { success: false, error: 'Database error: ' + error.message };
            }
            return { success: true };
        } catch (error) {
            console.error('Add patient error:', error);
            return { success: false, error: 'Database error' };
        }
    }

    /**
     * Add patient with creator as responsible person
     */
    static async addPatientWithCreator(
        data: Partial<Patient>,
        creatorEmail: string,
        additionalResponsible: string[] = []
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Check for duplicate HN
            if (data.hn) {
                const existingPatient = await this.getPatientByHn(data.hn);
                if (existingPatient) {
                    return { success: false, error: 'มีผู้ป่วยหมายเลข HN นี้แล้วในระบบ' };
                }
            }

            // Check for duplicate ID Card if provided
            if (data.idCard) {
                const { data: existingId } = await supabase
                    .from('patients')
                    .select('hn')
                    .eq('id_card', data.idCard)
                    .maybeSingle();

                if (existingId) {
                    return { success: false, error: 'มีผู้ป่วยที่ใช้เลขบัตรประชาชนนี้แล้วในระบบ' };
                }
            }

            // First add the patient
            const { error: patientError } = await supabase
                .from('patients')
                .insert([
                    {
                        hn: data.hn,
                        name: data.name,
                        surname: data.surname,
                        gender: data.gender,
                        age: data.age ? parseInt(data.age) : null,
                        blood_type: data.bloodType,
                        disease: data.disease || '-',
                        medication: data.medication || '-',
                        allergies: data.allergies || '-',
                        test_type: data.testType || 'ตรวจสุขภาพ',
                        status: 'ใช้งาน',
                        process: 'รอตรวจ',
                        appointment_date: data.appointmentDate || null,
                        caregiver: data.caregiver || '',
                        latest_receipt: '',
                        // New Fields
                        id_card: data.idCard || null,
                        phone: data.phone || null,
                        relative_name: data.relativeName || null,
                        relative_phone: data.relativePhone || null,
                        relative_relationship: data.relativeRelationship || null
                    }
                ]);

            if (patientError) {
                console.error('Add patient error:', patientError);
                return { success: false, error: 'Database error: ' + patientError.message };
            }

            // Build responsibility entries - creator first
            const responsibilityEntries = [
                {
                    patient_hn: data.hn,
                    user_email: creatorEmail,
                    role: 'creator',
                    assigned_by: creatorEmail
                },
                // Additional responsible persons
                ...additionalResponsible.map(email => ({
                    patient_hn: data.hn,
                    user_email: email.toLowerCase(),
                    role: 'responsible',
                    assigned_by: creatorEmail
                }))
            ];

            // Insert all responsibility entries
            const { error: respError } = await supabase
                .from('patient_responsibility')
                .insert(responsibilityEntries);

            if (respError) {
                console.error('Add responsibility error:', respError);
                // Patient was added, responsibility failed - not critical
            }

            // Send notification for new patient (status: รอตรวจ)
            const patientName = `${data.name} ${data.surname || ''}`.trim();
            try {
                const { NotificationService } = await import('./notificationService');
                await NotificationService.sendStatusNotification(
                    data.hn || '',
                    'รอตรวจ',
                    patientName,
                    'เพิ่มผู้ป่วยใหม่',
                    '📋 เพิ่มผู้ป่วยใหม่ในระบบ'
                );
            } catch (err) {
                console.error('Notification error:', err);
            }

            return { success: true };
        } catch (error) {
            console.error('Add patient error:', error);
            return { success: false, error: 'Database error' };
        }
    }

    static async updatePatientStatus(
        hn: string,
        processStatus: string,
        data: {
            history?: string,
            date?: string,
            time?: string,
            // New fields for status history
            changedByEmail?: string,
            changedByName?: string,
            changedByRole?: string
        }
    ): Promise<boolean> {
        try {
            // First, get current status for history logging
            const { data: currentPatient } = await supabase
                .from('patients')
                .select('process, name, surname')
                .eq('hn', hn)
                .single();

            const previousStatus = currentPatient?.process || 'รอตรวจ';

            const updateData: any = {
                process: processStatus,
                updated_at: new Date().toISOString()
            };

            if (data.date) {
                const dateObj = new Date(data.date); // This is YYYY-MM-DD

                if (data.time) {
                    const [hours, minutes] = data.time.split(':').map(Number);
                    dateObj.setHours(hours, minutes, 0, 0);
                    // Adjust for timezone offset if needed, but since we want the time to be "as entered", 
                    // we should likely treat it as local time.
                    // However, new Date(YYYY-MM-DD) creates a UTC midnight date if formatted as ISO,
                    // OR a local date if formatted as YYYY/MM/DD.
                    // Let's rely on the input which is YYYY-MM-DD (local from previous tool call).
                    // Actually, dateObj from "YYYY-MM-DD" is usually UTC midnight.
                    // Let's reconstruct carefully.

                    const [year, month, day] = data.date.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day, hours, minutes);

                    // Store as ISO string (which converts to UTC)
                    updateData.appointment_date = localDate.toISOString();
                } else {
                    updateData.appointment_date = data.date;
                }
            }

            const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('hn', hn);

            if (error) {
                console.error('Update patient status error:', error);
                return false;
            }

            // Log status change to history (if we have user info)
            if (data.changedByEmail && previousStatus !== processStatus) {
                StatusHistoryService.logStatusChange(
                    hn,
                    previousStatus,
                    processStatus,
                    data.changedByEmail,
                    data.changedByName,
                    data.changedByRole,
                    data.history
                ).catch(err => console.error('Status history log error:', err));
            }

            // Send notification to responsible staff
            if (currentPatient) {
                const patientName = `${currentPatient.name} ${currentPatient.surname || ''}`.trim();
                // Fire and forget - call API endpoint which runs server-side
                // Use NotificationService directly
                try {
                    const { NotificationService } = await import('./notificationService');
                    await NotificationService.sendStatusNotification(
                        hn,
                        processStatus,
                        patientName,
                        undefined, // Default subject
                        undefined, // Default message
                        data.changedByEmail // Exclude the actor from receiving their own notification
                    );
                } catch (err) {
                    console.error('Notification error:', err);
                }
            }

            return true;
        } catch (error) {
            console.error('Update patient error:', error);
            return false;
        }
    }

    static async updatePatient(
        hn: string,
        data: {
            gender?: string;
            age?: string;
            bloodType?: string;
            disease?: string;
            allergies?: string;
            // New Fields
            idCard?: string;
            phone?: string;
            relativeName?: string;
            relativePhone?: string;
            relativeRelationship?: string;
        }
    ): Promise<boolean> {
        try {
            const updateData: any = {
                updated_at: new Date().toISOString()
            };

            if (data.gender !== undefined) updateData.gender = data.gender;
            if (data.age !== undefined) updateData.age = data.age ? parseInt(data.age) : null;
            if (data.bloodType !== undefined) updateData.blood_type = data.bloodType;
            if (data.disease !== undefined) updateData.disease = data.disease;
            if (data.allergies !== undefined) updateData.allergies = data.allergies;
            if (data.idCard !== undefined) updateData.id_card = data.idCard;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.relativeName !== undefined) updateData.relative_name = data.relativeName;
            if (data.relativePhone !== undefined) updateData.relative_phone = data.relativePhone;
            if (data.relativeRelationship !== undefined) updateData.relative_relationship = data.relativeRelationship;

            const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('hn', hn);

            if (error) {
                console.error('Update patient error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Update patient error:', error);
            return false;
        }
    }

    // ==================== RESPONSIBILITY MANAGEMENT ====================

    /**
     * Get all responsible persons for a patient
     */
    static async getResponsiblePersons(hn: string): Promise<{ email: string; role: string; assignedAt: string; name?: string; surname?: string }[]> {
        try {
            // 1. Fetch responsibilities
            const { data, error } = await supabase
                .from('patient_responsibility')
                .select('user_email, role, assigned_at')
                .eq('patient_hn', hn)
                .eq('is_active', true);

            if (error || !data) return [];

            // 2. Fetch User Details for names
            const emails = data.map(r => r.user_email);
            const userMap = new Map<string, { name: string; surname: string }>();

            if (emails.length > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('email, name, surname')
                    .in('email', emails);

                users?.forEach(u => {
                    userMap.set(u.email, { name: u.name, surname: u.surname || '' });
                });
            }

            // 3. Map results
            return data.map(r => {
                const user = userMap.get(r.user_email);
                return {
                    email: r.user_email,
                    role: r.role,
                    assignedAt: r.assigned_at,
                    name: user?.name,
                    surname: user?.surname
                };
            });
        } catch (error) {
            console.error('Get responsible persons error:', error);
            return [];
        }
    }

    /**
     * Check if a user is responsible for a patient
     */
    static async isUserResponsible(hn: string, userEmail: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('patient_responsibility')
                .select('id')
                .eq('patient_hn', hn)
                .eq('user_email', userEmail)
                .eq('is_active', true)
                .single();

            if (error || !data) return false;
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Add a responsible person to a patient
     */
    static async addResponsiblePerson(
        hn: string,
        userEmail: string,
        assignedBy: string,
        client: any = supabase
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if user exists
            const { data: user } = await client
                .from('users')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (!user) {
                return { success: false, error: 'ไม่พบผู้ใช้งานนี้ในระบบ' };
            }

            // Check for ANY existing record (active or inactive)
            const { data: existing } = await client
                .from('patient_responsibility')
                .select('id, is_active')
                .eq('patient_hn', hn)
                .eq('user_email', userEmail)
                .maybeSingle(); // Use maybeSingle to avoid 406 on multiple rows (though unique constraint should prevent that)

            if (existing) {
                if (existing.is_active) {
                    return { success: false, error: 'ผู้ใช้นี้เป็นผู้รับผิดชอบอยู่แล้ว' };
                } else {
                    // Reactivate
                    const { error: updateError } = await client
                        .from('patient_responsibility')
                        .update({
                            is_active: true,
                            assigned_by: assignedBy,
                            assigned_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);

                    if (updateError) {
                        console.error('Reactivate responsible person error:', updateError);
                        return { success: false, error: 'Database error: ' + updateError.message };
                    }
                    return { success: true };
                }
            }

            const { error } = await client
                .from('patient_responsibility')
                .insert([
                    {
                        patient_hn: hn,
                        user_email: userEmail,
                        role: 'responsible',
                        assigned_by: assignedBy
                    }
                ]);

            if (error) {
                console.error('Add responsible person error:', error);
                return { success: false, error: 'Database error: ' + error.message };
            }
            return { success: true };
        } catch (error) {
            console.error('Add responsible person error:', error);
            return { success: false, error: 'System error' };
        }
    }

    /**
     * Remove a responsible person from a patient
     */
    static async removeResponsiblePerson(hn: string, userEmail: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('patient_responsibility')
                .update({ is_active: false })
                .eq('patient_hn', hn)
                .eq('user_email', userEmail);

            if (error) {
                console.error('Remove responsible person error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Remove responsible person error:', error);
            return false;
        }
    }

    static async deletePatient(hn: string): Promise<boolean> {
        try {

            // 1. Delete Status History (Child)
            const { error: historyError } = await supabase
                .from('status_history')
                .delete()
                .eq('patient_hn', hn);

            if (historyError) {
                console.warn(`[PatientService] Status history delete error (non-critical):`, historyError);
                // Continue, as this might be non-critical or empty
            }

            // 2. Delete Responsibilities (Child)
            const { error: respError } = await supabase
                .from('patient_responsibility')
                .delete()
                .eq('patient_hn', hn);

            if (respError) {
                console.warn(`[PatientService] Responsibility delete error:`, respError);
                // We try to continue, but if this failed due to OTHER constraints, next step might fail
            }

            // 3. Delete Appointments (Child)
            const { error: apptError } = await supabase
                .from('appointments')
                .delete()
                .eq('patient_hn', hn);

            if (apptError) {
                console.warn(`[PatientService] Appointments delete error:`, apptError);
            }

            // 4. Delete Lab Results (Child)
            const { error: labError } = await supabase
                .from('lab_results')
                .delete()
                .eq('hn', hn);

            if (labError) {
                console.warn(`[PatientService] Lab results delete error:`, labError);
            }

            // 5. Delete Patient (Parent)
            const { error: deleteError } = await supabase
                .from('patients')
                .delete()
                .eq('hn', hn);

            if (deleteError) {
                console.error(`[PatientService] Delete error for HN ${hn}:`, deleteError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[PatientService] Delete patient error:', error);
            return false;
        }
    }

    /**
     * Get all patients that a user is responsible for
     */
    static async getPatientsByResponsibleUser(userEmail: string): Promise<Patient[]> {
        try {
            // First get all patient HNs this user is responsible for
            const { data: responsibilities, error: respError } = await supabase
                .from('patient_responsibility')
                .select('patient_hn')
                .eq('user_email', userEmail)
                .eq('is_active', true);

            if (respError || !responsibilities || responsibilities.length === 0) {
                return [];
            }

            const patientHns = responsibilities.map(r => r.patient_hn);

            // Then fetch patient details
            const { data: patients, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .in('hn', patientHns)
                .order('updated_at', { ascending: false });

            if (patientError || !patients) {
                return [];
            }

            return patients.map(p => ({
                hn: p.hn,
                name: p.name,
                surname: p.surname,
                gender: p.gender,
                age: p.age?.toString() || '',
                bloodType: p.blood_type,
                disease: p.disease || '-',
                medication: p.medication || '-',
                allergies: p.allergies || '-',
                latestReceipt: p.latest_receipt || '-',
                testType: p.test_type || '',
                status: p.status || 'ใช้งาน',
                process: p.process || 'รอตรวจ',
                appointmentDate: p.appointment_date,
                timestamp: p.updated_at,
                caregiver: p.caregiver || '',
                appointmentTime: '',
            }));
        } catch (error) {
            console.error('Get patients by responsible user error:', error);
            return [];
        }
    }
}

