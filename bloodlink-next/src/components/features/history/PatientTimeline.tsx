import React from 'react';
import Link from 'next/link';
import { Edit2, AlertCircle, Calendar, MessageSquare, ShoppingCart, Eye, Check } from 'lucide-react';
import { PatientData } from './PatientDetail';

export const STATUS_ICONS: Record<string, React.ReactNode> = {
    'นัดหมาย': <Calendar className="w-4 h-4" />,
    'รอแล็บรับเรื่อง': <MessageSquare className="w-4 h-4" />,
    'รอจัดส่ง': <ShoppingCart className="w-4 h-4" />,
    'กำลังจัดส่ง': <ShoppingCart className="w-4 h-4" />,
    'กำลังตรวจ': <Eye className="w-4 h-4" />,
    'เสร็จสิ้น': <Check className="w-4 h-4" />,
};

export const STATUS_ORDER = ['นัดหมาย', 'รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'];

interface PatientTimelineProps {
    patientData: PatientData;
    canEditLab: boolean;
    canUpdateStatus: boolean;
    setShowStatusModal: (show: boolean) => void;
    daysSinceLabTest: number | null;
    isLabOverdue: boolean;
    currentStepIndex: number;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
    patientData,
    canEditLab,
    canUpdateStatus,
    setShowStatusModal,
    daysSinceLabTest,
    isLabOverdue,
    currentStepIndex
}) => {
    return (
        <>
            <div className="flex justify-start -mb-2.5 z-10 relative pl-4 gap-2">
                {canEditLab && canUpdateStatus && (
                    <button
                        onClick={() => setShowStatusModal(true)}
                        className="text-[#6366F1] dark:text-indigo-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:text-[#4F46E5] dark:hover:text-indigo-300 bg-[#F3F4F6] dark:bg-gray-800 px-2 py-0.5 rounded-full border-none outline-none"
                    >
                        <Edit2 className="w-3 h-3" /> อัปเดตสถานะ
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm p-4 flex-shrink-0 relative flex items-center justify-between transition-colors border border-transparent dark:border-gray-700">
                <div className="flex items-center gap-1 w-full px-2">
                    <div className="flex-1 flex items-center justify-center gap-0">
                        {STATUS_ORDER.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isActive = index === currentStepIndex;
                            return (
                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                    <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center transition-all relative z-10 ${isActive
                                        ? 'bg-[#60A5FA] text-white shadow-md scale-105'
                                        : isCompleted
                                            ? 'bg-[#4ADE80] text-white'
                                            : 'bg-[#9CA3AF] dark:bg-gray-600 text-white'
                                        }`}>
                                        {STATUS_ICONS[step]}
                                    </div>
                                    {index < STATUS_ORDER.length - 1 && (
                                        <div className="flex-1 h-[2px] mx-[-1px] bg-gray-200 dark:bg-gray-700 relative z-0">
                                            <div className={`h-full transition-all duration-500 ease-in-out ${index < currentStepIndex ? 'bg-[#4ADE80] w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-4 border-l pl-4 border-gray-200 dark:border-gray-700 py-0.5">
                    <Link
                        href={`/test-status/${patientData.hn}`}
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-5 py-1.5 rounded-[10px] font-bold transition-colors text-[13px] shadow-sm tracking-wide"
                    >
                        เช็คผลตรวจ
                    </Link>
                    {daysSinceLabTest !== null && (
                        <span className={`text-[10px] font-medium ${isLabOverdue
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-[#6B7280] dark:text-gray-400'
                            }`}>
                            {isLabOverdue && <AlertCircle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                            นับตั้งแต่วันตรวจ {daysSinceLabTest} วัน
                            {isLabOverdue && ' (เกิน 8 วัน)'}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};
