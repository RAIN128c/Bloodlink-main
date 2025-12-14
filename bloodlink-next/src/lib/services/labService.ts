/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

export interface LabResult {
    id?: number;
    timestamp: string;
    hn: string;
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
                        basophil: data.basophil, basophil_note: data.basophil_note
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

    static async updateLabResult(hn: string, data: Partial<LabResult>): Promise<boolean> {
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
                    return false;
                }
                return true;
            }

            const { error } = await supabase
                .from('lab_results')
                .update(dbData)
                .eq('id', existing.id);

            if (error) {
                console.error('Update lab result error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Update lab result error:', error);
            return false;
        }
    }
}

