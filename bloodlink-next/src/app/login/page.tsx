'use client';

import { authenticate, register } from '@/lib/actions';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

type FormMode = 'login' | 'register';

export default function LoginPage() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [mode, setMode] = useState<FormMode>('login');

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Register State
    const [regRole, setRegRole] = useState('หมอ');
    const [regName, setRegName] = useState('');
    const [regSurname, setRegSurname] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regHospitalType, setRegHospitalType] = useState('แม่ข่าย');
    const [regHospitalName, setRegHospitalName] = useState('');
    const [regPrivacy, setRegPrivacy] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            const result = await authenticate(email, password);
            if (result?.error) {
                setErrorMessage(result.error);
                setIsLoading(false);
            } else {
                // Use hard redirect to ensure session is fully loaded
                window.location.href = '/dashboard';
            }
        } catch {
            setErrorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError('');
        setRegSuccess('');
        setIsLoading(true);

        if (regPassword !== regConfirmPassword) {
            setRegError('รหัสผ่านไม่ตรงกัน');
            setIsLoading(false);
            return;
        }
        if (!regPrivacy) {
            setRegError('กรุณายอมรับนโยบายความเป็นส่วนตัว');
            setIsLoading(false);
            return;
        }

        try {
            const result = await register({
                role: regRole,
                name: regName,
                surname: regSurname,
                email: regEmail,
                password: regPassword,
                hospitalType: regHospitalType,
                hospitalName: regHospitalName
            });

            if (result.error) {
                setRegError(result.error);
                setIsLoading(false);
                return;
            }

            setRegSuccess('ลงทะเบียนสำเร็จ! กรุณารอการตรวจสอบและอนุมัติจากแอดมิน');

            // Switch to login tab after delay
            setTimeout(() => {
                setMode('login');
                setRegSuccess('');
                setEmail(regEmail);
                setIsLoading(false);
            }, 3000);
        } catch (error) {
            setRegError('เกิดข้อผิดพลาดขณะลงทะเบียน');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0f1115] flex items-center justify-center p-5 md:p-10 font-[family-name:var(--font-kanit)] transition-colors">
            <div className={`bg-white dark:bg-[#1F2937] rounded-3xl shadow-2xl dark:shadow-none w-full max-w-[900px] overflow-hidden flex flex-col md:flex-row ${mode === 'register' ? 'md:min-h-[700px]' : 'h-[640px]'} transition-all`}>

                {/* Left Panel: Illustration */}
                <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-[#D1ECF1] dark:bg-[#1e293b] relative p-8 shadow-lg rounded-lg transition-colors">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                            src="/images/nurse.png"
                            alt="Nurse Illustration"
                            width={380}
                            height={380}
                            className="object-contain max-w-[380px] max-h-[380px]"
                            priority
                        />
                    </div>
                </div>

                {/* Right Panel: Forms */}
                <div className={`w-full md:w-1/2 bg-white dark:bg-[#1F2937] flex items-center justify-center p-8 md:p-10 ${mode === 'register' ? 'overflow-y-auto' : ''} transition-colors`}>
                    <div className="w-full max-w-[400px]">

                        {/* Logo */}
                        <div className="mb-4">
                            {mounted ? (
                                <Image
                                    src={resolvedTheme === 'dark' ? "/images/logo_d.png" : "/images/logo.png"}
                                    alt="BloodLink Logo"
                                    width={180}
                                    height={80}
                                    className="w-[180px] h-auto object-contain animate-fadeIn"
                                    priority
                                />
                            ) : (
                                <div className="w-[180px] h-[80px]" />
                            )}
                        </div>
                        <p className="text-[26px] text-gray-700 dark:text-gray-200 font-normal whitespace-nowrap z-10 transition-colors mb-8">
                            ยินดีต้อนรับสู่
                        </p>

                        {/* Login Form */}
                        {mode === 'login' && (
                            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fadeIn">
                                {/* Email */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">อีเมล</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 transition-colors"
                                        autoComplete="username"
                                    />
                                </div>

                                {/* Password */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">รหัสผ่าน</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full py-2.5 px-3.5 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 transition-colors"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password */}
                                <div className="flex justify-end mb-6">
                                    <a href="#" className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline">ลืมรหัสผ่าน?</a>
                                </div>

                                {errorMessage && (
                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-48 mx-auto block py-3 px-6 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 rounded-full shadow-lg hover:bg-purple-700 active:bg-purple-800 transition-all disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "เข้าสู่ระบบ"}
                                </button>

                                {/* Register Link */}
                                <div className="text-center mt-6">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">หากคุณยังไม่ได้ลงทะเบียน คลิกปุ่มด้านล่าง</p>
                                    <button
                                        type="button"
                                        onClick={() => setMode('register')}
                                        className="w-48 mx-auto block py-3 px-6 text-sm font-semibold text-gray-500 dark:text-gray-300 bg-white dark:bg-[#374151] border border-gray-400 dark:border-gray-600 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-600 dark:hover:border-purple-500 transition-all"
                                    >
                                        ลงทะเบียน
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Register Form */}
                        {mode === 'register' && (
                            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                                {/* Role */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">บทบาท</label>
                                    <select
                                        value={regRole}
                                        onChange={(e) => setRegRole(e.target.value)}
                                        className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-purple-600 appearance-none bg-white dark:bg-[#374151] text-gray-900 dark:text-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10"
                                        required
                                    >
                                        <option value="แพทย์">แพทย์</option>
                                        <option value="พยาบาล">พยาบาล</option>
                                        <option value="เจ้าหน้าที่ห้องปฏิบัติการ">เจ้าหน้าที่ห้องปฏิบัติการ</option>
                                    </select>
                                </div>

                                {/* Name */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ชื่อ</label>
                                    <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" autoComplete="given-name" />
                                </div>

                                {/* Surname */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">นามสกุล</label>
                                    <input type="text" required value={regSurname} onChange={(e) => setRegSurname(e.target.value)} className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" autoComplete="family-name" />
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">อีเมล</label>
                                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" autoComplete="email" />
                                </div>

                                {/* Password */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">รหัสผ่าน</label>
                                    <div className="relative">
                                        <input type={showRegPassword ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full py-2.5 px-3.5 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ยืนยันรหัสผ่าน</label>
                                    <div className="relative">
                                        <input type={showRegConfirmPassword ? "text" : "password"} required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className="w-full py-2.5 px-3.5 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            {showRegConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Hospital Type */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ประเภทโรงพยาบาล</label>
                                    <select value={regHospitalType} onChange={(e) => setRegHospitalType(e.target.value)} className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-purple-600 appearance-none bg-white dark:bg-[#374151] text-gray-900 dark:text-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2712%27%20height%3D%278%27%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_16px_center] pr-10" required>
                                        <option value="แม่ข่าย">โรงพยาบาลแม่ข่าย</option>
                                        <option value="ชุมชน">โรงพยาบาลชุมชน</option>
                                    </select>
                                </div>

                                {/* Hospital Name */}
                                <div className="form-group">
                                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">ชื่อโรงพยาบาล</label>
                                    <input type="text" required value={regHospitalName} onChange={(e) => setRegHospitalName(e.target.value)} className="w-full py-2.5 px-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#374151] text-gray-900 dark:text-white focus:outline-none focus:border-purple-600" />
                                </div>

                                {/* Privacy Checkbox */}
                                <div className="form-group flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={regPrivacy} onChange={(e) => setRegPrivacy(e.target.checked)} className="sr-only peer" />
                                        <span className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded mr-2 peer-checked:bg-purple-600 peer-checked:border-purple-600 flex items-center justify-center transition-all bg-white dark:bg-[#374151]">
                                            {regPrivacy && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">ฉันเข้าใจ และยอมรับนโยบายความเป็นส่วนตัว</span>
                                    </label>
                                </div>

                                {regError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">{regError}</div>}
                                {regSuccess && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-center">{regSuccess}</div>}

                                {/* Register Button */}
                                <button
                                    type="submit"
                                    className="w-48 mx-auto block py-3 px-6 text-sm font-semibold text-white bg-purple-600 rounded-full shadow-lg hover:bg-purple-700 active:bg-purple-800 transition-all mt-6"
                                >
                                    ลงทะเบียน
                                </button>

                                {/* Login Link */}
                                <div className="text-center mt-6">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        มีบัญชีอยู่แล้ว? <button type="button" onClick={() => setMode('login')} className="text-purple-600 dark:text-purple-400 font-medium hover:underline">เข้าสู่ระบบ</button>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Add fadeIn animation */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out both;
                }
            `}</style>
        </div>
    );
}
