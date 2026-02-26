'use client';

import { formatDisplayId } from '@/lib/utils';
import { User, Edit2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export interface UserProfile {
    userId: string;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    position: string; // แพทย์, พยาบาล, เจ้าหน้าที่แลป
    role: string; // admin, user
    bio?: string;
    avatarUrl?: string;
    professionalId?: string;
    staffNumber?: string;
    status?: string;
}

interface ProfileCardProps {
    user: UserProfile;
    showEditButton?: boolean;
    editPath?: string;
    compact?: boolean; // For smaller display (dropdown)
}

export function ProfileCard({ user, showEditButton = false, editPath, compact = false }: ProfileCardProps) {
    if (compact) {
        // Compact version for dropdown
        return (
            <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-[#E5E7EB] dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-[#9CA3AF] dark:text-gray-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#111827] dark:text-white truncate">
                        {user.name} {user.surname}
                    </div>
                    <div className="text-[12px] text-[#6B7280] dark:text-gray-400 truncate">
                        {user.position}
                    </div>
                </div>
            </div>
        );
    }

    // Full profile card
    return (
        <div className="bg-white dark:bg-[#111827] rounded-[24px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row transition-all hover:shadow-md">
            {/* Left: Avatar Banner & Pic */}
            <div className="md:w-[320px] relative flex flex-col items-center p-8 bg-gradient-to-b from-indigo-50/50 to-white dark:from-[#1F2937] dark:to-[#111827] border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 dark:opacity-20 rounded-t-[24px] md:rounded-tr-none md:rounded-l-[24px]"></div>

                <div className="w-[140px] h-[140px] rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl relative z-10 mb-4 transition-transform hover:scale-105">
                    {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={140} height={140} priority className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-[60px] h-[60px] text-gray-300 dark:text-gray-500" />
                    )}
                </div>

                <div className="flex flex-col items-center gap-1 z-10 relative mt-2">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                        {user.role}
                    </span>
                    <span className="text-[14px] font-mono font-medium text-gray-500 dark:text-gray-400 mt-2">
                        ID: {formatDisplayId(user.staffNumber || user.userId, user.role)}
                    </span>
                </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 flex flex-col p-8 sm:p-10 justify-center">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[32px] sm:text-[36px] font-bold text-gray-900 dark:text-white leading-tight">
                            {user.name} {user.surname}
                        </h1>
                        <p className="text-[18px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">{user.position || 'เจ้าหน้าที่'}</p>
                    </div>

                    {showEditButton && editPath && (
                        <Link
                            href={editPath}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex-shrink-0"
                        >
                            <Edit2 className="w-4 h-4" />
                            แก้ไขโปรไฟล์
                        </Link>
                    )}
                </div>

                {user.bio ? (
                    <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed italic">
                            &quot;{user.bio}&quot;
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 mb-2"></div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                    {user.phone && (
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</span>
                            <span className="text-[15px] text-gray-800 dark:text-gray-200 font-medium">{user.phone}</span>
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">อีเมลติดต่อ</span>
                        <span className="text-[15px] text-gray-800 dark:text-gray-200 font-medium">{user.email}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">เลขใบประกอบวิชาชีพ / รหัสพนักงาน</span>
                        <span className={`text-[15px] font-medium ${user.professionalId ? 'text-gray-800 dark:text-gray-200' : 'text-red-500'}`}>
                            {user.professionalId || 'ไม่ได้ระบุ'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
