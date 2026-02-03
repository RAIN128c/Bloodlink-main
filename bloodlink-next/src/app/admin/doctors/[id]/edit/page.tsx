'use client';

import { Header } from '@/components/layout/Header';

import { ChevronLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DoctorEditPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} />

            <div className="pb-6">
                {/* Page Title & Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href={`/admin/doctors/${id}`}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-[#1F2937] rounded-full border border-[#E5E7EB] dark:border-gray-600 text-[#374151] dark:text-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-[24px] font-bold text-[#111827] dark:text-white">Doctor</h1>
                </div>

                {/* Edit Form Card */}
                <div className="bg-white dark:bg-[#1F2937] rounded-[16px] p-10 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 transition-colors">

                    {/* Role Select */}
                    <div className="flex justify-end mb-8">
                        <div className="w-[300px]">
                            <label className="block text-[14px] font-medium text-[#374151] dark:text-gray-300 mb-2">บทบาท</label>
                            <div className="relative">
                                <select className="w-full h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-white dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] appearance-none outline-none focus:border-[#6366F1] transition-colors">
                                    <option>กรุณาเลือกบทบาท</option>
                                    <option selected>แพทย์</option>
                                    <option>พยาบาล</option>
                                    <option>เจ้าหน้าที่แลป</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Section: User Info */}
                    <h2 className="text-[20px] font-bold text-[#111827] dark:text-white mb-6">ข้อมูลผู้ใช้ระบบ</h2>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {/* Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ชื่อ</label>
                            <input
                                type="text"
                                defaultValue="สมหญิง"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่เฉพาะชื่อ</span>
                        </div>

                        {/* Surname */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">นามสกุล</label>
                            <input
                                type="text"
                                defaultValue="เงินสั่งได้"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่เฉพาะนามสกุล</span>
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">อีเมล</label>
                            <input
                                type="email"
                                defaultValue="XXX_SOMYING@gmail.com"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่อีเมล</span>
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">เบอร์โทร</label>
                            <input
                                type="tel"
                                defaultValue="000-000-0000"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">เบอร์โทร</span>
                        </div>

                        {/* Position */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ตำแหน่ง</label>
                            <input
                                type="text"
                                defaultValue="จักษุแพทย์"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">กรุณาใส่ตำแหน่ง</span>
                        </div>

                        {/* Gender */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">เพศกำเนิด</label>
                            <div className="flex items-center gap-6 h-[44px]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="gender" value="male" className="w-[18px] h-[18px] text-[#3B82F6] border-gray-300 dark:border-gray-600 focus:ring-[#3B82F6]" />
                                    <span className="text-[14px] text-[#374151] dark:text-gray-300">ชาย</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="gender" value="female" defaultChecked className="w-[18px] h-[18px] text-[#3B82F6] border-gray-300 dark:border-gray-600 focus:ring-[#3B82F6]" />
                                    <span className="text-[14px] text-[#374151] dark:text-gray-300">หญิง</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section: Login Info */}
                    <h2 className="text-[20px] font-bold text-[#111827] dark:text-white mb-6">ข้อมูลการเข้าสู่ระบบ</h2>
                    <div className="grid grid-cols-2 gap-6 mb-10">
                        {/* Username */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ชื่อผู้ใช้</label>
                            <input
                                type="text"
                                defaultValue="Somying1234"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">ใส่ชื่อผู้ใช้</span>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">รหัสผ่าน</label>
                            <input
                                type="password"
                                defaultValue="********"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">ใส่รหัสผ่าน</span>
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">ยืนยันรหัสผ่าน</label>
                            <input
                                type="password"
                                defaultValue="********"
                                placeholder="Label Placeholder"
                                className="h-[44px] px-4 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-white text-[14px] outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <span className="text-[12px] text-[#9CA3AF] dark:text-gray-500">ใส่รหัสผ่านอีกครั้ง</span>
                        </div>

                        {/* Access Level */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-medium text-[#374151] dark:text-gray-300">การเข้าถึง</label>
                            <div className="flex items-center gap-6 h-[44px]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="access" value="bloodlink" defaultChecked className="w-[18px] h-[18px] text-[#3B82F6] border-gray-300 dark:border-gray-600 focus:ring-[#3B82F6]" />
                                    <span className="text-[14px] text-[#374151] dark:text-gray-300">เฉพาะ Bloodlink</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="access" value="all" className="w-[18px] h-[18px] text-[#3B82F6] border-gray-300 dark:border-gray-600 focus:ring-[#3B82F6]" />
                                    <span className="text-[14px] text-[#374151] dark:text-gray-300">ทั้งหมด</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href={`/admin/doctors/${id}`}
                            className="px-6 py-2.5 text-[#6B7280] dark:text-gray-400 text-[16px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-[8px] transition-colors"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            onClick={() => {
                                toast.success('บันทึกข้อมูลเรียบร้อย');
                                router.push(`/admin/doctors/${id}`);
                            }}
                            className="px-8 py-2.5 bg-[#3B82F6] text-white text-[16px] font-medium rounded-[8px] shadow-[0_2px_4px_rgba(59,130,246,0.2)] hover:bg-[#2563EB] transition-colors"
                        >
                            ยืนยัน
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
