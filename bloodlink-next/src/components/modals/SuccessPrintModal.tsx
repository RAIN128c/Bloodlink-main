
import React from 'react';
import { CheckCircle, Printer, ArrowLeft, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SuccessPrintModalProps {
    isOpen: boolean;
    onPrint: () => void;
    onBack: () => void;
    onAddAnother: () => void;
    patientName?: string;
}

export const SuccessPrintModal = ({
    isOpen,
    onPrint,
    onBack,
    onAddAnother,
    patientName
}: SuccessPrintModalProps) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">บันทึกข้อมูลสำเร็จ</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                เพิ่มข้อมูลผู้ป่วย {patientName} เรียบร้อยแล้ว
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full mt-4">
                            <button
                                onClick={onPrint}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                <Printer className="w-5 h-5" />
                                พิมพ์ใบส่งตรวจ (Request Sheet)
                            </button>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={onBack}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    กลับหน้าประวัติ
                                </button>
                                <button
                                    onClick={onAddAnother}
                                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    เพิ่มรายต่อไป
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
