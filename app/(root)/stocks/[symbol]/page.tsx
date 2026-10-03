import { auth } from '@clerk/nextjs/server';
import { getQuote, getCompanyProfile } from '@/lib/actions/finnhub.actions';
import { getWatchlistSymbols } from '@/lib/actions/watchlist.actions';
import WatchlistButton from '@/components/WatchlistButton';
import { notFound } from 'next/navigation';
import { TrendingUp, TrendingDown, Globe, Building2, Calendar } from 'lucide-react';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailsPage({ params }: PageProps) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol).toUpperCase();

  const { userId } = await auth();

  // Fetch data in parallel
  const [quote, profile, watchlistSymbols] = await Promise.all([
    getQuote(decodedSymbol),
    getCompanyProfile(decodedSymbol),
    userId ? getWatchlistSymbols(userId) : Promise.resolve([]),
  ]);

  if (!profile && !quote.currentPrice) {
    notFound();
  }

  const isInWatchlist = watchlistSymbols.includes(decodedSymbol);
  const isPositive = quote.change >= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Section */}
      <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            {profile?.logo ? (
              <Image
                src={profile.logo}
                alt={`${decodedSymbol} logo`}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full bg-white object-contain p-2"
                priority
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
                {decodedSymbol.slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-100">{profile?.name || decodedSymbol}</h1>
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <span className="font-semibold bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-200">
                  {decodedSymbol}
                </span>
                <span>•</span>
                <span>{profile?.exchange}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-gray-100">${quote.currentPrice.toFixed(2)}</div>
            <div className={`flex items-center justify-end gap-2 mt-1 text-lg font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.percentChange.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          {/* Watchlist Button */}
          <div className="w-full md:w-auto">
            <WatchlistButton
              userId={userId || ""}
              symbol={decodedSymbol}
              company={profile?.name || decodedSymbol}
              isInWatchlist={isInWatchlist}
            // If user is not logged in, button handles toast
            />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Market Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Market Cap</span>
              <span className="font-medium text-gray-200">
                {profile?.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(2)}B` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Shares Outstanding</span>
              <span className="font-medium text-gray-200">
                {profile?.shareOutstanding ? `${profile.shareOutstanding.toFixed(2)}M` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Industry</span>
              <span className="font-medium text-gray-200">{profile?.finnhubIndustry || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">IPO Date</span>
              <span className="font-medium text-gray-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                {profile?.ipo || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">About</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500" />
              <span>Country: {profile?.country || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-500" />
              <a href={profile?.weburl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                {profile?.weburl || 'N/A'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
