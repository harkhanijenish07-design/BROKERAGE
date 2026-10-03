import { Skeleton } from "@/components/ui/skeleton"

export function TableRowSkeleton() {
    return (
        <div className="flex items-center space-x-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    )
}

export function CardSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}

export function WatchlistSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="border border-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex justify-between mb-6">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                ))}
            </div>
        </div>
    )
}
