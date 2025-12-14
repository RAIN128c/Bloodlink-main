'use client';

import { useState } from 'react';
import { addPatient } from '@/lib/actions/patient';
import { useRouter } from 'next/navigation';
import { Loader2, Save, User, Activity, ShieldX, UsersRound, X, UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Permissions, getEffectiveRole } from '@/lib/permissions';

export function AddPatientForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Responsible persons state - store user objects with name and email
    const [additionalResponsible, setAdditionalResponsible] = useState<{ email: string; name: string; surname?: string }[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [searchingEmail, setSearchingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');

    // Check if user has permission to add patients
    const { data: session } = useSession();
    const effectiveRole = getEffectiveRole((session?.user as any)?.role);
    const canAdd = Permissions.canAddPatient(effectiveRole);
    const currentUserEmail = session?.user?.email || '';
    const currentUserName = session?.user?.name || 'คุณ';

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

        // Validate email exists in system
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            hn: formData.get('hn') as string,
            name: formData.get('name') as string,
            surname: formData.get('surname') as string,
            gender: formData.get('gender') as string,
            age: formData.get('age') as string,
            bloodType: formData.get('bloodType') as string,
            disease: formData.get('disease') as string,
            medication: formData.get('medication') as string,
            allergies: formData.get('allergies') as string,
        };

        try {
            // Extract just emails from user objects for the action
            const additionalEmails = additionalResponsible.map(r => r.email);
            const res = await addPatient(data, additionalEmails);
            if (res.success) {
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(res.error || 'Failed to add patient');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Show access denied if user cannot add patients
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
        <form onSubmit={handleSubmit} className="space-y-8 font-[family-name:var(--font-kanit)]">

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Section 1: Personal Info */}
            <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HN (Hospital Number) *</label>
                        <input name="hn" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" placeholder="e.g. 6601234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                            <input name="name" required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                            <input name="surname" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                            <input name="age" type="number" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                            <select name="gender" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Type</label>
                        <select name="bloodType" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                            <option value="">Select...</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="O">O</option>
                            <option value="AB">AB</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Responsible Persons */}
            <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <UsersRound className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    ผู้รับผิดชอบ
                </h3>

                {/* Creator (current user) */}
                <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ผู้สร้าง (คุณ):</p>
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{currentUserName}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">({currentUserEmail})</span>
                    </div>
                </div>

                {/* Additional responsible persons */}
                {additionalResponsible.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">ผู้รับผิดชอบเพิ่มเติม:</p>
                        <div className="flex flex-wrap gap-2">
                            {additionalResponsible.map(person => (
                                <div key={person.email} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-sm">
                                    <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{person.name} {person.surname}</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">({person.email})</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveResponsible(person.email)}
                                        className="ml-1 text-gray-400 hover:text-red-500 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add new responsible */}
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                        placeholder="กรอกอีเมลเพื่อเพิ่มผู้รับผิดชอบ"
                        className={`flex-1 px-4 py-2 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 text-sm ${emailError ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddResponsible(); } }}
                        disabled={searchingEmail}
                    />
                    <button
                        type="button"
                        onClick={handleAddResponsible}
                        disabled={searchingEmail || !newEmail.trim()}
                        className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                    >
                        {searchingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {searchingEmail ? 'ค้นหา...' : 'เพิ่ม'}
                    </button>
                </div>
                {emailError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    ผู้รับผิดชอบจะสามารถแก้ไขข้อมูลผู้ป่วยรายนี้ได้ (ต้องเป็นอีเมลที่มีในระบบ)
                </p>
            </div>

            {/* Section 3: Medical Info */}
            <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" />
                    Medical History
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Underlying Diseases</label>
                        <input name="disease" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" placeholder="Separate with comma (e.g. Hypertension, Diabetes)" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies</label>
                        <input name="allergies" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" placeholder="e.g. Penicillin, Seafood" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Medication</label>
                        <textarea name="medication" rows={2} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
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
