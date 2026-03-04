import React, { useState, useEffect } from 'react'
import { Loader2, Save, X, Calendar, Activity, FlaskConical, FileEdit, UserPlus } from 'lucide-react'
import { AppointmentService, Appointment } from '@/lib/services/appointmentService'
import { createAppointmentAction, updateAppointmentStatusAction } from '@/lib/actions/appointment'
import { updatePatientTestType } from '@/lib/actions/patient'
import { toast } from 'sonner'
import { Patient } from '@/types'
import { formatDateThai } from '@/lib/utils'

interface PreLabInputModalProps {
    isOpen: boolean
    onClose: () => void
    patient: Patient | null
    onSaveSuccess: () => void
    onSkip?: () => void
    queueInfo?: { current: number; total: number }
}

export function PreLabInputModal({ isOpen, onClose, patient, onSaveSuccess, onSkip, queueInfo }: PreLabInputModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Appointments
    const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([])
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [isWalkIn, setIsWalkIn] = useState(false)

    // Vitals
    const [bp1, setBp1] = useState('')
    const [bp2, setBp2] = useState('')
    const [pulse, setPulse] = useState('')
    const [rr, setRr] = useState('')
    const [temperature, setTemperature] = useState('')

    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')
    const [waist, setWaist] = useState('')

    // Historical Labs (JSONB)
    const [historicalLabs, setHistoricalLabs] = useState<Record<string, string>>({})

    // Current Labs (JSONB)
    const [currentLabs, setCurrentLabs] = useState<Record<string, string>>({})

    // Lab Request (testType)
    const [selectedTests, setSelectedTests] = useState<string[]>([])

    const LAB_TEST_GROUPS = [
        {
            category: 'DM (เบาหวาน)',
            tests: ['FBS (DM)', 'HbA1c (DM)', 'Lipid (DM)', 'Cr, GFR (DM)', 'Hct (DM)', 'U-Alb (DM)', 'U-sugar (DM)']
        },
        {
            category: 'HT (ความดันโลหิตสูง)',
            tests: ['FBS (HT)', 'Lipid (HT)', 'Cr, GFR (HT)', 'Na, K, Cl (HT)', 'U-Alb (HT)', 'U-sugar (HT)']
        },
        {
            category: 'DLP (ไขมันในเลือดสูง)',
            tests: ['FBS (DLP)', 'Lipid (DLP)']
        },
        {
            category: 'CKD (ไตเรื้อรัง)',
            tests: ['FBS (CKD)', 'HbA1c (CKD)', 'Lipid (CKD)', 'Cr, GFR (CKD)', 'Hct (CKD)', 'Electrolytes (CKD)', 'Microalbumin (CKD)']
        },
        {
            category: 'Asthma/COPD',
            tests: ['FBS (Asthma/COPD)', 'Lipid (Asthma/COPD)']
        },
        {
            category: 'อื่นๆ (General/Other)',
            tests: ['Uric Acid', 'AST(SGOT)', 'ALT(SGPT)', 'LFT', 'CBC', 'Na, K, Cl', 'Anti-HIV', 'HBs-Ag', 'VDRL', 'UPT', 'TFT']
        }
    ];

    const NCD_SET = ['FBS (DM)', 'HbA1c (DM)', 'Lipid (DM)', 'Cr, GFR (DM)', 'U-Alb (DM)', 'U-sugar (DM)']

    useEffect(() => {
        if (isOpen && patient?.hn) {
            loadAppointmentData()
        } else {
            resetForm()
        }
    }, [isOpen, patient])

    const resetForm = () => {
        setBp1(''); setBp2(''); setPulse(''); setRr('')
        setTemperature(''); setWeight(''); setHeight(''); setWaist('')
        setHistoricalLabs({})
        setCurrentLabs({})
        setPendingAppointments([])
        setSelectedAppointmentId(null)
        setIsWalkIn(false)
        setSelectedTests([])
    }

    const loadAppointmentData = async () => {
        if (!patient) return
        setIsLoading(true)
        try {
            const appts = await AppointmentService.getAppointmentsByHn(patient.hn)
            const pending = appts.filter(a => a.status === 'pending')
            setPendingAppointments(pending)

            // Pre-fill testType from patient record
            if (patient.testType) {
                setSelectedTests(patient.testType.split(',').filter(Boolean))
            }

            if (pending.length > 0) {
                // Auto-select the first pending appointment
                setSelectedAppointmentId(pending[0].id || null)
                setIsWalkIn(false)

                // Pre-fill vitals from the selected appointment if it has data
                const selected = pending[0]
                setBp1(selected.bp || '')
                setBp2(selected.bp2 || '')
                setPulse(selected.pulse || '')
                setRr(selected.rr || '')
                setTemperature(selected.temperature || '')

                setWeight(selected.weight || '')
                setHeight(selected.height || '')
                setWaist(selected.waist || '')
                setHistoricalLabs(selected.historical_labs || {})
                setCurrentLabs(((selected as unknown as Record<string, unknown>).current_labs as Record<string, string>) || {})
            } else {
                // No pending appointments → Walk-in mode automatically
                setIsWalkIn(true)
                setSelectedAppointmentId(null)
            }
        } catch (error) {
            console.error('Failed to load appointment data', error)
            toast.error('ไม่สามารถโหลดข้อมูลเริ่มต้นได้')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLabChange = (key: string, value: string) => {
        setHistoricalLabs(prev => ({ ...prev, [key]: value }))
    }

    const handleCurrentLabChange = (key: string, value: string) => {
        setCurrentLabs(prev => ({ ...prev, [key]: value }))
    }

    const handleSelectAppointment = (apptId: string | null) => {
        setSelectedAppointmentId(apptId)
        setIsWalkIn(false)

        // Pre-fill vitals from selected appointment
        const appt = pendingAppointments.find(a => a.id === apptId)
        if (appt) {
            setBp1(appt.bp || '')
            setBp2(appt.bp2 || '')
            setPulse(appt.pulse || '')
            setRr(appt.rr || '')
            setTemperature(appt.temperature || '')

            setWeight(appt.weight || '')
            setHeight(appt.height || '')
            setWaist(appt.waist || '')
            setHistoricalLabs(appt.historical_labs || {})
            setCurrentLabs(((appt as unknown as Record<string, unknown>).current_labs as Record<string, string>) || {})
        }
    }

    const handleSetWalkIn = () => {
        setIsWalkIn(true)
        setSelectedAppointmentId(null)
    }

    const handleSave = async () => {
        if (!patient) return

        // Validate: at least 1 test must be selected
        if (selectedTests.length === 0) {
            toast.error('กรุณาเลือกรายการตรวจอย่างน้อย 1 รายการ')
            return
        }

        setIsSaving(true)
        try {
            // 1. Save testType to patients table using Server Action (bypass RLS)
            const testTypeResult = await updatePatientTestType(patient.hn, selectedTests.join(','))

            if (!testTypeResult.success) {
                console.error('Failed to save test_type:', testTypeResult.error)
                toast.error('ไม่สามารถบันทึกรายการตรวจได้: ' + (testTypeResult.error || ''))
                setIsSaving(false)
                return
            }

            // 2. Save vitals to appointment
            const vitalsData: Partial<Appointment> = {
                bp: bp1,
                bp2: bp2,
                pulse: pulse,
                rr: rr,
                temperature: temperature,

                weight: weight,
                height: height,
                waist: waist,
                historical_labs: historicalLabs,
                current_labs: currentLabs
            }

            if (isWalkIn || !selectedAppointmentId) {
                // Walk-in: Create a new completed appointment with vitals
                const today = new Date()
                const apptResult = await createAppointmentAction({
                    patient_hn: patient.hn,
                    appointment_date: today.toISOString().split('T')[0],
                    appointment_time: today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    type: 'ตรวจทั่วไป (Walk-in)',
                    status: 'completed',
                    ...vitalsData
                })

                if (apptResult.success) {
                    // Mark the newly created appointment as completed
                    const freshAppts = await AppointmentService.getAppointmentsByHn(patient.hn)
                    const newAppt = freshAppts.find(a => a.status === 'pending')
                    if (newAppt?.id) {
                        await updateAppointmentStatusAction(newAppt.id, 'completed', vitalsData)
                    }
                    toast.success('บันทึกข้อมูล Walk-in สำเร็จ')
                    onSaveSuccess()
                } else {
                    toast.error('ไม่สามารถสร้างข้อมูลนัดหมายได้')
                }
            } else {
                // Update existing appointment with vitals and mark completed
                const success = await updateAppointmentStatusAction(selectedAppointmentId, 'completed', vitalsData)

                // Cancel other pending appointments
                for (const appt of pendingAppointments) {
                    if (appt.id && appt.id !== selectedAppointmentId && appt.status === 'pending') {
                        await updateAppointmentStatusAction(appt.id, 'cancelled')
                    }
                }

                if (success) {
                    toast.success('บันทึกข้อมูลก่อนส่งตรวจสำเร็จ')
                    onSaveSuccess()
                } else {
                    toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
                }
            }
        } catch (err) {
            console.error(err)
            toast.error('เกิดข้อผิดพลาดในระบบ')
        } finally {
            setIsSaving(false)
        }
    }

    // Map test names to lab field keys
    const testToLabKey: Record<string, { key: string; label: string }> = {
        'FBS (DM)': { key: 'fbs', label: 'FBS' },
        'FBS (HT)': { key: 'fbs', label: 'FBS' },
        'FBS (DLP)': { key: 'fbs', label: 'FBS' },
        'FBS (CKD)': { key: 'fbs', label: 'FBS' },
        'FBS (Asthma/COPD)': { key: 'fbs', label: 'FBS' },
        'HbA1c (DM)': { key: 'hba1c', label: 'HbA1C' },
        'HbA1c (CKD)': { key: 'hba1c', label: 'HbA1C' },
        'Lipid (DM)': { key: 'lipid', label: 'Lipid (TC/TG/HDL/LDL)' },
        'Lipid (HT)': { key: 'lipid', label: 'Lipid (TC/TG/HDL/LDL)' },
        'Lipid (DLP)': { key: 'lipid', label: 'Lipid (TC/TG/HDL/LDL)' },
        'Lipid (CKD)': { key: 'lipid', label: 'Lipid (TC/TG/HDL/LDL)' },
        'Lipid (Asthma/COPD)': { key: 'lipid', label: 'Lipid (TC/TG/HDL/LDL)' },
        'Cr, GFR (DM)': { key: 'cr', label: 'Cr / GFR' },
        'Cr, GFR (HT)': { key: 'cr', label: 'Cr / GFR' },
        'Cr, GFR (CKD)': { key: 'cr', label: 'Cr / GFR' },
        'Na, K, Cl (HT)': { key: 'electrolyte', label: 'Electrolytes' },
        'Electrolytes (CKD)': { key: 'electrolyte', label: 'Electrolytes' },
        'Hct (DM)': { key: 'hct', label: 'Hct' },
        'Hct (CKD)': { key: 'hct', label: 'Hct' },
        'U-Alb (DM)': { key: 'u-alb', label: 'U-Alb' },
        'U-Alb (HT)': { key: 'u-alb', label: 'U-Alb' },
        'U-sugar (DM)': { key: 'u-sugar', label: 'U-sugar' },
        'U-sugar (HT)': { key: 'u-sugar', label: 'U-sugar' },
        'Microalbumin (CKD)': { key: 'microalbumin', label: 'Microalbumin' },
        'Uric Acid': { key: 'uric', label: 'Uric Acid' },
        'AST(SGOT)': { key: 'ast', label: 'AST (SGOT)' },
        'ALT(SGPT)': { key: 'alt', label: 'ALT (SGPT)' },
        'LFT': { key: 'lft', label: 'LFT' },
        'CBC': { key: 'cbc', label: 'CBC' },
        'Na, K, Cl': { key: 'electrolyte', label: 'Electrolytes' },
        'Anti-HIV': { key: 'hiv', label: 'Anti-HIV' },
        'HBs-Ag': { key: 'hbs', label: 'HBs-Ag' },
        'VDRL': { key: 'vdrl', label: 'VDRL' },
        'UPT': { key: 'upt', label: 'UPT' },
        'TFT': { key: 'tft', label: 'TFT' },
    }

    // List of tests that actually have a space to write results on the form
    const writableLabTests = [
        'FBS', 'Hct', 'U-Alb', 'U-sugar'
    ]

    // Get unique lab fields for selected tests only (and only writable ones)
    const selectedLabFields = (() => {
        const seen = new Set<string>()
        const fields: { key: string; label: string }[] = []
        for (const test of selectedTests) {
            const isWritable = writableLabTests.some(w => test.startsWith(w));
            if (!isWritable) continue;
            const mapping = testToLabKey[test]
            if (mapping && !seen.has(mapping.key)) {
                seen.add(mapping.key)
                fields.push(mapping)
            }
        }
        return fields
    })()

    if (!patient) return null
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm font-[family-name:var(--font-prompt)] modal-backdrop">
            <div className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[700px] max-h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col modal-content">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <FileEdit className="w-5 h-5" />
                            </span>
                            บันทึกข้อมูลก่อนส่งตรวจ (Pre-Lab)
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                            {queueInfo && <span className="text-indigo-600 dark:text-indigo-400 font-semibold mr-1">({queueInfo.current}/{queueInfo.total})</span>}
                            {patient.name} {patient.surname} (HN: {patient.hn})
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4 self-start">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#111827]">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Section 1: Appointment Selection */}
                            <div className="space-y-4 bg-white dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold px-3 py-2 bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 rounded-md border border-sky-100 dark:border-sky-800 border-l-4 border-l-sky-500 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    1. ยืนยันการมาตามนัดหมาย
                                </h3>

                                {pendingAppointments.length > 0 ? (
                                    <div className="space-y-2 px-2">
                                        <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto">
                                            {pendingAppointments.map((appt) => (
                                                <label key={appt.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAppointmentId === appt.id && !isWalkIn
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-200'
                                                    }`}>
                                                    <input
                                                        type="radio"
                                                        name="selectedAppointment"
                                                        checked={selectedAppointmentId === appt.id && !isWalkIn}
                                                        onChange={() => handleSelectAppointment(appt.id || null)}
                                                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatDateThai(appt.appointment_date)}
                                                            </span>
                                                            <span className="text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                                {appt.appointment_time}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{appt.type}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <input
                                                type="radio"
                                                id="walkInRadio"
                                                name="selectedAppointment"
                                                checked={isWalkIn}
                                                onChange={handleSetWalkIn}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="walkInRadio" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                                ไม่ใช่การมาตามนัด (Walk-in)
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-2">
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                            <div className="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 p-2 rounded-full border border-amber-200 dark:border-amber-700">
                                                <UserPlus className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Walk-in (ไม่มีนัดหมายรอดำเนินการ)</p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400">ระบบจะสร้างรายการนัดหมายใหม่โดยอัตโนมัติ (วันที่ {new Date().toLocaleDateString('th-TH')})</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Lab Request */}
                            <div className="space-y-4 bg-white dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-100 dark:border-emerald-800 border-l-4 border-l-emerald-500 text-sm flex items-center gap-2 flex-1">
                                        <FlaskConical className="w-4 h-4" />
                                        2. รายการตรวจ (Lab Request) <span className="text-red-400 ml-1">*</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const unique = Array.from(new Set([...selectedTests, ...NCD_SET]))
                                            setSelectedTests(unique)
                                        }}
                                        className="text-[11px] text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-full transition-colors ml-3 whitespace-nowrap font-medium"
                                    >
                                        + NCD Set
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {LAB_TEST_GROUPS.map((group) => (
                                        <div key={group.category} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-2 pb-1 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                                {group.category}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {group.tests.map((test) => {
                                                    const isChecked = selectedTests.includes(test)
                                                    return (
                                                        <label key={test} className="flex items-start gap-2 cursor-pointer group p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${isChecked
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 group-hover:border-indigo-400'
                                                                }`}>
                                                                {isChecked && (
                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedTests(prev => [...prev, test])
                                                                    } else {
                                                                        setSelectedTests(prev => prev.filter(t => t !== test))
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[12px] text-gray-700 dark:text-gray-200 leading-tight">{test}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedTests.length > 0 && (
                                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 px-2">
                                        เลือกแล้ว {selectedTests.length} รายการ: {selectedTests.join(', ')}
                                    </p>
                                )}
                            </div>

                            {/* Section 3: Vital Signs */}
                            <div className="space-y-4 bg-white dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-md border border-indigo-100 dark:border-indigo-800 border-l-4 border-l-indigo-500 text-sm flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    3. สัญญาณชีพ (Vital Signs) <span className="text-xs text-gray-500 font-normal ml-1">(ถ้ามี จะไปแสดงในใบนำส่ง)</span>
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-2">
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">BP ครั้งที่ 1 (mmHg)</label>
                                        <input type="text" value={bp1} onChange={e => setBp1(e.target.value)} placeholder="120/80" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">BP ครั้งที่ 2</label>
                                        <input type="text" value={bp2} onChange={e => setBp2(e.target.value)} placeholder=".../..." className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Pulse (bpm)</label>
                                        <input type="text" value={pulse} onChange={e => setPulse(e.target.value.replace(/\D/g, ''))} placeholder="80" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">RR (/min)</label>
                                        <input type="text" value={rr} onChange={e => setRr(e.target.value.replace(/\D/g, ''))} placeholder="20" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Temp (°C)</label>
                                        <input type="text" value={temperature} onChange={e => setTemperature(e.target.value.replace(/[^\d.]/g, ''))} placeholder="36.5" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">น้ำหนัก (kg)</label>
                                        <input type="text" value={weight} onChange={e => setWeight(e.target.value.replace(/[^\d.]/g, ''))} placeholder="65" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">ส่วนสูง (cm)</label>
                                        <input type="text" value={height} onChange={e => setHeight(e.target.value.replace(/[^\d.]/g, ''))} placeholder="170" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-[12px] font-medium text-gray-700 dark:text-gray-300">รอบเอว (ซม.)</label>
                                        <input type="text" value={waist} onChange={e => setWaist(e.target.value.replace(/[^\d.]/g, ''))} placeholder="80" className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2 border focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Current Labs + Historical Labs (only for selected tests) */}
                            {selectedLabFields.length > 0 && (
                                <div className="space-y-4 bg-white dark:bg-[#1F2937] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="font-semibold px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md border border-amber-100 dark:border-amber-800 border-l-4 border-l-amber-500 text-sm">
                                        4. ค่าแล็บ (เฉพาะรายการที่เลือก)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 px-2">
                                        {selectedLabFields.map((field) => (
                                            <div key={field.key} className="flex flex-col space-y-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg">
                                                <label className="text-[12px] font-bold text-gray-800 dark:text-gray-300">{field.label}</label>
                                                <div className="space-y-1.5">
                                                    <div>
                                                        <label className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">ค่าปัจจุบัน</label>
                                                        <input
                                                            type="text"
                                                            value={currentLabs[field.key] || ''}
                                                            onChange={e => handleCurrentLabChange(field.key, e.target.value)}
                                                            placeholder="กรอกค่าปัจจุบัน..."
                                                            className="w-full text-sm bg-white dark:bg-gray-800 dark:text-white border border-blue-300 dark:border-blue-700 rounded-md p-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">ค่าเดิม</label>
                                                        <input
                                                            type="text"
                                                            value={historicalLabs[field.key] || ''}
                                                            onChange={e => handleLabChange(field.key, e.target.value)}
                                                            placeholder="กรอกค่าเดิม..."
                                                            className="w-full text-sm bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md p-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 px-2 flex items-start gap-1">
                                        <span className="font-bold text-amber-600 dark:text-amber-500">หมายเหตุ:</span> สามารถเว้นว่างได้ ข้อมูลจะถูกดึงไปแสดงในใบส่งตรวจ
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between flex-shrink-0 bg-white dark:bg-[#1F2937]">
                    <div>
                        {onSkip && (
                            <button
                                onClick={onSkip}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                ข้าม →
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก</>
                            ) : (
                                <><Save className="w-4 h-4" /> {queueInfo ? 'บันทึก & ถัดไป' : 'บันทึกข้อมูล'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
