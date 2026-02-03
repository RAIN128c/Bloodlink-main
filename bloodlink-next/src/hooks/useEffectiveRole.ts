'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Key for debug role override in sessionStorage
const ROLE_OVERRIDE_KEY = 'debug_role_override';

/**
 * Hook to get the effective user role with debug override support
 * This properly handles SSR/client side rendering and updates when override changes
 */
export function useEffectiveRole() {
    const { data: session, status } = useSession();
    const actualRole = (session?.user as any)?.role;
    const [effectiveRole, setEffectiveRole] = useState<string | undefined>(actualRole);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check for override on mount
        const override = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
        if (override) {
            setEffectiveRole(override);
        } else {
            setEffectiveRole(actualRole);
        }
    }, [actualRole]);

    // Listen for storage changes (when debug panel changes the override)
    useEffect(() => {
        const handleStorageChange = () => {
            const override = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
            if (override) {
                setEffectiveRole(override);
            } else {
                setEffectiveRole(actualRole);
            }
        };

        // Check on window focus (after reload from debug panel)
        window.addEventListener('focus', handleStorageChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('focus', handleStorageChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [actualRole]);

    return {
        effectiveRole: mounted ? effectiveRole : actualRole,
        actualRole,
        isLoading: status === 'loading',
        isOverridden: mounted && effectiveRole !== actualRole && !!sessionStorage.getItem(ROLE_OVERRIDE_KEY),
    };
}

/**
 * Gets the effective role - for non-hook usage (simple function)
 * Note: This may not work correctly on first SSR render
 */
export function getEffectiveRole(actualRole?: string): string | undefined {
    if (typeof window !== 'undefined') {
        const override = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
        if (override) return override;
    }
    return actualRole;
}
