'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/providers/NotificationContext';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { supabase } from '@/lib/supabase';

interface InboxContextType {
    unreadCount: number;
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
        } else if (subject.includes('เจาะเลือด') || content.includes('เจาะเลือด')) {
            type = 'time'; // Clock
        } else if (subject.includes('กำลังตรวจ') || content.includes('กำลังตรวจ')) {
            type = 'time'; // Clock (Checking)
        } else if (subject.includes('ส่งผลเลือดสำเร็จ') || content.includes('ส่งผลเลือดสำเร็จ')) {
            type = 'sentSuccess'; // Check Circle (Green)
        } else if (subject.includes('ผลเลือดออก') || content.includes('ผลเลือดออก')) {
            type = 'resultReady'; // Check Circle (Green)
        } else if (subject.includes('เสร็จสิ้น') || content.includes('เสร็จสิ้น')) {
            type = 'resultReady';
        }

        // Extract URL from content if present
        let finalTargetPath = '/inbox';
        const urlMatch = content.match(/(\/results\/[a-zA-Z0-9-]+)/);
        if (urlMatch) {
            finalTargetPath = urlMatch[1];
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

                // Trigger logic
                if (!isFirstLoadRef.current) {
                    // If not first load, and count increased, trigger
                    if (newCount > previousCountRef.current) {
                        const latestMessage = unreadMessages[0];
                        if (latestMessage) {
                            triggerPopup(latestMessage);
                        }
                    }
                } else {
                    isFirstLoadRef.current = false;
                }

                previousCountRef.current = newCount;
                setUnreadCount(newCount);
            }
        } catch (error) {
            console.error('Failed to update inbox count:', error);
        }
    }, [session, triggerPopup]);

    // Fetch on mount and session change
    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    // Polling setup (2 seconds)
    useEffect(() => {
        if (!userId) return;
        const interval = setInterval(refreshUnreadCount, 2000);
        return () => clearInterval(interval);
    }, [userId, refreshUnreadCount]);

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
        <InboxContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </InboxContext.Provider>
    );
}
