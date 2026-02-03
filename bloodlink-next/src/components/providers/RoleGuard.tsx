'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isValidRole, getEffectiveRole } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

// Public paths that don't require role validation
const PUBLIC_PATHS = ['/login', '/register', '/', '/forgot-password', '/reset-password', '/privacy-policy'];

/**
 * RoleGuard component checks if the logged-in user has a valid role.
 * Users without a valid role cannot access protected pages.
 * Valid roles: แพทย์, พยาบาล, เจ้าหน้าที่ห้องปฏิบัติการ, ผู้ดูแล
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { data: session, status, update } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [roleStatus, setRoleStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

    // Check if current path is public
    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    useEffect(() => {
        // Always allow public paths immediately
        if (isPublicPath) {
            setRoleStatus('valid');
            return;
        }

        // Still loading session
        if (status === 'loading') {
            setRoleStatus('loading');
            return;
        }

        // Not authenticated - redirect to login
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        // Authenticated - check if role is loaded
        if (status === 'authenticated') {
            const userRole = session?.user?.role;

            // If role is missing, we treat it as an invalid role instead of looping forever
            if (userRole === undefined || userRole === null) {
                console.warn('User authenticated but no role found in session');
                setRoleStatus('invalid');
                return;
            }

            // Role is loaded - validate it (with whitespace trimming)
            const effectiveRole = getEffectiveRole(userRole);
            if (isValidRole(effectiveRole)) {
                // If allowedRoles is specified, check against it
                if (allowedRoles && allowedRoles.length > 0) {
                    // Check if current user role is in the allowed list
                    // We need to map role names if they differ (e.g. 'admin' vs 'ผู้ดูแล')
                    // Assuming allowedRoles uses internal keys or exact matches?
                    // Let's assume broad matching for now or specific keys if defined in permissions
                    const currentRoleString = effectiveRole || '';
                    const hasPermission = allowedRoles.some(role =>
                        currentRoleString.toLowerCase().includes(role.toLowerCase()) ||
                        role === 'admin' && currentRoleString.includes('ผู้ดูแล') ||
                        role === 'doctor' && currentRoleString.includes('แพทย์') ||
                        role === 'medtech' && currentRoleString.includes('เจ้าหน้าที่ห้องปฏิบัติการ') ||
                        role === 'nurse' && currentRoleString.includes('พยาบาล')
                    );

                    if (hasPermission) {
                        setRoleStatus('valid');
                    } else {
                        setRoleStatus('invalid');
                    }
                } else {
                    setRoleStatus('valid');
                }
            } else {
                setRoleStatus('invalid');
            }
        }
    }, [status, session?.user?.role, pathname, router, update, isPublicPath, allowedRoles]);

    // Show loading while checking
    if (roleStatus === 'loading' && !isPublicPath) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-[family-name:var(--font-kanit)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-gray-500 dark:text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        );
    }

    // Allow public paths
    if (isPublicPath) {
        return <>{children}</>;
    }

    // Block users with invalid roles
    if (roleStatus === 'invalid') {
        const displayRole = session?.user?.role?.trim() || 'ไม่มีบทบาท';
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-[family-name:var(--font-kanit)]">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        ไม่สามารถเข้าถึงได้
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        บัญชีของคุณไม่มีบทบาทที่ถูกต้อง ({displayRole})
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                        กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดบทบาทให้ถูกต้อง
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            กลับหน้าเข้าสู่ระบบ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Role is valid - render children
    return <>{children}</>;
}
