'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import BuySellModal from './BuySellModal';
import { Button } from './ui/button';

interface PortfolioItem {
    _id: string;
    userId: string;
    symbol: string;
    companyName: string;
    quantity: number;
    averageBuyPrice: number;
    totalInvested: number;
    currentPrice: number;
    totalValue: number;
    profitLoss: number;
    profitLossPercentage: number;
}

interface PortfolioTableProps {
    portfolio: PortfolioItem[];
    userId: string;
}

export default function PortfolioTable({ portfolio, userId }: PortfolioTableProps) {
    if (portfolio.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                You don&apos;t own any stocks yet. Go to Search to find and buy stocks!
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
                        <TableHead className="text-gray-400 text-right">Qty</TableHead>
                        <TableHead className="text-gray-400 text-right">Avg Price</TableHead>
                        <TableHead className="text-gray-400 text-right">Current Price</TableHead>
                        <TableHead className="text-gray-400 text-right">Total Value</TableHead>
                        <TableHead className="text-gray-400 text-right">P/L ($)</TableHead>
                        <TableHead className="text-gray-400 text-right">P/L (%)</TableHead>
                        <TableHead className="text-gray-400 text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {portfolio.map((item) => (
                        <TableRow key={item.symbol} className="border-gray-800 hover:bg-[#141414]/50">
                            <TableCell className="font-medium text-gray-200">{item.companyName}</TableCell>
                            <TableCell className="text-gray-400">{item.symbol}</TableCell>
                            <TableCell className="text-right text-gray-200">{item.quantity.toFixed(4)}</TableCell>
                            <TableCell className="text-right text-gray-200">${item.averageBuyPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-gray-200">${item.currentPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-gray-200 font-bold">${item.totalValue.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-medium ${item.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${item.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.profitLossPercentage.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <BuySellModal
                                        userId={userId}
                                        symbol={item.symbol}
                                        companyName={item.companyName}
                                        currentPrice={item.currentPrice}
                                        type="BUY"
                                        trigger={<Button size="sm" variant="outline" className="h-8 border-green-900 text-green-500 hover:text-green-400 hover:bg-green-900/20">Buy</Button>}
                                    />
                                    <BuySellModal
                                        userId={userId}
                                        symbol={item.symbol}
                                        companyName={item.companyName}
                                        currentPrice={item.currentPrice}
                                        type="SELL"
                                        maxSellQuantity={item.quantity}
                                        trigger={<Button size="sm" variant="outline" className="h-8 border-red-900 text-red-500 hover:text-red-400 hover:bg-red-900/20">Sell</Button>}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
