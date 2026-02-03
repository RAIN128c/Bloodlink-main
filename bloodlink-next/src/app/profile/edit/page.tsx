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
    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const maxWidth = 1200; // Max width for profile
            const maxHeight = 1200;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width > height) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    }, 'image/jpeg', 0.8); // 80% quality jpeg
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
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
                            <div className="bg-white dark:bg-[#1F2937] rounded-[16px] p-5 sm:p-10 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 transition-colors">


                                {/* Avatar Upload Section */}
                                <div className="flex flex-col items-center gap-4 mb-8">
                                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            {formData.avatarUrl ? (
                                                <Image
                                                    src={formData.avatarUrl}
                                                    alt="Profile"
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-16 h-16 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAvatarClick}
                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        เปลี่ยนรูปโปรไฟล์
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>

                                {/* Section: User Info */}
                                <h2 className="text-[20px] font-bold text-[#111827] dark:text-white mb-6">ข้อมูลส่วนตัว</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                                    {/* Name */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ชื่อ</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่ชื่อ"
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Surname */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">นามสกุล</label>
                                        <input
                                            type="text"
                                            name="surname"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่นามสกุล"
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Email (Read Only) */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">อีเมล</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#E5E7EB] dark:bg-[#4B5563] text-[#6B7280] dark:text-gray-400 text-[14px] outline-none cursor-not-allowed"
                                        />
                                        <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">อีเมลไม่สามารถเปลี่ยนได้</span>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">เบอร์โทร</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="กรุณาใส่เบอร์โทร"
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Position (Editable now) */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ตำแหน่ง (ระบุเพิ่มเติม)</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                            placeholder="เช่น จักษุแพทย์, หัวหน้าตึกผู้ป่วยใน"
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* System Role (Read Only) */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">สิทธิ์การใช้งาน (Role)</label>
                                        <input
                                            type="text"
                                            value={formData.roleDisplay}
                                            readOnly
                                            className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#E5E7EB] dark:bg-[#4B5563] text-[#6B7280] dark:text-gray-400 text-[14px] outline-none cursor-not-allowed"
                                        />
                                        <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">หากต้องการเปลี่ยนสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ</span>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-col gap-3 mt-4 w-full">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSaving}
                                        className={`w-full py-3 bg-[#3B82F6] text-white text-[16px] font-medium rounded-[8px] shadow-[0_2px_4px_rgba(59,130,246,0.2)] hover:bg-[#2563EB] transition-colors flex justify-center items-center ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </button>
                                    <Link
                                        href="/profile"
                                        className="w-full py-3 text-[#6B7280] dark:text-gray-400 text-[16px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-[8px] transition-colors text-center"
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
