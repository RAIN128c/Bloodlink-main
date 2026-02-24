import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import { useMemo } from 'react';
import QRCode from 'react-qr-code';

// A4 Landscape Print Styles
const printStyles = `
    @media print {
        @page summary {
            size: A4 landscape;
            margin: 10mm;
        }
        .summary-sheet-container {
            page: summary;
        }
        body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
        }
        .print-only {
            display: block !important;
        }
        .screen-only {
            display: none !important;
        }
        .page-break {
            page-break-after: always;
        }
    }
    @media screen {
        .print-only {
            display: none;
        }
    }
`;

interface PrintSummarySheetProps {
    patients: Patient[];
    hospitalName?: string;
    signature?: { qr_token: string; signature_text: string; } | null;
}

export const PrintSummarySheet = ({ patients, signature, hospitalName = 'โรงพยาบาลส่งเสริมสุขภาพตำบล' }: PrintSummarySheetProps) => {
    // Chunk patients into pages of 10
    const chunkedPatients = useMemo(() => {
        const list = [...patients];
        const chunks = [];
        for (let i = 0; i < list.length; i += 10) {
            const chunk = list.slice(i, i + 10);
            while (chunk.length < 10) {
                chunk.push({} as Patient);
            }
            chunks.push(chunk);
        }
        if (chunks.length === 0) {
            // At least one empty page if no patients
            const emptyChunk = [];
            for (let i = 0; i < 10; i++) emptyChunk.push({} as Patient);
            chunks.push(emptyChunk);
        }
        return chunks;
    }, [patients]);

    const currentDate = new Date();
    const formattedDate = formatDateThai(currentDate.toISOString());

    const extractNameFromSignature = (text?: string) => {
        if (!text) return null;
        const match = text.match(/Digitally Signed by:\s*(.*?)\s*\|/);
        return match ? match[1].trim() : null;
    };

    const signerName = extractNameFromSignature(signature?.signature_text);

    return (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-4 text-black font-[family-name:var(--font-kanit)]">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            {chunkedPatients.map((pagePatients, pageIndex) => (
                <div key={pageIndex} className={`summary-sheet-container w-full max-w-[297mm] mx-auto ${pageIndex < chunkedPatients.length - 1 ? 'page-break' : ''}`}>
                    {/* Header */}
                    <div className="flex justify-between items-end mb-4">
                        <div className="text-[16px] font-bold">
                            แบบฟอร์มการส่งตรวจทางห้องปฏิบัติการ โรงพยาบาลส่งเสริมสุขภาพตำบล <span className="underline decoration-dotted underline-offset-4 font-normal ml-2">{hospitalName.replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', '').trim() || '........................'}</span>
                        </div>
                        <div className="text-[13px]">
                            <span className="font-bold">วันที่ส่งตรวจ:</span> <span className="underline decoration-dotted underline-offset-4 ml-1 mr-4">{formattedDate}</span>
                            <span className="font-bold">เวลา:</span> <span className="underline decoration-dotted underline-offset-4 ml-1 inline-block w-16 text-center">............</span>
                            {chunkedPatients.length > 1 && <span className="ml-4 font-bold">หน้า: {pageIndex + 1}/{chunkedPatients.length}</span>}
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-[12px]">
                        {/* ... table content remains below ... */}
                        <thead>
                            <tr className="bg-gray-100/50 text-[11px]">
                                <th rowSpan={2} className="border border-black px-1 py-1 w-[30px] text-center">ลำดับ</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 text-center w-[160px]">
                                    ชื่อ - สกุล<br />
                                    <span className="font-normal text-[10px]">ชื่อ-สกุลญาติ..........................................</span>
                                </th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[80px] text-center">
                                    HN<br />
                                    <span className="font-normal text-[10px]">"รพ..............."</span>
                                </th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[120px] text-center">Diagnosis</th>
                                <th colSpan={5} className="border border-black px-2 py-1 text-center">รายการตรวจวิเคราะห์</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 text-center">
                                    เลขบัตรประชาชน<br />
                                    <span className="font-normal text-[10px]">เบอร์โทร......................... ความสัมพันธ์........................</span>
                                </th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[80px] text-center">สรุปค่าตรวจ</th>
                            </tr>
                            <tr className="bg-gray-100/50">
                                <th className="border border-black px-1 py-1 w-[35px] text-center text-[10px]">CBC</th>
                                <th className="border border-black px-1 py-1 w-[35px] text-center text-[10px]">Chem</th>
                                <th className="border border-black px-1 py-1 w-[35px] text-center text-[10px]">HbA1C</th>
                                <th className="border border-black px-1 py-1 w-[35px] text-center text-[10px]">Immun</th>
                                <th className="border border-black px-1 py-1 w-[35px] text-center text-[10px]">Thyroid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagePatients.map((patient, index) => {
                                const isPlaceholder = !patient.hn;
                                const globalIndex = (pageIndex * 10) + index + 1;
                                // Determine checks based on patient.testType string
                                const testTypes = patient.testType || '';
                                const hasCBC = testTypes.includes('CBC');
                                const hasChem = testTypes.includes('Chemistry') || testTypes.includes('Profile') || testTypes.includes('FBS') || testTypes.includes('Creatinine') || testTypes.includes('LFT') || testTypes.includes('Electrolytes') || testTypes.includes('Uric Acid'); // Grouping chemistry tests
                                const hasHbA1c = testTypes.includes('HbA1c');
                                const hasImmun = testTypes.includes('Immun') || testTypes.includes('Anti-HIV') || testTypes.includes('HBs-Ag') || testTypes.includes('VDRL');
                                const hasThyroid = testTypes.includes('Thyroid') || testTypes.includes('TFT') || testTypes.includes('TSH') || testTypes.includes('FT3') || testTypes.includes('FT4');

                                return (
                                    <tr key={index} className="h-[45px]">
                                        {/* Column 1: Index */}
                                        <td className="border border-black text-center align-middle font-bold text-[13px]">
                                            {!isPlaceholder ? globalIndex : ''}
                                        </td>

                                        {/* Column 2: Name & Relative */}
                                        <td className="border border-black px-2 py-1 align-top relative">
                                            {!isPlaceholder && (
                                                <div className="flex flex-col justify-center h-full">
                                                    <div className="font-bold text-[13px] leading-tight mb-1">
                                                        {patient.name} {patient.surname}
                                                    </div>
                                                    <div className="text-[10px] text-gray-700 leading-tight">
                                                        <span className="font-normal text-gray-500 mr-1">ชื่อ-สกุลญาติ:</span>
                                                        <span className="border-b border-dotted border-gray-400 inline-block min-w-[100px]">{patient.relativeName || ''}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Column 3: HN */}
                                        <td className="border border-black px-2 py-1 align-top text-center">
                                            {!isPlaceholder && (
                                                <div className="flex flex-col justify-center h-full gap-1">
                                                    <span className="font-mono font-bold text-[13px]">{patient.hn}</span>
                                                    <span className="text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-0.5">
                                                        -
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Column 4: Diagnosis */}
                                        <td className="border border-black px-2 align-middle text-center">
                                            {!isPlaceholder && (
                                                <span className="text-[11px] leading-tight block">
                                                    {patient.disease || '-'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Columns 5-9: Checkboxes */}
                                        <td className="border border-black align-middle text-center">
                                            {hasCBC ? <span className="font-bold text-[14px]">✓</span> : ''}
                                        </td>
                                        <td className="border border-black align-middle text-center">
                                            {hasChem ? <span className="font-bold text-[14px]">✓</span> : ''}
                                        </td>
                                        <td className="border border-black align-middle text-center">
                                            {hasHbA1c ? <span className="font-bold text-[14px]">✓</span> : ''}
                                        </td>
                                        <td className="border border-black align-middle text-center">
                                            {hasImmun ? <span className="font-bold text-[14px]">✓</span> : ''}
                                        </td>
                                        <td className="border border-black align-middle text-center">
                                            {hasThyroid ? <span className="font-bold text-[14px]">✓</span> : ''}
                                        </td>

                                        {/* Column 10: ID Card & Phone */}
                                        <td className="border border-black px-2 py-1 align-top">
                                            {!isPlaceholder && (
                                                <div className="flex flex-col h-full gap-1">
                                                    <div className="text-[13px] tracking-widest text-center leading-tight">
                                                        {patient.idCard ? patient.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1 $2 $3 $4 $5') : ''}
                                                    </div>
                                                    <div className="text-[10px] flex gap-2 w-full mt-auto">
                                                        <span className="text-gray-500">เบอร์โทร</span>
                                                        <span className="border-b border-dotted border-gray-400 flex-1 min-w-[60px]">{patient.phone || patient.relativePhone || ''}</span>
                                                        <span className="text-gray-500">ความสัมพันธ์</span>
                                                        <span className="border-b border-dotted border-gray-400 w-12 text-center">{patient.relativeRelationship || (patient.relativePhone ? 'ญาติ' : '')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Column 11: End Column */}
                                        <td className="border border-black text-center align-middle text-gray-400 text-[10px]">
                                            {!isPlaceholder ? '' : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="flex justify-between mt-4 text-[12px] border-t border-dashed border-gray-400 pt-3 relative">
                        <div className="flex flex-col gap-1 items-start w-[38%]">
                            {signature ? (
                                <div className="flex flex-col items-start w-full">
                                    <div className="flex gap-2 items-start mb-2">
                                        <div className="w-[58px] h-[58px] bg-white p-1 border border-gray-200 flex-shrink-0">
                                            {typeof window !== 'undefined' && (
                                                <QRCode
                                                    value={`${window.location.origin}/verify/${signature.qr_token}`}
                                                    size={48}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col text-[8px] font-mono leading-tight max-w-[280px]">
                                            <span className="font-bold text-indigo-700 text-[9px] mb-0.5">E-Signature Validated ✓</span>
                                            <span className="text-gray-600 break-words whitespace-pre-wrap">{signature.signature_text}</span>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex flex-col gap-0.5">
                                        <span className="font-bold">หน่วยงานต้นทาง (รพ.สต.):</span>
                                        <div className="flex items-center gap-1 text-[11px]">
                                            <span>ผู้ส่งตรวจ:</span>
                                            <span className="font-semibold text-blue-700">{signerName || pagePatients.find(p => p && p.creatorEmail)?.creatorEmail}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold">หน่วยงานต้นทาง (รพ.สต.):</span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span>ผู้สั่งเจาะเลือด/ส่งตรวจ:</span>
                                        <span className="font-semibold text-blue-700">
                                            {pagePatients.some(p => p && p.creatorEmail)
                                                ? (signerName || pagePatients.find(p => p && p.creatorEmail)?.creatorEmail)
                                                : '.......................................'}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-gray-500 text-[10px]">
                                        (ลายเซ็นผู้ส่ง).......................................
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 items-center w-[24%] border-x border-dashed border-gray-300 px-2">
                            <span className="font-bold">ข้อมูลตัวอย่างเลือด:</span>
                            <div className="flex gap-4 mt-1">
                                <span>วันที่......../......../........</span>
                                <span>เวลา..................</span>
                            </div>
                            <div className="mt-2 text-red-600 text-[11px] leading-tight">
                                หมายเหตุ/สาเหตุความไม่ถูกต้อง.........................................................
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end w-1/3">
                            <span className="font-bold">หน่วยงานปลายทาง (ห้องแล็บ รพช.):</span>
                            <div className="flex gap-4 my-2">
                                <label className="flex items-center gap-1"><input type="checkbox" className="w-3 h-3" /> สิ่งส่งตรวจถูกต้อง</label>
                                <label className="flex items-center gap-1 text-red-600"><input type="checkbox" className="w-3 h-3" /> ไม่ถูกต้อง</label>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span>ผู้รับเรื่อง/ตรวจวิเคราะห์:</span>
                                <span className="font-semibold text-indigo-700">
                                    {pagePatients.some(p => p && p.responsibleEmails && p.responsibleEmails.length > 0)
                                        ? pagePatients.find(p => p && p.responsibleEmails && p.responsibleEmails.length > 0)?.responsibleEmails?.[0]
                                        : '.......................................'}
                                </span>
                            </div>
                            <div className="mt-1 text-gray-500 text-[10px]">
                                (ลายเซ็นผู้รับ).......................................
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
