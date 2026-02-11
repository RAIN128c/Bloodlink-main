/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

export interface LabResult {
    id?: number;
    timestamp: string;
    hn: string;
    patientName?: string;

    // Request Form Data
    doctor_name?: string;
    department?: string;
    diagnosis?: string;
    clinical_history?: string;
    specimen_type?: string;

    // New Fields for Excel Export
    ward?: string;
    bed?: string;
    visit_type?: string;
    receive_by?: string;
    approver_name?: string;

    wbc?: string;
    wbc_note?: string;
    rbc?: string;
    rbc_note?: string;
    hb?: string;
    hb_note?: string;
    hct?: string;
    hct_note?: string;
    mcv?: string;
    mcv_note?: string;
    mch?: string;
    mch_note?: string;
    mchc?: string;
    mchc_note?: string;
    plt?: string;
    plt_note?: string;
    neutrophil?: string;
    neutrophil_note?: string;
    lymphocyte?: string;
    lymphocyte_note?: string;
    monocyte?: string;
    monocyte_note?: string;
    eosinophil?: string;
    eosinophil_note?: string;
    basophil?: string;
    basophil_note?: string;
    plateletSmear?: string;
    plateletSmear_note?: string;
    nrbc?: string;
    nrbc_note?: string;
    rbcMorphology?: string;
    rbcMorphology_note?: string;

    // Vital Signs & Physical
    weight?: number;
    height?: number;
    waistLine?: number;
    bmi?: number;
    bpSys?: number;
    bpDia?: number;
    pulse?: number;
    respiration?: number;
    temperature?: number;

    // Chemistry
    fbs?: number; fbs_note?: string;
    uricAcid?: number;
    ast?: number;
    alt?: number;
    cholesterol?: number;
    triglyceride?: number;
    hdl?: number;
    ldl?: number;

    // Kidney Function
    creatinine?: number;
    egfr?: number;
    // Electrolytes
    sodium?: number;
    potassium?: number;
    chloride?: number;
    co2?: number;

    // Urine
    urineAlbumin?: string;
    urineSugar?: string;
    specimenStatus?: string;
    // Audit Trail
    reporter_name?: string;
}

export class LabService {
    static async getLabResults(hn: string): Promise<LabResult | null> {
        // ... existing single result logic ...
        const results = await this.getLabHistory(hn);
        return results.length > 0 ? results[0] : null;
    }

    static async getLabHistory(hn: string): Promise<LabResult[]> {
        try {
            const { data, error } = await supabase
                .from('lab_results')
                .select('*')
                .eq('hn', hn)
                .order('created_at', { ascending: false });

            if (error || !data) return [];

            return data.map(item => ({
                id: item.id,
                timestamp: item.timestamp,
                hn: item.hn,
                wbc: item.wbc, wbc_note: item.wbc_note,
                rbc: item.rbc, rbc_note: item.rbc_note,
                hb: item.hb, hb_note: item.hb_note,
                hct: item.hct, hct_note: item.hct_note,
                mcv: item.mcv, mcv_note: item.mcv_note,
                mch: item.mch, mch_note: item.mch_note,
                mchc: item.mchc, mchc_note: item.mchc_note,
                plt: item.plt, plt_note: item.plt_note,
                neutrophil: item.neutrophil, neutrophil_note: item.neutrophil_note,
                lymphocyte: item.lymphocyte, lymphocyte_note: item.lymphocyte_note,
                monocyte: item.monocyte, monocyte_note: item.monocyte_note,
                eosinophil: item.eosinophil, eosinophil_note: item.eosinophil_note,
                basophil: item.basophil, basophil_note: item.basophil_note,
                plateletSmear: item.platelet_smear, plateletSmear_note: item.platelet_smear_note,
                nrbc: item.nrbc, nrbc_note: item.nrbc_note,
                rbcMorphology: item.rbc_morphology, rbcMorphology_note: item.rbc_morphology_note,

                // Request Form Data
                doctor_name: item.doctor_name,
                department: item.department,
                diagnosis: item.diagnosis,
                clinical_history: item.clinical_history,
                specimen_type: item.specimen_type,

                // New Fields
                ward: item.ward,
                bed: item.bed,
                visit_type: item.visit_type,
                receive_by: item.receive_by,
                approver_name: item.approver_name,

                // Audit
                reporter_name: item.reporter_name,

                // Map new fields
                weight: item.weight,
                height: item.height,
                waistLine: item.waist_line,
                bmi: item.bmi,
                bpSys: item.bp_sys,
                bpDia: item.bp_dia,
                pulse: item.pulse,
                respiration: item.respiration,
                temperature: item.temperature,

                fbs: item.fbs, fbs_note: item.fbs_note,
                uricAcid: item.uric_acid,
                ast: item.ast,
                alt: item.alt,
                cholesterol: item.cholesterol,
                triglyceride: item.triglyceride,
                hdl: item.hdl,
                ldl: item.ldl,

                creatinine: item.creatinine,
                egfr: item.egfr,
                sodium: item.sodium,
                potassium: item.potassium,
                chloride: item.chloride,
                co2: item.co2,

                urineAlbumin: item.urine_albumin,
                urineSugar: item.urine_sugar,
                specimenStatus: item.specimen_status,
            }));
        } catch (error) {
            console.error('Get lab history error:', error);
            return [];
        }
    }

    static async addLabResult(data: any): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('lab_results')
                .insert([
                    {
                        hn: data.hn,
                        timestamp: new Date().toISOString(),
                        wbc: data.wbc, wbc_note: data.wbc_note,
                        rbc: data.rbc, rbc_note: data.rbc_note,
                        hb: data.hb, hb_note: data.hb_note,
                        hct: data.hct, hct_note: data.hct_note,
                        mcv: data.mcv, mcv_note: data.mcv_note,
                        mch: data.mch, mch_note: data.mch_note,
                        mchc: data.mchc, mchc_note: data.mchc_note,
                        plt: data.plt, plt_note: data.plt_note,
                        neutrophil: data.neutrophil, neutrophil_note: data.neutrophil_note,
                        lymphocyte: data.lymphocyte, lymphocyte_note: data.lymphocyte_note,
                        monocyte: data.monocyte, monocyte_note: data.monocyte_note,
                        eosinophil: data.eosinophil, eosinophil_note: data.eosinophil_note,
                        basophil: data.basophil, basophil_note: data.basophil_note,

                        // Request Form Data
                        doctor_name: data.doctor_name,
                        department: data.department,
                        diagnosis: data.diagnosis,
                        clinical_history: data.clinical_history,
                        specimen_type: data.specimen_type,
                        reporter_name: data.reporter_name,

                        // New Fields for Excel Export
                        ward: data.ward || 'กลุ่มงานเทคนิคการแพทย์', // Default if empty
                        bed: data.bed,
                        visit_type: data.visit_type || 'OPD',        // Default for now
                        receive_by: data.receive_by,
                        approver_name: data.approver_name,

                        // New Fields
                        weight: data.weight,
                        height: data.height,
                        waist_line: data.waistLine,
                        bmi: data.bmi,
                        bp_sys: data.bpSys,
                        bp_dia: data.bpDia,
                        pulse: data.pulse,
                        respiration: data.respiration,
                        temperature: data.temperature,

                        fbs: data.fbs, fbs_note: data.fbs_note,
                        uric_acid: data.uricAcid,
                        ast: data.ast,
                        alt: data.alt,
                        cholesterol: data.cholesterol,
                        triglyceride: data.triglyceride,
                        hdl: data.hdl,
                        ldl: data.ldl,
                        creatinine: data.creatinine,
                        egfr: data.egfr,
                        sodium: data.sodium,
                        potassium: data.potassium,
                        chloride: data.chloride,
                        co2: data.co2,

                        urine_albumin: data.urineAlbumin,
                        urine_sugar: data.urineSugar,
                        specimen_status: data.specimenStatus
                    }
                ]);

            if (error) {
                console.error('Add lab result error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Add lab result error:', error);
            return false;
        }
    }

    static async updateLabResult(hn: string, data: Partial<LabResult>, notifyDoctor: boolean = false): Promise<{ success: boolean; error?: string }> {
        try {
            // Map camelCase to snake_case for DB columns
            const dbData: any = {};
            if (data.wbc !== undefined) dbData.wbc = data.wbc;
            if (data.wbc_note !== undefined) dbData.wbc_note = data.wbc_note;
            if (data.rbc !== undefined) dbData.rbc = data.rbc;
            if (data.rbc_note !== undefined) dbData.rbc_note = data.rbc_note;
            if (data.hb !== undefined) dbData.hb = data.hb;
            if (data.hb_note !== undefined) dbData.hb_note = data.hb_note;
            if (data.hct !== undefined) dbData.hct = data.hct;
            if (data.hct_note !== undefined) dbData.hct_note = data.hct_note;
            if (data.mcv !== undefined) dbData.mcv = data.mcv;
            if (data.mcv_note !== undefined) dbData.mcv_note = data.mcv_note;
            if (data.mch !== undefined) dbData.mch = data.mch;
            if (data.mch_note !== undefined) dbData.mch_note = data.mch_note;
            if (data.mchc !== undefined) dbData.mchc = data.mchc;
            if (data.mchc_note !== undefined) dbData.mchc_note = data.mchc_note;
            if (data.plt !== undefined) dbData.plt = data.plt;
            if (data.plt_note !== undefined) dbData.plt_note = data.plt_note;
            if (data.neutrophil !== undefined) dbData.neutrophil = data.neutrophil;
            if (data.neutrophil_note !== undefined) dbData.neutrophil_note = data.neutrophil_note;
            if (data.lymphocyte !== undefined) dbData.lymphocyte = data.lymphocyte;
            if (data.lymphocyte_note !== undefined) dbData.lymphocyte_note = data.lymphocyte_note;
            if (data.monocyte !== undefined) dbData.monocyte = data.monocyte;
            if (data.monocyte_note !== undefined) dbData.monocyte_note = data.monocyte_note;
            if (data.eosinophil !== undefined) dbData.eosinophil = data.eosinophil;
            if (data.eosinophil_note !== undefined) dbData.eosinophil_note = data.eosinophil_note;
            if (data.basophil !== undefined) dbData.basophil = data.basophil;
            if (data.basophil_note !== undefined) dbData.basophil_note = data.basophil_note;
            if (data.plateletSmear !== undefined) dbData.platelet_smear = data.plateletSmear;
            if (data.plateletSmear_note !== undefined) dbData.platelet_smear_note = data.plateletSmear_note;
            if (data.nrbc !== undefined) dbData.nrbc = data.nrbc;
            if (data.nrbc_note !== undefined) dbData.nrbc_note = data.nrbc_note;
            if (data.rbcMorphology !== undefined) dbData.rbc_morphology = data.rbcMorphology;
            if (data.rbcMorphology_note !== undefined) dbData.rbc_morphology_note = data.rbcMorphology_note;

            // Request Form Data
            if (data.doctor_name !== undefined) dbData.doctor_name = data.doctor_name;
            if (data.department !== undefined) dbData.department = data.department;
            if (data.diagnosis !== undefined) dbData.diagnosis = data.diagnosis;
            if (data.clinical_history !== undefined) dbData.clinical_history = data.clinical_history;
            if (data.specimen_type !== undefined) dbData.specimen_type = data.specimen_type;
            if (data.specimen_type !== undefined) dbData.specimen_type = data.specimen_type;
            if (data.reporter_name !== undefined) dbData.reporter_name = data.reporter_name;

            // New Excel Fields
            if (data.ward !== undefined) dbData.ward = data.ward;
            if (data.bed !== undefined) dbData.bed = data.bed;
            if (data.visit_type !== undefined) dbData.visit_type = data.visit_type;
            if (data.receive_by !== undefined) dbData.receive_by = data.receive_by;
            if (data.approver_name !== undefined) dbData.approver_name = data.approver_name;

            // New Fields Mapping
            if (data.weight !== undefined) dbData.weight = data.weight;
            if (data.height !== undefined) dbData.height = data.height;
            if (data.waistLine !== undefined) dbData.waist_line = data.waistLine;
            if (data.bmi !== undefined) dbData.bmi = data.bmi;
            if (data.bpSys !== undefined) dbData.bp_sys = data.bpSys;
            if (data.bpDia !== undefined) dbData.bp_dia = data.bpDia;
            if (data.pulse !== undefined) dbData.pulse = data.pulse;
            if (data.respiration !== undefined) dbData.respiration = data.respiration;
            if (data.temperature !== undefined) dbData.temperature = data.temperature;

            if (data.fbs !== undefined) dbData.fbs = data.fbs;
            if (data.fbs_note !== undefined) dbData.fbs_note = data.fbs_note;
            if (data.uricAcid !== undefined) dbData.uric_acid = data.uricAcid;
            if (data.ast !== undefined) dbData.ast = data.ast;
            if (data.alt !== undefined) dbData.alt = data.alt;
            if (data.cholesterol !== undefined) dbData.cholesterol = data.cholesterol;
            if (data.triglyceride !== undefined) dbData.triglyceride = data.triglyceride;
            if (data.hdl !== undefined) dbData.hdl = data.hdl;
            if (data.ldl !== undefined) dbData.ldl = data.ldl;
            if (data.creatinine !== undefined) dbData.creatinine = data.creatinine;
            if (data.egfr !== undefined) dbData.egfr = data.egfr;
            if (data.sodium !== undefined) dbData.sodium = data.sodium;
            if (data.potassium !== undefined) dbData.potassium = data.potassium;
            if (data.chloride !== undefined) dbData.chloride = data.chloride;
            if (data.co2 !== undefined) dbData.co2 = data.co2;

            if (data.urineAlbumin !== undefined) dbData.urine_albumin = data.urineAlbumin;
            if (data.urineSugar !== undefined) dbData.urine_sugar = data.urineSugar;
            if (data.specimenStatus !== undefined) dbData.specimen_status = data.specimenStatus;

            // Get the latest result for this HN and update it
            const { data: existing } = await supabase
                .from('lab_results')
                .select('id')
                .eq('hn', hn)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!existing) {
                // If no existing result, create a new one
                const { error: insertError } = await supabase
                    .from('lab_results')
                    .insert([{
                        ...dbData,
                        hn: hn,
                        timestamp: new Date().toISOString()
                    }]);

                if (insertError) {
                    console.error('Insert new lab result error:', insertError);
                    return { success: false, error: insertError.message };
                }
            } else {
                const { error } = await supabase
                    .from('lab_results')
                    .update(dbData)
                    .eq('id', existing.id);

                if (error) {
                    console.error('Update lab result error:', error);
                    return { success: false, error: error.message };
                }
            }

            // Successfully updated results
            // Only send notification if explicitly requested
            if (notifyDoctor) {
                try {
                    const { data: patient } = await supabase
                        .from('patients')
                        .select('name, surname')
                        .eq('hn', hn)
                        .single();

                    if (patient) {
                        const patientName = `${patient.name} ${patient.surname || ''}`.trim();
                        const { NotificationService } = await import('./notificationService');
                        // We don't have the lab tech name context here easily without auth context passed down
                        // But that's optional.
                        await NotificationService.sendLabResultReadyNotification(hn, patientName);
                    }
                } catch (notifyError) {
                    console.error('Notification trigger error:', notifyError);
                    // Don't fail the whole operation just because notification failed
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error('Update lab result error:', error);
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    static async getAllLabResults(daysIdx: number = 30): Promise<LabResult[]> {
        try {
            // Fetch lab results with patient data
            const { data, error } = await supabase
                .from('lab_results')
                .select('*, patients(name, surname)')
                .order('created_at', { ascending: false })
                .limit(1000);

            if (error || !data) {
                console.error('Get all lab results error:', error);
                return [];
            }

            return data.map((item: any) => ({
                id: item.id,
                timestamp: item.timestamp,
                hn: item.hn,
                patientName: item.patients ? `${item.patients.name} ${item.patients.surname || ''}`.trim() : '',

                wbc: item.wbc, wbc_note: item.wbc_note,
                rbc: item.rbc, rbc_note: item.rbc_note,
                hb: item.hb, hb_note: item.hb_note,
                hct: item.hct, hct_note: item.hct_note,
                mcv: item.mcv, mcv_note: item.mcv_note,
                mch: item.mch, mch_note: item.mch_note,
                mchc: item.mchc, mchc_note: item.mchc_note,
                plt: item.plt, plt_note: item.plt_note,
                neutrophil: item.neutrophil, neutrophil_note: item.neutrophil_note,
                lymphocyte: item.lymphocyte, lymphocyte_note: item.lymphocyte_note,
                monocyte: item.monocyte, monocyte_note: item.monocyte_note,
                eosinophil: item.eosinophil, eosinophil_note: item.eosinophil_note,
                basophil: item.basophil, basophil_note: item.basophil_note,
                plateletSmear: item.platelet_smear, plateletSmear_note: item.platelet_smear_note,
                nrbc: item.nrbc, nrbc_note: item.nrbc_note,
                rbcMorphology: item.rbc_morphology, rbcMorphology_note: item.rbc_morphology_note,

                doctor_name: item.doctor_name,
                department: item.department,
                diagnosis: item.diagnosis,
                clinical_history: item.clinical_history,
                specimen_type: item.specimen_type,
                reporter_name: item.reporter_name,

                weight: item.weight,
                height: item.height,
                waistLine: item.waist_line,
                bmi: item.bmi,
                bpSys: item.bp_sys,
                bpDia: item.bp_dia,
                pulse: item.pulse,
                respiration: item.respiration,
                temperature: item.temperature,

                fbs: item.fbs, fbs_note: item.fbs_note,
                uricAcid: item.uric_acid,
                ast: item.ast,
                alt: item.alt,
                cholesterol: item.cholesterol,
                triglyceride: item.triglyceride,
                hdl: item.hdl,
                ldl: item.ldl,
                creatinine: item.creatinine,
                egfr: item.egfr,

                sodium: item.sodium,
                potassium: item.potassium,
                chloride: item.chloride,
                co2: item.co2,

                urineAlbumin: item.urine_albumin,
                urineSugar: item.urine_sugar,
                specimenStatus: item.specimen_status,
            }));
        } catch (error) {
            console.error('Get all lab results error:', error);
            return [];
        }
    }
    static async processBatchImport(results: LabResult[], autoStatusUpdate: boolean = true): Promise<{ processed: number, updated: number, errors: string[] }> {
        let processed = 0;
        let updated = 0;
        const errors: string[] = [];

        try {
            for (const result of results) {
                if (!result.hn) {
                    errors.push(`Skipped record with no HN`);
                    continue;
                }

                // 1. Try to Add or Update result
                const updateRes = await this.updateLabResult(result.hn, result, false);
                if (updateRes.success) {
                    updated++;
                } else {
                    errors.push(`Failed to update HN ${result.hn}: ${updateRes.error}`);
                    continue;
                }

                // 2. Auto Status Update (Optional)
                if (autoStatusUpdate) {
                    try {
                        const { error: statusError } = await supabase
                            .from('patients')
                            .update({
                                process: 'เสร็จสิ้น', // Mark as Completed
                                timestamp: new Date().toISOString()
                            })
                            .eq('hn', result.hn)
                            .eq('process', 'กำลังตรวจ'); // Only update if currently in progress

                        if (statusError) {
                            console.error(`Status update failed for HN ${result.hn}:`, statusError);
                        }
                    } catch (err) {
                        console.error(`Status update error for HN ${result.hn}:`, err);
                    }
                }

                processed++;
            }

            return { processed, updated, errors };
        } catch (error: any) {
            console.error('Batch process error:', error);
            return { processed: 0, updated: 0, errors: [error.message] };
        }
    }
}

