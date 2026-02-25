import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import QRCode from 'react-qr-code';

// A5 Landscape Print Styles for Request Sheet
const printStyles = `
    @media print {
        @page {
            size: A4 portrait;
            margin: 10mm;
        }
        body {
            visibility: hidden;
        }
        .request-sheet-container {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
        }
        .request-sheet-container * {
            visibility: visible;
        }
        .page-break {
            page-break-after: always;
        }
        .screen-only {
            display: none !important;
        }
    }
`;

interface PrintRequestSheetProps {
    patients: Patient[]; // Usually array of 1 for this sheet format, but accepts array for batch printing
    hospitalName?: string;
    signatures?: Record<string, { qr_token: string; signature_text: string; } | null>;
    vitals?: Record<string, any>; // Record<hn, VitalsObject>
    isPdfMode?: boolean; // Flag to render strictly for html2canvas
}

export const PrintRequestSheet = ({ patients, signatures, vitals, hospitalName = 'โรงพยาบาลส่งเสริมสุขภาพตำบล', isPdfMode = false }: PrintRequestSheetProps) => {
    return (
        <div className={isPdfMode ? "bg-white text-black font-[family-name:var(--font-kanit)]" : "w-full text-black font-[family-name:var(--font-kanit)]"}>
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

                const extractNameFromSignature = (text?: string) => {
                    if (!text) return null;
                    const match = text.match(/Digitally Signed by:\s*(.*?)\s*\|/);
                    return match ? match[1].trim() : null;
                };

                const signerName = extractNameFromSignature(patientSignature?.signature_text);
                const creatorDisplay = signerName || patient.creatorEmail || '.......................................';

                return (
                    <div key={pageIndex} className={`request-sheet-container relative bg-white mx-auto ${isPdfMode ? 'w-[794px] min-h-[1123px] p-8' : 'w-full max-w-[794px]'} ${pageIndex < patients.length - 1 && !isPdfMode ? 'page-break' : ''}`}>
                        {/* Header Info */}
                        <div className="flex flex-col gap-2 text-[14px] leading-tight mb-4">
                            <div className="flex gap-2 items-end border-b border-black pb-1">
                                <span className="font-bold text-[16px]">{hospitalName}</span>
                                <span className="flex-1 border-b border-dotted border-black px-2">อ.เฉลิมพระเกียรติ จ.นครศรีธรรมราช</span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-end">
                                <span className="font-bold">ชื่อ-สกุล</span>
                                <span className="min-w-[200px] border-b border-dotted border-black px-2">{patient.name} {patient.surname}</span>
                                <span className="font-bold">อายุ</span>
                                <span className="w-16 border-b border-dotted border-black text-center">{patient.age || '-'}</span>
                                <span>ปี</span>
                                <span className="font-bold ml-2">HN</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{patient.hn}</span>
                                <span className="font-bold ml-2">เลข ปชช.</span>
                                <span className="flex-1 border-b border-dotted border-black text-center tracking-widest">{patient.idCard || '-'}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-end mt-1">
                                <span className="font-bold">วัน/เดือน/ปี</span>
                                <span className="w-32 border-b border-dotted border-black text-center">{formattedDate}</span>
                                <span className="font-bold">เวลา</span>
                                <span className="w-20 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.appointment_time || '............'}</span>
                                <span className="font-bold ml-4">Diagnosis</span>
                                <span className="flex-1 min-w-[150px] border-b border-dotted border-black px-2">{patient.disease || '-'}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-end mt-1">
                                <span className="font-bold">Specimen</span>
                                <span className="flex-1 border-b border-dotted border-black px-2">{patient.testType || '-'}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-end mt-1">
                                <span className="font-bold">BP</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.bp || '......./.......'}</span>
                                <span>mmHg</span>
                                <span className="font-bold ml-4">Pulse</span>
                                <span className="w-20 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.pulse || '........'}</span>
                                <span>/min</span>
                                <span className="font-bold ml-4">Temp</span>
                                <span className="w-20 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.temperature || '........'}</span>
                                <span>°C</span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-end mt-1">
                                <span className="font-bold">น้ำหนัก</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.weight || '........'}</span>
                                <span className="mr-2">กิโลกรัม</span>
                                <span className="font-bold ml-2">ส่วนสูง</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.height || '........'}</span>
                                <span className="mr-2">ซม.</span>
                                <span className="font-bold ml-2">รอบเอว</span>
                                <span className="w-24 border-b border-dotted border-black text-center">{vitals?.[patient.hn]?.waist || '........'}</span>
                                <span>ซม.</span>
                            </div>
                        </div>

                        {/* Disease Selection Table */}
                        <div className="w-full border border-black grid grid-cols-6 text-[12px] leading-tight">
                            {/* Headers */}
                            <div className="border-r border-b border-black text-center font-bold p-1 bg-gray-100/50">DM</div>
                            <div className="border-r border-b border-black text-center font-bold p-1 bg-gray-100/50">HT</div>
                            <div className="border-r border-b border-black text-center font-bold p-1 bg-gray-100/50">DLP</div>
                            <div className="border-r border-b border-black text-center font-bold p-1 bg-gray-100/50">CKD</div>
                            <div className="border-r border-b border-black text-center font-bold p-1 bg-gray-100/50">Asthma/COPD</div>
                            <div className="border-b border-black text-center font-bold p-1 bg-gray-100/50">Other</div>

                            {/* Checkboxes row */}
                            <div className="border-r border-b border-black p-1 flex justify-center"><div className="relative w-4 h-4 border border-black flex items-center justify-center">{hasDM && <span className="absolute -top-1 font-bold">✓</span>}</div></div>
                            <div className="border-r border-b border-black p-1 flex justify-center"><div className="relative w-4 h-4 border border-black flex items-center justify-center">{hasHT && <span className="absolute -top-1 font-bold">✓</span>}</div></div>
                            <div className="border-r border-b border-black p-1 flex justify-center"><div className="relative w-4 h-4 border border-black flex items-center justify-center">{hasDLP && <span className="absolute -top-1 font-bold">✓</span>}</div></div>
                            <div className="border-r border-b border-black p-1 flex justify-center"><div className="relative w-4 h-4 border border-black flex items-center justify-center">{hasCKD && <span className="absolute -top-1 font-bold">✓</span>}</div></div>
                            <div className="border-r border-b border-black p-1 flex justify-center"><div className="relative w-4 h-4 border border-black flex items-center justify-center">{hasAsthma && <span className="absolute -top-1 font-bold">✓</span>}</div></div>
                            <div className="border-b border-black p-1"></div>

                            {/* First Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">FBS{checkTest('fbs')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">FBS{checkTest('fbs')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">FBS{checkTest('fbs')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">FBS{checkTest('fbs')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">FBS{checkTest('fbs')}</div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['uric'])}</div> Uric acid <span className="border-b border-dotted border-black flex-1 mt-auto"></span></div>

                            {/* Second Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">HbA1C{checkTest('hba1c')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Lipid{checkTest('lipid')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Lipid{checkTest('lipid')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">HbA1C{checkTest('hba1c')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Lipid{checkTest('lipid')}</div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['ast', 'sgot'])}</div> AST(SGOT)</div>

                            {/* Third Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">Lipid{checkTest('lipid')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Cr, GFR{checkTest('cr') || checkTest('gfr')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-r border-b border-black p-1 relative text-center">Lipid{checkTest('lipid')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">CBC{checkTest('cbc')}</div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['alt', 'sgpt'])}</div> ALT(SGPT)</div>

                            {/* Fourth Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">Cr, GFR{checkTest('cr') || checkTest('gfr')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Na, K,Cl{checkTest('na') || checkTest('k') || checkTest('cl') || checkTest('electrolyte')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-r border-b border-black p-1 relative text-center">Cr, GFR{checkTest('cr') || checkTest('gfr')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">Na, K,Cl{checkTest('na') || checkTest('k') || checkTest('cl') || checkTest('electrolyte')}</div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['lft'])}</div> LFT</div>

                            {/* Fifth Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">Hct{checkTest('hct')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">U-Alb{checkTest('u-alb')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-r border-b border-black p-1 relative text-center">Hct{checkTest('hct')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['anti-hiv', 'hiv'])}</div> Anti-HIV</div>

                            {/* Sixth Item Row */}
                            <div className="border-r border-b border-black p-1 relative text-center">U-Alb{checkTest('u-alb')}</div>
                            <div className="border-r border-b border-black p-1 relative text-center">U-sugar{checkTest('u-sugar')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-r border-b border-black p-1 relative text-center">electrolytes{checkTest('electrolyte')}</div>
                            <div className="border-r border-b border-black bg-gray-100/30"></div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['hbs-ag', 'hbs'])}</div> HBs-Ag</div>

                            {/* Seventh Item Row */}
                            <div className="border-r border-black p-1 relative text-center">U-sugar{checkTest('u-sugar')}</div>
                            <div className="border-r border-black bg-gray-100/30"></div>
                            <div className="border-r border-black bg-gray-100/30"></div>
                            <div className="border-r border-black p-1 relative text-center">microalbumin{checkTest('microalbumin')}</div>
                            <div className="border-r border-black bg-gray-100/30"></div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['vdrl'])}</div> VDRL</div>

                            {/* Eighth Item Row */}
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-b border-black p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['upt'])}</div> UPT</div>

                            {/* Ninth Item Row */}
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="border-t border-r border-black bg-gray-100/30 p-1"></div>
                            <div className="p-1 flex gap-2 items-center"><div className="w-3 h-3 border border-black shrink-0 relative">{checkList(['tft', 'thyroid', 'tsh', 'ft3', 'ft4'])}</div> TFT</div>
                        </div>

                        {/* Footer / Specimen Status / Signature */}
                        <div className="flex flex-wrap justify-between items-end mt-4 text-[13px] font-bold gap-4">
                            <div className="flex flex-wrap gap-4 items-center">
                                <span>ลักษณะ Specimen</span>
                                <label className="flex items-center gap-1 font-normal"><div className="w-4 h-4 border border-black"></div> Normal</label>
                                <label className="flex items-center gap-1 font-normal"><div className="w-4 h-4 border border-black"></div> Clot</label>
                                <label className="flex items-center gap-1 font-normal"><div className="w-4 h-4 border border-black"></div> Hemolysis</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <span>ผู้บันทึก</span>
                                <span className="w-48 border-b border-dotted border-black inline-block text-center text-blue-700 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {creatorDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Signature Block (if signed digitally) - Moved to flow normally below the grid */}
                        {patientSignature && (
                            <div className="flex justify-end mt-4 pr-4">
                                <div className="flex items-center gap-3 opacity-90 border border-gray-300 p-2 rounded-lg max-w-full">
                                    <div className="text-[10px] font-mono text-right">
                                        <span className="text-indigo-600 font-bold text-[12px]">E-Signed Authenticated</span>
                                        <br />
                                        <span className="text-gray-600 inline-block max-w-[280px] sm:max-w-md break-words whitespace-pre-wrap">{patientSignature.signature_text}</span>
                                    </div>
                                    <QRCode
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${patientSignature.qr_token}`}
                                        size={48}
                                        style={{ height: "auto", maxWidth: "100%", width: "48px" }}
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
