import React from 'react';
import { User, ShoppingCart, Trash2, Users, X, UserPlus, Phone } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatDateThai } from '@/lib/utils';
import { Permissions } from '@/lib/permissions';
import { PatientData } from '../PatientDetail';
import { STATUS_ICONS } from '../PatientTimeline';

export interface ResponsiblePerson {
    email: string;
    role: string;
    assignedAt?: string;
    name?: string;
    surname?: string;
}

export interface PatientDemographicsCardProps {
    patientData: PatientData;
    canUpdateStatus: boolean;
    setShowStatusModal: (show: boolean) => void;
    canEditPatient: boolean;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
    handleCancel: () => void;
    confirmDeletePatient: () => void;
    effectiveRole: string;
    editData: PatientData | null;
    setEditData: (data: PatientData) => void;
    responsiblePersons: ResponsiblePerson[];
    canEditPatientData: boolean;
    currentUserEmail?: string | null;
    handleRemoveResponsible: (email: string) => void;
    setShowAddResponsibleModal: (show: boolean) => void;
    removeTag: (field: 'disease' | 'allergy', index: number) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, field: 'disease' | 'allergy') => void;
    renderTagsView: (tags: string[], title: string) => React.ReactNode;
    ncdInput: string;
    setNcdInput: (value: string) => void;
    handleNCDKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSave: () => void;
    isSaving: boolean;
}

export const PatientDemographicsCard: React.FC<PatientDemographicsCardProps> = ({
    patientData,
    canUpdateStatus,
    setShowStatusModal,
    canEditPatient,
    isEditing,
    setIsEditing,
    handleCancel,
    confirmDeletePatient,
    effectiveRole,
    editData,
    setEditData,
    responsiblePersons,
    canEditPatientData,
    currentUserEmail,
    handleRemoveResponsible,
    setShowAddResponsibleModal,
    removeTag,
    handleKeyDown,
    renderTagsView,
    ncdInput,
    setNcdInput,
    handleNCDKeyDown,
    handleSave,
    isSaving
}) => {
    return (
        <div className="bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm p-6 flex flex-col md:flex-row relative flex-shrink-0 min-h-[260px] transition-colors border border-transparent dark:border-gray-700">
            {/* Status Update Button - Absolute Positioned for Response */}
            <div className="absolute top-6 right-6 z-10">
                <button
                    onClick={() => setShowStatusModal(true)}
                    disabled={!canUpdateStatus}
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center shadow-sm transition-transform active:scale-95 ${canUpdateStatus
                        ? 'bg-[#818cf8] text-white hover:bg-[#6366F1]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    title="อัปเดตสถานะ"
                >
                    {STATUS_ICONS[patientData.process] || <ShoppingCart className="w-4 h-4" />}
                </button>
            </div>

            {/* Left: Profile Section */}
            <div className="w-full md:w-[280px] flex flex-col md:pr-6 shrink-0 mb-4 md:mb-0 relative">
                <span className="text-[12px] text-[#6B7280] dark:text-gray-400 mb-4 block">
                    ตรวจเมื่อวันที่ {formatDateThai(patientData.lastCheck)}
                </span>

                <div className="w-[90px] h-[90px] bg-[#E5E7EB] dark:bg-gray-700 rounded-[14px] flex items-center justify-center mb-4 mx-0">
                    <User className="w-10 h-10 text-[#9CA3AF] dark:text-gray-400 stroke-[1.5]" />
                </div>

                <h1 className="text-[20px] font-bold text-[#1e1b4b] dark:text-white mb-1 leading-tight">
                    {patientData.name} {patientData.surname}
                </h1>

                <div className="flex gap-3 mb-4">
                    {patientData.hn.split('').map((digit, i) => (
                        <span key={i} className="text-[14px] font-bold text-[#6B7280] dark:text-gray-400">
                            {digit}
                        </span>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            if (canEditPatient) {
                                if (isEditing) {
                                    handleCancel();
                                } else {
                                    setIsEditing(true);
                                }
                            }
                        }}
                        disabled={!canEditPatient}
                        className={`w-fit px-5 py-1 rounded-[6px] border text-[11px] transition-colors font-medium ${!canEditPatient
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : isEditing
                                ? 'border-red-400 dark:border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'border-[#60A5FA] dark:border-blue-500 text-[#60A5FA] dark:text-blue-400 hover:bg-[#EFF6FF] dark:hover:bg-blue-900/30'
                            }`}
                    >
                        {isEditing ? 'ยกเลิก' : (canEditPatient ? 'แก้ไขข้อมูล' : 'ดูข้อมูล')}
                    </button>

                    {Permissions.isAdmin(effectiveRole) && (
                        <button
                            onClick={confirmDeletePatient}
                            className="w-fit px-3 py-1 rounded-[6px] border border-red-200 dark:border-red-800 text-[11px] transition-colors font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1"
                            title="ลบผู้ป่วย (Admin Only)"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="hidden md:block w-[1px] bg-[#E5E7EB] dark:bg-gray-700 mx-2 self-stretch rounded-full my-1"></div>

            {/* Right: Details Grid */}
            <div className="flex-1 md:pl-6 pt-2 relative">


                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 mt-2">

                    {/* Gender */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เพศ</label>
                        {isEditing && editData ? (
                            <div className="w-[100px]">
                                <CustomSelect
                                    value={
                                        editData.gender === 'ชาย' ? 'Male' :
                                            editData.gender === 'หญิง' ? 'Female' :
                                                editData.gender
                                    }
                                    onChange={(val) => setEditData({ ...editData, gender: val })}
                                    options={[
                                        { label: 'ชาย (Male)', value: 'Male' },
                                        { label: 'หญิง (Female)', value: 'Female' }
                                    ]}
                                    className="min-w-[80px]"
                                />
                            </div>
                        ) : (
                            <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">
                                {patientData.gender === 'Male' ? 'ชาย (Male)' : patientData.gender === 'Female' ? 'หญิง (Female)' : patientData.gender === 'ชาย' ? 'ชาย (Male)' : patientData.gender === 'หญิง' ? 'หญิง (Female)' : patientData.gender}
                            </span>
                        )}
                    </div>

                    {/* Age */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">อายุ</label>
                        {isEditing && editData ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={editData.age}
                                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                                    className="text-[14px] font-bold text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-14 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                />
                                <span className="text-[14px] text-[#6B7280] dark:text-gray-400">ปี</span>
                            </div>
                        ) : (
                            <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.age} ปี</span>
                        )}
                    </div>

                    {/* Responsible Persons */}
                    <div className="flex flex-col gap-0.5 col-span-2 md:col-span-3">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" /> ผู้รับผิดชอบ
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {responsiblePersons.length > 0 ? (
                                responsiblePersons.map((person, idx) => (
                                    <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e3a8a] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-700">
                                        <span>
                                            {person.name ? `${person.name} ${person.surname || ''}` : person.email}
                                        </span>
                                        {person.role === 'creator' && <span className="text-[10px] text-gray-500">(ผู้รับผิดชอบหลัก)</span>}
                                        {canEditPatientData && currentUserEmail === person.email && (
                                            <button
                                                onClick={() => handleRemoveResponsible(person.email)}
                                                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="ลบตัวเองออก"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <span className="text-[14px] text-gray-400 dark:text-gray-500">ไม่มีผู้รับผิดชอบ</span>
                            )}
                            {canEditPatientData && (
                                <button
                                    onClick={() => setShowAddResponsibleModal(true)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#6366F1] hover:text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                >
                                    <UserPlus className="w-3 h-3" /> เพิ่ม
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ID Card */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เลขบัตรประชาชน</label>
                        {isEditing && editData ? (
                            <input
                                type="text"
                                value={editData.idCard || ''}
                                onChange={(e) => setEditData({ ...editData, idCard: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                                className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8] font-mono tracking-wide"
                                placeholder="1234567890123"
                            />
                        ) : (
                            <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white font-mono tracking-wide">{patientData.idCard || '-'}</span>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เบอร์โทรศัพท์</label>
                        {isEditing && editData ? (
                            <input
                                type="tel"
                                value={editData.phone || ''}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                placeholder="0xx-xxx-xxxx"
                            />
                        ) : (
                            patientData.phone ? (
                                <a href={`tel:${patientData.phone}`} className="text-[14px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {patientData.phone}
                                </a>
                            ) : <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">-</span>
                        )}
                    </div>

                    {/* Relative Info Section */}
                    <div className="col-span-2 md:col-span-3 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">ข้อมูลติดต่อฉุกเฉิน (ญาติ)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                            {/* Relative Name */}
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[12px] text-[#6B7280] dark:text-gray-400">ชื่อญาติ</label>
                                {isEditing && editData ? (
                                    <input
                                        type="text"
                                        value={editData.relativeName || ''}
                                        onChange={(e) => setEditData({ ...editData, relativeName: e.target.value })}
                                        className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                    />
                                ) : (
                                    <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.relativeName || '-'}</span>
                                )}
                            </div>

                            {/* Sub-grid for Relation and Phone to keep alignment */}
                            <div className="contents md:flex md:contents">
                                {/* Relation */}
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[12px] text-[#6B7280] dark:text-gray-400">ความสัมพันธ์</label>
                                    {isEditing && editData ? (
                                        <input
                                            type="text"
                                            value={editData.relativeRelationship || ''}
                                            onChange={(e) => setEditData({ ...editData, relativeRelationship: e.target.value })}
                                            className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                            placeholder="เช่น บิดา, มารดา"
                                        />
                                    ) : (
                                        <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.relativeRelationship || '-'}</span>
                                    )}
                                </div>

                                {/* Relative Phone */}
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[12px] text-[#6B7280] dark:text-gray-400">เบอร์ญาติ</label>
                                    {isEditing && editData ? (
                                        <input
                                            type="tel"
                                            value={editData.relativePhone || ''}
                                            onChange={(e) => setEditData({ ...editData, relativePhone: e.target.value })}
                                            className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                        />
                                    ) : (
                                        patientData.relativePhone ? (
                                            <a href={`tel:${patientData.relativePhone}`} className="text-[14px] font-bold text-red-600 hover:underline flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {patientData.relativePhone}
                                            </a>
                                        ) : <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">-</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blood Type (Existing) */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">หมู่เลือด</label>
                        {isEditing && editData ? (
                            <div className="w-[100px]">
                                <CustomSelect
                                    value={editData.bloodType}
                                    onChange={(val) => setEditData({ ...editData, bloodType: val })}
                                    options={[
                                        { label: 'A+', value: 'A+' },
                                        { label: 'A-', value: 'A-' },
                                        { label: 'B+', value: 'B+' },
                                        { label: 'B-', value: 'B-' },
                                        { label: 'AB+', value: 'AB+' },
                                        { label: 'AB-', value: 'AB-' },
                                        { label: 'O+', value: 'O+' },
                                        { label: 'O-', value: 'O-' }
                                    ]}
                                    className="min-w-[80px]"
                                />
                            </div>
                        ) : (
                            <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.bloodType}</span>
                        )}
                    </div>

                    {/* Process Status */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">สถานะกระบวนการ</label>
                        <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{patientData.process}</span>
                    </div>

                    {/* Disease Tags */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">โรคประจำตัว</label>
                        {isEditing && editData ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-1">
                                    {editData.disease.map((tag, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-[#EFF6FF] dark:bg-blue-900/30 text-[#1e1b4b] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-700">
                                            {tag}
                                            <button onClick={() => removeTag('disease', index)} className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    onKeyDown={(e) => handleKeyDown(e, 'disease')}
                                    className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                    placeholder="พิมพ์แล้ว Enter..."
                                />
                            </div>
                        ) : (
                            renderTagsView(patientData.disease, 'โรคประจำตัว')
                        )}
                    </div>

                    {/* Allergy Tags */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">ยาที่แพ้</label>
                        {isEditing && editData ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-1">
                                    {editData.allergy.map((tag, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium bg-[#FEF2F2] dark:bg-red-900/30 text-[#991B1B] dark:text-red-300 border border-[#FECACA] dark:border-red-700">
                                            {tag}
                                            <button onClick={() => removeTag('allergy', index)} className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    onKeyDown={(e) => handleKeyDown(e, 'allergy')}
                                    className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                    placeholder="พิมพ์แล้ว Enter..."
                                />
                            </div>
                        ) : (
                            renderTagsView(patientData.allergy, 'ยาที่แพ้')
                        )}
                    </div>

                    {/* Reg Date */}
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[12px] text-[#6B7280] dark:text-gray-400">วันที่ลงทะเบียน</label>
                        <span className="text-[14px] font-bold text-[#1e1b4b] dark:text-white">{formatDateThai(patientData.registeredDate)}</span>
                    </div>

                    {/* NCD - Only shown in Edit Mode */}
                    {isEditing && (
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[12px] text-[#6B7280] dark:text-gray-400">NCD</label>
                            <input
                                type="text"
                                value={ncdInput}
                                onChange={(e) => setNcdInput(e.target.value)}
                                onKeyDown={handleNCDKeyDown}
                                className="text-[14px] font-medium text-[#1e1b4b] dark:text-white border border-[#D1D5DB] dark:border-gray-600 rounded-md px-2 py-0.5 w-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#818cf8]"
                                placeholder="ใส่รหัส (e.g. 001)"
                            />
                        </div>
                    )}

                    {/* Save Button */}
                    {isEditing && (
                        <div className="flex items-end col-span-2 md:col-span-1">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full md:w-auto px-5 py-1.5 bg-[#6366F1] text-white rounded-[6px] text-[12px] font-medium hover:bg-[#4F46E5] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
