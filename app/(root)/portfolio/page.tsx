import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getPortfolio } from '@/lib/actions/portfolio.actions';
import { getWalletBalance } from '@/lib/actions/wallet.actions';
import PortfolioTable from '@/components/PortfolioTable';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';

async function PortfolioContent({ userId }: { userId: string }) {
    const [portfolio, walletBalance] = await Promise.all([
        getPortfolio(userId),
        getWalletBalance(userId),
    ]);

    const totalValue = portfolio.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalInvested = portfolio.reduce((sum, item) => sum + (item.totalInvested || 0), 0);
    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Cash Balance</div>
                    <div className="text-3xl font-bold text-yellow-400">${walletBalance.toFixed(2)}</div>
                </div>
                <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Total Value</div>
                    <div className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</div>
                </div>

                <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Total Invested</div>
                    <div className="text-3xl font-bold text-white">${totalInvested.toFixed(2)}</div>
                </div>

                <div className="bg-[#141414] p-6 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-sm mb-1">Total Profit/Loss</div>
                    <div className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
                        <span className="text-sm font-normal ml-2 opacity-80">
                            ({totalProfitLossPercentage.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-[#141414] rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">Holdings</h2>
                <PortfolioTable portfolio={portfolio} userId={userId} />
            </div>
        </>
    );
}

export default async function PortfolioPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold text-gray-100">My Portfolio</h1>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                <PortfolioContent userId={userId} />
            </Suspense>
        </div>
    );
}
