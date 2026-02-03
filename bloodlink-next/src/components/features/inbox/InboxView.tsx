'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Message } from '@/lib/services/messageService';
import { ComposeMessageModal } from '@/components/modals/ComposeMessageModal';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
    Mail, Search, Send, AlertCircle, RefreshCw, MessageSquare, Bell, User,
    ChevronLeft, ChevronRight, Trash2, Reply, MailOpen, Clock, Inbox, ArrowUpRight, CheckSquare, Square,
    Check
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { useInbox } from '@/components/providers/InboxContext';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface InboxViewProps {
    role?: string;
    title?: string;
}

// Skeleton Loader Component
function MessageSkeleton() {
    return (
        <div className="p-4 animate-pulse">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    );
}

export function InboxView({ role = 'user', title = 'กล่องข้อความ' }: InboxViewProps) {
    // Helper to make URLs clickable
    const linkify = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)|(\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part?.match(/^https?:\/\//)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {part}
                    </a>
                );
            }
            // Handle internal links starting with /
            if (part?.match(/^\//)) {
                // Ensure it's not just a slash or part of text
                // Simple heuristic: if it looks like a path
                if (part.length > 1 && !part.includes(' ')) {
                    return (
                        <a key={i} href={part} className="text-blue-600 hover:underline">
                            {part}
                        </a>
                    );
                }
            }
            return part;
        });
    };

    const { refreshUnreadCount } = useInbox();
    const { data: session, status } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);

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

    // Pagination & Multi-select
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const ITEMS_PER_PAGE = 20;

    const userId = session?.user?.userId;

    useEffect(() => {
        if (status === 'loading') return;
        if (!userId) {
            setIsLoading(false);
            return;
        }

        fetchMessages();

        const channel = supabase
            .channel('unified_inbox')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`
                },
                () => fetchMessages()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, status]);

    const fetchMessages = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/messages');
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data: Message[] = await res.json();
            setMessages(data);

            if (selectedMessage) {
                const updated = data.find((m: Message) => m.id === selectedMessage.id);
                if (updated) setSelectedMessage(updated);
                else setSelectedMessage(null);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectMessage = async (message: Message) => {
        setSelectedMessage(message);
        if (!message.is_read) {
            try {
                await fetch(`/api/messages/${message.id}/read`, { method: 'PATCH' });
                setMessages(prev => prev.map(m =>
                    m.id === message.id ? { ...m, is_read: true } : m
                ));
                refreshUnreadCount();
            } catch (err) {
                console.error('Failed to mark read:', err);
            }
        }
    };

    const handleDelete = async (messageId: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบข้อความ',
            description: 'คุณต้องการลบข้อความนี้หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้',
            action: async () => {
                setIsDeleting(true);
                try {
                    const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
                    if (res.ok) {
                        setMessages(prev => prev.filter(m => m.id !== messageId));
                        if (selectedMessage?.id === messageId) {
                            setSelectedMessage(null);
                        }
                        refreshUnreadCount();
                    }
                } catch (err) {
                    console.error('Failed to delete:', err);
                } finally {
                    setIsDeleting(false);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleMarkAsUnread = async (messageId: string) => {
        try {
            await fetch(`/api/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: false })
            });
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, is_read: false } : m
            ));
            refreshUnreadCount();
        } catch (err) {
            console.error('Failed to mark unread:', err);
        }
    };

    const handleReply = (message: Message) => {
        setReplyTo(message);
        setIsComposeOpen(true);
    };

    // Filter counts
    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = { all: messages.length };
        messages.forEach(m => {
            counts[m.type] = (counts[m.type] || 0) + 1;
        });
        // Add sent count
        counts.sent = messages.filter(m => m.sender_id === userId).length;
        return counts;
    }, [messages, userId]);

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const term = searchQuery.toLowerCase();
            const matchesSearch =
                msg.subject?.toLowerCase().includes(term) ||
                msg.content.toLowerCase().includes(term) ||
                msg.sender_name?.toLowerCase().includes(term) ||
                msg.receiver_name?.toLowerCase().includes(term);

            if (filterType === 'sent') {
                return matchesSearch && msg.sender_id === userId;
            }

            const matchesType = filterType === 'all' || msg.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [messages, searchQuery, filterType, userId]);

    // Pagination
    const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
    const paginatedMessages = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredMessages.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMessages, currentPage]);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [filterType, searchQuery]);

    // Multi-select handlers
    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === paginatedMessages.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedMessages.map(m => m.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setConfirmConfig({
            isOpen: true,
            title: 'ยืนยันการลบแบบกลุ่ม',
            description: `ต้องการลบ ${selectedIds.size} ข้อความที่เลือกหรือไม่?`,
            action: async () => {
                setIsDeleting(true);
                try {
                    await Promise.all(
                        Array.from(selectedIds).map(id =>
                            fetch(`/api/messages/${id}`, { method: 'DELETE' })
                        )
                    );
                    setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
                    setSelectedIds(new Set());
                    setSelectedMessage(null);
                    refreshUnreadCount();
                } catch (err) {
                    console.error('Bulk delete error:', err);
                } finally {
                    setIsDeleting(false);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteAllRead = async () => {
        const readMessages = messages.filter(m => m.is_read);
        if (readMessages.length === 0) return;

        setConfirmConfig({
            isOpen: true,
            title: 'ลบข้อความที่อ่านแล้ว',
            description: `ต้องการลบ ${readMessages.length} ข้อความที่อ่านแล้วทั้งหมดหรือไม่?`,
            action: async () => {
                setIsDeleting(true);
                try {
                    await Promise.all(
                        readMessages.map(m =>
                            fetch(`/api/messages/${m.id}`, { method: 'DELETE' })
                        )
                    );
                    setMessages(prev => prev.filter(m => !m.is_read));
                    setSelectedIds(new Set());
                    setSelectedMessage(null);
                    refreshUnreadCount();
                } catch (err) {
                    console.error('Delete all read error:', err);
                } finally {
                    setIsDeleting(false);
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const getTypeIcon = (type: string) => {
        const iconClass = "w-4 h-4";
        switch (type) {
            case 'alert': return <AlertCircle className={`${iconClass} text-red-500`} />;
            case 'system':
            case 'system_update': return <RefreshCw className={`${iconClass} text-orange-500`} />;
            case 'notification': return <Bell className={`${iconClass} text-blue-500`} />;
            case 'patient_feedback': return <MessageSquare className={`${iconClass} text-green-500`} />;
            case 'staff_message': return <MessageSquare className={`${iconClass} text-purple-500`} />;
            default: return <MessageSquare className={`${iconClass} text-indigo-500`} />;
        }
    };

    const getBadge = (type: string) => {
        const baseClass = "text-[10px] px-2 py-0.5 rounded-full font-medium";
        switch (type) {
            case 'alert':
                return <span className={`${baseClass} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`}>ด่วน</span>;
            case 'system_update':
                return <span className={`${baseClass} bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400`}>อัพเดทระบบ</span>;
            case 'patient_feedback':
                return <span className={`${baseClass} bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`}>Feedback</span>;
            default:
                return null;
        }
    };

    const getDisplayInfo = (msg: Message) => {
        if (msg.type === 'system_update') {
            return { isOwner: false, displayName: 'System' };
        }
        const isOwner = msg.sender_id === userId;
        return {
            isOwner,
            displayName: isOwner ? `ถึง: ${msg.receiver_name || 'Unknown'}` : (msg.sender_name || 'System')
        };
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500',
            'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    return (
        <div className="flex-1 overflow-hidden flex gap-4 h-full">
            {/* Left Sidebar: Message List */}
            <div className={`w-full md:w-[380px] bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                <Inbox className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {filterCounts.all} ข้อความ • {messages.filter(m => !m.is_read).length} ยังไม่อ่าน
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setReplyTo(null); setIsComposeOpen(true); }}
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
                            title="เขียนข้อความใหม่"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาข้อความ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 dark:text-white shadow-sm"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2 text-xs overflow-x-auto pb-1 hide-scrollbar">
                        {[
                            { key: 'all', label: 'ทั้งหมด', color: 'gray' },
                            { key: 'message', label: 'ข้อความ', color: 'indigo' },
                            { key: 'sent', label: 'ส่งแล้ว', color: 'blue' },
                            { key: 'alert', label: 'ด่วน', color: 'red' },
                            { key: 'system_update', label: 'ระบบ', color: 'orange' },
                        ].map(filter => (
                            <button
                                key={filter.key}
                                onClick={() => setFilterType(filter.key)}
                                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${filterType === filter.key
                                    ? `bg-${filter.color}-500 text-white shadow-sm`
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {filter.label}
                                {filterCounts[filter.key] > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterType === filter.key
                                        ? 'bg-white/20'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                        }`}>
                                        {filterCounts[filter.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bulk Action Bar */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title={selectedIds.size === paginatedMessages.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมดในหน้านี้'}
                        >
                            {selectedIds.size === paginatedMessages.length && paginatedMessages.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {selectedIds.size > 0 && (
                            <span className="text-xs text-gray-500">เลือกแล้ว {selectedIds.size} รายการ</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="px-2.5 py-1 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                ลบที่เลือก
                            </button>
                        )}
                        <button
                            onClick={handleDeleteAllRead}
                            disabled={isDeleting || messages.filter(m => m.is_read).length === 0}
                            className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            <MailOpen className="w-3 h-3" />
                            ลบที่อ่านแล้ว
                        </button>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[1, 2, 3, 4, 5].map(i => <MessageSkeleton key={i} />)}
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-1">ไม่มีข้อความ</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                                {filterType !== 'all' ? 'ลองเปลี่ยนตัวกรองหรือค้นหาใหม่' : 'กล่องข้อความของคุณว่างเปล่า'}
                            </p>
                            <button
                                onClick={() => { setReplyTo(null); setIsComposeOpen(true); }}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                เขียนข้อความใหม่
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedMessages.map((msg) => {
                                const { isOwner, displayName } = getDisplayInfo(msg);
                                const isSelected = selectedIds.has(msg.id);
                                return (
                                    <div
                                        key={msg.id}
                                        className={`w-full p-4 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 group relative flex items-center gap-2 ${selectedMessage?.id === msg.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500' : ''
                                            } ${!msg.is_read ? 'bg-white dark:bg-[#1F2937]' : 'bg-gray-50/30 dark:bg-gray-900/10'}`}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={(e) => handleToggleSelect(msg.id, e)}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>

                                        {/* Message Content (Clickable) */}
                                        <button
                                            onClick={() => handleSelectMessage(msg)}
                                            className="flex-1 text-left flex gap-3 min-w-0"
                                        >
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-medium ${msg.type === 'system_update'
                                                ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                                : getAvatarColor(displayName)
                                                }`}>
                                                {msg.type === 'system_update' ? (
                                                    <RefreshCw className="w-5 h-5" />
                                                ) : (
                                                    displayName.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className={`text-sm truncate max-w-[150px] ${!msg.is_read ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {displayName}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: false, locale: th })}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 mb-1">
                                                    {getBadge(msg.type)}
                                                    {isOwner && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-0.5">
                                                            <ArrowUpRight className="w-3 h-3" />ส่ง
                                                        </span>
                                                    )}
                                                    <h3 className={`text-sm truncate ${!msg.is_read ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {msg.subject || '(ไม่มีหัวข้อ)'}
                                                    </h3>
                                                </div>

                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 bg-white dark:bg-[#1F2937]">
                        <span className="text-xs text-gray-500 whitespace-nowrap order-2 sm:order-1">
                            หน้า {currentPage} / {totalPages} <span className="hidden sm:inline">({filteredMessages.length} ข้อความ)</span>
                        </span>
                        <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Content: Message Detail */}
            <div className={`flex-1 bg-white dark:bg-[#1F2937] rounded-[20px] shadow-sm flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden ${!selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                {selectedMessage ? (
                    <>
                        {/* Detail Header */}
                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-[#1F2937]">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-medium ${selectedMessage.type === 'system_update'
                                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                        : getAvatarColor(getDisplayInfo(selectedMessage).displayName)
                                        }`}>
                                        {selectedMessage.type === 'system_update' ? (
                                            <RefreshCw className="w-6 h-6" />
                                        ) : (
                                            <User className="w-6 h-6" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            {getBadge(selectedMessage.type)}
                                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedMessage.subject || '(ไม่มีหัวข้อ)'}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                            <span>
                                                {selectedMessage.sender_id === userId ? 'ถึง:' : 'จาก:'}{' '}
                                                <strong className="text-gray-700 dark:text-gray-300">
                                                    {selectedMessage.type === 'system_update'
                                                        ? 'System'
                                                        : (selectedMessage.sender_id === userId
                                                            ? selectedMessage.receiver_name
                                                            : (selectedMessage.sender_name || 'System'))}
                                                </strong>
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {format(new Date(selectedMessage.created_at), 'dd MMM yyyy, HH:mm', { locale: th })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
                                    {linkify(selectedMessage.content)}
                                </p>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {selectedMessage.sender_id !== userId && selectedMessage.type !== 'system_update' && (
                                        <button
                                            onClick={() => handleReply(selectedMessage)}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Reply className="w-4 h-4" />
                                            ตอบกลับ
                                        </button>
                                    )}

                                    {selectedMessage.is_read && (
                                        <button
                                            onClick={() => handleMarkAsUnread(selectedMessage.id)}
                                            className="px-3 py-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-600"
                                        >
                                            <MailOpen className="w-4 h-4" />
                                            <span className="hidden sm:inline">ทำเครื่องหมายยังไม่อ่าน</span>
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    disabled={isDeleting}
                                    className="px-3 py-2 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">ลบ</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">เลือกข้อความ</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                            คลิกที่ข้อความทางด้านซ้ายเพื่ออ่านรายละเอียด
                        </p>
                    </div>
                )}
            </div>

            <ComposeMessageModal
                isOpen={isComposeOpen}
                onClose={() => { setIsComposeOpen(false); setReplyTo(null); }}
                onMessageSent={() => {
                    fetchMessages();
                    setIsComposeOpen(false);
                    setReplyTo(null);
                }}
                currentUserId={userId || ''}
                currentUserRole={role}
            />

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
