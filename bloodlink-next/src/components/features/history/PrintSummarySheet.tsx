import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import { useMemo } from 'react';

// A4 Portrait Print Styles
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
    // Ensure we only take up to 10 patients
    const displayPatients = useMemo(() => {
        const list = [...patients].slice(0, 10);
        // Fill remaining slots with empty placeholders if less than 10
        while (list.length < 10) {
            list.push({} as Patient);
        }
        return list;
    }, [patients]);

    const currentDate = new Date();
    const formattedDate = formatDateThai(currentDate.toISOString());

    return (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-4 text-black font-[family-name:var(--font-sarabun)]">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            <div className="w-full max-w-[297mm] mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex justify-between items-end border-b pb-2 mb-2">
                        <h1 className="text-xl font-bold">{hospitalName}</h1>
                        <div className="text-sm">
                            <span className="font-semibold">วันที่ส่งตรวจ:</span> {formattedDate}
                        </div>
                    </div>
                    <div className="text-center text-lg font-bold mb-4">แบบฟอร์มการส่งตรวจทางห้องปฏิบัติการ</div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-black text-[12px]">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-1 w-[40px] text-center">ลำดับ</th>
                            <th className="border border-black px-2 py-1 text-left">ชื่อ - สกุล / ญาติ</th>
                            <th className="border border-black px-2 py-1 w-[100px] text-center">HN</th>
                            <th className="border border-black px-2 py-1 w-[150px] text-left">Diagnosis / อาการ</th>
                            <th className="border border-black px-2 py-1 w-[30px] text-center text-[10px]">CBC</th>
                            <th className="border border-black px-2 py-1 w-[30px] text-center text-[10px]">Chem</th>
                            <th className="border border-black px-2 py-1 w-[30px] text-center text-[10px]">HbA1c</th>
                            <th className="border border-black px-2 py-1 w-[30px] text-center text-[10px]">Lipid</th>
                            <th className="border border-black px-2 py-1 w-[30px] text-center text-[10px]">Urine</th>
                            <th className="border border-black px-2 py-1 w-[200px] text-center">เลขบัตรประชาชน / เบอร์โทรศัพท์</th>
                            <th className="border border-black px-2 py-1 w-[100px] text-center">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayPatients.map((patient, index) => {
                            const isPlaceholder = !patient.hn;

                            return (
                                <tr key={index} className="h-[55px]">
                                    {/* Column 1: Index */}
                                    <td className="border border-black text-center align-middle font-bold">
                                        {index + 1}
                                    </td>

                                    {/* Column 2: Name & Relative */}
                                    <td className="border border-black px-2 py-1 align-top">
                                        {!isPlaceholder && (
                                            <div className="flex flex-col">
                                                <div className="font-bold text-[13px] leading-tight mb-0.5">
                                                    {patient.name} {patient.surname}
                                                </div>
                                                {patient.relativeName && (
                                                    <div className="text-[11px] text-gray-600 font-light leading-tight">
                                                        <span className="font-normal">ญาติ:</span> {patient.relativeName} <span className="text-gray-500">({patient.relativeRelationship || '-'})</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Column 3: HN */}
                                    <td className="border border-black text-center align-middle font-mono font-bold text-[12px]">
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

                                    {/* Columns 5-9: Checkboxes - Auto-ticked based on testType */}
                                    <td className="border border-black align-middle text-center">
                                        {patient.testType?.includes('CBC') ? <span className="font-bold text-[14px]">✓</span> : ''}
                                    </td>
                                    <td className="border border-black align-middle text-center">
                                        {patient.testType?.includes('Chemistry') ? <span className="font-bold text-[14px]">✓</span> : ''}
                                    </td>
                                    <td className="border border-black align-middle text-center">
                                        {patient.testType?.includes('HbA1c') ? <span className="font-bold text-[14px]">✓</span> : ''}
                                    </td>
                                    <td className="border border-black align-middle text-center">
                                        {patient.testType?.includes('Lipid') ? <span className="font-bold text-[14px]">✓</span> : ''}
                                    </td>
                                    <td className="border border-black align-middle text-center">
                                        {patient.testType?.includes('Urine') || patient.testType?.includes('Urinalysis') ? <span className="font-bold text-[14px]">✓</span> : ''}
                                    </td>

                                    {/* Column 10: ID Card & Phone */}
                                    <td className="border border-black px-2 py-1 align-top">
                                        {!isPlaceholder && (
                                            <div className="flex flex-col gap-0.5">
                                                {patient.idCard && (
                                                    <div className="font-mono text-[12px] tracking-tight leading-tight">
                                                        {patient.idCard}
                                                    </div>
                                                )}
                                                <div className="text-[11px] text-gray-700 leading-tight">
                                                    {patient.phone ? (
                                                        <>
                                                            <span className="text-gray-500 text-[10px] mr-1">โทร:</span>
                                                            <span className="font-semibold">{patient.phone}</span>
                                                        </>
                                                    ) : patient.relativePhone ? (
                                                        <>
                                                            <span className="text-gray-500 text-[10px] mr-1">ญาติ:</span>
                                                            <span>{patient.relativePhone}</span>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Column 11: Note */}
                                    <td className="border border-black text-center align-middle text-gray-400 text-[10px]">
                                        {!isPlaceholder ? '' : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="flex justify-around mt-8 text-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="border-b border-black w-[150px] border-dotted"></div>
                        <span>ผู้บันทึก</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="border-b border-black w-[150px] border-dotted"></div>
                        <span>ผู้ตรวจสอบ / สั่งตรวจ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
