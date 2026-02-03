'use client';

import { useState } from 'react';
import { Patient } from '@/types';
import { updatePatientStatus } from '@/lib/actions/patient';
import { Edit3, Calendar, Clock, FileText, Loader2, Lock, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Permissions, STATUS_ORDER } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';

// Status options for the modal - excludes 'รอตรวจ' normally, but shows it when in 'เสร็จสิ้น' for recheck
const getStatusOptions = (currentStatus: string) => {
    // If current status is 'เสร็จสิ้น', include 'รอตรวจ' as an option for recheck
    if (currentStatus === 'เสร็จสิ้น') {
        return ['รอตรวจ', ...STATUS_ORDER.filter(s => s !== 'รอตรวจ' && s !== 'เสร็จสิ้น')];
    }
    return STATUS_ORDER.filter(s => s !== 'รอตรวจ') as string[];
};

interface PatientActionPanelProps {
    patient: Patient;
}

export function PatientActionPanel({ patient }: PatientActionPanelProps) {
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const currentStatus = patient.process || 'รอตรวจ';
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);
    const [history, setHistory] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    // Check if user can see the status panel at all
    const canSeePanel = Permissions.canSeeStatusPanel(effectiveRole);

    // Get the next allowed status for this user
    const nextAllowedStatus = Permissions.getNextAllowedStatus(effectiveRole, currentStatus);

    // Check if recheck is available (Doctor only, when status is 'เสร็จสิ้น')
    const canRecheck = currentStatus === 'เสร็จสิ้น' && Permissions.canUpdateToStatus(effectiveRole, 'เสร็จสิ้น', 'รอตรวจ');

    // Get status options based on current status
    const statusOptions = getStatusOptions(currentStatus);

    const handleUpdate = async () => {
        if (!nextAllowedStatus && !Permissions.isAdmin(effectiveRole)) {
            toast.error('คุณไม่มีสิทธิ์อัปเดตสถานะนี้');
            return;
        }

        if (selectedStatus === 'นัดหมาย' && (!date || !time)) {
            toast.error('กรุณาระบุวันที่และเวลานัดหมาย');
            return;
        }

        setIsLoading(true);
        try {
            const result = await updatePatientStatus(patient.hn, selectedStatus, {
                history: history || undefined,
                date: date || undefined,
                time: time || undefined
            });

            if (result.success) {
                toast.success('อัปเดตสถานะเรียบร้อย');
                setIsOpen(false);
                // Reset form
                setHistory('');
                setDate('');
                setTime('');
            } else {
                toast.error(result.error || 'ไม่สามารถอัปเดตสถานะได้');
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        } finally {
            setIsLoading(false);
        }
    };

    // Get button state for each status option
    const getStatusButtonState = (targetStatus: string) => {
        const isCurrentStatus = currentStatus === targetStatus;
        const canUpdate = Permissions.canUpdateToStatus(effectiveRole, currentStatus, targetStatus);
        const isValidNext = Permissions.isValidTransition(currentStatus, targetStatus);
        const requiredRole = Permissions.getRequiredRoleForTransition(currentStatus, targetStatus);

        return {
            isCurrentStatus,
            canUpdate,
            isValidNext,
            requiredRole,
            isDisabled: !canUpdate || isCurrentStatus,
            tooltip: isCurrentStatus
                ? 'สถานะปัจจุบัน'
                : !isValidNext
                    ? 'ไม่ใช่ลำดับถัดไป'
                    : !canUpdate
                        ? `ต้องใช้สิทธิ์: ${requiredRole}`
                        : ''
        };
    };



    if (!canSeePanel) {
        return null;
    }

    return (
        <>
            <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 font-[family-name:var(--font-kanit)] transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Actions</h3>
                </div>
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            // Pre-select the next allowed status
                            if (nextAllowedStatus) {
                                setSelectedStatus(nextAllowedStatus);
                            }
                            setIsOpen(true);
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        อัปเดตสถานะ
                    </button>
                    {canRecheck && (
                        <button
                            onClick={() => {
                                setSelectedStatus('รอตรวจ');
                                setIsOpen(true);
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-800 transition-colors"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            ตรวจอีกครั้ง
                        </button>
                    )}
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors">
                        ดูประวัติ
                    </button>
                </div>

                {/* Current Status Display */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">สถานะปัจจุบัน</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {currentStatus}
                    </span>
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

                        <div className="inline-block align-bottom bg-white dark:bg-[#1F2937] rounded-2xl text-left shadow-xl dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-transparent dark:border-gray-700 flex flex-col">
                            <div className="bg-white dark:bg-[#1F2937] px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-2xl">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white mb-4" id="modal-title">
                                            อัปเดตสถานะผู้ป่วย
                                        </h3>
                                        <div className="mt-2 space-y-4">
                                            {/* Current Status Info */}
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">สถานะปัจจุบัน</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentStatus}</p>
                                            </div>

                                            {/* Status Select */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">เลือกสถานะใหม่</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {statusOptions.map((opt) => {
                                                        const state = getStatusButtonState(opt);

                                                        return (
                                                            <button
                                                                key={opt}
                                                                onClick={() => !state.isDisabled && setSelectedStatus(opt)}
                                                                disabled={state.isDisabled}
                                                                title={state.tooltip}
                                                                className={clsx(
                                                                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all relative",
                                                                    selectedStatus === opt && !state.isDisabled
                                                                        ? "bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500"
                                                                        : state.isCurrentStatus
                                                                            ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 cursor-default"
                                                                            : state.isDisabled
                                                                                ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                                                                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-300"
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-1">
                                                                    {state.isDisabled && !state.isCurrentStatus && (
                                                                        <Lock className="w-3 h-3" />
                                                                    )}
                                                                    {opt}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {/* Helper text */}
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    🔒 = ต้องใช้สิทธิ์บทบาทอื่น | สีเขียว = สถานะปัจจุบัน
                                                </p>
                                            </div>

                                            {/* Appointment Date/Time - Only show if 'นัดหมาย' is selected */}
                                            {selectedStatus === 'นัดหมาย' && (
                                                <div className="grid grid-cols-2 gap-4 z-10">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> วันที่
                                                        </label>
                                                        <CustomDatePicker
                                                            value={date ? new Date(date) : undefined}
                                                            onChange={(d) => {
                                                                if (d) {
                                                                    // Format as YYYY-MM-DD in local time
                                                                    const year = d.getFullYear();
                                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                    const day = String(d.getDate()).padStart(2, '0');
                                                                    setDate(`${year}-${month}-${day}`);
                                                                } else {
                                                                    setDate('');
                                                                }
                                                            }}
                                                            placeholder="เลือกวันที่"
                                                            minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                            <Clock className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> เวลา
                                                        </label>
                                                        <CustomTimePicker
                                                            value={time}
                                                            onChange={setTime}
                                                            placeholder="เลือกเวลา"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* History Note */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                                    <FileText className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" /> หมายเหตุ
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={history}
                                                    onChange={(e) => setHistory(e.target.value)}
                                                    placeholder="กรอกหมายเหตุ (ถ้ามี)..."
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={isLoading || !Permissions.canUpdateToStatus(effectiveRole, currentStatus, selectedStatus)}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'บันทึก'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
