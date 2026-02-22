import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import { useMemo } from 'react';

// A4 Landscape Print Styles
const printStyles = `
    @media print {
        @page {
            size: A4 landscape;
            margin: 10mm;
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
}

export const PrintSummarySheet = ({ patients, hospitalName = 'โรงพยาบาลส่งเสริมสุขภาพตำบล' }: PrintSummarySheetProps) => {
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

    return (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-4 text-black font-[family-name:var(--font-kanit)]">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            {chunkedPatients.map((pagePatients, pageIndex) => (
                <div key={pageIndex} className={`w-full max-w-[297mm] mx-auto ${pageIndex < chunkedPatients.length - 1 ? 'page-break' : ''}`}>
                    {/* Header */}
                    <div className="mb-4">
                        <div className="flex justify-between items-end border-b border-black pb-2 mb-2">
                            <h1 className="text-xl font-bold">{hospitalName}</h1>
                            <div className="text-sm">
                                <span className="font-semibold">วันที่ส่งตรวจ:</span> {formattedDate}
                                {chunkedPatients.length > 1 && <span className="ml-4 font-semibold">หน้า: {pageIndex + 1}/{chunkedPatients.length}</span>}
                            </div>
                        </div>
                        <div className="text-center text-lg font-bold mb-4">แบบฟอร์มการส่งตรวจทางห้องปฏิบัติการ</div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-[12px]">
                        <thead>
                            <tr className="bg-gray-100/50">
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[40px] text-center">ลำดับ</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 text-left">ชื่อ - สกุล / ญาติ</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[100px] text-center">HN</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[130px] text-left">Diagnosis</th>
                                <th colSpan={5} className="border border-black px-2 py-1 text-center">รายการตรวจวิเคราะห์</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[180px] text-center">เลขบัตรประชาชน / เบอร์โทรศัพท์</th>
                                <th rowSpan={2} className="border border-black px-2 py-1 w-[100px] text-center">สรุปค่าตรวจ</th>
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
                                                    <div className="font-bold text-[13px] leading-tight mb-0.5">
                                                        {patient.name} {patient.surname}
                                                    </div>
                                                    {patient.relativeName && (
                                                        <div className="text-[10px] text-gray-700 leading-tight border-t border-dashed border-gray-300 pt-0.5 mt-0.5">
                                                            <span className="font-normal text-gray-500">ชื่อ-สกุลญาติ:</span> {patient.relativeName}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Column 3: HN */}
                                        <td className="border border-black text-center align-middle font-mono font-bold text-[13px]">
                                            {patient.hn}
                                        </td>

                                        {/* Column 4: Diagnosis */}
                                        <td className="border border-black px-2 align-middle">
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
                                                <div className="flex flex-col justify-center h-full gap-0.5">
                                                    {patient.idCard && (
                                                        <div className="font-mono text-[12px] tracking-tight leading-tight">
                                                            {patient.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-gray-700 leading-tight">
                                                        {patient.phone ? (
                                                            <>
                                                                <span className="text-gray-500 mr-1">เบอร์โทร:</span>
                                                                <span className="font-semibold">{patient.phone}</span>
                                                            </>
                                                        ) : patient.relativePhone ? (
                                                            <div className="border-t border-dashed border-gray-300 pt-0.5 mt-0.5">
                                                                <span className="text-gray-500 mr-1">ความสัมพันธ์:</span>
                                                                <span>{patient.relativeRelationship || 'ญาติ'}</span>
                                                                <span className="ml-2">({patient.relativePhone})</span>
                                                            </div>
                                                        ) : '-'}
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

                    {/* Signature and Responsibility Block */}
                    <div className="flex justify-between mt-6 text-[12px] border-t border-dashed border-gray-400 pt-4">
                        <div className="flex flex-col gap-1 items-start w-1/3">
                            <span className="font-bold">หน่วยงานต้นทาง (รพ.สต.):</span>
                            <div className="mt-1 flex items-center gap-2">
                                <span>ผู้สั่งเจาะเลือด/ส่งตรวจ:</span>
                                <span className="font-semibold text-blue-700">
                                    {pagePatients.some(p => p && p.creatorEmail)
                                        ? pagePatients.find(p => p && p.creatorEmail)?.creatorEmail
                                        : '.......................................'}
                                </span>
                            </div>
                            <div className="mt-1 text-gray-500 text-[10px]">
                                (ลายเซ็นผู้ส่ง).......................................
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 items-center w-1/3 border-x border-dashed border-gray-300 px-4">
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
