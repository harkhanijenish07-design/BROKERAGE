'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toggleWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, TrendingUp } from 'lucide-react';

import BuySellModal from './BuySellModal';

interface WatchlistItem {
    _id: string;
    symbol: string;
    company: string;
    price: number;
    change: number;
    changePercentage: number;
    addedAt: Date;
}

interface WatchlistTableProps {
    watchlist: WatchlistItem[];
    userId: string;
    portfolioMap: Record<string, number>;
}

export default function WatchlistTable({ watchlist, userId, portfolioMap }: WatchlistTableProps) {
    const router = useRouter();

    const handleRemove = async (symbol: string, company: string) => {
        try {
            const result = await toggleWatchlist(userId, symbol, company);
            if (result.success) {
                toast.success(result.message);
                router.refresh(); // Refresh to update list
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error('Remove Watchlist error:', error);
            toast.error('Failed to remove stock');
        }
    };

    if (watchlist.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                Your watchlist is empty. Go to Search to add stocks!
            </div>
        );
    }

    return (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-[#141414]">
                    <TableRow className="border-gray-800 hover:bg-[#141414]">
                        <TableHead className="text-gray-400">Company</TableHead>
                        <TableHead className="text-gray-400">Symbol</TableHead>
                        <TableHead className="text-gray-400 text-right">Price</TableHead>
                        <TableHead className="text-gray-400 text-right">Change</TableHead>
                        <TableHead className="text-gray-400 text-right">Change %</TableHead>
                        <TableHead className="text-gray-400 text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {watchlist.map((item) => {
                        const ownedQuantity = portfolioMap[item.symbol] || 0;
                        return (
                            <TableRow key={item.symbol} className="border-gray-800 hover:bg-[#141414]/50">
                                <TableCell className="font-medium text-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-gray-800 p-1.5 rounded-full">
                                            <TrendingUp className="h-4 w-4 text-blue-400" />
                                        </div>
                                        {item.company}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-400">{item.symbol}</TableCell>
                                <TableCell className="text-right text-gray-200 font-bold">
                                    ${item.price.toFixed(2)}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${item.changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {item.changePercentage.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <BuySellModal
                                            userId={userId}
                                            symbol={item.symbol}
                                            companyName={item.company}
                                            currentPrice={item.price}
                                            type="BUY"
                                            trigger={<Button size="sm" variant="outline" className="h-8 border-green-900 text-green-500 hover:text-green-400 hover:bg-green-900/20">Buy</Button>}
                                        />
                                        <BuySellModal
                                            userId={userId}
                                            symbol={item.symbol}
                                            companyName={item.company}
                                            currentPrice={item.price}
                                            type="SELL"
                                            maxSellQuantity={ownedQuantity}
                                            trigger={<Button size="sm" variant="outline" disabled={ownedQuantity <= 0} className="h-8 border-red-900 text-red-500 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed">Sell</Button>}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-gray-500 hover:text-red-500 hover:bg-red-900/10 h-8 w-8 p-0"
                                            onClick={() => handleRemove(item.symbol, item.company)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
