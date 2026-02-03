'use client';

import { Header } from '@/components/layout/Header';

import { InboxView } from '@/components/features/inbox/InboxView';

export default function AdminInboxPage() {
    return (
        <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
            <Header hideSearch={true} />
            <main className="flex-1 overflow-hidden p-4 pt-0">
                <InboxView role="admin" title="Inbox (Admin)" />
            </main>
        </div>
    );
}
