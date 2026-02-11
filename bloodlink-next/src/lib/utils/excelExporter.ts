import * as XLSX from 'xlsx';
import { LabResult } from '@/lib/services/labService';
import { Patient } from '@/types';

// Helper to format Thai Date (dd/mm/yy hh:mm)
const formatThaiDateShort = (isoString: string | undefined) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = (date.getFullYear() + 543).toString().slice(-2); // Thai Year last 2 digits
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return '-';
    }
};

const formatThaiDateFull = (isoString: string | undefined) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = (date.getFullYear() + 543);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return '-';
    }
};

interface ExportPatientData {
    patient: any; // Using any to be flexible with slightly different Patient interfaces
    result: LabResult;
    printerName?: string;
}

export const LAB_HEADERS_MAP: Record<string, string> = {
    hn: 'HN',
    timestamp: 'วันที่ตรวจ',
    doctor_name: 'แพทย์ผู้ส่งตรวจ',
    department: 'แผนก',
    reporter_name: 'ผู้รายงานผล',
    paymentType: 'สิทธิ์การรักษา',

    // Complete Blood Count (CBC)
    wbc: 'WBC',
    rbc: 'RBC',
    hb: 'Hb',
    hct: 'Hct',
    mcv: 'MCV',
    mch: 'MCH',
    mchc: 'MCHC',
    plt: 'Platelet',
    neutrophil: 'Neutrophil',
    lymphocyte: 'Lymphocyte',
    monocyte: 'Monocyte',
    eosinophil: 'Eosinophil',
    basophil: 'Basophil',

    // Chemistry
    fbs: 'FBS',
    hba1c: 'HbA1c',
    bun: 'BUN',
    creatinine: 'Creatinine',
    egfr: 'eGFR',
    uricAcid: 'Uric Acid',
    cholesterol: 'Cholesterol',
    triglyceride: 'Triglyceride',
    hdl: 'HDL',
    ldl: 'LDL',
    ast: 'AST',
    alt: 'ALT',
    alkKline: 'Alk Phosphatase',

    // Electrolytes
    sodium: 'Sodium',
    potassium: 'Potassium',
    chloride: 'Chloride',
    co2: 'CO2',

    // Urine Analysis
    urineColor: 'Color',
    urineAppearance: 'Appearance',
    urinePh: 'pH',
    urineSpGr: 'Sp.Gr',
    urineProtein: 'Protein',
    urineGlucose: 'Glucose',
    urineWbc: 'WBC (Urine)',
    urineRbc: 'RBC (Urine)',

    // Vital Signs
    weight: 'น้ำหนัก (kg)',
    height: 'ส่วนสูง (cm)',
    bmi: 'BMI',
    bpSys: 'Systolic BP',
    bpDia: 'Diastolic BP',
    pulse: 'Pulse',
};

export const ExcelExporter = {
    exportToExcel: (data: LabResult[], filename: string = 'lab_results_export.xlsx') => {
        // 1. Flatten and Map Data
        const sheetData = data.map(item => {
            const row: any = {};

            // Map known headers
            Object.keys(LAB_HEADERS_MAP).forEach(key => {
                const value = (item as any)[key];
                if (value !== undefined && value !== null) {
                    // Format Date
                    if (key === 'timestamp') {
                        try {
                            row[LAB_HEADERS_MAP[key]] = new Date(value).toLocaleDateString('th-TH', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                            });
                        } catch {
                            row[LAB_HEADERS_MAP[key]] = value;
                        }
                    } else {
                        row[LAB_HEADERS_MAP[key]] = value;
                    }
                }
            });

            return row;
        });

        // 2. Create Workbook
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Lab Results');

        // 3. Auto-Adjustment Column Width (Start)
        // Simple heuristic: look at header length
        const colWidths = Object.values(LAB_HEADERS_MAP).map(h => ({ wch: h.length + 5 }));
        worksheet['!cols'] = colWidths;

        // 4. Download
        XLSX.writeFile(workbook, filename);
    },

    exportPatientLabResultToExcel: ({ patient, result, printerName }: ExportPatientData, filename: string) => {
        const wb = XLSX.utils.book_new();
        const ws: XLSX.WorkSheet = {};

        // Helper to set cell value
        const setCell = (cell: string, value: any, bold: boolean = false) => {
            ws[cell] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
            if (bold) {
                if (!ws[cell].s) ws[cell].s = {};
                ws[cell].s.font = { bold: true };
            }
        };

        // --- 1. Header Information (Coordinates from Layout.xlsx) ---
        setCell('B1', 'โรงพยาบาลเฉลิมพระเกียรติ', true);
        setCell('B2', 'อ.เฉลิมพระเกียรติ');

        setCell('E1', 'HN:');
        setCell('F1', patient.hn || result.hn);

        setCell('G1', 'ชื่อผู้ป่วย:');
        setCell('H1', `${patient.name} ${patient.surname || ''}`.trim());

        setCell('K1', 'เพศ:');
        setCell('L1', patient.gender || '-');

        setCell('M1', result.department || 'BIOCHEMISTRY');

        setCell('E2', 'อายุ :');
        let ageYear = '-';
        let ageMonth = '0';
        if (patient.age) {
            const ageStr = String(patient.age).replace(' ปี', '').trim();
            ageYear = ageStr;
        }
        setCell('F2', Number(ageYear) || ageYear);
        setCell('G2', 'ปี');
        setCell('H2', Number(ageMonth));
        setCell('I2', 'เดือน');

        setCell('J2', 'Ward:');
        setCell('K2', result.ward || 'กลุ่มงานเทคนิคการแพทย์');

        setCell('L3', 'Request NO:');
        setCell('L4', result.id ? String(result.id) : '-'); // Value L4 (below label)

        setCell('N3', 'Bed:');
        setCell('O3', 'แพทย์:');
        setCell('P3', result.doctor_name || '-'); // Doctor Name (Ordering)
        setCell('N4', result.bed || '-');

        setCell('B5', 'Visit Type : ');
        setCell('C5', result.visit_type || 'OPD');

        setCell('E5', 'Receive Time:');
        const thaiDateShort = formatThaiDateShort(result.timestamp);
        setCell('F5', thaiDateShort);

        setCell('H5', 'Receive By:');
        setCell('I5', result.receive_by || '-');

        setCell('B6', 'หมายเหตุ:');

        // --- 2. Data Table Headers (Row 7) ---
        setCell('B7', 'Parameter', true);
        setCell('E7', 'Result', true); // Header at E
        setCell('H7', 'Unit', true);   // Header at H
        setCell('J7', 'Flag Reference', true);
        setCell('L7', 'Method', true);

        // --- 3. Data Loop (Starting Row 8) ---
        const TEST_MAPPING = [
            // CBC
            { key: 'wbc', label: 'WBC', unit: '10^3/uL', range: '4.8-10.8' },
            { key: 'rbc', label: 'RBC', unit: '10^6/uL', range: '4.2-5.4' },
            { key: 'hb', label: 'HB', unit: 'g/dL', range: '12-16' },
            { key: 'hct', label: 'HCT', unit: '%', range: '37-47' },
            { key: 'mcv', label: 'MCV', unit: 'fL', range: '80-99' },
            { key: 'mch', label: 'MCH', unit: 'pg', range: '27-31' },
            { key: 'mchc', label: 'MCHC', unit: 'g/dL', range: '33-37' },
            { key: 'plt', label: 'Platelet Count', unit: '10^3/uL', range: '130-400' },
            { key: 'neutrophil', label: 'Neutrophil', unit: '%', range: '40-74' },
            { key: 'lymphocyte', label: 'Lymphocyte', unit: '%', range: '19-48' },
            { key: 'monocyte', label: 'Monocyte', unit: '%', range: '3.4-9' },
            { key: 'eosinophil', label: 'Eosinophil', unit: '%', range: '0-7' },
            { key: 'basophil', label: 'Basophil', unit: '%', range: '0-1.5' },
            // Chemistry
            { key: 'fbs', label: 'Glu (FBS)', unit: 'mg/dL', range: '70-99' },
            { key: 'bun', label: 'BUN', unit: 'mg/dL', range: '7-20' },
            { key: 'creatinine', label: 'CREATININE', unit: 'mg/dL', range: '0.6-1.1' },
            { key: 'uricAcid', label: 'Uric Acid', unit: 'mg/dL', range: '2.4-5.7' },
            { key: 'cholesterol', label: 'CHOLESTEROL', unit: 'mg/dL', range: '<200' },
            { key: 'triglyceride', label: 'TRIGLYCERIDE', unit: 'mg/dL', range: '<150' },
            { key: 'hdl', label: 'HDL-C', unit: 'mg/dL', range: '>50' },
            { key: 'ldl', label: 'LDL-C', unit: 'mg/dL', range: '<100' },
            { key: 'ast', label: 'AST (SGOT)', unit: 'U/L', range: '0-32' },
            { key: 'alt', label: 'ALT (SGPT)', unit: 'U/L', range: '0-33' },
            { key: 'alkKline', label: 'Alk Phosphatase', unit: 'U/L', range: '35-104' },
            // Electrolytes
            { key: 'sodium', label: 'SODIUM', unit: 'mmol/L', range: '136-145' },
            { key: 'potassium', label: 'POTASSIUM', unit: 'mmol/L', range: '3.5-5.1' },
            { key: 'chloride', label: 'CHLORIDE', unit: 'mmol/L', range: '98-107' },
            { key: 'co2', label: 'CO2', unit: 'mmol/L', range: '22-29' },
            { key: 'egfr', label: 'GFR', unit: 'ml/min/1.73', range: '>90' },
        ];

        let currentRow = 8;
        TEST_MAPPING.forEach(test => {
            const val = (result as any)[test.key];
            if (val !== undefined && val !== null && val !== '') {
                // Mapping per Layout.xlsx sample data
                setCell(`B${currentRow}`, test.label); // Parameter
                setCell(`D${currentRow}`, val);        // Result
                setCell(`H${currentRow}`, test.unit);  // Unit
                setCell(`I${currentRow}`, test.range); // Ref Range

                currentRow++;
            }
        });

        // --- 4. Footer Information ---
        const footerStartRow = currentRow + 2;

        // Reporter
        setCell(`B${footerStartRow}`, 'ผู้รายงานผล:');
        setCell(`C${footerStartRow}`, result.reporter_name || '-');
        setCell(`C${footerStartRow + 1}`, formatThaiDateShort(result.timestamp));

        // Approver
        setCell(`F${footerStartRow}`, 'ผู้รับรองผล:');
        setCell(`G${footerStartRow}`, result.approver_name || result.doctor_name || '-');
        setCell(`G${footerStartRow + 1}`, formatThaiDateShort(result.timestamp));

        // Printer
        setCell(`J${footerStartRow}`, 'ผู้พิมพ์รายงาน:');
        setCell(`K${footerStartRow}`, printerName || 'System');
        setCell(`K${footerStartRow + 1}`, formatThaiDateShort(new Date().toISOString()));

        // Set Ranges
        ws['!ref'] = `A1:P${footerStartRow + 5}`;

        // Column Widths
        ws['!cols'] = [
            { wch: 2 },  // A
            { wch: 20 }, // B: Param
            { wch: 10 }, // C
            { wch: 10 }, // D: Result
            { wch: 10 }, // E: Result Header
            { wch: 15 }, // F: HN
            { wch: 15 }, // G
            { wch: 10 }, // H: Unit
            { wch: 25 }, // I: Range
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Lab Report');
        XLSX.writeFile(wb, filename);
    }
};
