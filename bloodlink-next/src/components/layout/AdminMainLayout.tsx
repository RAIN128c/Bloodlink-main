'use client';

import { AdminSidebar } from './AdminSidebar';

interface AdminMainLayoutProps {
    children: React.ReactNode;
}

export function AdminMainLayout({ children }: AdminMainLayoutProps) {
    return (
        <div className="flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 md:ml-[195px] transition-all duration-300 h-screen overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#0f1115] px-2 sm:p-4 pt-0 transition-colors">
                    {children}
                </main>
            </div>
        </div>
    );
}

