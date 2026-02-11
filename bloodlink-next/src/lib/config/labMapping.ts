export const LAB_ALIAS_MAP: Record<string, string> = {
    // CBC
    'hgb': 'hb',
    'hb': 'hb',
    'hemoglobin': 'hb',
    'hct': 'hct',
    'hematocrit': 'hct',
    'wbc': 'wbc',
    'wbccount': 'wbc',
    'plt': 'plt',
    'platelet': 'plt',
    'plateletcount': 'plt',

    // Differential
    'neutrophil': 'neutrophil',
    'neu': 'neutrophil',
    'lymphocyte': 'lymphocyte',
    'lym': 'lymphocyte',
    'monocyte': 'monocyte',
    'mono': 'monocyte',
    'eosinophil': 'eosinophil',
    'eos': 'eosinophil',
    'basophil': 'basophil',
    'baso': 'basophil',

    // Chemistry
    'fbs': 'fbs',
    'glucose': 'fbs',
    'sugar': 'fbs',
    'bun': 'bun', // Note: BUN is usually not in the main list but often with Creatinine
    'creatinine': 'creatinine',
    'cr': 'creatinine',
    'creat': 'creatinine',
    'egfr': 'egfr',
    'gfr': 'egfr',
    'uric': 'uricAcid',
    'uricacid': 'uricAcid',

    // Liver
    'ast': 'ast',
    'sgot': 'ast',
    'alt': 'alt',
    'sgpt': 'alt',

    // Lipid
    'cholesterol': 'cholesterol',
    'chol': 'cholesterol',
    'triglyceride': 'triglyceride',
    'trig': 'triglyceride',
    'hdl': 'hdl',
    'hdlc': 'hdl',
    'ldl': 'ldl',
    'ldlc': 'ldl',

    // Electrolytes
    'sodium': 'sodium',
    'na': 'sodium',
    'potassium': 'potassium',
    'k': 'potassium',
    'chloride': 'chloride',
    'cl': 'chloride',
    'co2': 'co2',
    'bicarbonate': 'co2',
    'hco3': 'co2',
};

// Critical Ranges (Panic Values)
export const CRITICAL_RANGES: Record<string, { min?: number; max?: number }> = {
    'glucose': { min: 50, max: 400 },
    'potassium': { min: 2.5, max: 6.0 },
    'sodium': { min: 120, max: 160 },
    'creatinine': { max: 5.0 }, // High only
    'hb': { min: 7.0 },
    'plt': { min: 50000 },
};
