'use client';

import { useState } from 'react';
import { addPatient } from '@/lib/actions/patient';
import { useRouter } from 'next/navigation';
import { Loader2, Save, User, Activity, ShieldX, UsersRound, X, UserPlus, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Permissions } from '@/lib/permissions';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, type PatientFormData } from '@/lib/validations/patient';

import { useNotifications } from '@/components/providers/NotificationContext';

export function AddPatientForm() {
    const router = useRouter();
    const { notify } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Responsible persons state (kept separate from main form for now)
    const [additionalResponsible, setAdditionalResponsible] = useState<{ email: string; name: string; surname?: string }[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [searchingEmail, setSearchingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');

    // Check permissions
    const { data: session } = useSession();
    const { effectiveRole } = useEffectiveRole();
    const canAdd = Permissions.canAddPatient(effectiveRole);
    const currentUserEmail = session?.user?.email || '';
    const currentUserName = session?.user?.name || 'คุณ';

    // React Hook Form Setup
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema) as Resolver<PatientFormData>,
        defaultValues: {
            gender: 'Male',
            bloodType: 'O',
        }
    });

    const handleAddResponsible = async () => {
        const email = newEmail.trim().toLowerCase();
        setEmailError('');

        if (!email) return;
        if (email === currentUserEmail.toLowerCase()) {
            setEmailError('คุณเป็นผู้รับผิดชอบหลักอยู่แล้ว');
            return;
        }
        if (additionalResponsible.some(r => r.email === email)) {
            setEmailError('อีเมลนี้ถูกเพิ่มไปแล้ว');
            return;
        }

        setSearchingEmail(true);
        try {
            const res = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            if (data.found) {
                setAdditionalResponsible([
                    ...additionalResponsible,
                    { email: data.user.email, name: data.user.name, surname: data.user.surname }
                ]);
                setNewEmail('');
            } else {
                setEmailError('ไม่พบผู้ใช้งานนี้ในระบบ');
            }
        } catch {
            setEmailError('เกิดข้อผิดพลาดในการค้นหา');
        } finally {
            setSearchingEmail(false);
        }
    };

    const handleRemoveResponsible = (email: string) => {
        setAdditionalResponsible(additionalResponsible.filter(e => e.email !== email));
    };

    const onSubmit = async (data: PatientFormData) => {
        setIsLoading(true);
        setSubmitError('');

        try {
            // Transform form data to match API expectation (string conversions)
            const payload = {
                ...data,
                age: data.age.toString(),
            };

            const additionalEmails = additionalResponsible.map(r => r.email);
            const res = await addPatient(payload, additionalEmails);

            if (res.success) {
                notify('success', 'เพิ่มผู้ป่วยสำเร็จ', `เพิ่มข้อมูลผู้ป่วย ${data.name} ${data.surname || ''} เรียบร้อยแล้ว`);
                router.push('/dashboard');
                router.refresh();
            } else {
                setSubmitError(res.error || 'Failed to add patient');
            }
        } catch {
            setSubmitError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canAdd) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center font-[family-name:var(--font-kanit)]">
                <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-200 dark:border-red-800">
                    <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        เฉพาะแพทย์และพยาบาลเท่านั้นที่สามารถเพิ่มผู้ป่วยได้
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        กลับ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-[family-name:var(--font-kanit)]">

            {submitError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {submitError}
                </div>
            )}

            {/* Section 1: Personal Info */}
            <div className="bg-white dark:bg-[#1F2937] p-4 md:p-6 rounded-[20px] shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    ข้อมูลส่วนตัว (Personal Information)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HN (Hospital Number) <span className="text-red-500">*</span></label>
                        <input
                            {...register('hn')}
                            className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all outline-none focus:ring-2 ${errors.hn ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                            placeholder="e.g. 6601234"
                        />
                        {errors.hn && <p className="text-red-500 text-xs mt-1">{errors.hn.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อ (First Name) <span className="text-red-500">*</span></label>
                            <input
                                {...register('name')}
                                className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">นามสกุล (Last Name)</label>
                            <input
                                {...register('surname')}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อายุ (Age)</label>
                            <input
                                type="number"
                                {...register('age')}
                                className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all outline-none focus:ring-2 ${errors.age ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                            />
                            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
                        </div>
                        <div>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <CustomSelect
                                        label="เพศ (Gender)"
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.gender?.message}
                                        options={[
                                            { value: 'Male', label: 'ชาย (Male)' },
                                            { value: 'Female', label: 'หญิง (Female)' },
                                            { value: 'Other', label: 'อื่นๆ (Other)' }
                                        ]}
                                        triggerClassName="rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-auto"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <Controller
                            name="bloodType"
                            control={control}
                            render={({ field }) => (
                                <CustomSelect
                                    label="หมู่เลือด (Blood Type)"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.bloodType?.message}
                                    options={[
                                        { value: 'A', label: 'A' },
                                        { value: 'B', label: 'B' },
                                        { value: 'O', label: 'O' },
                                        { value: 'AB', label: 'AB' }
                                    ]}
                                    triggerClassName="rounded-xl px-4 py-2.5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-auto"
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Responsible Persons */}
            <div className="bg-white dark:bg-[#1F2937] p-4 md:p-6 rounded-[20px] shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <UsersRound className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    ผู้รับผิดชอบ (Responsible Persons)
                </h3>

                {/* Creator (current user) */}
                <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ผู้สร้าง (คุณ):</p>
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700 w-full sm:w-auto overflow-hidden">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300 truncate">{currentUserName}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 hidden sm:inline">({currentUserEmail})</span>
                    </div>
                </div>

                {/* Additional responsible persons */}
                {additionalResponsible.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ผู้รับผิดชอบเพิ่มเติม:</p>
                        <div className="flex flex-wrap gap-2">
                            {additionalResponsible.map(person => (
                                <div key={person.email} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-sm max-w-full">
                                    <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[100px] sm:max-w-none">{person.name} {person.surname}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 text-xs hidden sm:inline">({person.email})</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveResponsible(person.email)}
                                        className="ml-1 text-gray-400 hover:text-red-500 transition flex-shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add new responsible */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                        placeholder="กรอกอีเมลเพื่อเพิ่มผู้รับผิดชอบ"
                        className={`w-full sm:flex-1 px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 text-sm ${emailError ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddResponsible(); } }}
                        disabled={searchingEmail}
                    />
                    <button
                        type="button"
                        onClick={handleAddResponsible}
                        disabled={searchingEmail || !newEmail.trim()}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                    >
                        {searchingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {searchingEmail ? 'ค้นหา...' : 'เพิ่ม'}
                    </button>
                </div>
                {emailError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>
                )}
            </div>

            {/* Section 3: Medical Info */}
            <div className="bg-white dark:bg-[#1F2937] p-4 md:p-6 rounded-[20px] shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" />
                    ประวัติสุขภาพ (Medical History)
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">โรคประจำตัว (Underlying Diseases)</label>
                        <input
                            {...register('disease')}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="เช่น เบาหวาน, ความดัน (ถ้าไม่มีให้เว้นว่าง)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประวัติการแพ้ยา/อาหาร (Allergies)</label>
                        <input
                            {...register('allergies')}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="เช่น แพ้ยาเพนิซิลลิน, อาหารทะเล"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ยาที่ทานประจำ (Current Medication)</label>
                        <textarea
                            {...register('medication')}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="ระบุชื่อยาและปริมาณที่ทาน"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center px-8 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    Save Patient
                </button>
            </div>
        </form>
    );
}
