'use client'

import Link from 'next/link'
import { usePatientDetail } from '@/components/features/history/patient-detail/usePatientDetail'

import { PatientHistoryTabs } from '@/components/features/history/PatientHistoryTabs'
import { UpdateStatusModal } from '@/components/features/history/UpdateStatusModal'
import { AddResponsibleModal } from '@/components/features/history/patient-detail/AddResponsibleModal'
import { PatientTimeline } from '@/components/features/history/PatientTimeline'
import { PatientDemographicsCard } from '@/components/features/history/patient-detail/PatientDemographicsCard'

import {
    X,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { PinVerificationModal } from '@/components/shared/PinVerificationModal'
import { PreLabInputModal } from '@/components/modals/PreLabInputModal'

// Re-export PatientData for consumers that import it from here
export type { PatientData } from '@/components/features/history/patient-detail/usePatientDetail'

interface PatientDetailProps {
    hn: string
    backPath: string
}

export const PatientDetail = ({ hn, backPath }: PatientDetailProps) => {
    const {
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
        nextRoundLoading,
        setShowNextRoundModal,
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
    } = usePatientDetail(hn, backPath)

    // Render tags view helper (wraps hook logic with JSX)
    const renderTagsViewJSX = (tags: string[], title: string) => {
        const result = renderTagsView(tags, title)
        if (!result) {
            return <span className="text-[14px] font-medium text-[#1e1b4b] dark:text-white">-</span>
        }

        return (
            <div className="flex flex-wrap gap-1">
                <div className="px-2 py-0.5 bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e1b4b] dark:text-blue-300 rounded-full text-[12px] font-medium border border-[#DBEAFE] dark:border-blue-700">
                    {result.firstTag}
                </div>
                {result.extraCount > 0 && (
                    <div
                        onClick={() => setModalTags({ title: result.title, tags: result.tags })}
                        className="px-2 py-0.5 bg-[#F3F4F6] dark:bg-gray-700 text-[#6B7280] dark:text-gray-300 rounded-full text-[12px] font-medium cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-gray-600 border border-[#E5E7EB] dark:border-gray-600"
                    >
                        +{result.extraCount}
                    </div>
                )}
            </div>
        )
    }

    // Loading State
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        )
    }

    // Error State
    if (error || !patientData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 dark:text-red-400">{error || 'ไม่พบข้อมูลผู้ป่วย'}</p>
                <Link href={backPath} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                    กลับ
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* Content Area */}
            <div className="flex-1 flex flex-col gap-3 pb-4">

                {/* Back Button */}
                <div className="flex-shrink-0 mt-1">
                    <Link href={backPath} className="inline-flex items-center px-3 py-1.5 bg-[#BAE6FD] dark:bg-sky-900/50 text-[#0369A1] dark:text-sky-300 rounded-[8px] text-[12px] font-medium hover:bg-[#7DD3FC] dark:hover:bg-sky-800/50 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        ย้อนกลับ
                    </Link>
                </div>

                {/* Patient Info Card */}
                <PatientDemographicsCard
                    patientData={patientData}
                    canUpdateStatus={canUpdateStatus}
                    setShowStatusModal={setShowStatusModal}
                    canEditPatient={canEditPatient}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    handleCancel={handleCancel}
                    confirmDeletePatient={confirmDeletePatient}
                    effectiveRole={effectiveRole as string}
                    editData={editData}
                    setEditData={setEditData}
                    responsiblePersons={responsiblePersons}
                    canEditPatientData={canEditPatientData}
                    currentUserEmail={currentUserEmail}
                    handleRemoveResponsible={handleRemoveResponsible}
                    setShowAddResponsibleModal={setShowAddResponsibleModal}
                    removeTag={removeTag}
                    handleKeyDown={handleKeyDown}
                    renderTagsView={renderTagsViewJSX}
                    ncdInput={ncdInput}
                    setNcdInput={setNcdInput}
                    handleNCDKeyDown={handleNCDKeyDown}
                    handleSave={handleSave}
                    isSaving={isSaving}
                />

                {/* Tabs Section */}
                <PatientHistoryTabs
                    hn={patientData.hn}
                    appointmentHistory={appointmentHistory}
                    labHistory={labHistory}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    apptLimit={apptLimit}
                    setApptLimit={setApptLimit}
                    labLimit={labLimit}
                    setLabLimit={setLabLimit}
                />

                {/* Timeline + Action Section */}
                <PatientTimeline
                    patientData={patientData}
                    canEditLab={canEditLab}
                    canUpdateStatus={canUpdateStatus}
                    setShowStatusModal={setShowStatusModal}
                    daysSinceLabTest={daysSinceLabTest}
                    isLabOverdue={isLabOverdue}
                    currentStepIndex={currentStepIndex}
                />
            </div>

            {/* Status Update Modal */}
            <UpdateStatusModal
                showStatusModal={showStatusModal}
                setShowStatusModal={setShowStatusModal}
                patientData={patientData}
                effectiveRole={effectiveRole as string}
                tempStatus={tempStatus}
                setTempStatus={setTempStatus}
                appointmentDate={appointmentDate}
                setAppointmentDate={setAppointmentDate}
                appointmentTime={appointmentTime}
                setAppointmentTime={setAppointmentTime}
                appointmentType={appointmentType}
                setAppointmentType={setAppointmentType}
                statusNote={statusNote}
                setStatusNote={setStatusNote}
                isUpdating={isUpdating}
                handleUpdateStatus={handleUpdateStatus}
            />

            {/* Pre-Lab Input Modal (opens after selecting รอแล็บรับเรื่อง) */}
            <PreLabInputModal
                isOpen={showPreLabModal}
                onClose={() => setShowPreLabModal(false)}
                patient={patientData ? {
                    hn: patientData.hn,
                    name: patientData.name,
                    surname: patientData.surname,
                    gender: patientData.gender,
                    age: patientData.age,
                    bloodType: patientData.bloodType,
                    status: patientData.status,
                    process: patientData.process,
                    disease: patientData.disease.join(', '),
                    allergies: patientData.allergy.join(', '),
                    medication: '',
                    latestReceipt: patientData.latestReceipt,
                    testType: '',
                    appointmentDate: patientData.appointmentDate || '',
                    appointmentTime: patientData.appointmentTime || '',
                    timestamp: patientData.registeredDate
                } : null}
                onSaveSuccess={() => {
                    setShowPreLabModal(false)
                    // After Pre-Lab save, open PIN modal for e-signature
                    setShowPinModal(true)
                }}
            />

            {/* Tag View Modal */}
            {modalTags && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setModalTags(null)}>
                    <div className="bg-white dark:bg-[#1F2937] rounded-xl p-4 w-[calc(100%-2rem)] max-w-[300px] mx-4 shadow-lg dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)] animate-in fade-in zoom-in-95 border border-transparent dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-[#1e1b4b] dark:text-white">{modalTags.title}ทั้งหมด</h3>
                            <button onClick={() => setModalTags(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {modalTags.tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-[#F3F4F6] dark:bg-gray-700 text-[#1f2937] dark:text-gray-200 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <AddResponsibleModal
                isOpen={showAddResponsibleModal}
                onClose={() => setShowAddResponsibleModal(false)}
                hn={hn}
                responsiblePersons={responsiblePersons}
                onSuccess={fetchResponsibility}
            />

            {/* Next-Round Modal */}
            {showNextRoundModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">การตรวจรอบที่แล้วเสร็จสิ้น</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">HN: {hn}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                            ผู้ป่วยรายนี้ถูกตรวจเสร็จสิ้นแล้วในรอบก่อนหน้า ต้องการเริ่มการตรวจในรอบใหม่หรือไม่?
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleNextRound}
                                disabled={nextRoundLoading}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition disabled:opacity-50"
                            >
                                {nextRoundLoading ? 'กำลังดำเนินการ...' : 'ใช่ — เริ่มตรวจรอบใหม่ (Reset เป็น รอตรวจ)'}
                            </button>
                            <button
                                onClick={() => { setShowNextRoundModal(false); setNextRoundDismissed(true) }}
                                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition"
                            >
                                ไม่ — เก็บข้อมูลไว้ก่อน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => !isDeleting && setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.action}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText || "ยืนยัน"}
                cancelText="ยกเลิก"
                variant={confirmConfig.variant || "danger"}
                isLoading={isDeleting}
            />

            <PinVerificationModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onVerify={(pin) => {
                    setShowPinModal(false)
                    executeStatusUpdate(pin)
                }}
            />
        </>
    )
}
