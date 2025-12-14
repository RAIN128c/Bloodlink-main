import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminMainLayout } from '@/components/layout/AdminMainLayout';
import { Permissions } from '@/lib/permissions';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Check if user is authenticated and has admin role (ผู้ดูแล or admin)
    if (!session || !Permissions.isAdmin(session.user?.role)) {
        redirect('/dashboard');
    }

    return (
        <AdminMainLayout>
            {children}
        </AdminMainLayout>
    );
}

