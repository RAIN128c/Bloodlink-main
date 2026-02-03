'use client';

import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { HelpButton } from '@/components/shared/HelpButton';
import { NotificationPopup } from '@/components/shared/NotificationPopup';
import { useRouter } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { NotificationProvider, useNotifications } from '@/components/providers/NotificationContext';
import { InboxProvider } from '@/components/providers/InboxContext';
import { RoleGuard } from '@/components/providers/RoleGuard';

interface GlobalProviderProps {
    children: React.ReactNode;
}

// Inner component that uses the notification context
function GlobalProviderInner({ children }: GlobalProviderProps) {
    const router = useRouter();
    const { currentNotification, closePopup, notify } = useNotifications();

    const handleAction = () => {
        if (currentNotification.targetPath) {
            router.push(currentNotification.targetPath);
            closePopup(); // Close popup after navigation
        }
    };

    return (
        <>
            <RoleGuard>
                {children}
            </RoleGuard>
            <OfflineBanner />
            <HelpButton onNotify={notify} />
            <NotificationPopup
                isOpen={currentNotification.isOpen}
                onClose={closePopup}
                onAction={handleAction}
                type={currentNotification.type}
                title={currentNotification.title}
                message={currentNotification.message}
            />
        </>
    );
}

export function GlobalProvider({ children }: GlobalProviderProps) {
    return (
        <SessionProvider>
            <NotificationProvider>
                <InboxProvider>
                    <GlobalProviderInner>{children}</GlobalProviderInner>
                </InboxProvider>
            </NotificationProvider>
        </SessionProvider>
    );
}

