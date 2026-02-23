import { SupabaseAuthProvider } from '@/components/providers/SupabaseAuthProvider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SupabaseAuthProvider>
            {children}
        </SupabaseAuthProvider>
    );
}
