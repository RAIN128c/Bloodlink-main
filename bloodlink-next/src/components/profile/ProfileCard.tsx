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
        <div className="bg-white dark:bg-[#1F2937] rounded-[16px] p-10 shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none border border-[#E5E7EB] dark:border-gray-700 flex gap-10 transition-colors">
            {/* Left: Avatar */}
            <div className="flex flex-col items-center gap-4 min-w-[200px] pr-10 border-r border-[#E5E7EB] dark:border-gray-700">
                <div className="w-[120px] h-[120px] rounded-full bg-[#E5E7EB] dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={120} height={120} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-[60px] h-[60px] text-[#374151] dark:text-gray-400" />
                    )}
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[14px] font-medium text-[#374151] dark:text-gray-300">
                        {formatDisplayId(user.userId, user.role)}
                    </span>
                </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="text-[24px] font-bold text-[#111827] dark:text-white">
                    {user.name} {user.surname}
                </div>
                <div className="text-[16px] text-[#9CA3AF] dark:text-gray-400">{user.position}</div>

                {user.bio && (
                    <div className="text-[14px] text-[#4B5563] dark:text-gray-300 leading-relaxed mt-2 mb-6">
                        {user.bio}
                    </div>
                )}

                <div className="text-[14px] text-[#4B5563] dark:text-gray-300 flex flex-col gap-1 mt-auto">
                    {user.phone && <div>{user.phone}</div>}
                    <div>{user.email}</div>
                </div>

                {showEditButton && editPath && (
                    <div className="flex justify-end mt-4">
                        <Link
                            href={editPath}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-[#E5E7EB] dark:border-gray-600 rounded-[8px] text-[#374151] dark:text-gray-200 text-[14px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            แก้ไขข้อมูล
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
