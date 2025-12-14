'use client';

import { useState } from 'react';
import { Patient } from '@/types';
import { updatePatientStatus } from '@/lib/actions/patient';
import { Edit3, Calendar, Clock, FileText, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['นัดหมาย', 'เจาะเลือด', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'];

export function PatientActionPanel({ patient }: { patient: Patient }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [status, setStatus] = useState(patient.process || STATUS_OPTIONS[0]);
    const [history, setHistory] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            await updatePatientStatus(patient.hn, status, {
                history: history || undefined,
                date: date || undefined,
                time: time || undefined
            });
            setIsOpen(false);
            // Optional: Show success toast
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 font-[family-name:var(--font-kanit)] transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Actions</h3>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Update Status / Appointment
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors">
                        View History Logs
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto font-[family-name:var(--font-kanit)]">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 dark:bg-black opacity-75 dark:opacity-80" onClick={() => setIsOpen(false)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white dark:bg-[#1F2937] rounded-2xl text-left overflow-hidden shadow-xl dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-transparent dark:border-gray-700">
                            <div className="bg-white dark:bg-[#1F2937] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white mb-4" id="modal-title">
                                            Update Patient Status
                                        </h3>
                                        <div className="mt-2 space-y-4">
                                            {/* Status Select */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setStatus(opt)}
                                                            className={clsx(
                                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                                                                status === opt
                                                                    ? "bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                                                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                            )}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Appointment Date/Time - Only show if 'นัดหมาย' is selected or user wants to update it */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                        <Clock className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={time}
                                                        onChange={(e) => setTime(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* History Note */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                    <FileText className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> Note / Result
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={history}
                                                    onChange={(e) => setHistory(e.target.value)}
                                                    placeholder="Enter details..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
