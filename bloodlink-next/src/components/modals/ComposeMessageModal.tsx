'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { CurrentUser } from '@/components/profile/ProfileDropdown';

interface ComposeMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMessageSent: () => void;
    currentUserId: string;
    currentUserRole?: string;
}

interface User {
    userId: string;
    email: string;
    name: string;
    surname: string;
    role: string;
}

export function ComposeMessageModal({ isOpen, onClose, onMessageSent, currentUserId, currentUserRole }: ComposeMessageModalProps) {
    const [step, setStep] = useState<1 | 2>(1); // 1: Select User, 2: Write Message
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);

    // Message form
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [messageType, setMessageType] = useState<'message' | 'alert' | 'system_update'>('message');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchUsers();
        }
    }, [isOpen, step]);

    const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                // Filter out current user
                setUsers(data.filter((u: User) => u.userId !== currentUserId));
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSend = async () => {
        if (!selectedUser || !content.trim()) return;

        setIsSending(true);
        setError(null);

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: selectedUser.userId,
                    subject,
                    content,
                    type: messageType
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            onMessageSent();
            handleClose();
        } catch (err: any) {
            setError(err.message || 'ส่งข้อความไม่สำเร็จ');
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedUser(null);
        setSubject('');
        setContent('');
        setMessageType('message');
        setSearchQuery('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm font-[family-name:var(--font-kanit)] modal-backdrop">
            <div className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[600px] max-h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col modal-content">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-indigo-500" />
                        ส่งข้อความใหม่
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 ? (
                        /* Step 1: Select User */
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาผู้รับ (ชื่อ, นามสกุล, อีเมล)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                {isFetchingUsers ? (
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                        กำลังโหลดรายชื่อ...
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                                        ไม่พบรายชื่อ
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredUsers.map((user) => (
                                            <button
                                                key={user.userId}
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setStep(2);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${user.role === 'แพทย์' ? 'bg-blue-500' :
                                                    user.role === 'พยาบาล' ? 'bg-green-500' : 'bg-gray-500'
                                                    }`}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {user.name} {user.surname}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                            {user.role}
                                                        </span>
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Write Message */
                        <div className="space-y-4">
                            {/* Selected User Header */}
                            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${selectedUser?.role === 'แพทย์' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                        {selectedUser?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            ถึง: {selectedUser?.name} {selectedUser?.surname}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedUser?.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    เปลี่ยนผู้รับ
                                </button>
                            </div>

                            {/* Category/Tag Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ประเภทข้อความ (Tags)
                                </label>
                                <div className="flex gap-2 text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setMessageType('message')}
                                        className={`px-3 py-1.5 rounded-full border transition-all ${messageType === 'message'
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        ทั่วไป
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMessageType('alert')}
                                        className={`px-3 py-1.5 rounded-full border transition-all ${messageType === 'alert'
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        ด่วน/สำคัญ
                                    </button>
                                    {currentUserRole === 'admin' && (
                                        <button
                                            type="button"
                                            onClick={() => setMessageType('system_update')}
                                            className={`px-3 py-1.5 rounded-full border transition-all ${messageType === 'system_update'
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            อัพเดทระบบ
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    หัวข้อ (ไม่ระบุได้)
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="เช่น แจ้งเตือนผล Lab..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ข้อความ <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-[150px] px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="พิมพ์ข้อความ..."
                                    required
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        ยกเลิก
                    </button>
                    {step === 2 && (
                        <button
                            onClick={handleSend}
                            disabled={!content.trim() || isSending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    กำลังส่ง...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    ส่งข้อความ
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
