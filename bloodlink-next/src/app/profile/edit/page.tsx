'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export default function ProfileEditPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        position: '',

        roleDisplay: '', // System Role (e.g. Doctor) - Read Only
        username: '',
        avatarUrl: '',
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({
                        ...prev,
                        name: data.name || '',
                        surname: data.surname || '',
                        email: data.email || '',
                        phone: data.phone || '', // Need to add phone to DB if not present
                        position: data.position || '', // Actual job title
                        roleDisplay: data.roleDisplay || data.role || '',
                        username: data.email ? data.email.split('@')[0] : '',
                        avatarUrl: data.avatarUrl || '',
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    // Helper to compress image
    const compressImage = async (file: File): Promise<Blob> => {
        const options = {
            maxSizeMB: 0.2, // Max 200KB for avatars
            maxWidthOrHeight: 512, // 512x512 is plenty for avatars
            useWebWorker: true,
            initialQuality: 0.8,
        };
        try {
            return await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression error', error);
            throw error;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            let file = e.target.files[0];

            // 1. Check File Type
            if (!file.type.startsWith('image/')) {
                toast.warning('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
                return;
            }

            // 2. Check File Size (50MB limit as requested, but we will compress if > 1MB)
            const MAX_SIZE_MB = 50;
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.warning(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_SIZE_MB}MB)`);
                return;
            }

            setUploading(true);

            // 3. Compress if larger than 1MB
            if (file.size > 1 * 1024 * 1024) {
                try {
                    const compressedBlob = await compressImage(file);
                    file = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                } catch (err) {
                    console.warn('Compression failed, using original file', err);
                }
            }

            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await uploadRes.json();
            setFormData(prev => ({ ...prev, avatarUrl: data.url }));
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    surname: formData.surname,
                    phone: formData.phone,
                    position: formData.position,
                    avatarUrl: formData.avatarUrl
                }),
            });

            if (res.ok) {
                toast.success('บันทึกข้อมูลเรียบร้อย');
                router.push('/profile');
            } else {
                toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
                <Sidebar />
                <div className="ml-0 md:ml-[195px] flex-1 flex items-center justify-center">
                    <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
            <Sidebar />
            <div className="ml-0 md:ml-[195px] flex-1 flex flex-col h-screen overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#0f1115] px-2 sm:p-4 pt-0 transition-colors">
                    <div className="w-full sm:max-w-[960px] mx-auto flex flex-col h-full">
                        <Header hideSearch={true} />

                        <div className="pb-6">
                            {/* Page Title & Back Button */}
                            <div className="flex items-center gap-4 mb-6">
                                <Link
                                    href="/profile"
                                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1F2937] rounded-full border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Link>
                                <h1 className="text-[24px] font-bold text-[#111827] dark:text-white">แก้ไขโปรไฟล์</h1>
                            </div>

                            {/* Edit Form Card */}
                            <div className="bg-white dark:bg-[#111827] rounded-[24px] p-6 sm:p-12 shadow-sm border border-gray-100 dark:border-gray-800 transition-all">


                                {/* Avatar Upload Section */}
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-10 border-b border-gray-100 dark:border-gray-800">
                                    <div className="relative group cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
                                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-[6px] border-white dark:border-gray-800 shadow-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center transition-transform group-hover:scale-105">
                                            {formData.avatarUrl ? (
                                                <Image
                                                    src={formData.avatarUrl}
                                                    alt="Profile"
                                                    width={160}
                                                    height={160}
                                                    priority
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 dark:text-gray-600" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left pt-2">
                                        <h3 className="text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-white mb-2">ภาพประจำตัว (Avatar)</h3>
                                        <p className="text-[14px] sm:text-[15px] text-gray-500 dark:text-gray-400 mb-5 max-w-sm leading-relaxed">อัปโหลดภาพโปรไฟล์เพื่อให้เพื่อนร่วมงานจดจำคุณได้ง่ายขึ้น รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 50MB</p>
                                        <button
                                            onClick={handleAvatarClick}
                                            className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                                        >
                                            อัปโหลดรูปภาพใหม่
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Section: User Info */}
                                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                    ข้อมูลส่วนตัว
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-10">
                                    {/* Name */}
                                    <div className="flex flex-col">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2">ชื่อ</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่ชื่อ"
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Surname */}
                                    <div className="flex flex-col">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2">นามสกุล</label>
                                        <input
                                            type="text"
                                            name="surname"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่นามสกุล"
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Email (Read Only) */}
                                    <div className="flex flex-col">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                                            <span>อีเมล</span>
                                            <span className="text-[12px] font-normal text-gray-400">(ไม่สามารถเปลี่ยนได้)</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-[#374151]/50 text-gray-500 dark:text-gray-400 text-[15px] outline-none cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2">เบอร์โทร</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่เบอร์โทร"
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                                        />
                                    </div>

                                    {/* Position (Editable now) */}
                                    <div className="flex flex-col md:col-span-2 lg:col-span-1">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2">ตำแหน่ง (ระบุเพิ่มเติม)</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                            placeholder="เช่น จักษุแพทย์, หัวหน้าตึกผู้ป่วยใน"
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1F2937] text-gray-900 dark:text-white text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-gray-400"
                                        />
                                    </div>

                                    {/* System Role (Read Only) */}
                                    <div className="flex flex-col md:col-span-2 lg:col-span-1">
                                        <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                                            <span>สิทธิ์การใช้งาน (Role)</span>
                                            <span className="text-[12px] font-normal text-gray-400">(ติดต่อแอดมินเพื่อแก้ไข)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.roleDisplay}
                                            readOnly
                                            className="h-[48px] px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-[#374151]/50 text-gray-500 dark:text-gray-400 text-[15px] outline-none cursor-not-allowed capitalize"
                                        />
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSaving}
                                        className={`flex-1 sm:order-2 py-3.5 bg-indigo-600 text-white text-[16px] font-semibold rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow transition-all flex justify-center items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isSaving && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                    </button>
                                    <Link
                                        href="/profile"
                                        className="flex-1 sm:order-1 py-3.5 text-gray-700 dark:text-gray-300 text-[16px] font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-center border border-gray-200 dark:border-gray-700"
                                    >
                                        ยกเลิก
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
