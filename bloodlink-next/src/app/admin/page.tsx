import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header';
import { AdminClient } from './AdminClient';
import { StatsService } from '@/lib/services/statsService';

export const metadata: Metadata = {
    title: 'จัดการระบบ',
}
import packageJson from '../../../package.json';

// Force dynamic rendering since we want fresh data on every load
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // Fetch stats directly on the server, bypassing the API route
    let initialStats = null;
    const initialSystemInfo: {
        dbStatus: 'checking' | 'connected' | 'error';
        lastUpdated: string;
        version: string;
    } = {
        dbStatus: 'checking',
        lastUpdated: '-',
        version: packageJson.version
    };

    try {
        initialStats = await StatsService.getDashboardStats();
        initialSystemInfo.dbStatus = 'connected';

        // Find latest activity time for the "last updated" field if possible
        if (initialStats && initialStats.loginHistory && initialStats.loginHistory.length > 0) {
            initialSystemInfo.lastUpdated = initialStats.loginHistory[0].time;
        } else {
            initialSystemInfo.lastUpdated = new Date().toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Failed to fetch initial admin stats on server:', error);
        initialSystemInfo.dbStatus = 'error';
    }

    return (
        <div className="w-full sm:max-w-[1200px] mx-auto flex flex-col h-full">
            <Header hideSearch={true} />
            <AdminClient
                initialStats={initialStats}
                initialSystemInfo={initialSystemInfo}
            />
        </div>
    );
}
