const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1bAMyXysG7-X9Iu5OwWF_ByxGdIqnr2K5KD7JlbOMbR8';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Initialize Google Sheets
async function initializeSheet() {
    const serviceAccountAuth = new JWT({
        email: SERVICE_ACCOUNT_EMAIL,
        key: PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

/**
 * Authenticate user by email and password
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise<object|null>} User object if authenticated, null otherwise
 */
async function authenticateUser(email, password) {
    try {
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[0]; // Assuming first sheet contains user data

        // Load rows from sheet
        const rows = await sheet.getRows();

        // Find user by email (assume email is in column index 2)
        const userRow = rows.find(row => {
            const rowEmail = row._rawData[2]; // COL_EMAIL = 2
            return rowEmail && rowEmail.toLowerCase() === email.toLowerCase();
        });

        if (!userRow) {
            return null; // User not found
        }

        // Get password from sheet (assume password is in column index 3)
        const storedPassword = userRow._rawData[3]; // COL_PASSWORD = 3
        const role = userRow._rawData[1]; // COL_ROLE = 1

        // Check if password is hashed (starts with $2b$ for bcrypt)
        let isPasswordValid = false;

        if (storedPassword && storedPassword.startsWith('$2b$')) {
            // Compare hashed password
            isPasswordValid = await comparePassword(password, storedPassword);
        } else {
            // Compare plain text password (temporary support)
            isPasswordValid = (password === storedPassword);
        }

        if (!isPasswordValid) {
            return null; // Invalid password
        }

        // Return user object (without password)
        return {
            email: userRow._rawData[2],
            role: role,
            name: email.split('@')[0], // Simple name extraction
            status: userRow._rawData[4] // COL_STATUS = 4
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare plain text password with hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// Simple in-memory cache for user roles (TTL: 10 seconds for near real-time sync)
const roleCache = new Map();
const CACHE_TTL = 10 * 1000; // 10 seconds

/**
 * Get user role from Google Sheets
 * Uses caching to reduce API calls
 * @param {string} email - User email
 * @returns {Promise<string|null>} User role or null if not found
 */
async function getUserRoleFromSheets(email) {
    try {
        const cacheKey = email.toLowerCase();
        const cached = roleCache.get(cacheKey);

        // Return cached value if still valid
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.role;
        }

        // Fetch from Google Sheets
        const doc = await initializeSheet();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        // Find user by email - look for registration entry (not login logs)
        const userRow = rows.find(row => {
            const cellAction = row._rawData[1]; // COL_ROLE
            const cellEmail = row._rawData[2]; // COL_EMAIL

            return (cellAction === 'สมัครสมาชิก' || cellAction === 'Register') &&
                cellEmail && cellEmail.toLowerCase() === email.toLowerCase();
        });

        if (!userRow) {
            return null;
        }

        const role = userRow._rawData[4]; // COL_STATUS = 4 (contains actual role)

        // Update cache
        roleCache.set(cacheKey, {
            role: role,
            timestamp: Date.now()
        });

        return role;
    } catch (error) {
        console.error('Error fetching user role from Sheets:', error);
        return null;
    }
}

module.exports = {
    authenticateUser,
    hashPassword,
    comparePassword,
    initializeSheet,
    getUserRoleFromSheets
};
