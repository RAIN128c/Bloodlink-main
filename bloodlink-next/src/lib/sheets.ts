import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Google Sheets Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1bAMyXysG7-X9Iu5OwWF_ByxGdIqnr2K5KD7JlbOMbR8';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

// Cache the document instance module-level so it persists across warm invocations
let cachedDoc: GoogleSpreadsheet | null = null;

export async function getDoc() {
    if (cachedDoc) {
        return cachedDoc;
    }

    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
        throw new Error('Google Service Account credentials missing');
    }

    const serviceAccountAuth = new JWT({
        email: SERVICE_ACCOUNT_EMAIL,
        key: PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    cachedDoc = doc;
    return doc;
}
