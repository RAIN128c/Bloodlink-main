'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { InboxView } from '@/components/features/inbox/InboxView';

export default function InboxPage() {
    return (
        <MainLayout>
            <div className="max-w-[1200px] w-full mx-auto flex flex-col h-full">
                <Header hideSearch={true} />
                <div className="flex-1 overflow-hidden pb-4">
                    <InboxView role="user" title="กล่องข้อความ" />
                </div>
            </div>
        </MainLayout>
    );
}
