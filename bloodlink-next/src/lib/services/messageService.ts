
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name?: string;
    sender_email?: string;
    receiver_name?: string;
    receiver_email?: string;
    subject: string;
    content: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export class MessageService {
    // Get messages for a specific user (sent and received) + Admin Inbox
    static async getMessages(userId: string): Promise<{ messages: Message[]; error?: string }> {
        try {
            // 1. Fetch from 'messages' table
            const messagesPromise = supabaseAdmin
                .from('messages')
                .select(`
                    *,
                    sender:sender_id (
                        name,
                        surname,
                        email
                    ),
                    receiver:receiver_id (
                        name,
                        surname,
                        email
                    )
                `)
                .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            // 2. Fetch from 'admin_inbox' table (Safely)
            const adminInboxPromise = supabaseAdmin
                .from('admin_inbox')
                .select('*')
                .order('created_at', { ascending: false });

            const [messagesResult, adminResult] = await Promise.allSettled([messagesPromise, adminInboxPromise]);

            // Handle Messages Result
            let messagesData: any[] = [];
            if (messagesResult.status === 'fulfilled') {
                if (messagesResult.value.error) {
                    console.error('Error fetching main messages:', messagesResult.value.error);
                    // Decide if this is fatal. Usually yes for main messages.
                    throw messagesResult.value.error;
                }
                messagesData = messagesResult.value.data || [];
            } else {
                console.error('Promise rejected for messages:', messagesResult.reason);
                throw new Error('Failed to execute messages query');
            }

            // Handle Admin Inbox Result (Non-fatal)
            let adminData: any[] = [];
            if (adminResult.status === 'fulfilled') {
                if (adminResult.value.error) {
                    console.warn('Admin inbox fetch error (ignoring):', adminResult.value.error.message);
                } else {
                    adminData = adminResult.value.data || [];
                }
            } else {
                console.warn('Promise rejected for admin_inbox (ignoring):', adminResult.reason);
            }

            // Map 'messages'
            const mappedMessages = messagesData.map(msg => ({
                ...msg,
                sender_name: msg.sender ? `${msg.sender.name} ${msg.sender.surname}` : 'System',
                sender_email: msg.sender?.email,
                receiver_name: msg.receiver ? `${msg.receiver.name} ${msg.receiver.surname}` : 'Unknown',
                receiver_email: msg.receiver?.email
            }));

            // Map 'admin_inbox'
            const mappedAdminMessages = adminData.map(item => ({
                id: item.id,
                sender_id: 'system_external', // Placeholder
                receiver_id: userId,
                sender_name: item.sender_name || 'System',
                sender_email: item.sender_email,
                receiver_name: 'Admin',
                receiver_email: '',
                subject: item.subject,
                content: item.message, // Mapped from 'message' column
                type: item.type,
                is_read: item.is_read,
                created_at: item.created_at
            } as Message));

            // Combine and Sort
            const allMessages = [...mappedMessages, ...mappedAdminMessages].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return { messages: allMessages };
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            return { messages: [], error: error.message };
        }
    }

    // Send a message
    static async sendMessage(
        senderId: string,
        receiverId: string,
        content: string,
        subject: string = '',
        type: string = 'message'
    ): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`MessageService.sendMessage: From ${senderId} to ${receiverId}, using Admin Client? ${!!supabaseAdmin}`);

            const { error } = await supabaseAdmin
                .from('messages')
                .insert([{
                    sender_id: senderId === 'system' ? null : senderId,
                    receiver_id: receiverId,
                    content,
                    subject,
                    type,
                    is_read: false
                }]);

            if (error) {
                console.error('MessageService.sendMessage Error:', error);
                throw error;
            }
            console.log('MessageService.sendMessage: Success');
            return { success: true };
        } catch (error: any) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }

    // Mark message as read (tries both tables)
    static async markAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Try 'messages' table first
            const { data, error } = await supabaseAdmin
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                return { success: true };
            }

            // If not found in 'messages', try 'admin_inbox'
            const { error: adminError } = await supabaseAdmin
                .from('admin_inbox')
                .update({ is_read: true })
                .eq('id', messageId);

            if (adminError) throw adminError;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // Mark message as unread
    static async markAsUnread(messageId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Try 'messages' table first
            const { data, error } = await supabaseAdmin
                .from('messages')
                .update({ is_read: false })
                .eq('id', messageId)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                return { success: true };
            }

            // If not found in 'messages', try 'admin_inbox'
            const { error: adminError } = await supabaseAdmin
                .from('admin_inbox')
                .update({ is_read: false })
                .eq('id', messageId);

            if (adminError) throw adminError;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // Delete message
    static async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabaseAdmin
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // Get unread count
    static async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabaseAdmin
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            return 0;
        }
    }
}
