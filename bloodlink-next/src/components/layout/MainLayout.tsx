'use client';

import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function MainLayout({ children, className = "" }: MainLayoutProps) {
    return (
        <div className={`flex bg-[#F3F4F6] dark:bg-[#0f1115] min-h-screen font-[family-name:var(--font-kanit)] transition-colors ${className}`}>
            <Sidebar />
            <div className="ml-0 md:ml-[195px] flex-1 flex flex-col h-screen overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F3F4F6] dark:bg-[#0f1115] p-2 sm:p-3 md:p-4 pt-0 transition-colors">
                    {children}
                </main>
            </div>
        </div>
    );
}

