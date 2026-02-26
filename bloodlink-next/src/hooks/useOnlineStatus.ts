import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    const checkConnection = useCallback(async () => {
        try {
            // First check browser's navigator.onLine (fast fail)
            if (typeof window !== 'undefined' && !navigator.onLine) {
                // If browser explicitly says offline, trust it immediately
                setIsOnline(false);
                return;
            }

            // If browser says online, verify with actual request (ping)
            // Use a timeout to consider it offline if the server doesn't respond quickly (e.g. 5s)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('/api/health', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);
            setIsOnline(res.ok);
        } catch {
            // If fetch failed (network error), we are offline
            setIsOnline(false);
        }
    }, []);

    useEffect(() => {
        // Initial check
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkConnection();

        // Check every 60 seconds (reduced from 5s to save API requests)
        const interval = setInterval(checkConnection, 60000);

        const handleOnline = () => {
            // Browser says online, but verify connection immediately
            setIsOnline(true); // Optimistic update
            checkConnection();
        };

        const handleOffline = () => {
            // Browser says offline, believe it immediately
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkConnection]);

    return isOnline;
}
