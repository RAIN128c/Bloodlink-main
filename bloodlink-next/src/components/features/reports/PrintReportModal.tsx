import { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, ChevronRight, FileText, Activity, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface PrintReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: (selectedSections: PrintSections) => void;
}

export interface PrintSections {
    summary: boolean;
    orders: boolean;
    userActivity: boolean;
    systemLogs: boolean;
}

export function PrintReportModal({ isOpen, onClose, onPrint }: PrintReportModalProps) {
    const [mounted, setMounted] = useState(false);
    const [sections, setSections] = useState<PrintSections>({
        summary: true,
        orders: true,
        userActivity: true,
        systemLogs: false, // OFF by default
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    const toggleSection = (key: keyof PrintSections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrint = () => {
        onPrint(sections);
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">ตั้งค่าการพิมพ์รายงาน (Print Options)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">เลือกหมวดหมู่ที่ต้องการแสดงในเอกสารรายงาน</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">

                    {/* Option 1: Summary */}
                    <button
                        onClick={() => toggleSection('summary')}
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left ${sections.summary
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${sections.summary ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${sections.summary ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-200'}`}>สรุปยอดรวมประจำวัน (Daily Summary)</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">แสดงตัวเลขรวมและกราฟแนวโน้ม</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            {sections.summary
                                ? <CheckCircle2 className="w-5 h-5 text-indigo-500 animate-in zoom-in" />
                                : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            }
                        </div>
                    </button>

                    {/* Option 2: Orders */}
                    <button
                        onClick={() => toggleSection('orders')}
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left ${sections.orders
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${sections.orders ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                            <Printer className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${sections.orders ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-200'}`}>ตารางคำสั่งตรวจ (Daily Orders)</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">รายชื่อและสถานะของผู้ป่วย 10 คนล่าสุด</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            {sections.orders
                                ? <CheckCircle2 className="w-5 h-5 text-indigo-500 animate-in zoom-in" />
                                : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            }
                        </div>
                    </button>

                    {/* Option 3: User Activity */}
                    <button
                        onClick={() => toggleSection('userActivity')}
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left ${sections.userActivity
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${sections.userActivity ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${sections.userActivity ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-200'}`}>บันทึกกิจกรรมผู้ใช้ (User Activity)</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ประวัติการทำงานของพนักงาน</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            {sections.userActivity
                                ? <CheckCircle2 className="w-5 h-5 text-indigo-500 animate-in zoom-in" />
                                : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            }
                        </div>
                    </button>

                    {/* Option 4: System Logs */}
                    <button
                        onClick={() => toggleSection('systemLogs')}
                        className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left opacity-90 ${sections.systemLogs
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${sections.systemLogs ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${sections.systemLogs ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-200'}`}>ระบบแจ้งเตือน (System Logs)</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ประวัติแจ้งเตือนระบบ (ไม่บังคับในการพิมพ์)</p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            {sections.systemLogs
                                ? <CheckCircle2 className="w-5 h-5 text-indigo-500 animate-in zoom-in" />
                                : <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            }
                        </div>
                    </button>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!sections.summary && !sections.orders && !sections.userActivity && !sections.systemLogs}
                        className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        ยืนยันการพิมพ์
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
