const { initializeSheet } = require('./authService');
const { cache, CacheKeys, getOrFetch } = require('./cacheService');

// Column Indices for Sheet 3 (Blood Test Results)
const COL_TIMESTAMP = 0;
const COL_HN = 1;
const COL_WBC = 2;
const COL_WBC_NOTE = 3;
const COL_RBC = 4;
const COL_RBC_NOTE = 5;
const COL_HEMOGLOBIN = 6;
const COL_HEMOGLOBIN_NOTE = 7;
const COL_HEMATOCRIT = 8;
const COL_HEMATOCRIT_NOTE = 9;
const COL_MCV = 10;
const COL_MCV_NOTE = 11;
const COL_MCH = 12;
const COL_MCH_NOTE = 13;
const COL_MCHC = 14;
const COL_MCHC_NOTE = 15;
const COL_PLATELET = 16;
const COL_PLATELET_NOTE = 17;
const COL_NEUTROPHIL = 18;
const COL_NEUTROPHIL_NOTE = 19;
const COL_LYMPHOCYTE = 20;
const COL_LYMPHOCYTE_NOTE = 21;
const COL_MONOCYTE = 22;
const COL_MONOCYTE_NOTE = 23;
const COL_EOSINOPHIL = 24;
const COL_EOSINOPHIL_NOTE = 25;
const COL_BASOPHIL = 26;
const COL_BASOPHIL_NOTE = 27;
const COL_PLATELET_SMEAR = 28;
const COL_PLATELET_SMEAR_NOTE = 29;
const COL_NRBC = 30;
const COL_NRBC_NOTE = 31;
const COL_RBC_MORPHOLOGY = 32;
const COL_RBC_MORPHOLOGY_NOTE = 33;

/**
 * Get all blood tests (Cached)
 */
async function getAllBloodTests() {
    return getOrFetch(CacheKeys.BLOOD_TESTS, async () => {
        try {
            const doc = await initializeSheet();
            const sheet = doc.sheetsByIndex[2]; // Sheet 3
            const rows = await sheet.getRows();

            return rows.map(row => mapRowToBloodTest(row._rawData));
        } catch (error) {
            console.error('Error fetching all blood tests:', error);
            return [];
        }
    }); // Default TTL
}

/**
 * Get latest blood test result for a patient by HN
 * @param {string} hn - Hospital Number
 * @returns {Promise<Object|null>} Blood test result object or null
 */
async function getBloodTestByHN(hn) {
    // Optimization: Filter from cached list
    const allTests = await getAllBloodTests();
    const patientTests = allTests.filter(test => test.hn === hn);

    if (patientTests.length === 0) return null;

    // Return latest test (assuming list order or timestamp)
    // getAllBloodTests preserves row order, so last item is latest
    return patientTests[patientTests.length - 1];
}

/**
 * Get all blood test history for a patient
 * @param {string} hn - Hospital Number
 * @returns {Promise<Array>} List of blood test records
 */
async function getBloodTestHistory(hn) {
    // Optimization: Filter from cached list
    const allTests = await getAllBloodTests();
    return allTests.filter(test => test.hn === hn);
}

/**
 * Add new blood test result
 * @param {string} hn - Hospital Number
 * @param {Object} data - Blood test data
 * @returns {Promise<boolean>} Success status
 */
async function addBloodTest(hn, data) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[2]; // Sheet 3
        await sheet.loadHeaderRow();

        const newRow = {
            [sheet.headerValues[COL_TIMESTAMP]]: new Date().toLocaleString('th-TH'),
            [sheet.headerValues[COL_HN]]: hn,
            [sheet.headerValues[COL_WBC]]: data.wbc || '-',
            [sheet.headerValues[COL_WBC_NOTE]]: data.wbcNote || '-',
            [sheet.headerValues[COL_RBC]]: data.rbc || '-',
            [sheet.headerValues[COL_RBC_NOTE]]: data.rbcNote || '-',
            [sheet.headerValues[COL_HEMOGLOBIN]]: data.hemoglobin || '-',
            [sheet.headerValues[COL_HEMOGLOBIN_NOTE]]: data.hemoglobinNote || '-',
            [sheet.headerValues[COL_HEMATOCRIT]]: data.hematocrit || '-',
            [sheet.headerValues[COL_HEMATOCRIT_NOTE]]: data.hematocritNote || '-',
            [sheet.headerValues[COL_MCV]]: data.mcv || '-',
            [sheet.headerValues[COL_MCV_NOTE]]: data.mcvNote || '-',
            [sheet.headerValues[COL_MCH]]: data.mch || '-',
            [sheet.headerValues[COL_MCH_NOTE]]: data.mchNote || '-',
            [sheet.headerValues[COL_MCHC]]: data.mchc || '-',
            [sheet.headerValues[COL_MCHC_NOTE]]: data.mchcNote || '-',
            [sheet.headerValues[COL_PLATELET]]: data.platelet || '-',
            [sheet.headerValues[COL_PLATELET_NOTE]]: data.plateletNote || '-',
            [sheet.headerValues[COL_NEUTROPHIL]]: data.neutrophil || '-',
            [sheet.headerValues[COL_NEUTROPHIL_NOTE]]: data.neutrophilNote || '-',
            [sheet.headerValues[COL_LYMPHOCYTE]]: data.lymphocyte || '-',
            [sheet.headerValues[COL_LYMPHOCYTE_NOTE]]: data.lymphocyteNote || '-',
            [sheet.headerValues[COL_MONOCYTE]]: data.monocyte || '-',
            [sheet.headerValues[COL_MONOCYTE_NOTE]]: data.monocyteNote || '-',
            [sheet.headerValues[COL_EOSINOPHIL]]: data.eosinophil || '-',
            [sheet.headerValues[COL_EOSINOPHIL_NOTE]]: data.eosinophilNote || '-',
            [sheet.headerValues[COL_BASOPHIL]]: data.basophil || '-',
            [sheet.headerValues[COL_BASOPHIL_NOTE]]: data.basophilNote || '-',
            [sheet.headerValues[COL_PLATELET_SMEAR]]: data.plateletSmear || '-',
            [sheet.headerValues[COL_PLATELET_SMEAR_NOTE]]: data.plateletSmearNote || '-',
            [sheet.headerValues[COL_NRBC]]: data.nrbc || '-',
            [sheet.headerValues[COL_NRBC_NOTE]]: data.nrbcNote || '-',
            [sheet.headerValues[COL_RBC_MORPHOLOGY]]: data.rbcMorphology || '-',
            [sheet.headerValues[COL_RBC_MORPHOLOGY_NOTE]]: data.rbcMorphologyNote || '-',
        };

        await sheet.addRow(newRow);

        // Invalidate cache
        cache.del(CacheKeys.BLOOD_TESTS);

        return true;
    } catch (error) {
        console.error('Error adding blood test:', error);
        return false;
    }
}

/**
 * Update blood test result
 * @param {string} hn - Hospital Number
 * @param {Object} data - Blood test data
 * @returns {Promise<boolean>} Success status
 */
async function updateBloodTest(hn, data) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[2]; // Sheet 3
        const rows = await sheet.getRows();

        const patientRows = rows.filter(row => row._rawData[COL_HN] === hn);

        if (patientRows.length === 0) {
            return false;
        }

        const latestRow = patientRows[patientRows.length - 1];
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;

        // Helper to update field if present
        const updateField = (colIndex, value) => {
            if (value !== undefined) latestRow.set(headers[colIndex], value);
        };

        updateField(COL_WBC, data.wbc);
        updateField(COL_WBC_NOTE, data.wbcNote);
        updateField(COL_RBC, data.rbc);
        updateField(COL_RBC_NOTE, data.rbcNote);
        updateField(COL_HEMOGLOBIN, data.hemoglobin);
        updateField(COL_HEMOGLOBIN_NOTE, data.hemoglobinNote);
        updateField(COL_HEMATOCRIT, data.hematocrit);
        updateField(COL_HEMATOCRIT_NOTE, data.hematocritNote);
        updateField(COL_MCV, data.mcv);
        updateField(COL_MCV_NOTE, data.mcvNote);
        updateField(COL_MCH, data.mch);
        updateField(COL_MCH_NOTE, data.mchNote);
        updateField(COL_MCHC, data.mchc);
        updateField(COL_MCHC_NOTE, data.mchcNote);
        updateField(COL_PLATELET, data.platelet);
        updateField(COL_PLATELET_NOTE, data.plateletNote);
        updateField(COL_NEUTROPHIL, data.neutrophil);
        updateField(COL_NEUTROPHIL_NOTE, data.neutrophilNote);
        updateField(COL_LYMPHOCYTE, data.lymphocyte);
        updateField(COL_LYMPHOCYTE_NOTE, data.lymphocyteNote);
        updateField(COL_MONOCYTE, data.monocyte);
        updateField(COL_MONOCYTE_NOTE, data.monocyteNote);
        updateField(COL_EOSINOPHIL, data.eosinophil);
        updateField(COL_EOSINOPHIL_NOTE, data.eosinophilNote);
        updateField(COL_BASOPHIL, data.basophil);
        updateField(COL_BASOPHIL_NOTE, data.basophilNote);
        updateField(COL_PLATELET_SMEAR, data.plateletSmear);
        updateField(COL_PLATELET_SMEAR_NOTE, data.plateletSmearNote);
        updateField(COL_NRBC, data.nrbc);
        updateField(COL_NRBC_NOTE, data.nrbcNote);
        updateField(COL_RBC_MORPHOLOGY, data.rbcMorphology);
        updateField(COL_RBC_MORPHOLOGY_NOTE, data.rbcMorphologyNote);

        await latestRow.save();

        // Invalidate cache
        cache.del(CacheKeys.BLOOD_TESTS);

        return true;
    } catch (error) {
        console.error('Error updating blood test:', error);
        return false;
    }
}

/**
 * Map sheet row to blood test object
 * @param {Array} rowData - Raw row data
 * @returns {Object} Blood test object
 */
function mapRowToBloodTest(rowData) {
    if (!rowData) return {};
    return {
        timestamp: rowData[COL_TIMESTAMP],
        hn: rowData[COL_HN],
        wbc: { value: rowData[COL_WBC], note: rowData[COL_WBC_NOTE] },
        rbc: { value: rowData[COL_RBC], note: rowData[COL_RBC_NOTE] },
        hemoglobin: { value: rowData[COL_HEMOGLOBIN], note: rowData[COL_HEMOGLOBIN_NOTE] },
        hematocrit: { value: rowData[COL_HEMATOCRIT], note: rowData[COL_HEMATOCRIT_NOTE] },
        mcv: { value: rowData[COL_MCV], note: rowData[COL_MCV_NOTE] },
        mch: { value: rowData[COL_MCH], note: rowData[COL_MCH_NOTE] },
        mchc: { value: rowData[COL_MCHC], note: rowData[COL_MCHC_NOTE] },
        platelet: { value: rowData[COL_PLATELET], note: rowData[COL_PLATELET_NOTE] },
        neutrophil: { value: rowData[COL_NEUTROPHIL], note: rowData[COL_NEUTROPHIL_NOTE] },
        lymphocyte: { value: rowData[COL_LYMPHOCYTE], note: rowData[COL_LYMPHOCYTE_NOTE] },
        monocyte: { value: rowData[COL_MONOCYTE], note: rowData[COL_MONOCYTE_NOTE] },
        eosinophil: { value: rowData[COL_EOSINOPHIL], note: rowData[COL_EOSINOPHIL_NOTE] },
        basophil: { value: rowData[COL_BASOPHIL], note: rowData[COL_BASOPHIL_NOTE] },
        plateletSmear: { value: rowData[COL_PLATELET_SMEAR], note: rowData[COL_PLATELET_SMEAR_NOTE] },
        nrbc: { value: rowData[COL_NRBC], note: rowData[COL_NRBC_NOTE] },
        rbcMorphology: { value: rowData[COL_RBC_MORPHOLOGY], note: rowData[COL_RBC_MORPHOLOGY_NOTE] }
    };
}

/**
 * Get available blood test dates (for dropdown)
 * @returns {Promise<Array>} List of dates
 */
async function getBloodTestDates() {
    try {
        const tests = await getAllBloodTests();

        // Extract unique dates
        const dates = new Set();
        tests.forEach(test => {
            if (test.timestamp) {
                const date = test.timestamp.split(',')[0].trim();
                dates.add(date);
            }
        });

        return Array.from(dates);
    } catch (error) {
        console.error('Error fetching blood test dates:', error);
        return [];
    }
}

/**
 * Get blood tests by date
 * @param {string} date - Date string 'd/m/yyyy'
 * @returns {Promise<Array>} List of test records
 */
async function getBloodTestsByDate(date) {
    try {
        const tests = await getAllBloodTests();
        return tests.filter(test => {
            if (!test.timestamp) return false;
            return test.timestamp.startsWith(date);
        });
    } catch (error) {
        console.error('Error fetching blood tests by date:', error);
        return [];
    }
}

module.exports = {
    getBloodTestByHN,
    getBloodTestHistory,
    addBloodTest,
    updateBloodTest,
    getAllBloodTests,
    getBloodTestsByDate,
    getBloodTestDates
};
