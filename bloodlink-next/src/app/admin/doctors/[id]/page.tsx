'use client';

import { Header } from '@/components/layout/Header';

import { ChevronLeft, Edit2, Loader2, Trash2, Save, User, Phone, Mail, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { formatDisplayId, formatDateThai } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Patient } from '@/types';
import { UserProfile } from '@/components/profile/ProfileCard';
import { Role } from '@/lib/permissions';
import { toast } from 'sonner';

export default function DoctorDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    // Edit Role State
    const [selectedRole, setSelectedRole] = useState('');

    // Bio editing state
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');
    const [savingBio, setSavingBio] = useState(false);

    // Responsible patients
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/users/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setSelectedRole(data.role || 'user');
                    setBioText(data.bio || '');

                    // Fetch patients this user is responsible for
                    if (data.email) {
                        const patientsRes = await fetch(`/api/admin/users/${id}/patients`);
                        if (patientsRes.ok) {
                            const patientsData = await patientsRes.json();
                            setPatients(patientsData);
                        }
                    }
                } else {
                    setError('ไม่พบข้อมูลผู้ใช้งาน');
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchUser();
    }, [id]);

    const handleDeleteUser = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push('/admin/doctors');
                router.refresh();
            } else {
                toast.error('ไม่สามารถลบผู้ใช้งานได้');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleUpdateRole = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole })
            });

            if (res.ok) {
                setUser(prev => prev ? { ...prev, role: selectedRole } : null);
                setIsEditRoleModalOpen(false);
            } else {
                toast.error('ไม่สามารถอัพเดทข้อมูลได้');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBio = async () => {
        try {
            setSavingBio(true);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: user?.role, bio: bioText })
            });

            if (res.ok) {
                setUser(prev => prev ? { ...prev, bio: bioText } : null);
                setIsEditingBio(false);
            } else {
                toast.error('ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error) {
            console.error('Save bio error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSavingBio(false);
        }
    };

    const handleApproveUser = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                // Sending status 'Approved' triggers the email in AuthService
                body: JSON.stringify({ status: 'Approved' })
            });

            if (res.ok) {
                setUser(prev => prev ? { ...prev, status: 'Approved' } : null);
                setIsApproveModalOpen(false);
                toast.success('อนุมัติผู้ใช้งานเรียบร้อยแล้ว');
            } else {
                toast.error('ไม่สามารถอนุมัติได้');
            }
        } catch (error) {
            console.error('Approve error:', error);
            toast.error('เกิดข้อผิดพลาด');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F3F4F6] dark:bg-[#0f1115]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-gray-500">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F3F4F6] dark:bg-[#0f1115]">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{error || 'ไม่พบผู้ใช้งาน'}</h1>
                    <Link href="/admin/doctors" className="text-indigo-500 hover:underline">กลับหน้ารายการ</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} isAdminPage={true} />

            <div className="pb-6">
                {/* Page Header with Search */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-[32px] font-bold text-[#0F172A] dark:text-white flex items-center gap-4">
                        <Link href="/admin/doctors" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                            <ChevronLeft className="w-8 h-8" />
                        </Link>
                        Doctor
                    </h1>
                    <div className="relative w-[300px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ/HN"
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Main Profile Card */}
                <div className="bg-white dark:bg-[#1F2937] rounded-[24px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <div className="flex flex-col md:flex-row">
                        {/* Left Column: Avatar & ID */}
                        <div className="w-full md:w-[280px] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 gap-4">
                            <div className="w-[140px] h-[140px] rounded-full bg-[#E5E7EB] dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-sm">
                                {user.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt={user.name} width={140} height={140} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-[70px] h-[70px] text-[#9CA3AF] dark:text-gray-400" />
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[#9CA3AF] dark:text-gray-400 text-sm font-medium">{formatDisplayId(user.staffNumber || user.userId, user.role)}</p>
                            </div>

                            {/* Action Buttons (Admin Only) */}
                            <div className="flex gap-2 mt-2">
                                {/* Approve Button - Only if not approved */}
                                {user?.status && !['approved', 'active', 'อนุมัติ', 'ใช้งาน'].includes(user.status.toLowerCase()) && (
                                    <button
                                        onClick={() => setIsApproveModalOpen(true)}
                                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-all"
                                        title="อนุมัติผู้ใช้งาน"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsEditRoleModalOpen(true)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all"
                                    title="แก้ไขตำแหน่ง/สิทธิ์"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                                    title="ลบผู้ใช้งาน"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Info & Bio */}
                        <div className="flex-1 p-8 flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-[28px] font-bold text-[#1E1B4B] dark:text-white mb-1">
                                    {user.name} {user.surname}
                                </h2>
                                <p className="text-[#9CA3AF] dark:text-gray-400 text-lg font-medium mb-3">{user.position || user.role || 'เจ้าหน้าที่'}</p>

                                {/* Status Badge */}
                                <div className="flex">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${['approved', 'active', 'อนุมัติ', 'ใช้งาน'].includes(user.status?.toLowerCase() || '')
                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                                        }`}>
                                        {user.status || 'รอตรวจสอบ'}
                                    </span>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="flex-1 mb-8 relative group">
                                {!isEditingBio ? (
                                    <div
                                        className="text-[#334155] dark:text-gray-300 text-[15px] leading-relaxed min-h-[80px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -ml-2 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                                        onClick={() => setIsEditingBio(true)}
                                        title="คลิกเพื่อแก้ไขประวัติ"
                                    >
                                        {user.bio || (
                                            <span className="text-gray-400 italic flex items-center gap-2">
                                                <Edit2 className="w-4 h-4" />
                                                เพิ่มประวัติหรือข้อมูลแนะนำตัว...
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <textarea
                                            value={bioText}
                                            onChange={(e) => setBioText(e.target.value)}
                                            className="w-full h-32 p-3 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="เขียนแนะนำตัวหรือข้อมูลเพิ่มเติม..."
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => { setIsEditingBio(false); setBioText(user.bio || ''); }}
                                                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                disabled={savingBio}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                onClick={handleSaveBio}
                                                disabled={savingBio}
                                                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
                                            >
                                                {savingBio && <Loader2 className="w-3 h-3 animate-spin" />}
                                                บันทึก
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="mt-auto space-y-2">
                                {user.phone && (
                                    <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400 text-[15px]">
                                        <Phone className="w-4 h-4" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-[#4B5563] dark:text-gray-400 text-[15px]">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-[#4338CA] dark:text-[#818cf8]">{user.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Appointments Section */}
                <div className="bg-white dark:bg-[#1F2937] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                    <h3 className="text-[22px] font-bold text-[#1E1B4B] dark:text-white mb-6">การนัดหมาย</h3>

                    {patients.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <p>ยังไม่มีรายการนัดหมาย</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900 dark:text-white w-[60px] border-r border-gray-100 dark:border-gray-700">#</th>
                                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700">ผู้ป่วย</th>
                                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700">การนัดหมาย</th>
                                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700">พบเจอล่าสุด</th>
                                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white w-[80px] border-r border-gray-100 dark:border-gray-700">อายุ</th>
                                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white w-[120px]">ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map((patient, idx) => (
                                        <tr key={patient.hn} className="group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium border-r border-gray-100 dark:border-gray-800">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-4 px-4 border-r border-gray-100 dark:border-gray-800">
                                                <Link href={`/admin/patients/${patient.hn}`} className="font-semibold text-[#0F172A] dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {patient.name} {patient.surname}
                                                </Link>
                                            </td>
                                            <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                                                {formatDateThai(patient.appointmentDate)}
                                            </td>
                                            <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                                                {formatDateThai(patient.timestamp)}
                                            </td>
                                            <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                                                {patient.age}
                                            </td>
                                            <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {patient.hn}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit Role Modal */}
                {isEditRoleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#1F2937] rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">แก้ไขสิทธิ์การใช้งาน</h3>
                            <div className="flex flex-col gap-3 mb-6">
                                {[Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.LAB].map((r) => (
                                    <label key={r} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r}
                                            checked={selectedRole === r ||
                                                (r === Role.ADMIN && selectedRole.toLowerCase() === 'admin') ||
                                                (r === Role.DOCTOR && selectedRole.toLowerCase() === 'doctor') ||
                                                (r === Role.NURSE && selectedRole.toLowerCase() === 'nurse') ||
                                                (r === Role.LAB && selectedRole.toLowerCase().includes('lab'))
                                            }
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">
                                            {r} {
                                                r === Role.ADMIN ? '(Admin)' :
                                                    r === Role.DOCTOR ? '(Doctor)' :
                                                        r === Role.NURSE ? '(Nurse)' : '(Lab)'
                                            }
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditRoleModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#1F2937] rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">ยืนยันการลบ?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้? <br />
                                การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={saving}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    ลบผู้ใช้งาน
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Approve Confirmation Modal */}
                {isApproveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-[#1F2937] rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">ยืนยันการอนุมัติ?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                คุณต้องการอนุมัติผู้ใช้งานรายนี้ใช่หรือไม่? <br />
                                ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้ใช้งานทันที
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setIsApproveModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleApproveUser}
                                    disabled={saving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    ยืนยันอนุมัติ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
