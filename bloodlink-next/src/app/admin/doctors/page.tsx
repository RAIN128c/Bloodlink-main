'use client';

import { Header } from '@/components/layout/Header';

import { Users, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface User {
    userId: string;
    email: string;
    name: string;
    surname: string;
    role: string;
    position?: string;
    status?: string;
    avatarUrl?: string;
}

export default function AdminDoctorsPage() {
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                // Fetch ALL users for management
                const res = await fetch('/api/admin/users');
                if (res.ok) {
                    const data = await res.json();
                    setDoctors(data);
                }
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doc =>
        (doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (doc.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (doc.role?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (doc.position?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full px-4 sm:px-6 lg:px-8">
            <Header hideSearch={true} />

            <div className="flex flex-col gap-6 pb-6 mt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-[20px] sm:text-[24px] font-bold text-[#111827] dark:text-white">จัดการบุคลากร/ผู้ใช้ (Staff Management)</h1>
                    <div className="relative w-full sm:w-[300px]">
                        <input
                            type="text"
                            placeholder="ค้นหารายชื่อ/ตำแหน่ง"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-[44px] pl-4 pr-10 rounded-[8px] border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-[#1F2937] text-[14px] text-[#374151] dark:text-white outline-none focus:border-[#6366F1] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-gray-500 w-5 h-5 pointer-events-none" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">ไม่พบข้อมูลบุคลากร</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredDoctors.map((doc, i) => (
                            <div key={i} className="bg-white dark:bg-[#1F2937] rounded-[16px] p-6 sm:p-8 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 flex flex-col items-center gap-4 transition-colors">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${doc.avatarUrl ? 'bg-transparent' : 'bg-[#E0E7FF] dark:bg-indigo-900/50'}`}>
                                    {doc.avatarUrl ? (
                                        <img src={doc.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-[#4F46E5] dark:text-indigo-300 text-[20px] sm:text-[24px] font-bold">
                                            {(doc.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[16px] font-semibold text-[#374151] dark:text-white text-center break-words w-full px-2">
                                    {doc.name} {doc.surname}
                                </div>
                                <div className="flex gap-2 items-center flex-wrap justify-center w-full">
                                    <span className="px-3 py-1 rounded-[4px] text-[12px] font-medium bg-[#67E8F9] dark:bg-cyan-900/50 text-[#0E7490] dark:text-cyan-300 truncate max-w-[120px]">
                                        {doc.position || doc.role || 'เจ้าหน้าที่'}
                                    </span>
                                    <Link href={`/admin/doctors/${doc.userId}`} className="px-3 py-1 rounded-[4px] text-[12px] font-medium bg-[#E5E7EB] dark:bg-gray-700 text-[#374151] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">
                                        โปรไฟล์
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
