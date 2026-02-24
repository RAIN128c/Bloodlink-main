'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSession, SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';
import { useNotifications } from '@/components/providers/NotificationContext';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { supabase } from '@/lib/supabase';

interface InboxContextType {
    unreadCount: number;
    messages: any[];
    refreshUnreadCount: () => Promise<void>;
}

const InboxContext = createContext<InboxContextType | null>(null);

export function useInbox() {
    const context = useContext(InboxContext);
    if (!context) {
        throw new Error('useInbox must be used within InboxProvider');
    }
    return context;
}

export function InboxProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<any[]>([]);
    const { notify } = useNotifications();
    const userId = (session?.user as any)?.userId;
    const previousCountRef = useRef(0);
    const isFirstLoadRef = useRef(true);

    const triggerPopup = useCallback((message: any) => {
        // Only show popup for system notifications, NOT for direct messages
        const messageType = message.type || 'message';
        if (messageType === 'message' || messageType === 'direct') {
            console.log('[InboxContext] Skipping popup for direct message:', messageType);
            return; // Don't show popup for direct messages - user will see unread count
        }

        let type: NotificationType = 'success';
        const subject = message.subject || '';
        const content = message.content || '';

        // Map status/content to notification type
        if (subject.includes('นัดหมาย') || content.includes('นัดหมาย')) {
            type = 'time'; // Clock
        } else if (subject.includes('รอแล็บรับเรื่อง') || content.includes('รอแล็บรับเรื่อง') || subject.includes('เจาะเลือด')) {
            type = 'time'; // Clock (Lab Queue / Blood Test)
        } else if (subject.includes('กำลังตรวจ') || content.includes('กำลังตรวจ')) {
            type = 'time'; // Clock (Checking)
        } else if (subject.includes('ส่งผลเลือดสำเร็จ') || content.includes('ส่งผลเลือดสำเร็จ')) {
            type = 'sentSuccess'; // Check Circle (Green)
        } else if (subject.includes('ผลเลือดออก') || content.includes('ผลเลือดออก')) {
            type = 'resultReady'; // Check Circle (Green)
        } else if (subject.includes('เสร็จสิ้น') || content.includes('เสร็จสิ้น')) {
            type = 'resultReady';
        }

        // Extract URL from content if present, or determine route from keywords
        let finalTargetPath = '/inbox';
        const resultUrlMatch = content.match(/(\/results\/[a-zA-Z0-9-]+)/);
        const historyUrlMatch = content.match(/(\/history\/[a-zA-Z0-9-]+)/);
        const hnMatch = content.match(/HN[:\s]*([a-zA-Z0-9-]+)/i) || subject.match(/HN[:\s]*([a-zA-Z0-9-]+)/i);

        if (resultUrlMatch) {
            finalTargetPath = resultUrlMatch[1];
        } else if (historyUrlMatch) {
            finalTargetPath = historyUrlMatch[1];
        } else if (subject.includes('คิวงาน') || subject.includes('Lab') || content.includes('ส่งตรวจ') || content.includes('รอแล็บ')) {
            finalTargetPath = '/lab/queue';
        } else if ((subject.includes('ผลเลือด') || subject.includes('ผลตรวจ')) && hnMatch) {
            finalTargetPath = `/test-status/${hnMatch[1]}`;
        }

        notify(
            type,
            subject || 'แจ้งเตือนระบบ',
            content || 'คุณมีการแจ้งเตือนใหม่',
            finalTargetPath
        );
    }, [notify]);

    const refreshUnreadCount = useCallback(async () => {
        if (!session?.user) return;
        try {
            // Add cache busting timestamp
            const response = await fetch(`/api/messages?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                const messages = Array.isArray(data) ? data : [];
                const unreadMessages = messages.filter((m: any) => !m.is_read);
                const newCount = unreadMessages.length;

                // We no longer trigger popups here because Supabase Realtime handles it directly.
                if (isFirstLoadRef.current) {
                    isFirstLoadRef.current = false;
                }

                previousCountRef.current = newCount;
                setUnreadCount(newCount);
                setMessages(messages);
            }
        } catch (error) {
            console.error('Failed to update inbox count:', error);
        }
    }, [session, triggerPopup]);

    // Fetch on mount and session change
    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    // Remove aggressive 2-second polling to save Supabase REST / Auth requests.
    // Realtime channel logic below will now handle updates exclusively.

    // Supabase Realtime subscription for instant notifications
    useEffect(() => {
        if (!userId) return;

        console.log('Setting up Supabase Realtime subscription for user:', userId);

        const channel = supabase
            .channel('inbox-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`
                },
                (payload) => {
                    console.log('New message received:', payload);
                    const newMessage = payload.new as any;

                    // Refresh count
                    refreshUnreadCount();

                    // Trigger popup notification
                    triggerPopup(newMessage);
                }
            )
            .subscribe((status) => {
                console.log('Supabase Realtime subscription status:', status);
            });

        return () => {
            console.log('Cleaning up Supabase Realtime subscription');
            supabase.removeChannel(channel);
        };
    }, [userId, refreshUnreadCount, triggerPopup]); // removed notify from deps as triggerPopup uses it

    return (
        <InboxContext.Provider value={{ unreadCount, messages, refreshUnreadCount }}>
            {children}
        </InboxContext.Provider>
    );
}
