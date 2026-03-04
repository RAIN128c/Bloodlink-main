'use client';

import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import React from 'react';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';

const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

// Note: Ensure strictly A5 Landscape printing — MUST fit on one page.
const printStyles = `
    @media print {
        @page { size: A5 landscape; margin: 4mm; }
        html, body {
            width: 200mm; height: 140mm;
            margin: 0; padding: 0;
            overflow: hidden;
            font-family: 'Prompt', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .print-area { display: block !important; }
        .no-print { display: none !important; }
        .page-break { page-break-after: always; }
        .request-sheet-container {
            width: 200mm !important;
            max-height: 138mm !important;
            padding: 2mm 4mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            font-size: 9px !important;
        }
        .request-sheet-container .grid { gap: 0 !important; }
        .request-sheet-container [class*="min-h-[36px]"] { min-height: 22px !important; }
        .request-sheet-container [class*="min-h-[28px]"] { min-height: 18px !important; }
        .request-sheet-container [class*="py-1"] { padding-top: 1px !important; padding-bottom: 1px !important; }
        .request-sheet-container [class*="p-1.5"] { padding: 2px !important; }
        .request-sheet-container [class*="mt-1.5"] { margin-top: 1px !important; }
        .request-sheet-container [class*="gap-1.5"] { gap: 1px !important; }
    }

`;

interface HospitalInfo {
    hospitalType?: string;
    hospitalName?: string;
    district?: string;
    province?: string;
}

interface PrintRequestSheetProps {
    patients: Patient[]; // Usually array of 1 for this sheet format, but accepts array for batch printing
    hospitalInfo?: HospitalInfo | null;
    signatures?: Record<string, { qr_token?: string; signature_text?: string; document_url?: string } | null>;
    vitals?: Record<string, unknown>; // Record<hn, VitalsObject>
    isPdfMode?: boolean; // Flag to render strictly for html2canvas
}

export const PrintRequestSheet = ({ patients, signatures, vitals, hospitalInfo, isPdfMode = false }: PrintRequestSheetProps) => {
    return (
        <div className={isPdfMode ? "bg-white text-black font-[family-name:var(--font-prompt)]" : "w-full text-black font-[family-name:var(--font-prompt)]"}>
            {!isPdfMode && <style dangerouslySetInnerHTML={{ __html: printStyles }} />}

            {patients.map((patient, pageIndex) => {
                const currentDate = new Date();
                const formattedDate = formatDateThai(currentDate.toISOString());
                const patientSignature = signatures?.[patient.hn];

                // Parse diseases and tests for checkmarks
                const diseases = (patient.disease || '').toLowerCase();
                const testTypes = (patient.testType || '').toLowerCase();

                const hasDM = diseases.includes('dm') || diseases.includes('เบาหวาน');
                const hasHT = diseases.includes('ht') || diseases.includes('ความดัน');
                const hasDLP = diseases.includes('dlp') || diseases.includes('ไขมัน');
                const hasCKD = diseases.includes('ckd') || diseases.includes('ไต');
                const hasAsthma = diseases.includes('asthma') || diseases.includes('copd') || diseases.includes('หอบ');

                const check = (condition: boolean) => condition ? <span className="font-bold text-[14px]">✓</span> : null;
                const checkTest = (keyword: string) => testTypes.includes(keyword.toLowerCase()) ? <span className="absolute left-1 top-0.5 font-bold text-[14px]">✓</span> : null;
                const checkIcon = (keyword: string) => testTypes.includes(keyword.toLowerCase()) ? <div className="absolute inset-0 flex items-center justify-center font-bold text-[14px] pointer-events-none">✓</div> : null;
                const checkList = (keywords: string[]) => keywords.some(k => testTypes.includes(k.toLowerCase())) ? <div className="absolute inset-0 flex items-center justify-center font-bold text-[14px] pointer-events-none -mt-1 -ml-1">✓</div> : null;

                const deriveSpecimen = (tests: string) => {
                    const bloodKeywords = ['fbs', 'lipid', 'cbc', 'hba1c', 'cr', 'gfr', 'bun', 'ast', 'alt', 'lft', 'uric', 'electrolyte'];
                    const urineKeywords = ['u-alb', 'u-sugar', 'microalbumin', 'upt', 'urine'];

                    const hasBlood = bloodKeywords.some(k => tests.includes(k));
                    const hasUrine = urineKeywords.some(k => tests.includes(k));

                    if (hasBlood && hasUrine) return "Blood & Urine Sample";
                    if (hasBlood) return "Blood Sample";
                    if (hasUrine) return "Urine Sample";
                    return tests || '-';
                };

                const specimenLabel = deriveSpecimen(testTypes);

                const extractNameFromSignature = (text?: string) => {
                    if (!text) return null;
                    const match = text.match(/Digitally Signed by:\s*(.*?)\s*\|/);
                    return match ? match[1].trim() : null;
                };

                const signerName = extractNameFromSignature(patientSignature?.signature_text);
                const creatorDisplay = signerName || patient.creatorEmail || '.......................................';

                const displayHospital = hospitalInfo?.hospitalName
                    ? `${hospitalInfo.hospitalType === 'รพ.สต.' ? 'โรงพยาบาลส่งเสริมสุขภาพตำบล' : hospitalInfo.hospitalType || ''} ${hospitalInfo.hospitalName}`.trim()
                    : 'โรงพยาบาลส่งเสริมสุขภาพตำบล';

                const displayLocation = (hospitalInfo?.district || hospitalInfo?.province)
                    ? `อ.${hospitalInfo.district || '-'} จ.${hospitalInfo.province || '-'}`
                    : 'อ.เฉลิมพระเกียรติ จ.นครศรีธรรมราช';

                return (
                    <div key={pageIndex} className={`request-sheet-container relative bg-white mx-auto ${isPdfMode ? 'w-[794px] min-h-[559px] p-8 flex flex-col justify-between' : 'w-full max-w-[794px]'} ${pageIndex < patients.length - 1 && !isPdfMode ? 'page-break' : ''}`}>
                        {/* Header Info */}
                        <div className="flex flex-col text-[12px] leading-snug mb-1">
                            <div className="flex justify-between items-center border-b border-black pb-1 mb-1">
                                <div className="flex gap-2 items-baseline">
                                    <span className="font-bold text-[15px]">{displayHospital}</span>
                                    <span className="text-[13px]">{displayLocation}</span>
                                </div>
                                <div className="flex items-center justify-end w-36 h-8 overflow-hidden mix-blend-multiply opacity-90">
                                    <Barcode value={patient.hn} width={1} height={22} displayValue={false} margin={0} background="transparent" />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-end">
                                <span className="font-bold">ชื่อ-สกุล</span>
                                <span className="flex-1 min-w-[140px] border-b border-dotted border-black px-1">{patient.name} {patient.surname}</span>
                                <span className="font-bold">อายุ</span>
                                <span className="w-10 border-b border-dotted border-black text-center">{patient.age || '-'}</span>
                                <span>ปี</span>
                                <span className="font-bold">HN</span>
                                <span className="w-20 border-b border-dotted border-black text-center">{patient.hn}</span>
                                <span className="font-bold">เลข ปชช.</span>
                                <span className="w-36 border-b border-dotted border-black text-center tracking-wider text-[12px]">{patient.idCard || '-'}</span>
                            </div>

                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-end mt-1">
                                <span className="font-bold">วัน/เดือน/ปี</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{formattedDate}</span>
                                <span className="font-bold">เวลา</span>
                                <span className="w-14 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).appointment_time as string : '........'}</span>
                                <span className="font-bold">Diagnosis</span>
                                <span className="flex-1 min-w-[100px] border-b border-dotted border-black px-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">{patient.disease || '-'}</span>
                                <span className="font-bold">Specimen</span>
                                <span className="w-36 border-b border-dotted border-black px-1 text-center font-mono text-[11px] whitespace-nowrap overflow-hidden">{specimenLabel}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 items-end mt-1">
                                <span className="font-bold">V/S BP1</span>
                                <span className="w-16 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? ((vitals[patient.hn] as Record<string, unknown>).bp as string || '') : '.../....'}</span>
                                <span className="text-[10px]">mmHg</span>
                                <span className="font-bold ml-2">BP2</span>
                                <span className="w-16 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? ((vitals[patient.hn] as Record<string, unknown>).bp2 as string || '') : '.../....'}</span>
                                <span className="text-[10px]">mmHg</span>
                                <span className="font-bold ml-4">P</span>
                                <span className="w-10 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).pulse as string : '......'}</span>
                                <span className="text-[10px]">/min</span>
                                <span className="font-bold ml-4">RR</span>
                                <span className="w-10 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).rr as string : '......'}</span>
                                <span className="text-[10px]">/min</span>
                                <span className="font-bold ml-4">T</span>
                                <span className="w-10 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).temperature as string : '......'}</span>
                                <span className="text-[10px]">°C</span>
                            </div>

                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-end mt-1 mb-1">
                                <span className="font-bold">น้ำหนัก</span>
                                <span className="w-12 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).weight as string : '......'}</span>
                                <span className="text-[10px]">กิโลกรัม</span>
                                <span className="font-bold">ส่วนสูง</span>
                                <span className="w-12 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).height as string : '......'}</span>
                                <span className="text-[10px]">ซม.</span>
                                <span className="font-bold">รอบเอว</span>
                                <span className="w-12 border-b border-dotted border-black text-center">{vitals?.[patient.hn] ? (vitals[patient.hn] as Record<string, unknown>).waist as string : '......'}</span>
                                <span className="text-[10px]">ซม.</span>
                            </div>
                        </div>

                        {/* Disease Selection Table */}
                        <div className="w-full border border-black flex flex-col text-[11px] leading-tight">
                            {/* Headers row — ALL square checkboxes */}
                            <div className="grid grid-cols-6 w-full border-b-2 border-black bg-gray-50">
                                <div className="border-r border-black py-1 flex justify-center items-center gap-1">
                                    <div className="w-5 h-5 border border-black flex justify-center items-center bg-white">{hasDM && <span className="font-bold text-[13px]">✓</span>}</div>
                                    <span className="font-bold text-[12px]">DM</span>
                                </div>
                                <div className="border-r border-black py-1 flex justify-center items-center gap-1">
                                    <div className="w-5 h-5 border border-black flex justify-center items-center bg-white">{hasHT && <span className="font-bold text-[13px]">✓</span>}</div>
                                    <span className="font-bold text-[12px]">HT</span>
                                </div>
                                <div className="border-r border-black py-1 flex justify-center items-center gap-1">
                                    <div className="w-5 h-5 border border-black flex justify-center items-center bg-white">{hasDLP && <span className="font-bold text-[13px]">✓</span>}</div>
                                    <span className="font-bold text-[12px]">DLP</span>
                                </div>
                                <div className="border-r border-black py-1 flex justify-center items-center gap-1">
                                    <div className="w-5 h-5 border border-black flex justify-center items-center bg-white">{hasCKD && <span className="font-bold text-[13px]">✓</span>}</div>
                                    <span className="font-bold text-[12px]">CKD</span>
                                </div>
                                <div className="border-r border-black py-1 flex justify-center items-center gap-1">
                                    <div className="w-5 h-5 border border-black flex justify-center items-center bg-white shrink-0">{hasAsthma && <span className="font-bold text-[11px]">✓</span>}</div>
                                    <span className="font-bold text-[10px] leading-tight text-center">Asthma/<br />COPD</span>
                                </div>
                                <div className="py-1 flex justify-center items-center font-bold text-[12px]">Other</div>
                            </div>

                            {/* Data Rows */}
                            {Array.from({ length: 9 }).map((_, i) => {
                                const hLabs = (vitals?.[patient.hn] as Record<string, unknown>)?.historical_labs as Record<string, string> || {};
                                const cLabs = (vitals?.[patient.hn] as Record<string, unknown>)?.current_labs as Record<string, string> || {};

                                const cellMap = [
                                    // Row 1
                                    [
                                        { label: "FBS", active: testTypes.includes('fbs (dm)'), val: hLabs['fbs'], currentVal: cLabs['fbs'] },
                                        { label: "FBS", active: testTypes.includes('fbs (ht)'), val: hLabs['fbs'], currentVal: cLabs['fbs'] },
                                        { label: "FBS", active: testTypes.includes('fbs (dlp)'), val: hLabs['fbs'], currentVal: cLabs['fbs'] },
                                        { label: "FBS", active: testTypes.includes('fbs (ckd)'), val: hLabs['fbs'], currentVal: cLabs['fbs'] },
                                        { label: "FBS", active: testTypes.includes('fbs (asthma/copd)'), val: hLabs['fbs'], currentVal: cLabs['fbs'] },
                                        { label: "Uric acid", active: testTypes.includes('uric acid') || testTypes.includes('uric'), val: hLabs['uric acid'], currentVal: cLabs['uric'], isPlain: true, unit: 'mg/dL' }
                                    ],
                                    // Row 2
                                    [
                                        { label: "HbA1c", active: testTypes.includes('hba1c (dm)'), isPlain: true },
                                        { label: "Lipid", active: testTypes.includes('lipid (ht)'), isPlain: true },
                                        { label: "Lipid", active: testTypes.includes('lipid (dlp)'), isPlain: true },
                                        { label: "HbA1c", active: testTypes.includes('hba1c (ckd)'), isPlain: true },
                                        { label: "Lipid", active: testTypes.includes('lipid (asthma/copd)'), isPlain: true },
                                        { label: "AST(SGOT)", active: testTypes.includes('ast(sgot)'), val: hLabs['ast'], currentVal: cLabs['ast'], isPlain: true }
                                    ],
                                    // Row 3
                                    [
                                        { label: "Lipid", active: testTypes.includes('lipid (dm)'), isPlain: true },
                                        { label: "Cr, GFR", active: testTypes.includes('cr, gfr (ht)'), isPlain: true },
                                        { label: "", active: false },
                                        { label: "Lipid", active: testTypes.includes('lipid (ckd)'), isPlain: true },
                                        { label: "CBC", active: testTypes.includes('cbc'), isPlain: true },
                                        { label: "ALT(SGPT)", active: testTypes.includes('alt(sgpt)'), val: hLabs['alt'], currentVal: cLabs['alt'], isPlain: true }
                                    ],
                                    // Row 4
                                    [
                                        { label: "Cr, GFR", active: testTypes.includes('cr, gfr (dm)'), isPlain: true },
                                        { label: "Na, K, Cl", active: testTypes.includes('na, k, cl (ht)'), isPlain: true },
                                        { label: "", active: false },
                                        { label: "Cr, GFR", active: testTypes.includes('cr, gfr (ckd)'), isPlain: true },
                                        { label: "", active: false },
                                        { label: "LFT", active: testTypes.includes('lft'), val: hLabs['lft'], currentVal: cLabs['lft'], isPlain: true }
                                    ],
                                    // Row 5
                                    [
                                        { label: "Hct", active: testTypes.includes('hct (dm)'), val: hLabs['hct'], currentVal: cLabs['hct'] },
                                        { label: "U-Alb", active: testTypes.includes('u-alb (ht)'), val: hLabs['u-alb'], currentVal: cLabs['u-alb'] },
                                        { label: "", active: false },
                                        { label: "Hct", active: testTypes.includes('hct (ckd)'), val: hLabs['hct'], currentVal: cLabs['hct'] },
                                        { label: "", active: false },
                                        { label: "Anti-HIV", active: testTypes.includes('anti-hiv'), val: hLabs['hiv'], currentVal: cLabs['hiv'], isPlain: true }
                                    ],
                                    // Row 6
                                    [
                                        { label: "U-Alb", active: testTypes.includes('u-alb (dm)'), val: hLabs['u-alb'], currentVal: cLabs['u-alb'] },
                                        { label: "U-sugar", active: testTypes.includes('u-sugar (ht)'), val: hLabs['u-sugar'], currentVal: cLabs['u-sugar'] },
                                        { label: "", active: false },
                                        { label: "electrolytes", active: testTypes.includes('electrolytes (ckd)'), val: hLabs['electrolyte'], currentVal: cLabs['electrolyte'], isPlain: true },
                                        { label: "", active: false },
                                        { label: "HBs-Ag", active: testTypes.includes('hbs-ag'), val: hLabs['hbs'], currentVal: cLabs['hbs'], isPlain: true }
                                    ],
                                    // Row 7
                                    [
                                        { label: "U-sugar", active: testTypes.includes('u-sugar (dm)'), val: hLabs['u-sugar'], currentVal: cLabs['u-sugar'] },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "microalbumin", active: testTypes.includes('microalbumin (ckd)'), val: hLabs['microalbumin'], currentVal: cLabs['microalbumin'], isPlain: true },
                                        { label: "", active: false },
                                        { label: "VDRL", active: testTypes.includes('vdrl'), val: hLabs['vdrl'], currentVal: cLabs['vdrl'], isPlain: true }
                                    ],
                                    // Row 8
                                    [
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "UPT", active: testTypes.includes('upt'), val: hLabs['upt'], currentVal: cLabs['upt'], isPlain: true }
                                    ],
                                    // Row 9
                                    [
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "", active: false },
                                        { label: "TFT", active: testTypes.includes('tft'), val: hLabs['tft'], currentVal: cLabs['tft'], isPlain: true }
                                    ]
                                ];

                                const row = cellMap[i];

                                return (
                                    <div key={i} className={`grid grid-cols-6 w-full ${i < 8 ? 'border-b border-black' : ''}`}>
                                        {row.map((cell: Record<string, unknown>, colIndex) => {
                                            if (!cell.label) return <div key={colIndex} className={`${!cell.noBorder && colIndex < 5 ? 'border-r border-black' : ''} p-1.5 min-h-[28px]`}></div>;

                                            // Handling the "Other" column (colIndex === 5) differently
                                            if (cell.isPlain || colIndex === 5) {
                                                return (
                                                    <div key={colIndex} className={`${colIndex < 5 ? 'border-r border-black' : 'border-l border-black'} p-1.5 min-h-[28px] flex items-center gap-1.5`}>
                                                        <span className="w-5 border-b border-black inline-block text-center font-bold text-[13px] leading-none pb-0.5">
                                                            {cell.active ? '✓' : ''}
                                                        </span>
                                                        <span className={`text-[11px] leading-tight ${cell.active ? "font-bold" : ""}`}>{cell.label as string}</span>
                                                    </div>
                                                );
                                            }

                                            // Handling dynamic input formatting neatly to avoid overlaps
                                            return (
                                                <div key={colIndex} className="border-r border-black px-1.5 py-1 min-h-[36px] flex flex-col justify-between">
                                                    <div className="flex w-full items-end gap-1">
                                                        <span className="font-bold w-3 text-center leading-none text-[14px]">{cell.active ? '✓' : '\u00A0'}</span>
                                                        <span className={`text-[11px] leading-tight ${cell.active ? "font-bold" : ""}`}>{cell.label as string}</span>
                                                        <span className="flex-1 border-b border-black border-dashed min-w-[10px] mb-0.5 text-center text-[10px] font-medium">{(cell.currentVal as string) || ''}</span>
                                                    </div>
                                                    <div className="text-right text-[9px] text-gray-600 mt-0.5 pr-1 leading-none tracking-tight">
                                                        (เดิม: {(cell.val as string) || '........'})
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer / Specimen + Branding + Signer — compact single row */}
                        <div className="flex justify-between items-center mt-1.5 text-[11px] font-bold">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap gap-2.5 items-center">
                                    <span>ลักษณะ Specimen</span>
                                    <label className="flex items-center gap-1 font-normal"><div className="w-3 h-3 border border-black"></div> Normal</label>
                                    <label className="flex items-center gap-1 font-normal"><div className="w-3 h-3 border border-black"></div> Clot</label>
                                    <label className="flex items-center gap-1 font-normal"><div className="w-3 h-3 border border-black"></div> Hemolysis</label>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-90 mt-0.5 overflow-visible">
                                    <span className="text-[11px] font-medium text-gray-500 italic leading-none">Powered by</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/images/logo.png" alt="BloodLink" className="h-8 w-auto object-contain" />
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-start pt-1">
                                <span>ผู้บันทึก</span>
                                <span className="w-40 border-b border-dotted border-black inline-block text-center text-blue-700 whitespace-nowrap overflow-hidden text-ellipsis text-[11px]">
                                    {creatorDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Signature Block (compact, inline with footer to prevent page 2) */}
                        {patientSignature && (
                            <div className="flex justify-end mt-0.5">
                                <div className="flex items-center gap-2 opacity-90 border border-gray-300 px-2 py-1 rounded max-w-full">
                                    <div className="text-[9px] font-mono text-right leading-tight tracking-tight">
                                        <span className="text-indigo-600 font-bold text-[11px]">E-Signed Authenticated</span>
                                        <br />
                                        <span className="text-gray-500 inline-block max-w-[450px] whitespace-normal break-all leading-snug">
                                            {patientSignature.signature_text?.replace(/\n/g, ' | ') ?? ''}
                                        </span>
                                    </div>
                                    <QRCode
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${patientSignature.qr_token}`}
                                        size={36}
                                        style={{ height: "auto", maxWidth: "100%", width: "36px" }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
