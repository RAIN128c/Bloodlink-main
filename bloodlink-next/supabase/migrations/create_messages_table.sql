-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for system messages to all? Or strict? Let's make it strict for user-to-user. For broadcast, we might need separate logic, but for now strict.
    subject TEXT,
    content TEXT,
    type TEXT DEFAULT 'message', -- 'message', 'alert', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster queries
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view messages sent to them
CREATE POLICY "Users can view received messages" ON messages
    FOR SELECT USING (auth.uid() = receiver_id);

-- Users can view messages they sent
CREATE POLICY "Users can view sent messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id);

-- Users can insert messages (sender_id must be themselves)
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update is_read status for their received messages
CREATE POLICY "Users can update read status" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);
