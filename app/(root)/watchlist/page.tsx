import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getWatchlist } from '@/lib/actions/watchlist.actions';
import WatchlistTable from '@/components/WatchlistTable';
import { Suspense } from 'react';
import { WatchlistSkeleton } from '@/components/ui/skeleton-loaders';

import { getPortfolio } from '@/lib/actions/portfolio.actions';

// Separate component for data fetching to allow streaming
async function WatchlistContent({ userId }: { userId: string }) {
    const [watchlist, portfolio] = await Promise.all([
        getWatchlist(userId),
        getPortfolio(userId)
    ]);

    // Create a map of symbol -> quantity for easier lookup
    const portfolioMap = portfolio.reduce((acc, item) => {
        acc[item.symbol] = item.quantity;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-6">
            <WatchlistTable watchlist={watchlist} userId={userId} portfolioMap={portfolioMap} />
        </div>
    );
}

export default async function WatchlistPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold text-gray-100">My Watchlist</h1>
                <p className="text-gray-400">Track your favorite stocks in real-time.</p>
            </div>

            <Suspense fallback={<WatchlistSkeleton />}>
                <WatchlistContent userId={userId} />
            </Suspense>
        </div>
    );
}
