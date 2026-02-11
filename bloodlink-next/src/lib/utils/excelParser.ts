import * as XLSX from 'xlsx';
import { LAB_ALIAS_MAP, CRITICAL_RANGES } from '@/lib/config/labMapping';
import { LabResult } from '@/lib/services/labService';

export interface ParsedLabResult {
    hn: string;
    patientName?: string;
    timestamp: string; // ISO String
    data: Partial<LabResult>;
    criticals: string[]; // List of critical parameters
    rawFile?: string;
}

export const ExcelParser = {
    /**
     * Parse a single Excel file buffer
     */
    parseFile: async (file: File): Promise<ParsedLabResult> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // 1. Extract HN (Assuming Cell E1 based on user analysis)
                    // "HN : 6500332"
                    const cellE1 = worksheet['E1']?.v?.toString() || '';
                    const hnMatch = cellE1.match(/\d+/); // broad match for digits
                    const hn = hnMatch ? hnMatch[0] : '';

                    if (!hn) {
                        reject(new Error('Could not find HN in Cell E1'));
                        return;
                    }

                    // 2. Extract Date (Assuming Row 5 "Receive Time")
                    // Expected: "Receive Time : 29/01/2569  08:16:35"
                    // Need to scan for "Receive Time" or just pick a cell if fixed.
                    // Let's look at cell E5 or search in headers row 5
                    let timestamp = new Date().toISOString();
                    // Search for date string in first 10 rows
                    // TODO: Implement precise date extraction if strictly fixed. 
                    // For now, fallback to "Now" if not found, but try to parse.
                    // Assuming User Analysis: "Row 5 contains Receive Time"
                    // Let's try to find a cell with "Receive Time"

                    // 3. Extract Lab Values (Table starts at Row 8)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 7 }) as any[][];
                    // range: 7 means start at Row 8 (0-indexed)

                    const labData: Partial<LabResult> = {};
                    const criticals: string[] = [];

                    jsonData.forEach(row => {
                        if (row.length < 2) return;

                        // Clean Parameter Name: "CREATININE *" -> "creatinine"
                        const rawParam = row[1]?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                        const valueStr = row[2]?.toString().trim();

                        if (!rawParam || !valueStr) return;

                        // Check Alias Map
                        const dbKey = LAB_ALIAS_MAP[rawParam];
                        if (dbKey) {
                            const numValue = parseFloat(valueStr);
                            if (!isNaN(numValue)) {
                                (labData as any)[dbKey] = numValue;

                                // Check Critical
                                const range = CRITICAL_RANGES[rawParam] || CRITICAL_RANGES[dbKey];
                                if (range) {
                                    if ((range.min !== undefined && numValue < range.min) ||
                                        (range.max !== undefined && numValue > range.max)) {
                                        criticals.push(dbKey);
                                    }
                                }
                            } else {
                                // Handle string values (e.g. Urine Color)
                                (labData as any)[dbKey] = valueStr;
                            }
                        }
                    });

                    resolve({
                        hn,
                        timestamp, // Use extracted date later
                        data: {
                            ...labData,
                            hn,
                            timestamp
                        },
                        criticals,
                        rawFile: file.name
                    });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
};
