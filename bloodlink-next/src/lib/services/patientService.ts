/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types';

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

            let userMap = new Map<string, { name: string; surname: string }>();

            if (emails.size > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('email, name, surname')
                    .in('email', Array.from(emails));

                users?.forEach(u => {
                    userMap.set(u.email, { name: u.name, surname: u.surname || '' });
                });
            }

            // 4. Map data
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
                    process: p.process || 'นัดหมาย',
                    appointmentDate: p.appointment_date || p.created_at,
                    timestamp: p.updated_at,
                    caregiver: caregiverName,
                    creatorEmail: creator?.user_email,
                    responsibleEmails: allResponsible,
                    appointmentTime: '',
                };
            });
        } catch (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }

    static async getPatientByHn(hn: string): Promise<Patient | null> {
        try {
            const { data: patient, error } = await supabase
                .from('patients')
                .select('*')
                .eq('hn', hn)
                .single();

            if (error || !patient) return null;

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
                process: patient.process || 'นัดหมาย',
                appointmentDate: patient.appointment_date || patient.created_at,
                timestamp: patient.updated_at,
                caregiver: patient.caregiver || '',
                appointmentTime: '',
            };
        } catch (error) {
            console.error('Error getting patient by HN:', error);
            return null;
        }
    }

    static async addPatient(data: Partial<Patient>): Promise<{ success: boolean; error?: string }> {
        try {
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
                        process: 'นัดหมาย',
                        appointment_date: data.appointmentDate || new Date().toISOString(),
                        caregiver: data.caregiver || '',
                        latest_receipt: ''
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
                        process: 'นัดหมาย',
                        appointment_date: data.appointmentDate || new Date().toISOString(),
                        caregiver: data.caregiver || '',
                        latest_receipt: ''
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

            // Send notification for new patient (status: นัดหมาย)
            const patientName = `${data.name} ${data.surname || ''}`.trim();
            fetch('/api/notifications/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientHn: data.hn || '', status: 'นัดหมาย', patientName })
            }).catch(err => console.error('Notification error:', err));

            return { success: true };
        } catch (error) {
            console.error('Add patient error:', error);
            return { success: false, error: 'Database error' };
        }
    }

    static async updatePatientStatus(
        hn: string,
        processStatus: string,
        data: { history?: string, date?: string, time?: string }
    ): Promise<boolean> {
        try {
            const updateData: any = {
                process: processStatus,
                updated_at: new Date().toISOString()
            };

            if (data.date) {
                updateData.appointment_date = data.date;
            }

            const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('hn', hn);

            if (error) {
                console.error('Update patient status error:', error);
                return false;
            }

            // Send notification to responsible staff
            // First, get patient name for the notification
            const { data: patient } = await supabase
                .from('patients')
                .select('name, surname')
                .eq('hn', hn)
                .single();

            if (patient) {
                const patientName = `${patient.name} ${patient.surname || ''}`.trim();
                // Fire and forget - call API endpoint which runs server-side
                fetch('/api/notifications/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientHn: hn, status: processStatus, patientName })
                }).catch(err => console.error('Notification error:', err));
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
            let userMap = new Map<string, { name: string; surname: string }>();

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
        assignedBy: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if user exists
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', userEmail)
                .single();

            if (!user) {
                return { success: false, error: 'ไม่พบผู้ใช้งานนี้ในระบบ' };
            }

            // Check for ANY existing record (active or inactive)
            const { data: existing } = await supabase
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
                    const { error: updateError } = await supabase
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

            const { error } = await supabase
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
            console.log(`[PatientService] Deleting patient HN: ${hn}`);
            const { error, count } = await supabase
                .from('patients')
                .delete()
                .eq('hn', hn);

            if (error) {
                console.error(`[PatientService] Delete error for HN ${hn}:`, error);
                return false;
            }
            console.log(`[PatientService] Deleted OK for HN ${hn}`);
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
                process: p.process || 'นัดหมาย',
                appointmentDate: p.appointment_date || p.created_at,
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

