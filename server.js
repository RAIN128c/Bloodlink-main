const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { authenticateUser } = require('./services/authService');
const {
    getPatients,
    getPatientByHN,
    addPatient,
    getPatientHistory,
    updatePatient,
    updateProcess
} = require('./services/sheetsService');
const {
    getBloodTestByHN,
    getBloodTestHistory,
    addBloodTest,
    updateBloodTest,
    getAllBloodTests,
    getBloodTestsByDate,
    getBloodTestDates
} = require('./services/bloodTestService');
const { requireAuth, requireAdmin, requireEditPermission, requireNotLab, isAdmin, canEdit, attachUserToLocals, revalidateUserRole } = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

function formatTimestamp() {
    return new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour12: false
    });
}

function mapArrayToHeaders(headers, values) {
    if (!Array.isArray(headers)) {
        return {};
    }
    const row = {};
    headers.forEach((header, idx) => {
        if (header && values[idx] !== undefined) {
            row[header] = values[idx];
        }
    });
    return row;
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cookie-Session Configuration (works with Vercel Serverless)
// Unlike express-session, cookie-session stores data directly in the cookie
// This means it persists across serverless function invocations
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
app.use(cookieSession({
    name: 'bloodlink_session',
    keys: [process.env.SESSION_SECRET || 'bloodlink-secret-key-2024-change-in-production'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction, // Use secure cookies only in production (HTTPS)
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax' // Required for cross-site cookie handling
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user data available to all templates
app.use(attachUserToLocals);

// Revalidate user role on every request (with 10-second cache)
app.use(revalidateUserRole);

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1bAMyXysG7-X9Iu5OwWF_ByxGdIqnr2K5KD7JlbOMbR8';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Column Mappings (0-indexed for google-spreadsheet)
const COL_TIME = 0;
const COL_ROLE = 1;
const COL_EMAIL = 2;
const COL_PASSWORD = 3;
const COL_STATUS = 4;
const COL_NAME = 5;
const COL_SURNAME = 6;
const COL_HOSPITAL_TYPE = 7;
const COL_HOSPITAL_NAME = 8;
const COL_ADMIN_STATUS = 9;

async function getDoc() {
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
        console.warn('Google Service Account credentials not found. Using mock data mode if possible, or failing.');
        // In a real scenario, we might want to throw an error or handle this gracefully.
        // For now, we'll return null and handle it in the routes.
        return null;
    }

    const serviceAccountAuth = new JWT({
        email: SERVICE_ACCOUNT_EMAIL,
        key: PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

app.get('/history', requireAuth, async (req, res) => {
    const patients = await getPatients();

    // Calculate missed appointments (patients whose appointment date has passed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missedAppointments = patients
        .map(patient => {
            if (!patient.timestamp) return null;

            // Parse timestamp (format: "d/m/yyyy, HH:MM:SS" or "d/m/yy")
            const datePart = patient.timestamp.split(/[,\s]/)[0];
            const [day, month, year] = datePart.split('/').map(Number);

            // Handle 2-digit or 4-digit year (Buddhist Era)
            let fullYear = year;
            if (year < 100) {
                fullYear = 2500 + year; // 2-digit BE
            }
            // Convert BE to AD
            const adYear = fullYear > 2500 ? fullYear - 543 : fullYear;

            const appointmentDate = new Date(adYear, month - 1, day);
            appointmentDate.setHours(0, 0, 0, 0);

            const diffTime = today - appointmentDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Only include if appointment date has passed (diffDays > 0)
            // and process is not "เสร็จสิ้น"
            if (diffDays > 0 && patient.process !== 'เสร็จสิ้น') {
                return {
                    ...patient,
                    daysOverdue: diffDays,
                    severity: diffDays >= 14 ? 'red' : diffDays >= 7 ? 'orange' : 'yellow'
                };
            }
            return null;
        })
        .filter(p => p !== null)
        .sort((a, b) => b.daysOverdue - a.daysOverdue); // Sort by most overdue first

    res.render('history', { patients, missedAppointments });
});

// Patient History Detail View
// Patient History Detail View
app.get('/history-detail', requireAuth, async (req, res) => {
    const hn = req.query.hn;
    if (!hn) {
        return res.redirect('/history');
    }
    const patient = await getPatientByHN(hn);
    if (!patient) {
        return res.status(404).send('Patient not found');
    }

    // Get blood test data from Sheet 3
    const bloodTest = await getBloodTestByHN(hn);
    const bloodTestHistory = await getBloodTestHistory(hn);

    // Calculate days since last test
    let daysSinceTest = null;
    if (bloodTest && bloodTest.timestamp) {
        const datePart = bloodTest.timestamp.split(/[,\s]/)[0];
        const [day, month, year] = datePart.split('/').map(Number);
        let fullYear = year < 100 ? 2500 + year : year;
        const adYear = fullYear > 2500 ? fullYear - 543 : fullYear;
        const testDate = new Date(adYear, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        testDate.setHours(0, 0, 0, 0);
        daysSinceTest = Math.floor((today - testDate) / (1000 * 60 * 60 * 24));
    }

    // Map process to step index for timeline
    const processStepMap = {
        'นัดหมาย': 0,
        'เจาะเลือด': 1,
        'กำลังจัดส่ง': 2,
        'กำลังตรวจ': 3,
        'เสร็จสิ้น': 4
    };
    const currentStep = processStepMap[patient.process] ?? 0;

    // Pass permission flags to template
    const userRole = req.session.user.role || '';

    // Helper to check role
    const checkRole = (roles) => roles.some(r => userRole.toLowerCase().includes(r));

    const isLab = checkRole(['lab', 'แลป']);
    const isAdmin = checkRole(['admin', 'ผู้ดูแลระบบ']);
    const isDoctor = checkRole(['doctor', 'หมอ', 'แพทย์']);
    const isNurse = checkRole(['nurse', 'พยาบาล']);

    // Edit Patient Info: Admin, Doctor, Nurse (NOT Lab)
    const canEditPatientInfo = isAdmin || isDoctor || isNurse;

    // Update Status: Admin, Lab (NOT Doctor, Nurse)
    const canUpdateStatus = isAdmin || isLab;

    res.render('history-detail', {
        patient,
        bloodTest,
        bloodTestHistory,
        daysSinceTest,
        currentStep,
        canEditPatientInfo,
        canEdit: canUpdateStatus // For status update (timeline)
    });
});

app.get('/appointments', requireAuth, async (req, res) => {
    try {
        const patients = await getPatients();

        // Filter for patients with 'นัดหมาย' status or process
        const appointmentPatients = patients.filter(p =>
            p.process === 'นัดหมาย' ||
            (p.process === 'appointment') // Handle potential English value
        );

        // Sort by date and time
        appointmentPatients.sort((a, b) => {
            const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
            const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
            return dateA - dateB;
        });

        res.render('appointments', {
            appointments: appointmentPatients,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Error fetching appointments');
    }
});

// Blood test results - patient information form
// Blood test results - from Sheet 3
app.get('/results', requireAuth, async (req, res) => {
    const dateFilter = req.query.date; // Optional date filter (format: d/m/yy)

    let bloodTests;
    let availableDates;

    try {
        // Get all blood tests or filter by date
        if (dateFilter) {
            bloodTests = await getBloodTestsByDate(dateFilter);
        } else {
            bloodTests = await getAllBloodTests();
        }

        // Get available dates for navigation
        availableDates = await getBloodTestDates();

        // Combine blood test data with patient info from Sheet 2
        const patientsWithTests = await Promise.all(
            bloodTests.map(async (test) => {
                const patient = await getPatientByHN(test.hn);
                return {
                    hn: test.hn,
                    name: patient?.name || 'ไม่พบข้อมูล',
                    surname: patient?.surname || '',
                    timestamp: test.timestamp,
                    testType: patient?.testType || 'CBC'
                };
            })
        );

        res.render('results', {
            patients: patientsWithTests,
            currentDate: dateFilter || '',
            availableDates: availableDates
        });
    } catch (error) {
        console.error('Error fetching results:', error);
        res.render('results', {
            patients: [],
            currentDate: '',
            availableDates: []
        });
    }
});

// Add patient form (Not for Lab)
app.get('/add-patient', requireAuth, requireNotLab, (req, res) => {
    res.render('add-patient');
});

// Handle Add Patient Submission
app.post('/add-patient', requireAuth, requireNotLab, async (req, res) => {
    try {
        const success = await addPatient(req.body);
        if (success) {
            res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
        } else {
            res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' });
        }
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// Patient Detail View
app.get('/patient-detail', requireAuth, async (req, res) => {
    const hn = req.query.hn;
    if (!hn) {
        return res.redirect('/history');
    }
    const patient = await getPatientByHN(hn);
    if (!patient) {
        return res.status(404).send('Patient not found');
    }
    // Get blood test results from Sheet 3
    const bloodTest = await getBloodTestByHN(hn);
    res.render('patient-detail', { patient, bloodTest });
});

// Patient Detail Edit View (Admin + Lab)
app.get('/patient-detail-edit', requireEditPermission, async (req, res) => {
    const hn = req.query.hn;
    if (!hn) {
        return res.redirect('/history');
    }
    const patient = await getPatientByHN(hn);
    if (!patient) {
        return res.status(404).send('Patient not found');
    }
    const bloodTest = await getBloodTestByHN(hn);
    res.render('patient-detail-edit', { patient, bloodTest });
});

// API: Save blood test results
app.post('/api/blood-test/save', requireEditPermission, async (req, res) => {
    try {
        const { hn, ...bloodTestData } = req.body;
        if (!hn) {
            return res.status(400).json({ success: false, message: 'HN is required' });
        }

        // Add new blood test record (keeps history)
        const success = await addBloodTest(hn, bloodTestData);

        if (success) {
            res.json({ success: true, message: 'บันทึกผลตรวจเลือดสำเร็จ' });
        } else {
            res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกผลตรวจได้' });
        }
    } catch (error) {
        console.error('Error saving blood test:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// API: Update patient demographics
app.post('/api/update-patient', requireEditPermission, async (req, res) => {
    try {
        const { hn, ...patientData } = req.body;
        if (!hn) {
            return res.status(400).json({ success: false, message: 'HN is required' });
        }

        const success = await updatePatient(hn, patientData);

        if (success) {
            res.json({ success: true, message: 'อัปเดตข้อมูลผู้ป่วยสำเร็จ' });
        } else {
            res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// API: Update patient process status
app.post('/api/update-process', requireEditPermission, async (req, res) => {
    try {
        const { hn, status, note } = req.body; // note might be used later or logged
        if (!hn || !status) {
            return res.status(400).json({ success: false, message: 'HN and status are required' });
        }

        const success = await updateProcess(hn, status);

        if (success) {
            res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
        } else {
            res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะได้' });
        }
    } catch (error) {
        console.error('Error updating process:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// Test Status View - with real data from Sheet 2
app.get('/test-status', requireAuth, async (req, res) => {
    try {
        const statusFilter = req.query.status; // Optional: filter by process status

        // Get all patients from Sheet 2
        let patients = await getPatients();

        // Map process status to indicator types
        const statusMapping = {
            'นัดหมาย': 'waiting',
            'เจาะเลือด': 'received',
            'กำลังจัดส่ง': 'received',
            'กำลังตรวจ': 'testing',
            'เสร็จสิ้น': 'completed'
        };

        // Add indicator type to each patient
        patients = patients.map(p => ({
            ...p,
            indicator: statusMapping[p.process] || 'waiting'
        }));

        // Filter by status if specified
        if (statusFilter && statusFilter !== 'all') {
            patients = patients.filter(p => p.indicator === statusFilter);
        }

        // Get patients without blood test (from Sheet 2 but not in Sheet 3)
        const allBloodTests = await getAllBloodTests();
        const bloodTestHNs = new Set(allBloodTests.map(t => t.hn));
        const patientsWithoutTest = patients.filter(p => !bloodTestHNs.has(p.hn));

        // Get today's date in Thai format
        const today = new Date();
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const todayStr = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${(today.getFullYear() + 543).toString().slice(-2)}`;

        res.render('test-status', {
            patients,
            patientsWithoutTest,
            currentFilter: statusFilter || 'all',
            todayStr
        });
    } catch (error) {
        console.error('Error fetching test status:', error);
        res.render('test-status', {
            patients: [],
            patientsWithoutTest: [],
            currentFilter: 'all',
            todayStr: ''
        });
    }
});

// Admin Dashboard View
app.get('/admin-dashboard', requireAdmin, (req, res) => {
    res.render('admin-dashboard');
});

// Admin Doctor List View
app.get('/admin-doctors', requireAdmin, (req, res) => {
    res.render('admin-doctors');
});

// Admin Doctor Detail View
app.get('/admin-doctor-detail', requireAdmin, (req, res) => {
    res.render('admin-doctor-detail');
});

// Admin Doctor Edit View
app.get('/admin-doctor-edit', requireAdmin, (req, res) => {
    res.render('admin-doctor-edit');
});

// Admin Patient List View
app.get('/admin-patients', requireAdmin, (req, res) => {
    res.render('admin-patients');
});

// Admin Patient Detail View
app.get('/admin-patient-detail', requireAdmin, async (req, res) => {
    const hn = req.query.hn;
    if (!hn) {
        return res.redirect('/admin-patients');
    }

    try {
        const patient = await getPatientByHN(hn);
        if (!patient) {
            return res.status(404).send('Patient not found');
        }

        const bloodTest = await getBloodTestByHN(hn);

        // Calculate days since last test
        let daysSinceTest = null;
        if (bloodTest && bloodTest.timestamp) {
            const datePart = bloodTest.timestamp.split(/[,\s]/)[0];
            const [day, month, year] = datePart.split('/').map(Number);
            let fullYear = year < 100 ? 2500 + year : year;
            const adYear = fullYear > 2500 ? fullYear - 543 : fullYear;
            const testDate = new Date(adYear, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            testDate.setHours(0, 0, 0, 0);
            daysSinceTest = Math.floor((today - testDate) / (1000 * 60 * 60 * 24));
        }

        // Map process to step index for timeline
        const processStepMap = {
            'นัดหมาย': 0,
            'เจาะเลือด': 1,
            'กำลังจัดส่ง': 2,
            'กำลังตรวจ': 3,
            'เสร็จสิ้น': 4
        };
        const currentStep = processStepMap[patient.process] ?? 0;

        res.render('admin-patient-detail', {
            patient,
            bloodTest,
            daysSinceTest,
            currentStep,
            canEditPatientInfo: true,
            canEdit: true
        });
    } catch (error) {
        console.error('Error in admin-patient-detail:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Admin Inbox View
app.get('/admin-inbox', requireAdmin, (req, res) => {
    res.render('admin-inbox');
});

// Admin Inbox Detail View
app.get('/admin-inbox-detail', requireAdmin, (req, res) => {
    res.render('admin-inbox-detail');
});

// Admin Reports View
app.get('/admin-reports', requireAdmin, (req, res) => {
    res.render('admin-reports');
});


// API Endpoint for Login/Register
app.post('/api/action', async (req, res) => {
    const data = req.body;
    const action = data.action;

    try {
        const doc = await getDoc();

        if (!doc) {
            // Fallback for local testing without credentials (OPTIONAL)
            // For now, return error if no credentials
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing Google Credentials' });
        }

        const sheet = doc.sheetsByIndex[0]; // Assuming first sheet
        const rows = await sheet.getRows();

        if (action === 'login') {
            const email = data.email.trim().toLowerCase();
            const password = data.password;

            const userRow = rows.find(row => {
                const rowEmail = row.get(COL_EMAIL) ? row.get(COL_EMAIL).toString().trim().toLowerCase() : '';
                const rowAction = row.get(COL_ROLE); // This column seems to be used for both Role and Action type in the original script?
                // Wait, in original script:
                // registerloginColNum = 2; // Role/Action
                // if (data.action === 'login') actionType = 'เข้าสู่ระบบ';
                // else actionType = 'สมัครสมาชิก'; (or Role?)

                // The original script logic for findUserByEmail:
                // var action = String(row[registerloginColNum - 1]).trim();
                // if ((action === 'Register' || action === 'สมัครสมาชิก') && rowEmail === searchEmail)

                // So we look for rows where column 1 (Role) is NOT 'เข้าสู่ระบบ' (Logins are just logs)
                // Actually, the original script saves 'เข้าสู่ระบบ' in that column for login logs.
                // But for registration, it saves the Role (e.g. 'หมอ', 'พยาบาล').
                // So we should look for rows where the email matches.
                // AND we need to find the *Registration* entry, not a *Login* log.
                // A registration entry would have a Role that is NOT 'เข้าสู่ระบบ'.
                // Or we can check if it has a password? Login logs also have password.

                // Let's stick to the original logic:
                // if ((action === 'Register' || action === 'สมัครสมาชิก') ...
                // But wait, when registering, the code sets: rowData[registerloginColNum - 1] = data.role;
                // data.role comes from the form: 'หมอ', 'พยาบาล', 'แลป'.
                // So the original check `action === 'Register' || action === 'สมัครสมาชิก'` might be flawed if it only checks for those strings.
                // Let's re-read the original main.gs carefully.

                /*
                Original main.gs:
                if (data.action !== 'login') {
                    rowData[statusColNum - 1] = data.role; // Column 5 (Status) gets the Role?
                    // Wait.
                    // registerloginColNum = 2; // Role
                    // statusColNum = 5; // Status
                    
                    // rowData[registerloginColNum - 1] = actionType; ('สมัครสมาชิก' or 'เข้าสู่ระบบ')
                    // rowData[statusColNum - 1] = data.role;
                }
                
                Ah!
                Line 102: var actionType = 'สมัครสมาชิก';
                Line 106: rowData[registerloginColNum - 1] = actionType; (Column 2)
                Line 112: rowData[statusColNum - 1] = data.role; (Column 5)
                
                So Column 2 is 'สมัครสมาชิก' for registrations.
                */

                const rowActionType = row.get('Role') || row._rawData[COL_ROLE]; // Access by header or index
                // google-spreadsheet uses headers by default. If headers are row 1.
                // Let's assume headers are: Timestamp, Role, Email, Password, Status, Name, Surname, HospitalType, HospitalName, AdminStatus
                // But the user might not have headers.
                // Safest is to use index if we can, but google-spreadsheet rows object is header-keyed usually.
                // However, `getRows` returns row objects.
                // Let's try to match by index if possible or assume standard headers.
                // Actually, `row._rawData` gives the array.

                const cellAction = row._rawData[COL_ROLE];
                return (cellAction === 'สมัครสมาชิก' || cellAction === 'Register') &&
                    (row._rawData[COL_EMAIL].toString().trim().toLowerCase() === email);
            });

            if (!userRow) {
                return res.json({ success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
            }

            if (userRow._rawData[COL_PASSWORD].toString() !== password) {
                return res.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
            }

            if (userRow._rawData[COL_ADMIN_STATUS] !== 'ผ่าน') {
                return res.json({ success: false, message: 'รอการตรวจสอบจากผู้ดูแลระบบ หรือการลงทะเบียนไม่ผ่าน' });
            }

            const loginRow = [];
            loginRow[COL_TIME] = formatTimestamp();
            loginRow[COL_ROLE] = 'เข้าสู่ระบบ';
            loginRow[COL_EMAIL] = email;
            loginRow[COL_PASSWORD] = password;

            await sheet.addRow(mapArrayToHeaders(sheet.headerValues, loginRow));

            // Create session for authenticated user
            req.session.user = {
                email: email,
                name: userRow._rawData[COL_NAME],
                role: userRow._rawData[COL_STATUS]
            };

            // Generate token (keeping for backward compatibility)
            const token = Buffer.from(email + '_' + Date.now()).toString('base64');

            return res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                token: token,
                user: {
                    email: email,
                    name: userRow._rawData[COL_NAME],
                    role: userRow._rawData[COL_STATUS]
                }
            });

        } else if (action === 'register') {
            const email = data.email.trim().toLowerCase();

            // Check existing
            const existingUser = rows.find(row => {
                const cellAction = row._rawData[COL_ROLE];
                return (cellAction === 'สมัครสมาชิก' || cellAction === 'Register') &&
                    (row._rawData[COL_EMAIL].toString().trim().toLowerCase() === email);
            });

            if (existingUser) {
                return res.json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }

            // Add new user
            // We need to construct the row array or object matching headers.
            // Since we don't know exact headers, let's try adding an array if the library supports it, 
            // or use the header names if we can guess them.
            // `addRow` accepts an array if the sheet has no headers, or object if it does.
            // Let's assume the sheet HAS headers because `getRows` worked.
            // But to be safe with column indices, we might need to load header row.

            // Alternative: just pass an object with keys matching the header row.
            // We don't know the header names for sure.
            // Let's assume the user will set up headers or we use the indices by passing an array?
            // google-spreadsheet v4 addRow takes an object (header: value) or array.

            const newRowData = [];
            newRowData[COL_TIME] = formatTimestamp();
            newRowData[COL_ROLE] = 'สมัครสมาชิก';
            newRowData[COL_EMAIL] = email;
            newRowData[COL_PASSWORD] = data.password;
            newRowData[COL_STATUS] = data.role;
            newRowData[COL_NAME] = data.name;
            newRowData[COL_SURNAME] = data.surname;
            newRowData[COL_HOSPITAL_TYPE] = data.hospital;
            newRowData[COL_HOSPITAL_NAME] = data.hospitalName;
            newRowData[COL_ADMIN_STATUS] = 'รอตรวจสอบ';

            await sheet.addRow(mapArrayToHeaders(sheet.headerValues, newRowData));

            return res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
        }

        return res.json({ success: false, message: 'Invalid action' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.toString() });
    }
});

// API Endpoint for Saving Patient Data
app.post('/api/save-patient', async (req, res) => {
    const data = req.body;

    try {
        const doc = await getDoc();

        if (!doc) {
            return res.status(500).json({ success: false, message: 'Server configuration error: Missing Google Credentials' });
        }

        // Access Sheet 2 (index 1) for patient data
        const patientSheet = doc.sheetsByIndex[1];

        if (!patientSheet) {
            return res.status(500).json({ success: false, message: 'Patient data sheet not found. Please ensure Sheet 2 exists.' });
        }

        const rows = await patientSheet.getRows();

        // Column headers for patient data sheet
        const PATIENT_HEADERS = {
            TIME: 'ประทับเวลา',
            HN: 'HN',
            FIRST_NAME: 'ชื่อ',
            LAST_NAME: 'นามสกุล',
            GENDER: 'เพศ',
            AGE: 'อายุ',
            BLOOD_TYPE: 'หมู่เลือด',
            DISEASE: 'โรคประจำตัว',
            MEDICATION: 'การใช้ยาที่มีผลต่อเม็ดเลือด',
            ALLERGIES: 'อาการแพ้',
            TRANSFUSION: 'การได้รับเลือดล่าสุด',
            EXAM_TYPE: 'ประเภทการตรวจ'
        };

        // Validate required fields
        if (!data.hn || !data.firstName || !data.lastName) {
            return res.json({ success: false, message: 'กรุณากรอกข้อมูล HN, ชื่อ และนามสกุล' });
        }

        // Validate HN format (9 digits)
        if (!/^\d{9}$/.test(data.hn.toString())) {
            return res.json({ success: false, message: 'รหัส HN ต้องเป็นตัวเลข 9 หลักถ้วน' });
        }

        // Check if HN already exists
        const existingPatient = rows.find(row => {
            const rowHN = row.get(PATIENT_HEADERS.HN) || row._rawData[1];
            return rowHN && rowHN.toString().trim() === data.hn.toString().trim();
        });

        if (existingPatient) {
            return res.json({ success: false, message: 'HN นี้มีอยู่ในระบบแล้ว กรุณาใช้ HN อื่น' });
        }

        // Prepare new patient data
        const newPatientData = {
            [PATIENT_HEADERS.TIME]: formatTimestamp(),
            [PATIENT_HEADERS.HN]: data.hn,
            [PATIENT_HEADERS.FIRST_NAME]: data.firstName || '',
            [PATIENT_HEADERS.LAST_NAME]: data.lastName || '',
            [PATIENT_HEADERS.GENDER]: data.gender || '',
            [PATIENT_HEADERS.AGE]: data.age || '',
            [PATIENT_HEADERS.BLOOD_TYPE]: data.bloodType || '',
            [PATIENT_HEADERS.DISEASE]: data.underlyingDisease || '',
            [PATIENT_HEADERS.MEDICATION]: data.medication || '',
            [PATIENT_HEADERS.ALLERGIES]: data.allergies || '',
            [PATIENT_HEADERS.TRANSFUSION]: data.lastTransfusion || '',
            [PATIENT_HEADERS.EXAM_TYPE]: data.examinationType || ''
        };

        await patientSheet.addRow(newPatientData);

        return res.json({
            success: true,
            message: 'บันทึกข้อมูลผู้ป่วยสำเร็จ',
            data: {
                hn: data.hn,
                name: `${data.firstName} ${data.lastName}`
            }
        });

    } catch (error) {
        console.error('Error saving patient:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + error.toString() });
    }
});

// Authentication API Routes
// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    // For cookie-session, we just set the session to null
    req.session = null;
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
});

// Check session endpoint
app.get('/api/auth/check-session', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user
        });
    }
    return res.json({ authenticated: false });
});

// Get current user info endpoint
app.get('/api/auth/user', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

// Handle Update Patient Info (Doctor/Nurse/Admin only, NOT Lab)
app.post('/update-patient', requireAuth, requireNotLab, async (req, res) => {
    try {
        const { hn, ...updateData } = req.body;
        if (!hn) {
            return res.status(400).json({ success: false, message: 'HN is required' });
        }

        const success = await updatePatient(hn, updateData);
        if (success) {
            res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
        } else {
            res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลได้' });
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// Handle Update Patient Process Status (Lab/Admin only)
app.post('/update-process', requireAuth, requireEditPermission, async (req, res) => {
    try {
        const { hn, process: processStatus, note, appointmentDate, appointmentTime } = req.body;
        console.log(`[update-process] Received: hn=${hn}, process=${processStatus}`);

        if (!hn || !processStatus) {
            return res.status(400).json({ success: false, message: 'HN and process are required' });
        }

        // Pass note as historyData if status is completed
        let historyData = null;
        if (processStatus === 'เสร็จสิ้น' && note) {
            historyData = note;
        }

        const success = await updateProcess(hn, processStatus, historyData, appointmentDate, appointmentTime);
        console.log(`[update-process] updateProcess result: ${success}`);

        if (!success) {
            return res.status(500).json({ success: false, message: 'ไม่สามารถอัปเดตสถานะได้' });
        }

        // If status is "เสร็จสิ้น", add a new blood test record
        if (processStatus === 'เสร็จสิ้น') {
            try {
                await addBloodTest(hn, {});
                console.log(`[update-process] Added blood test record for HN ${hn}`);
            } catch (bloodTestError) {
                console.error('[update-process] Error adding blood test:', bloodTestError);
                // Don't fail the whole request if blood test addition fails
            }
        }

        res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
        console.error('[update-process] Error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
