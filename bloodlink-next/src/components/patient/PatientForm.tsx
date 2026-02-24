'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Patient } from '@/types';
import { useSession, SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import { Permissions } from '@/lib/permissions';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
        testType: initialData.testType || 'ตรวจเลือดทั่วไป (CBC)',
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
        status: initialData.status || 'ใช้งาน',
        // New Fields
        idCard: initialData.idCard || '',
        phone: initialData.phone || '',
        relativeName: initialData.relativeName || '',
        relativePhone: initialData.relativePhone || '',
        relativeRelationship: initialData.relativeRelationship || '',
        // Vital Signs
        weight: initialData.weight || '',
        height: initialData.height || '',
        waist: initialData.waist || '',
        bp: initialData.bp || '',
        pulse: initialData.pulse || '',
        temperature: initialData.temperature || '',
        dtx: initialData.dtx || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const formRef = useRef<HTMLFormElement>(null);

    // Duplicate check states
    const [hnDuplicate, setHnDuplicate] = useState<{ exists: boolean; patient?: { hn: string; name: string } } | null>(null);
    const [idCardDuplicate, setIdCardDuplicate] = useState<{ exists: boolean; patient?: { hn: string; name: string } } | null>(null);
    const [checkingHn, setCheckingHn] = useState(false);
    const [checkingIdCard, setCheckingIdCard] = useState(false);

    // Real-time HN duplicate check
    useEffect(() => {
        if (!formData.hn || formData.hn.length !== 9 || isEdit) { setHnDuplicate(null); return; }
        const timer = setTimeout(async () => {
            setCheckingHn(true);
            try {
                const res = await fetch(`/api/patients/check?hn=${formData.hn}`);
                if (res.ok) setHnDuplicate(await res.json());
            } catch { } finally { setCheckingHn(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [formData.hn, isEdit]);

    // Real-time ID card duplicate check
    useEffect(() => {
        if (!formData.idCard || formData.idCard.length !== 13 || isEdit) { setIdCardDuplicate(null); return; }
        const timer = setTimeout(async () => {
            setCheckingIdCard(true);
            try {
                const res = await fetch(`/api/patients/check?idCard=${formData.idCard}`);
                if (res.ok) setIdCardDuplicate(await res.json());
            } catch { } finally { setCheckingIdCard(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [formData.idCard, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.testType) newErrors.testType = 'กรุณาเลือกประเภทการตรวจ';
        if (!formData.name?.trim()) newErrors.name = 'กรุณากรอกชื่อ';
        if (!formData.surname?.trim()) newErrors.surname = 'กรุณากรอกนามสกุล';
        if (!formData.hn?.trim()) {
            newErrors.hn = 'กรุณากรอก HN';
        } else if (formData.hn.length !== 9) {
            newErrors.hn = 'HN ต้องมี 9 หลัก';
        } else if (hnDuplicate?.exists) {
            newErrors.hn = `HN นี้มีอยู่แล้ว (${hnDuplicate.patient?.name || ''})`;
        }

        if (!formData.bloodType) newErrors.bloodType = 'กรุณาเลือกหมู่เลือด';
        if (!formData.age?.trim()) newErrors.age = 'กรุณากรอกอายุ';
        else if (isNaN(Number(formData.age))) newErrors.age = 'อายุต้องเป็นตัวเลขเท่านั้น';

        // Consultant's Mandatory Fields
        if (!formData.idCard?.trim()) newErrors.idCard = 'กรุณากรอกเลขบัตรประชาชน';
        else if (formData.idCard.length !== 13) newErrors.idCard = 'เลขบัตรประชาชนต้องมี 13 หลัก';
        else if (idCardDuplicate?.exists) newErrors.idCard = `เลขบัตรนี้มีอยู่แล้ว (${idCardDuplicate.patient?.name || ''})`;

        if (!formData.relativeName?.trim()) newErrors.relativeName = 'กรุณากรอกชื่อญาติ';
        if (!formData.relativePhone?.trim()) newErrors.relativePhone = 'กรุณากรอกเบอร์โทรญาติ';
        if (!formData.relativeRelationship) newErrors.relativeRelationship = 'กรุณาระบุความสัมพันธ์';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form data:', formData);

        if (validate()) {
            onConfirm?.(formData);
        } else {
            // Predict the first error key from the same validation logic
            const currentErrors = (() => {
                const newErrors: Record<string, string> = {};
                if (!formData.testType) newErrors.testType = 'กรุณาเลือกประเภทการตรวจ';
                if (!formData.name?.trim()) newErrors.name = 'กรุณากรอกชื่อ';
                if (!formData.surname?.trim()) newErrors.surname = 'กรุณากรอกนามสกุล';
                if (!formData.hn?.trim() || formData.hn.length !== 9 || hnDuplicate?.exists) newErrors.hn = 'HN';
                if (!formData.bloodType) newErrors.bloodType = 'กรุณาเลือกหมู่เลือด';
                if (!formData.age?.trim() || isNaN(Number(formData.age))) newErrors.age = 'อายุ';
                if (!formData.idCard?.trim() || formData.idCard.length !== 13 || idCardDuplicate?.exists) newErrors.idCard = 'idCard';
                if (!formData.relativeName?.trim()) newErrors.relativeName = 'relativeName';
                if (!formData.relativePhone?.trim()) newErrors.relativePhone = 'relativePhone';
                if (!formData.relativeRelationship) newErrors.relativeRelationship = 'relativeRelationship';
                return newErrors;
            })();

            const firstErrorKey = Object.keys(currentErrors)[0];

            setTimeout(() => {
                const firstErrorEl = document.querySelector(`[name="${firstErrorKey}"]`) || document.querySelector('.border-red-500');
                if (firstErrorEl) {
                    firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (firstErrorEl as HTMLElement).focus?.();
                }
            }, 100);
        }
    };

    return (
        <div className="w-full flex justify-center items-start font-[family-name:var(--font-kanit)]">
            <div className="w-full bg-white dark:bg-[#1F2937] rounded-[24px] shadow-[0_20px_40px_rgba(15,23,42,0.04)] dark:shadow-none p-[32px_40px_28px_40px] flex flex-col gap-6 relative transition-colors">

                {/* Section: Vital Signs (New) */}
                <div className="space-y-4 pt-4">
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                        <label className="text-[18px] font-bold text-[#111827] dark:text-white">สัญญาณชีพ (Vital Signs)</label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'weight', label: 'น้ำหนัก (kg)' },
                            { name: 'height', label: 'ส่วนสูง (cm)' },
                            { name: 'waist', label: 'รอบเอว (cm)' },
                            { name: 'bp', label: 'ความดัน (BP)' },
                            { name: 'pulse', label: 'ชีพจร (Pulse)' },
                            { name: 'temperature', label: 'อุณหภูมิ (Temp)' },
                            { name: 'dtx', label: 'DTX (mg/dL)' },
                        ].map((field) => (
                            <div key={field.name} className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    {field.label}
                                </label>
                                <input
                                    type="text"
                                    name={field.name}
                                    value={formData[field.name as keyof Patient] || ''}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Diagnosis (Updated) */}
                <div className="space-y-4">
                    <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                        <label className="text-[18px] font-bold text-[#111827] dark:text-white">การวินิจฉัย (Diagnosis)</label>
                    </div>
                    <div className="flex flex-wrap gap-4 p-4 rounded-[12px] bg-[#F9FAFB] dark:bg-[#374151] border border-[#E5E7EB] dark:border-gray-600">
                        {['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].map((dx) => {
                            const isChecked = formData.disease?.includes(dx);
                            return (
                                <label key={dx} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-[#6366F1]"
                                        checked={isChecked || false}
                                        onChange={(e) => {
                                            if (!canEdit) return;
                                            const currentDx = formData.disease ? formData.disease.split(',').filter(d => Boolean(d) && !['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].includes(d)) : [];
                                            const selectedDx = ['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].filter(d =>
                                                d === dx ? e.target.checked : formData.disease?.includes(d)
                                            );
                                            // Combine standard Dx with custom text ones
                                            // Actually, simpler logic:
                                            let newDxList = formData.disease ? formData.disease.split(',') : [];
                                            if (e.target.checked) {
                                                if (!newDxList.includes(dx)) newDxList.push(dx);
                                            } else {
                                                newDxList = newDxList.filter(d => d !== dx);
                                            }
                                            setFormData(prev => ({ ...prev, disease: newDxList.filter(Boolean).join(',') }));
                                        }}
                                        disabled={!canEdit}
                                    />
                                    <span className="text-[14px] text-[#374151] dark:text-gray-200">{dx}</span>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">ระบุเพิ่มเติม (Other)</label>
                        <input
                            type="text"
                            placeholder="ระบุโรคอื่นๆ (คั่นด้วยจุลภาค)"
                            value={formData.disease?.split(',').filter(d => !['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].includes(d)).join(',') || ''}
                            onChange={(e) => {
                                if (!canEdit) return;
                                const standardDx = formData.disease ? formData.disease.split(',').filter(d => ['DM', 'HT', 'DLP', 'CKD', 'Asthma', 'COPD'].includes(d)) : [];
                                const otherDx = e.target.value;
                                const combined = [...standardDx, otherDx].filter(Boolean).join(',');
                                setFormData(prev => ({ ...prev, disease: combined }));
                            }}
                            disabled={!canEdit}
                            className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Section: Lab Requests (Updated) */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                            รายการตรวจทางห้องปฏิบัติการ (Lab Request) <span className="text-red-500">*</span>
                        </label>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    const ncdSet = ['FBS', 'HbA1c', 'Lipid Profile', 'Creatinine', 'Urinalysis']; // Standard NCD Set
                                    const current = formData.testType ? formData.testType.split(',') : [];
                                    const unique = Array.from(new Set([...current, ...ncdSet])).filter(Boolean);
                                    setFormData(prev => ({ ...prev, testType: unique.join(',') }));
                                    if (errors.testType) setErrors(prev => ({ ...prev, testType: '' }));
                                }}
                                className="text-[11px] text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full transition-colors"
                            >
                                + NCD Set
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-[12px] bg-[#F9FAFB] dark:bg-[#374151] border border-[#E5E7EB] dark:border-gray-600">
                        {[
                            'CBC', 'FBS', 'HbA1c', 'Lipid Profile',
                            'Creatinine', 'eGFR', 'Urinalysis', 'Electrolytes',
                            'Uric Acid', 'LFT', 'Anti-HIV', 'HBs-Ag', 'VDRL', 'UPT', 'TFT'
                        ].map((type) => {
                            const isChecked = formData.testType?.includes(type);
                            return (
                                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked
                                        ? 'bg-[#6366F1] border-[#6366F1]'
                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 group-hover:border-[#6366F1]'
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
                                        checked={isChecked || false}
                                        onChange={(e) => {
                                            if (!canEdit) return;
                                            const currentTypes = formData.testType ? formData.testType.split(',').filter(Boolean) : [];
                                            let newTypes;
                                            if (e.target.checked) {
                                                newTypes = [...currentTypes, type];
                                            } else {
                                                newTypes = currentTypes.filter(t => t !== type);
                                            }
                                            setFormData(prev => ({ ...prev, testType: newTypes.join(',') }));
                                            if (newTypes.length > 0 && errors.testType) {
                                                setErrors(prev => ({ ...prev, testType: '' }));
                                            }
                                        }}
                                        disabled={!canEdit}
                                    />
                                    <span className="text-[13px] text-[#374151] dark:text-gray-200">{type}</span>
                                </label>
                            );
                        })}
                    </div>
                    {errors.testType && <span className="text-red-500 text-[11px]">{errors.testType}</span>}
                </div>


                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Section: Name */}
                    <div className="space-y-4 pt-4">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-2">
                            <label className="text-[18px] font-bold text-[#111827] dark:text-white">ชื่อ-สกุล</label>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    ชื่อ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className={`w-full p-[10px_14px] rounded-[12px] border ${errors.name ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'} dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                {errors.name && <span className="text-red-500 text-[11px]">{errors.name}</span>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    นามสกุล <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className={`w-full p-[10px_14px] rounded-[12px] border ${errors.surname ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'} dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                {errors.surname && <span className="text-red-500 text-[11px]">{errors.surname}</span>}
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
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    HN <span className="text-red-500">*</span>
                                    {formData.hn?.length === 9 && (
                                        <span className="ml-2 text-green-500 text-xs font-medium">✓ ครบ 9 หลัก</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="hn"
                                        value={formData.hn}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Only allow numbers and max 9 digits
                                            if (/^\d*$/.test(value) && value.length <= 9) {
                                                handleChange(e);
                                            }
                                        }}
                                        disabled={!canEdit}
                                        maxLength={9}
                                        placeholder="ตัวเลข 9 หลัก"
                                        className={`w-full p-[10px_14px] rounded-[12px] border ${errors.hn
                                            ? 'border-red-500 bg-red-50'
                                            : formData.hn?.length === 9
                                                ? 'border-green-500 bg-green-50/10'
                                                : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'
                                            } dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                        {formData.hn?.length || 0}/9
                                    </div>
                                </div>
                                {errors.hn && <span className="text-red-500 text-[11px]">{errors.hn}</span>}
                                {checkingHn && <span className="text-blue-400 text-[11px] animate-pulse">กำลังตรวจสอบ...</span>}
                                {!checkingHn && hnDuplicate?.exists && (
                                    <span className="text-amber-600 text-[11px] font-medium">
                                        ⚠️ HN นี้มีอยู่แล้ว: {hnDuplicate.patient?.name}
                                    </span>
                                )}
                            </div>

                            {/* Blood Type */}
                            <div className="flex flex-col gap-1.5 z-10">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    หมู่เลือด <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    value={formData.bloodType || ''}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, bloodType: val }));
                                        if (errors.bloodType) setErrors(prev => ({ ...prev, bloodType: '' }));
                                    }}
                                    options={[
                                        { value: 'A+', label: 'A+' },
                                        { value: 'A-', label: 'A-' },
                                        { value: 'B+', label: 'B+' },
                                        { value: 'B-', label: 'B-' },
                                        { value: 'AB+', label: 'AB+' },
                                        { value: 'AB-', label: 'AB-' },
                                        { value: 'O+', label: 'O+' },
                                        { value: 'O-', label: 'O-' }
                                    ]}
                                    disabled={!canEdit}
                                    placeholder="เลือกหมู่เลือด"
                                    error={errors.bloodType}
                                    triggerClassName="rounded-[12px] bg-[#F9FAFB] dark:bg-[#374151] border-[#E5E7EB] dark:border-gray-600 p-[10px_14px] h-auto"
                                />
                            </div>

                            {/* Age */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    อายุ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    className={`w-full p-[10px_14px] rounded-[12px] border ${errors.age ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'} dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                {errors.age ? (
                                    <span className="text-red-500 text-[11px]">{errors.age}</span>
                                ) : (
                                    <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">ใส่อายุเป็นตัวเลข</span>
                                )}
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

                            {/* ID Card */}
                            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    เลขบัตรประชาชน <span className="text-red-500">*</span>
                                    {formData.idCard?.length === 13 && (
                                        <span className="ml-2 text-green-500 text-xs font-medium">✓ ครบ 13 หลัก</span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="idCard"
                                        value={formData.idCard || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, ''); // Numeric only
                                            if (val.length <= 13) {
                                                setFormData(prev => ({ ...prev, idCard: val }));
                                                if (errors.idCard) setErrors(prev => ({ ...prev, idCard: '' }));
                                            }
                                        }}
                                        disabled={!canEdit}
                                        maxLength={13}
                                        placeholder="เลข 13 หลัก"
                                        className={`w-full p-[10px_14px] rounded-[12px] border ${errors.idCard
                                            ? 'border-red-500 bg-red-50'
                                            : formData.idCard?.length === 13
                                                ? 'border-green-500 bg-green-50/10'
                                                : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'
                                            } dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wider font-mono`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                        {formData.idCard?.length || 0}/13
                                    </div>
                                </div>
                                {errors.idCard && <span className="text-red-500 text-[11px]">{errors.idCard}</span>}
                                {checkingIdCard && <span className="text-blue-400 text-[11px] animate-pulse">กำลังตรวจสอบ...</span>}
                                {!checkingIdCard && idCardDuplicate?.exists && (
                                    <span className="text-amber-600 text-[11px] font-medium">
                                        ⚠️ เลขบัตรนี้มีอยู่แล้ว: {idCardDuplicate.patient?.name} (HN: {idCardDuplicate.patient?.hn})
                                    </span>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    เบอร์โทรศัพท์ผู้ป่วย
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d-]/g, '');
                                        setFormData(prev => ({ ...prev, phone: val }));
                                    }}
                                    disabled={!canEdit}
                                    placeholder="0xx-xxx-xxxx"
                                    className="w-full p-[10px_14px] rounded-[12px] border border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB] dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="checkbox"
                                        id="useRelativePhone"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                // If checked, maybe clear phone or set a flag? 
                                                // User requirement: "Toggle: patient might not have private phone"
                                                // We'll just leave phone empty and rely on relative phone
                                                setFormData(prev => ({ ...prev, phone: '' }));
                                            }
                                        }}
                                    />
                                    <label htmlFor="useRelativePhone" className="text-[11px] text-gray-500 cursor-pointer">
                                        ไม่มีเบอร์ส่วนตัว (ใช้เบอร์ญาติ)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Contact / Relative Info */}
                    <div className="space-y-4">
                        <div className="border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                            <label className="text-[18px] font-bold text-[#111827] dark:text-white">ข้อมูลผู้ติดต่อฉุกเฉิน (ญาติ)</label>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium border border-red-200">Mandatory for NCD</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            {/* Relative Name */}
                            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    ชื่อ-สกุล ญาติ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="relativeName"
                                    value={formData.relativeName || ''}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    placeholder="ชื่อผู้ติตต่อฉุกเฉิน"
                                    className={`w-full p-[10px_14px] rounded-[12px] border ${errors.relativeName ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'} dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                {errors.relativeName && <span className="text-red-500 text-[11px]">{errors.relativeName}</span>}
                            </div>

                            {/* Relationship */}
                            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    ความสัมพันธ์ <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    value={formData.relativeRelationship || ''}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, relativeRelationship: val }));
                                        if (errors.relativeRelationship) setErrors(prev => ({ ...prev, relativeRelationship: '' }));
                                    }}
                                    options={[
                                        { value: 'บิดา/มารดา', label: 'บิดา/มารดา' },
                                        { value: 'สามี/ภรรยา', label: 'สามี/ภรรยา' },
                                        { value: 'บุตร/ธิดา', label: 'บุตร/ธิดา' },
                                        { value: 'พี่น้อง', label: 'พี่น้อง' },
                                        { value: 'ญาติ', label: 'ญาติ' },
                                        { value: 'ผู้ดูแล (Caregiver)', label: 'ผู้ดูแล (Caregiver)' },
                                        { value: 'อื่นๆ', label: 'อื่นๆ' }
                                    ]}
                                    disabled={!canEdit}
                                    placeholder="เลือกความสัมพันธ์"
                                    error={errors.relativeRelationship}
                                />
                            </div>

                            {/* Relative Phone */}
                            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                                <label className="text-[13px] font-semibold text-[#374151] dark:text-gray-300">
                                    เบอร์โทรศัพท์ญาติ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="relativePhone"
                                    value={formData.relativePhone || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^\d-]/g, '');
                                        setFormData(prev => ({ ...prev, relativePhone: val }));
                                        if (errors.relativePhone) setErrors(prev => ({ ...prev, relativePhone: '' }));
                                    }}
                                    disabled={!canEdit}
                                    placeholder="0xx-xxx-xxxx"
                                    className={`w-full p-[10px_14px] rounded-[12px] border ${errors.relativePhone ? 'border-red-500 bg-red-50' : 'border-[#E5E7EB] dark:border-gray-600 bg-[#F9FAFB]'} dark:bg-[#374151] text-[14px] text-[#111827] dark:text-white focus:outline-none focus:border-[#6366F1] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono`}
                                />
                                {errors.relativePhone && <span className="text-red-500 text-[11px]">{errors.relativePhone}</span>}
                            </div>

                            {/* Disease (Removed - merged into Diagnosis above) */}


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
                            <button type="submit" className="px-8 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold shadow-[0_12px_20px_rgba(37,99,235,0.35)] dark:shadow-[0_12px_20px_rgba(37,99,235,0.2)] active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                ยืนยัน
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
