'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Patient } from '@/types';
import { useSession } from 'next-auth/react';
import { Permissions } from '@/lib/permissions';

interface PatientFormProps {
    initialData?: Partial<Patient>;
    onCancel?: () => void;
    onConfirm?: (data: Partial<Patient>) => void;
    title?: string;
    isEdit?: boolean;
}

export function PatientForm({ initialData = {}, onCancel, onConfirm, title = "กรอกข้อมูลผู้ป่วย", isEdit = false }: PatientFormProps) {
    const { data: session } = useSession();
    const role = session?.user?.role;

    // Check permissions based on mode (Add vs Edit)
    // For Add: Check canAddPatient
    // For Edit: Check canEditPatient (Note: For Doctors/Nurses, this currently defaults to false as we don't track responsibility here yet)
    const canEdit = isEdit
        ? Permissions.canEditPatient(role)
        : Permissions.canAddPatient(role);

    const [formData, setFormData] = useState<Partial<Patient>>({
        testType: initialData.testType || '',
        name: initialData.name || '',
        surname: initialData.surname || '',
        hn: initialData.hn || '',
        bloodType: initialData.bloodType || '',
        age: initialData.age || '',
        gender: initialData.gender || 'ชาย',
        disease: initialData.disease || '',
        medication: initialData.medication || '',
        allergies: initialData.allergies || '',
        latestReceipt: initialData.latestReceipt || '', // Was lastTransfusion
        process: initialData.process || 'นัดหมาย',
        status: initialData.status || 'ใช้งาน'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm?.(formData);
    };

    // If no permission, showing the form (likely read-only or error)
    // The requirement says: "part that cannot access will not see to edit"
    // We will disable all inputs if !canEdit

    return (
        <div className="w-full flex justify-center items-start font-[family-name:var(--font-kanit)]">
            <div className="w-full bg-white dark:bg-[#1F2937] rounded-[24px] shadow-[0_20px_40px_rgba(15,23,42,0.04)] dark:shadow-none p-[32px_40px_28px_40px] flex flex-col gap-6 relative transition-colors">
                <h1 className="text-[28px] font-bold text-[#111827] dark:text-white mb-2">{title}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Exam Type */}
                    <div className="flex flex-col gap-1.5 absolute top-8 right-10 w-[250px]">
                        <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">ประเภทการตรวจ</label>
                        <div className="relative">
                            <select
                                name="testType"
                                value={formData.testType}
                                onChange={handleChange}
                                disabled={!canEdit}
                                className="w-full p-[10px_14px] pr-10 rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white appearance-none focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">กรุณาเลือกประเภทการตรวจ</option>
                                <option value="ตรวจเลือดทั่วไป (CBC)">ตรวจเลือดทั่วไป (CBC)</option>
                                <option value="ตรวจสุขภาพประจำปี">ตรวจสุขภาพประจำปี</option>
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>

                    {/* Section: Name */}
                    <div className="space-y-4 pt-4">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                            <label className="text-[18px] font-bold text-[#111827] dark:text-white">ชื่อ-สกุล</label>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">ชื่อ</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่เฉพาะชื่อ</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">นามสกุล</label>
                                <input type="text" name="surname" value={formData.surname} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่เฉพาะนามสกุล</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Patient Data */}
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                            <label className="text-[18px] font-bold text-[#111827] dark:text-white">ข้อมูลผู้ป่วย</label>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {/* HN */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">HN</label>
                                <input type="text" name="hn" value={formData.hn} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>

                            {/* Blood Type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">หมู่เลือด</label>
                                <div className="relative">
                                    <select name="bloodType" value={formData.bloodType} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] pr-10 rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white appearance-none focus:outline-none focus:border-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed">
                                        <option value="">เลือกหมู่เลือด</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-400 w-4 h-4 pointer-events-none" />
                                </div>
                            </div>

                            {/* Age */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">อายุ</label>
                                <input type="text" name="age" value={formData.age} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ใส่อายุเป็นตัวเลข</span>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">เพศกำเนิด</label>
                                <div className="flex gap-4 mt-2">
                                    {['ชาย', 'หญิง'].map((g) => (
                                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={formData.gender === g}
                                                onChange={handleChange}
                                                disabled={!canEdit}
                                                className="w-4 h-4 accent-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <span className="text-[14px] text-[#4B5563] dark:text-gray-300">
                                                {g}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Disease */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">โรคประจำตัว</label>
                                <input type="text" name="disease" value={formData.disease} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ไม่มีใส่ " - "</span>
                            </div>

                            {/* Medication */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">การใช้ยาที่มีผลต่อเม็ดเลือด</label>
                                <input type="text" name="medication" value={formData.medication} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ไม่มีใส่ " - "</span>
                            </div>

                            {/* Allergies */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">อาการแพ้</label>
                                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ไม่มีใส่ " - "</span>
                            </div>

                            {/* Latest Receipt / Transfusion */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">การได้รับเลือดล่าสุด</label>
                                <input type="text" name="latestReceipt" value={formData.latestReceipt} onChange={handleChange} disabled={!canEdit} className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ไม่มีใส่ " - "</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-full text-[14px] text-[#6B7280] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            ยกเลิก
                        </button>
                        {canEdit && (
                            <button type="submit" className="px-8 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-[0_12px_20px_rgba(37,99,235,0.35)] dark:shadow-[0_12px_20px_rgba(37,99,235,0.2)] active:translate-y-px transition-all">
                                ยืนยัน
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
