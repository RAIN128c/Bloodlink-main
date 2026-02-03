import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <MainLayout>
            <div className="max-w-[1200px] w-full mx-auto flex flex-col font-[family-name:var(--font-kanit)]">
                <Header />

                <div className="flex flex-col gap-6 pb-20">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-48 rounded-md" />
                        <Skeleton className="h-5 w-64 rounded-md" />
                    </div>

                    {/* Filter Bar Skeleton */}
                    <Skeleton className="h-[72px] w-full rounded-2xl" />

                    {/* Patient List Skeleton */}
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white dark:bg-[#1F2937] p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2 w-full">
                                    <Skeleton className="h-5 w-40 rounded-md" />
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                </div>
                                <Skeleton className="hidden md:block h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
