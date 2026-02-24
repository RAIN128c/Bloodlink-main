
import { Patient } from '@/types';
import { formatDateThai } from '@/lib/utils';
import React from 'react';

const printStyles = `
    @media print {
        @page {
            size: A5 landscape;
            margin: 5mm;
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

interface RequestSheetProps {
    patient: Patient;
    hospitalName?: string;
}

export const RequestSheet = ({ patient, hospitalName = 'โรงพยาบาลส่งเสริมสุขภาพตำบล.............' }: RequestSheetProps) => {
    const currentDate = new Date();
    const formattedDate = formatDateThai(currentDate.toISOString());

    // Helper to render checkbox
    const CheckBox = ({ checked, label }: { checked?: boolean; label: string }) => (
        <div className="flex items-center gap-1">
            <div className={`w-4 h-4 border border-black flex items-center justify-center ${checked ? 'font-bold' : ''}`}>
                {checked && '✓'}
            </div>
            <span className="text-[12px]">{label}</span>
        </div>
    );

    // Helper for grid cell with label and value
    const GridCell = ({ label, value, unit }: { label: string; value?: string; unit?: string }) => (
        <div className="flex flex-col border border-black p-1 h-[45px] justify-between">
            <span className="text-[10px] font-semibold">{label}</span>
            <div className="flex justify-end items-end gap-1">
                <span className="text-[14px] font-bold">{value || '-'}</span>
                {unit && <span className="text-[10px] text-gray-600 mb-0.5">{unit}</span>}
            </div>
        </div>
    );

    return (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-4 text-black font-[family-name:var(--font-sarabun)]">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            <div className="w-[200mm] mx-auto border border-black p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-2 border-b border-black pb-2">
                    <div>
                        <h1 className="text-lg font-bold">{hospitalName}</h1>
                        <div className="text-sm">อ.เฉลิมพระเกียรติ จ.นครศรีธรรมราช</div>
                    </div>
                    <div className="text-right text-sm">
                        <div><span className="font-semibold">วันที่:</span> {formattedDate}</div>
                        <div><span className="font-semibold">เวลา:</span> {currentDate.toLocaleTimeString('th-TH')}</div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-[14px]">
                        <span className="font-bold text-[16px]">ชื่อ-สกุล:</span> {patient.name} {patient.surname}
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold">HN:</span> {patient.hn}
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold">อายุ:</span> {patient.age} ปี
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold">เลขบัตรประชาชน:</span> {patient.idCard}
                    </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-7 gap-0 mb-4 text-center">
                    <GridCell label="น้ำหนัก" value="" unit="kg" />
                    <GridCell label="ส่วนสูง" value="" unit="cm" />
                    <GridCell label="รอบเอว" value="" unit="cm" />
                    <GridCell label="สพ." value="" unit="cm" /> {/* Hip - placeholder if needed or remove */}
                    <GridCell label="BP" value="" unit="mmHg" />
                    <GridCell label="Pulse" value="" unit="/min" />
                    <GridCell label="Temp" value="" unit="C" />
                    <GridCell label="DTX" value="" unit="mg/dL" />
                    {/* Fill empty cells to make row complete if 7 cols doesn't fit perfectly or adjust cols */}
                </div>

                {/* Diagnosis & Lab Request Layout */}
                <div className="grid grid-cols-12 gap-0 border border-black">
                    {/* Header Row */}
                    <div className="col-span-3 border-r border-b border-black p-1 font-bold text-center text-[12px] bg-gray-100">Diagnosis</div>
                    <div className="col-span-9 border-b border-black p-1 font-bold text-center text-[12px] bg-gray-100">Lab Request</div>

                    {/* Content */}
                    <div className="col-span-3 border-r border-black p-2 flex flex-col gap-2">
                        {['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].map(d => (
                            <CheckBox key={d} label={d} checked={patient.disease?.includes(d)} />
                        ))}
                        <div className="mt-2 border-t border-dotted border-black pt-1">
                            <span className="text-[10px] block font-semibold">Other:</span>
                            <span className="text-[12px]">{patient.disease?.split(',').filter(d => !['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].includes(d)).join(', ')}</span>
                        </div>
                    </div>

                    <div className="col-span-9 p-2">
                        <div className="grid grid-cols-4 gap-y-2 gap-x-4">
                            {[
                                'FBS', 'HbA1c', 'Lipid Profile', 'Creatinine',
                                'eGFR', 'Urinalysis', 'Electrolytes', 'Uric Acid',
                                'LFT', 'Anti-HIV', 'HBs-Ag', 'VDRL',
                                'UPT', 'CBC'
                            ].map(lab => (
                                <CheckBox key={lab} label={lab} checked={patient.testType?.includes(lab)} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Section: Specimen & Signatures */}
                <div className="mt-4 flex flex-col gap-2">
                    {/* Specimen Checkboxes (Empty for Lab use) */}
                    <div className="flex gap-6 border border-black p-2 bg-gray-50 items-center">
                        <span className="text-[12px] font-bold">ลักษณะสิ่งส่งตรวจ (Specimen):</span>
                        <CheckBox label="Normal" />
                        <CheckBox label="Clot" />
                        <CheckBox label="Hemolysis" />
                        <div className="flex-1 text-right">
                            <div className="text-[12px] border-b border-black w-[150px] inline-block"></div> <span className="text-[10px]">ผู้รับสิ่งส่งตรวจ</span>
                        </div>
                    </div>

                    <div className="flex justify-between mt-4 px-8 text-center pt-8">
                        <div>
                            <div className="border-b border-dotted border-black w-[150px] mb-1"></div>
                            <div className="text-[12px]">ผู้ส่งตรวจ / ผู้บันทึก</div>
                        </div>
                        <div>
                            <div className="border-b border-dotted border-black w-[150px] mb-1"></div>
                            <div className="text-[12px]">แพทย์ / พยาบาลผู้สั่ง</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
