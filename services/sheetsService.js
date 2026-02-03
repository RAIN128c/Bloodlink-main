const { initializeSheet } = require('./authService');
const { cache, CacheKeys, getOrFetch } = require('./cacheService');

// Column Indices for Sheet 2 (Patients & History)
const COL_TIMESTAMP = 0; // Keep 0 for original if needed, but we will use 14 for registration date as requested
const COL_HN = 1;
const COL_NAME = 2;
const COL_SURNAME = 3;
const COL_GENDER = 4;
const COL_AGE = 5;
const COL_BLOOD_TYPE = 6;
const COL_DISEASE = 7;
const COL_MEDICATION = 8;
const COL_ALLERGIES = 9;
const COL_LATEST_RECEIPT = 10;
const COL_TEST_TYPE = 11;
const COL_STATUS = 12; // สถานะ: ใช้งาน/ไม่ใช้งาน
const COL_PROCESS = 13; // กระบวนการ: 5 states
const COL_REGISTRATION_DATE = 14; // Column O - New Registration Date
const COL_APPOINTMENT_DATE = 14; // Alias for Column O
const COL_APPOINTMENT_TIME = 15;

/**
 * Get all unique patients from Sheet 2
 * Returns the latest entry for each HN
 * @returns {Promise<Array>} List of patients
 */
async function getPatients() {
    return getOrFetch(CacheKeys.PATIENTS, async () => {
        try {
            const doc = await initializeSheet();
            const sheet = doc.sheetsByIndex[1]; // Sheet 2
            const rows = await sheet.getRows();

            const patientsMap = new Map();

            // Iterate through rows to find unique patients (keyed by HN)
            // We want the latest entry for each patient, so we just overwrite
            rows.forEach((row, index) => {
                const hn = row._rawData[COL_HN];
                if (!hn) return;

                // DEBUG LOGGING
                if (index < 5) { // Log first 5 rows to debug
                    console.log(`Row ${index} HN: ${hn}`);
                    console.log(` - Disease (Raw): ${row._rawData[COL_DISEASE]}`);
                    console.log(` - Process (Raw): ${row._rawData[COL_PROCESS]}`);
                    console.log(` - RegDate (Raw Col 14): ${row._rawData[COL_REGISTRATION_DATE]}`);
                }

                const patientData = {
                    hn: hn,
                    name: row._rawData[COL_NAME],
                    surname: row._rawData[COL_SURNAME],
                    gender: row._rawData[COL_GENDER],
                    age: row._rawData[COL_AGE],
                    bloodType: row._rawData[COL_BLOOD_TYPE],
                    disease: row._rawData[COL_DISEASE],
                    medication: row._rawData[COL_MEDICATION],
                    allergies: row._rawData[COL_ALLERGIES],
                    latestReceipt: row._rawData[COL_LATEST_RECEIPT],
                    testType: row._rawData[COL_TEST_TYPE],
                    status: row._rawData[COL_STATUS] || 'ใช้งาน', // Default: Active
                    process: row._rawData[COL_PROCESS], // No default, strict mapping
                    appointmentDate: row._rawData[14], // Temp map
                    appointmentTime: row._rawData[COL_APPOINTMENT_TIME],
                    timestamp: row._rawData[COL_REGISTRATION_DATE] || row._rawData[0] // Use Col 14, fallback to 0
                };

                patientsMap.set(hn, patientData);
            });

            return Array.from(patientsMap.values());
        } catch (error) {
            console.error('Error fetching patients:', error);
            return [];
        }
    }); // Default TTL
}


/**
 * Update process status for a patient (and update timestamp, and optional history data/appointment)
 * @param {string} hn - Hospital Number
 * @param {string} processStatus - Process status
 * @param {string} historyData - Optional history data to save to Column K (COL_LATEST_RECEIPT)
 * @param {string} appointmentDate - Optional appointment date
 * @param {string} appointmentTime - Optional appointment time
 * @returns {Promise<boolean>} Success status
 */
async function updateProcess(hn, processStatus, historyData = null, appointmentDate = null, appointmentTime = null) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[1]; // Sheet 2
        const rows = await sheet.getRows();

        const patientRows = rows.filter(row => row._rawData[COL_HN] === hn);

        if (patientRows.length === 0) {
            return false;
        }

        const latestRow = patientRows[patientRows.length - 1];
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;

        // Update process status
        latestRow.set(headers[COL_PROCESS], processStatus);

        // Update timestamp to record when status was changed
        const newTimestamp = new Date().toLocaleString('th-TH');
        latestRow.set(headers[COL_TIMESTAMP], newTimestamp);

        // Update history data (Column K) if provided
        if (historyData !== null) {
            latestRow.set(headers[COL_LATEST_RECEIPT], historyData);
        }

        // Update appointment data if provided
        if (appointmentDate !== null) {
            latestRow.set(headers[COL_APPOINTMENT_DATE], appointmentDate);
        }
        if (appointmentTime !== null) {
            latestRow.set(headers[COL_APPOINTMENT_TIME], appointmentTime);
        }

        await latestRow.save();
        console.log(`Updated process for HN ${hn} to: ${processStatus} at ${newTimestamp}`);

        // Invalidate cache
        cache.del(CacheKeys.PATIENTS);

        return true;
    } catch (error) {
        console.error('Error updating process:', error);
        return false;
    }
}

/**
 * Get patient details by HN
 * @param {string} hn - Hospital Number
 * @returns {Promise<Object|null>} Patient object or null
 */
async function getPatientByHN(hn) {
    // Optimization: Filter from cached patients list instead of fetching rows again
    const patients = await getPatients();
    const patient = patients.find(p => p.hn === hn);
    return patient || null;
}

/**
 * Add new patient (or new history record)
 * @param {Object} data - Form data
 * @returns {Promise<boolean>} Success status
 */
async function addPatient(data) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[1]; // Sheet 2
        await sheet.loadHeaderRow();

        const newRow = {
            [sheet.headerValues[COL_TIMESTAMP]]: new Date().toLocaleString('th-TH'),
            [sheet.headerValues[COL_HN]]: data.hn,
            [sheet.headerValues[COL_NAME]]: data.name,
            [sheet.headerValues[COL_SURNAME]]: data.surname,
            [sheet.headerValues[COL_GENDER]]: data.gender,
            [sheet.headerValues[COL_AGE]]: data.age,
            [sheet.headerValues[COL_BLOOD_TYPE]]: data.bloodType,
            [sheet.headerValues[COL_DISEASE]]: data.disease || '-',
            [sheet.headerValues[COL_MEDICATION]]: data.medication || '-',
            [sheet.headerValues[COL_ALLERGIES]]: data.allergies || '-',
            [sheet.headerValues[COL_LATEST_RECEIPT]]: data.latestReceipt || '-',
            [sheet.headerValues[COL_TEST_TYPE]]: data.testType || '-',
            [sheet.headerValues[COL_STATUS]]: data.status || 'ใช้งาน',
            [sheet.headerValues[COL_PROCESS]]: data.process || 'รอตรวจ'
        };

        await sheet.addRow(newRow);

        // Invalidate cache
        cache.del(CacheKeys.PATIENTS);

        return true;
    } catch (error) {
        console.error('Error adding patient:', error);
        return false;
    }
}

/**
 * Get all history records for a patient
 * @param {string} hn 
 * @returns {Promise<Array>} List of history records
 */
async function getPatientHistory(hn) {
    try {
        // Need to fetch fresh rows for full history details as getPatients only caches 'latest'
        // OR we could cache ALL rows. For now, let's keep this as fresh fetch BUT 
        // we could optimize later. This is less critical than the main list.
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[1]; // Sheet 2
        const rows = await sheet.getRows();

        const history = rows
            .filter(row => row._rawData[COL_HN] === hn)
            .map(row => ({
                timestamp: row._rawData[COL_TIMESTAMP],
                testType: row._rawData[COL_TEST_TYPE],
                latestReceipt: row._rawData[COL_LATEST_RECEIPT],
                // Add other fields if needed for history detail
            }));

        return history;
    } catch (error) {
        console.error('Error fetching patient history:', error);
        return [];
    }
}

/**
 * Update patient details
 * @param {string} hn - Hospital Number
 * @param {Object} data - Updated data
 * @returns {Promise<boolean>} Success status
 */
async function updatePatient(hn, data) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[1]; // Sheet 2
        const rows = await sheet.getRows();

        // Find the latest row for this HN to update
        // Note: In a real log-based system, we might want to append a new row instead of editing.
        // But for "Edit Info", updating the latest record makes sense if we treat it as the current profile.
        // However, if we want to keep history, we should add a new row with the same HN but updated info.
        // For this implementation, let's update the LATEST row found.

        const patientRows = rows.filter(row => row._rawData[COL_HN] === hn);

        if (patientRows.length === 0) {
            return false; // Patient not found
        }

        const latestRow = patientRows[patientRows.length - 1];

        // Update fields using the correct property names from the sheet
        // Get the header values to know the exact column names
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;

        // Update fields if provided - use .set() or direct property assignment
        if (data.name !== undefined) latestRow.set(headers[COL_NAME], data.name);
        if (data.surname !== undefined) latestRow.set(headers[COL_SURNAME], data.surname);
        if (data.gender !== undefined) latestRow.set(headers[COL_GENDER], data.gender);
        if (data.age !== undefined) latestRow.set(headers[COL_AGE], data.age);
        if (data.bloodType !== undefined) latestRow.set(headers[COL_BLOOD_TYPE], data.bloodType);
        if (data.disease !== undefined) latestRow.set(headers[COL_DISEASE], data.disease);
        if (data.medication !== undefined) latestRow.set(headers[COL_MEDICATION], data.medication);
        if (data.allergies !== undefined) latestRow.set(headers[COL_ALLERGIES], data.allergies);
        if (data.status !== undefined) latestRow.set(headers[COL_STATUS], data.status);

        // Save the updated row
        await latestRow.save();
        console.log(`Updated patient HN ${hn} successfully`);

        // Invalidate cache
        cache.del(CacheKeys.PATIENTS);

        return true;
    } catch (error) {
        console.error('Error updating patient:', error);
        return false;
    }
}


module.exports = {
    getPatients,
    getPatientByHN,
    addPatient,
    getPatientHistory,
    updatePatient,
    updateProcess
};
