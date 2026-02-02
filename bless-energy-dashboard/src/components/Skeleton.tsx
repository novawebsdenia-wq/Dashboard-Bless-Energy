'use client';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200 dark:bg-white/10 ${className}`}
        />
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-gray-200 dark:border-gold/20 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

export function TableSkeleton() {
    return (
        <div className="space-y-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-gold/20 rounded-2xl overflow-hidden p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
