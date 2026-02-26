import React from 'react'
import { PatientData } from './PatientDetail'
import { Permissions } from '@/lib/permissions'
import { formatDateThai } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { CustomDatePicker } from '@/components/ui/CustomDatePicker'
import { CustomTimePicker } from '@/components/ui/CustomTimePicker'
import { Calendar, ShoppingCart, X } from 'lucide-react'

interface UpdateStatusModalProps {
    showStatusModal: boolean
    setShowStatusModal: (show: boolean) => void
    patientData: PatientData | null
    effectiveRole: string
    tempStatus: string
    setTempStatus: (status: string) => void
    appointmentDate: string
    setAppointmentDate: (date: string) => void
    appointmentTime: string
    setAppointmentTime: (time: string) => void
    appointmentType: string
    setAppointmentType: (type: string) => void
    statusNote: string
    setStatusNote: (note: string) => void
    isUpdating: boolean
    handleUpdateStatus: () => Promise<void>
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
    showStatusModal, setShowStatusModal, patientData, effectiveRole,
    tempStatus, setTempStatus,
    appointmentDate, setAppointmentDate,
    appointmentTime, setAppointmentTime,
    appointmentType, setAppointmentType,
    statusNote, setStatusNote,
    isUpdating, handleUpdateStatus
}) => {
    if (!showStatusModal) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}>
            <div
                className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[400px] mx-4 shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 border border-transparent dark:border-gray-700 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-white dark:bg-[#1F2937] px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
                    <h2 className="text-lg font-bold text-[#1e1b4b] dark:text-white">อัปเดตสถานะ</h2>
                    <button onClick={() => setShowStatusModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {['รอตรวจ', 'นัดหมาย', 'รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'].map((option) => {
                            const isCurrentProcess = patientData?.process === option
                            const isAllowedNext = Permissions.canUpdateToStatus(effectiveRole, patientData?.process, option)
                            const isDisabled = !isAllowedNext && !isCurrentProcess
                            return (
                                <label
                                    key={option}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-pointer'
                                        } ${tempStatus === option
                                            ? 'bg-[#EFF6FF] dark:bg-blue-900/30 border-[#60A5FA] dark:border-blue-600 text-[#1e1b4b] dark:text-white'
                                            : isDisabled
                                                ? 'border-gray-200 dark:border-gray-700 text-gray-400'
                                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option}
                                        checked={tempStatus === option}
                                        onChange={(e) => setTempStatus(e.target.value)}
                                        className="w-4 h-4 text-[#60A5FA]"
                                        disabled={isDisabled}
                                    />
                                    <span className="text-sm font-medium">{option}</span>
                                </label>
                            )
                        })}
                    </div>

                    {tempStatus === 'นัดหมาย' && (
                        <div className="bg-[#F8FAFC] dark:bg-gray-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-gray-700 mb-4 animate-in slide-in-from-top-2">
                            <label className="flex items-center gap-2 text-[#0F172A] dark:text-white font-medium text-sm mb-3">
                                <Calendar className="w-4 h-4 text-[#6366F1] dark:text-indigo-400" />
                                กำหนดวันเวลานัดหมาย
                            </label>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">ประเภทนัดหมาย</label>
                                        <CustomSelect
                                            value={appointmentType}
                                            onChange={setAppointmentType}
                                            options={[
                                                { value: 'Check-up', label: 'ตรวจสุขภาพ (Check-up)' },
                                                { value: 'Follow-up', label: 'ติดตามผล (Follow-up)' },
                                                { value: 'Consultation', label: 'ปรึกษาแพทย์' },
                                                { value: 'Other', label: 'อื่นๆ' }
                                            ]}
                                            placeholder="เลือกประเภท"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">วันที่</label>
                                        <CustomDatePicker
                                            value={appointmentDate ? new Date(appointmentDate) : undefined}
                                            onChange={(d) => {
                                                if (d) {
                                                    const year = d.getFullYear()
                                                    const month = String(d.getMonth() + 1).padStart(2, '0')
                                                    const day = String(d.getDate()).padStart(2, '0')
                                                    setAppointmentDate(`${year}-${month}-${day}`)
                                                } else {
                                                    setAppointmentDate('')
                                                }
                                            }}
                                            placeholder="เลือกวันที่"
                                            minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">เวลา</label>
                                    <CustomTimePicker
                                        value={appointmentTime}
                                        onChange={setAppointmentTime}
                                        placeholder="เลือกเวลา"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {tempStatus === 'รอแล็บรับเรื่อง' && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700 mb-4 animate-in slide-in-from-top-2">
                            <p className="text-sm text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                <span className="text-lg">📝</span>
                                เมื่อยืนยัน ระบบจะเปิดหน้าบันทึกข้อมูลก่อนส่งตรวจ (Pre-Lab) เพื่อกรอกสัญญาณชีพและค่าแล็บเดิม
                            </p>
                        </div>
                    )}

                    {tempStatus === 'กำลังจัดส่ง' && (
                        <div className="bg-[#FFFBEB] dark:bg-amber-900/20 p-4 rounded-xl border border-[#FDE68A] dark:border-amber-700/50 mb-4 animate-in slide-in-from-top-2">
                            <label className="flex items-center gap-2 text-[#92400E] dark:text-amber-400 font-medium text-sm mb-2">
                                <ShoppingCart className="w-4 h-4" />
                                สิ่งที่ต้องทำในขั้นตอน &quot;กำลังจัดส่ง&quot;
                            </label>
                            <ul className="text-sm text-[#B45309] dark:text-amber-300/80 list-disc list-inside space-y-1 ml-1">
                                <li>พิมพ์ใบส่งตรวจเลือด (จากหน้ารายการคิวงาน)</li>
                                <li>นำส่งตัวอย่างเลือดและใบส่งตรวจไปที่ห้อง Lab รพช.</li>
                                <li>รอให้ทางเจ้าหน้าที่ Lab ตรวจและอัปโหลดผลเข้าระบบ</li>
                            </ul>
                        </div>
                    )}

                    <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">หมายเหตุ</label>
                        <textarea
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="ระบุหมายเหตุ..."
                        />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={() => setShowStatusModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleUpdateStatus}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-lg hover:bg-[#4F46E5] shadow-sm disabled:opacity-50"
                    >
                        {isUpdating ? 'กำลังบันทึก...' : 'ยืนยัน'}
                    </button>
                </div>
            </div>
        </div>
    )
}
