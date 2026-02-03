'use client';

import { Header } from '@/components/layout/Header';

import {
    Archive,
    Trash2,
    Clock,
    Reply,
    ArrowLeft,
    MoreVertical,
    User,
    Loader2,
    Mail,
    Bell,
    MessageSquare,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatDateTimeThai } from '@/lib/utils';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface InboxMessage {
    id: string;
    type: string;
    sender_email: string | null;
    sender_name: string | null;
    subject: string;
    message: string | null;
    tags: string[] | null;
    is_read: boolean;
    created_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'patient_feedback': <MessageSquare className="w-5 h-5" />,
    'registration': <UserPlus className="w-5 h-5" />,
    'notification': <Bell className="w-5 h-5" />,
    'staff_message': <Mail className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
    'patient_feedback': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'registration': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'notification': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'staff_message': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const TYPE_LABELS: Record<string, string> = {
    'patient_feedback': 'Feedback จากผู้ป่วย',
    'registration': 'คำขอลงทะเบียน',
    'notification': 'การแจ้งเตือนระบบ',
    'staff_message': 'ข้อความจากพนักงาน',
};

export default function InboxDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [message, setMessage] = useState<InboxMessage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
    }>({
        isOpen: false,
        title: '',
        description: '',
        action: async () => { }
    });

    useEffect(() => {
        async function fetchMessage() {
            try {
                const response = await fetch('/api/admin/inbox');
                if (response.ok) {
                    const data = await response.json();
                    const found = data.messages?.find((m: InboxMessage) => m.id === params.id);
                    if (found) {
                        setMessage(found);
                        // Mark as read
                        if (!found.is_read) {
                            fetch('/api/admin/inbox', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: found.id, is_read: true })
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch message:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchMessage();
    }, [params.id]);

    const handleDelete = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบข้อความ',
            description: 'ต้องการลบข้อความนี้ใช่หรือไม่?',
            action: async () => {
                setIsDeleting(true);
                // TODO: Implement delete API
                // await fetch(`/api/admin/inbox/${params.id}`, { method: 'DELETE' });
                // await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
                router.push('/admin/inbox');
                setIsDeleting(false);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!message) {
        return (
            <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">ไม่พบข้อความ</p>
                    <Link href="/admin/inbox" className="text-indigo-600 hover:underline">กลับไปยัง Inbox</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} isAdminPage={true} />

            <div className="flex flex-col gap-4 pb-6 h-full">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/inbox" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </Link>
                        <h1 className="text-[24px] font-bold text-[#111827] dark:text-gray-100">Inbox</h1>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[12px] font-medium ${TYPE_COLORS[message.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[message.type] || message.type}
                    </div>
                </div>

                {/* Main Message Card */}
                <div className="bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm flex flex-col flex-1 overflow-hidden transition-colors">

                    {/* Toolbar */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                                <Archive className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                                <Clock className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                                <Reply className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Message Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {/* Sender Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${TYPE_COLORS[message.type] || 'bg-gray-100'}`}>
                                    {TYPE_ICONS[message.type] || <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h2 className="text-[16px] font-bold text-[#111827] dark:text-white">
                                        {message.sender_name || 'ระบบ'}
                                    </h2>
                                    <div className="text-[14px] font-medium text-[#374151] dark:text-gray-300 mb-0.5">
                                        {message.subject}
                                    </div>
                                    {message.sender_email && (
                                        <div className="text-[12px] text-gray-400">{message.sender_email}</div>
                                    )}
                                </div>
                            </div>
                            <div className="text-[12px] text-gray-400">
                                {formatDateTimeThai(message.created_at)}
                            </div>
                        </div>

                        {/* Tags */}
                        {message.tags && message.tags.length > 0 && (
                            <div className="flex gap-2 mb-6">
                                {message.tags.map((tag, i) => (
                                    <span key={i} className="bg-[#F3F4F6] dark:bg-gray-700 text-[#374151] dark:text-gray-300 text-[12px] px-3 py-1 rounded-full font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Body */}
                        <div className="text-[14px] text-[#374151] dark:text-gray-300 leading-relaxed space-y-4 max-w-[800px]">
                            {message.message ? (
                                message.message.split('\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">ไม่มีเนื้อหา</p>
                            )}
                        </div>
                    </div>

                    {/* Reply Section */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#111827]/50">
                        <div className="bg-white dark:bg-[#1F2937] rounded-[12px] border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`ตอบกลับ ${message.sender_name || 'ข้อความนี้'}...`}
                                className="w-full p-4 min-h-[100px] resize-none outline-none text-[14px] text-[#374151] dark:text-gray-200 bg-transparent placeholder-gray-400"
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <button className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2 rounded-[8px] transition-colors font-medium">
                                <Reply className="w-4 h-4" />
                                ส่ง
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.action}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText="ยืนยัน"
                cancelText="ยกเลิก"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
