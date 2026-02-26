'use client'

import { useState, useEffect, useCallback } from 'react'
import { Patient } from '@/types'
import { LabService, LabResult } from '@/lib/services/labService'
import { AppointmentService, Appointment } from '@/lib/services/appointmentService'
import { updatePatientStatus as updatePatientStatusAction } from '@/lib/actions/patient'
import { Permissions } from '@/lib/permissions'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'
import { useSession } from '@/components/providers/SupabaseAuthProvider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { STATUS_ORDER } from '@/components/features/history/PatientTimeline'

// NCD Mapping
const NCD_MAP: Record<string, string> = {
    '001': 'โรคเบาหวาน',
    '002': 'ความดันโลหิตสูง',
    '003': 'ไขมันในเลือดสูง',
    '004': 'โรคหัวใจ',
    '005': 'โรคไตวายเรื้อรัง'
}

export interface PatientData {
    hn: string
    name: string
    surname: string
    gender: string
    age: string
    bloodType: string
    status: string
    process: string
    disease: string[]
    allergy: string[]
    ncd: string
    lastCheck: string
    registeredDate: string
    latestReceipt: string
    caregiver: string
    appointmentDate?: string
    appointmentTime?: string
    idCard?: string
    phone?: string
    relativeName?: string
    relativePhone?: string
    relativeRelationship?: string
}

interface ConfirmConfig {
    isOpen: boolean
    title: string
    description: string
    action: () => Promise<void>
    variant?: 'danger' | 'warning' | 'primary'
    confirmText?: string
}

export const usePatientDetail = (hn: string, backPath: string) => {
    // Core State
    const [patientData, setPatientData] = useState<PatientData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<PatientData | null>(null)
    const [ncdInput, setNcdInput] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Tag UI State
    const [modalTags, setModalTags] = useState<{ title: string, tags: string[] } | null>(null)

    // Status Modal State
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [tempStatus, setTempStatus] = useState('')
    const [statusNote, setStatusNote] = useState('')
    const [appointmentDate, setAppointmentDate] = useState('')
    const [appointmentTime, setAppointmentTime] = useState('')
    const [appointmentType, setAppointmentType] = useState('Check-up')
    const [isUpdating, setIsUpdating] = useState(false)

    // Pre-Lab Modal State (opens after selecting รอแล็บรับเรื่อง)
    const [showPreLabModal, setShowPreLabModal] = useState(false)

    // Responsibility State
    const [responsiblePersons, setResponsiblePersons] = useState<{ email: string; role: string; assignedAt: string; name?: string; surname?: string }[]>([])
    const [canEditPatientData, setCanEditPatientData] = useState(false)
    const [showAddResponsibleModal, setShowAddResponsibleModal] = useState(false)

    // History State
    const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([])
    const [labHistory, setLabHistory] = useState<LabResult[]>([])

    // Tab State
    const [activeTab, setActiveTab] = useState<'appointments' | 'labs'>('appointments')
    const [apptLimit, setApptLimit] = useState(5)
    const [labLimit, setLabLimit] = useState(5)

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    // Confirm Modal Config
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
        isOpen: false,
        title: '',
        description: '',
        action: async () => { },
        variant: 'danger',
    })

    // Next-round modal
    const [showNextRoundModal, setShowNextRoundModal] = useState(false)
    const [nextRoundLoading, setNextRoundLoading] = useState(false)
    const [nextRoundDismissed, setNextRoundDismissed] = useState(false)

    // PIN Verification State
    const [showPinModal, setShowPinModal] = useState(false)

    // Permission Checks
    const { data: session } = useSession()
    const { effectiveRole } = useEffectiveRole()
    const currentUserEmail = session?.user?.email

    // Derived values
    const userResponsibility = responsiblePersons.find(p => p.email === currentUserEmail)
    const isResponsible = !!userResponsibility
    const canEditPatient = Permissions.canEditPatient(effectiveRole, isResponsible)
    const canUpdateStatus = patientData ? (
        Permissions.isAdmin(effectiveRole) ||
        Permissions.getNextAllowedStatus(effectiveRole, patientData.process) !== null
    ) : false
    const canEditLab = Permissions.canEditLab(effectiveRole)
    const currentStepIndex = patientData ? STATUS_ORDER.indexOf(patientData.process) : 0

    // Calculate days since last LAB TEST
    const daysSinceLabTest = (() => {
        if (!labHistory || labHistory.length === 0) return null
        try {
            const latestLab = labHistory[0]
            const labDate = new Date(latestLab.created_at || latestLab.timestamp)
            const today = new Date()
            const diffTime = Math.abs(today.getTime() - labDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays
        } catch {
            return null
        }
    })()
    const isLabOverdue = daysSinceLabTest !== null && daysSinceLabTest > 8

    // ─── Effects ────────────────────────────────────────────

    // Trigger next-round modal when patient is เสร็จสิ้น
    useEffect(() => {
        if (
            patientData?.process === 'เสร็จสิ้น' &&
            !nextRoundDismissed &&
            (Permissions.isDoctorOrNurse(effectiveRole) || Permissions.isAdmin(effectiveRole))
        ) {
            const t = setTimeout(() => setShowNextRoundModal(true), 600)
            return () => clearTimeout(t)
        }
    }, [patientData?.process, effectiveRole, nextRoundDismissed])

    // Fetch patient data
    useEffect(() => {
        async function fetchPatient(retries = 3, delay = 500) {
            try {
                setIsLoading(true)
                const response = await fetch(`/api/patients/${hn}`)

                if (!response.ok) {
                    if (response.status === 404 && retries > 0) {
                        setTimeout(() => fetchPatient(retries - 1, delay * 2), delay)
                        return
                    }
                    throw new Error('Patient not found')
                }

                const data: Patient = await response.json()

                const mapped: PatientData = {
                    hn: data.hn,
                    name: data.name,
                    surname: data.surname,
                    gender: data.gender,
                    age: data.age,
                    bloodType: data.bloodType,
                    status: data.status || 'ใช้งาน',
                    process: data.process || 'นัดหมาย',
                    disease: data.disease && data.disease !== '-'
                        ? data.disease.split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== '-')
                        : [],
                    allergy: data.allergies && data.allergies !== '-'
                        ? data.allergies.split(',').map((s: string) => s.trim()).filter((s: string) => s && s !== '-')
                        : [],
                    ncd: '-',
                    lastCheck: data.appointmentDate || data.timestamp || '-',
                    registeredDate: data.timestamp || '-',
                    latestReceipt: data.latestReceipt || '-',
                    caregiver: data.caregiver || '-',
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    idCard: data.idCard,
                    phone: data.phone,
                    relativeName: data.relativeName,
                    relativePhone: data.relativePhone,
                    relativeRelationship: data.relativeRelationship
                }

                setPatientData(mapped)
                setEditData(mapped)
                setTempStatus(mapped.process)

                // Fetch Appointment History
                try {
                    const appHistory = await AppointmentService.getAppointmentsByHn(hn)
                    setAppointmentHistory(appHistory)
                } catch (e) {
                    console.error('Failed to fetch appointments:', e)
                }

                // Fetch Lab History
                try {
                    const labHist = await LabService.getLabHistory(hn)
                    setLabHistory(labHist)
                } catch (e) {
                    console.error('Failed to fetch labs:', e)
                }

                setIsLoading(false)
            } catch (err) {
                console.error('Failed to fetch patient:', err)
                if (retries === 0) {
                    setError('ไม่พบข้อมูลผู้ป่วย')
                    setIsLoading(false)
                }
            }
        }

        fetchPatient()
    }, [hn, session])

    // Fetch responsibility data
    const fetchResponsibility = useCallback(async () => {
        try {
            const response = await fetch(`/api/patients/${hn}/responsibility`)
            if (response.ok) {
                const data = await response.json()
                setResponsiblePersons(data.responsiblePersons || [])
                setCanEditPatientData(data.canEdit || false)
            }
        } catch (error) {
            console.error('Failed to fetch responsibility:', error)
        }
    }, [hn])

    useEffect(() => {
        fetchResponsibility()
    }, [fetchResponsibility])

    // ─── Handlers ───────────────────────────────────────────

    const handleNextRound = async () => {
        setNextRoundLoading(true)
        try {
            const result = await updatePatientStatusAction(hn, 'รอตรวจ', { history: 'เริ่มการตรวจรอบใหม่' })
            if (result.success) {
                setPatientData(prev => prev ? { ...prev, process: 'รอตรวจ' } : null)
                setShowNextRoundModal(false)
                toast.success('เริ่มการตรวจรอบใหม่เรียบร้อย')
            } else {
                toast.error(result.error || 'ไม่สามารถเริ่มรอบใหม่')
            }
        } catch {
            toast.error('เกิดข้อผิดพลาด')
        } finally {
            setNextRoundLoading(false)
        }
    }

    const handleRemoveResponsible = async (targetEmail: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบความรับผิดชอบ',
            description: 'คุณต้องการลบตัวเองออกจากความรับผิดชอบผู้ป่วยรายนี้หรือไม่?',
            variant: 'warning',
            confirmText: 'ยืนยัน',
            action: async () => {
                try {
                    const response = await fetch(`/api/patients/${hn}/responsibility`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'remove', targetEmail })
                    })
                    if (response.ok) {
                        toast.success('ลบผู้รับผิดชอบเรียบร้อย')
                        const respData = await fetch(`/api/patients/${hn}/responsibility`).then(r => r.json())
                        setResponsiblePersons(respData.responsiblePersons || [])
                        setCanEditPatientData(respData.canEdit || false)
                    } else {
                        toast.error('ไม่สามารถลบผู้รับผิดชอบได้')
                    }
                } catch (error) {
                    console.error('Failed to remove responsible person:', error)
                    toast.error('เกิดข้อผิดพลาดในการลบผู้รับผิดชอบ')
                } finally {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    const handleSave = async () => {
        if (!editData || !patientData) return

        setIsSaving(true)
        try {
            const response = await fetch(`/api/patients/${patientData.hn}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender: editData.gender,
                    age: editData.age,
                    bloodType: editData.bloodType,
                    disease: editData.disease.join(', '),
                    allergies: editData.allergy.join(', '),
                    idCard: editData.idCard,
                    phone: editData.phone,
                    relativeName: editData.relativeName,
                    relativePhone: editData.relativePhone,
                    relativeRelationship: editData.relativeRelationship
                })
            })

            if (response.ok) {
                setPatientData({ ...editData })
                setIsEditing(false)
                setNcdInput('')
                toast.success('บันทึกข้อมูลเรียบร้อยแล้ว')
            } else {
                toast.error('เกิดข้อผิดพลาดในการบันทึก')
            }
        } catch (err) {
            console.error('Save error:', err)
            toast.error('เกิดข้อผิดพลาดในการบันทึก')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeletePatient = async () => {
        if (!patientData) return

        try {
            setIsDeleting(true)
            const res = await fetch(`/api/patients/${patientData.hn}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                toast.success('ลบผู้ป่วยเรียบร้อยแล้ว')
                router.push(backPath)
                router.refresh()
            } else {
                toast.error('ไม่สามารถลบผู้ป่วยได้')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('เกิดข้อผิดพลาดในการลบ')
        } finally {
            setIsDeleting(false)
            setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        }
    }

    const confirmDeletePatient = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบผู้ป่วย',
            description: `คุณแน่ใจหรือไม่ที่จะลบข้อมูลผู้ป่วย ${patientData?.name} ${patientData?.surname || ''} (HN: ${patientData?.hn})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            variant: 'danger',
            confirmText: 'ลบผู้ป่วย',
            action: handleDeletePatient
        })
    }

    const handleCancel = () => {
        if (patientData) {
            setEditData({ ...patientData })
        }
        setIsEditing(false)
        setNcdInput('')
    }

    // Tag Handlers
    const addTag = (field: 'disease' | 'allergy', value: string) => {
        if (editData && value.trim() && !editData[field].includes(value.trim())) {
            setEditData(prev => prev ? ({
                ...prev,
                [field]: [...prev[field], value.trim()]
            }) : null)
        }
    }

    const removeTag = (field: 'disease' | 'allergy', index: number) => {
        setEditData(prev => prev ? ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }) : null)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'disease' | 'allergy') => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag(field, e.currentTarget.value)
            e.currentTarget.value = ''
        }
    }

    const handleNCDKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const code = ncdInput.trim()
            if (NCD_MAP[code]) {
                addTag('disease', NCD_MAP[code])
                setNcdInput('')
            } else {
                toast.warning('รหัส NCD ไม่ถูกต้อง')
            }
        }
    }

    // Status Update Handler
    const handleUpdateStatus = async () => {
        const currentStatus = patientData?.process || 'รอตรวจ'
        if (!Permissions.canUpdateToStatus(effectiveRole, currentStatus, tempStatus)) {
            const requiredRole = Permissions.getRequiredRoleForTransition(currentStatus, tempStatus)
            toast.error(`ไม่สามารถอัปเดตสถานะได้: ต้องใช้สิทธิ์ ${requiredRole}`)
            return
        }

        setIsUpdating(true)

        // รอแล็บรับเรื่อง → open Pre-Lab first, then PIN
        if (tempStatus === 'รอแล็บรับเรื่อง') {
            setShowStatusModal(false)
            setShowPreLabModal(true)
            setIsUpdating(false)
            return
        }

        const eSignatureStatuses = ['รับออร์เดอร์', 'กำลังตรวจ']
        if (eSignatureStatuses.includes(tempStatus)) {
            setShowPinModal(true)
            setIsUpdating(false)
            return
        }

        await executeStatusUpdate()
    }

    const executeStatusUpdate = async (pin?: string) => {
        setIsUpdating(true)
        try {
            const data: Record<string, unknown> = {
                history: statusNote,
                pin
            }

            if (tempStatus === 'นัดหมาย') {
                if (!appointmentDate) {
                    toast.error('กรุณาระบุวันที่นัดหมาย')
                    setIsUpdating(false)
                    return
                }
                data.date = appointmentDate
                data.time = appointmentTime
                data.type = appointmentType
            }

            const result = await updatePatientStatusAction(hn, tempStatus, data)

            if (result.success) {
                setPatientData((prev: PatientData | null) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        status: 'ใช้งาน',
                        process: tempStatus,
                        appointmentDate: tempStatus === 'นัดหมาย' ? appointmentDate : prev.appointmentDate,
                        appointmentTime: tempStatus === 'นัดหมาย' ? appointmentTime : prev.appointmentTime
                    }
                })
                setShowStatusModal(false)

                const history = await AppointmentService.getAppointmentsByHn(hn)
                setAppointmentHistory(history)

                toast.success('อัปเดตสถานะเรียบร้อย')
            } else {
                toast.error(result.error || 'ไม่สามารถอัปเดตสถานะได้')
            }
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
        } finally {
            setIsUpdating(false)
        }
    }

    const renderTagsView = (tags: string[], title: string) => {
        if (tags.length === 0 || (tags.length === 1 && tags[0] === '-')) {
            return null // Signal to show dash
        }
        return { tags, title, firstTag: tags[0], extraCount: tags.length - 1 }
    }

    return {
        // Core state
        patientData,
        isLoading,
        error,

        // Edit state
        isEditing,
        setIsEditing,
        editData,
        setEditData,
        ncdInput,
        setNcdInput,
        isSaving,

        // Tag UI
        modalTags,
        setModalTags,

        // Status Modal
        showStatusModal,
        setShowStatusModal,
        tempStatus,
        setTempStatus,
        statusNote,
        setStatusNote,
        appointmentDate,
        setAppointmentDate,
        appointmentTime,
        setAppointmentTime,
        appointmentType,
        setAppointmentType,
        isUpdating,

        // Pre-Lab Modal
        showPreLabModal,
        setShowPreLabModal,

        // Responsibility
        responsiblePersons,
        canEditPatientData,
        showAddResponsibleModal,
        setShowAddResponsibleModal,
        fetchResponsibility,

        // History
        appointmentHistory,
        labHistory,
        activeTab,
        setActiveTab,
        apptLimit,
        setApptLimit,
        labLimit,
        setLabLimit,

        // Delete
        isDeleting,

        // Confirm Modal
        confirmConfig,
        setConfirmConfig,

        // Next-round
        showNextRoundModal,
        setShowNextRoundModal,
        nextRoundLoading,
        nextRoundDismissed,
        setNextRoundDismissed,

        // PIN
        showPinModal,
        setShowPinModal,

        // Permissions
        effectiveRole,
        currentUserEmail,
        canEditPatient,
        canUpdateStatus,
        canEditLab,

        // Computed
        currentStepIndex,
        daysSinceLabTest,
        isLabOverdue,

        // Handlers
        handleNextRound,
        handleRemoveResponsible,
        handleSave,
        confirmDeletePatient,
        handleCancel,
        removeTag,
        handleKeyDown,
        handleNCDKeyDown,
        handleUpdateStatus,
        executeStatusUpdate,
        renderTagsView,
    }
}
