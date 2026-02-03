import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <MainLayout>
            <div className="max-w-[900px] w-full mx-auto flex flex-col font-[family-name:var(--font-kanit)]">
                <Header />

                <div className="flex flex-col gap-4 pb-5">
                    {/* Welcome Banner Skeleton */}
                    <Skeleton className="h-[140px] w-full rounded-[20px]" />

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-[90px] w-full rounded-2xl" />
                        ))}
                    </div>

                    {/* Quick Action Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-[100px] w-full rounded-2xl" />
                        ))}
                    </div>

                    {/* Info Panel & Quick Actions Panel Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-[180px] w-full rounded-2xl" />
                        <Skeleton className="h-[120px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
