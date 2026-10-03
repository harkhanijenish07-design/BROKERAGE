'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buyStock, sellStock } from '@/lib/actions/portfolio.actions';
import { getWalletBalance } from '@/lib/actions/wallet.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChargesBreakdown from './ChargesBreakdown';
import { calculateCharges } from '@/lib/brokerage';

interface BuySellModalProps {
    userId: string;
    symbol: string;
    companyName: string;
    currentPrice: number;
    type: 'BUY' | 'SELL';
    maxSellQuantity?: number; // Only needed for SELL
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export default function BuySellModal({
    userId,
    symbol,
    companyName,
    currentPrice,
    type,
    maxSellQuantity,
    onSuccess,
    trigger
}: BuySellModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState<string>('1');
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const router = useRouter();

    const estimatedTotal = (parseFloat(quantity) || 0) * currentPrice;

    // Calculate charges breakdown
    const charges = useMemo(
        () => calculateCharges(estimatedTotal, type),
        [estimatedTotal, type],
    );

    // For BUY, user pays tradeValue + charges. For SELL, user receives tradeValue - charges.
    const totalWithCharges = type === 'BUY' ? charges.totalPayable : charges.totalPayable;
    const insufficientFunds = type === 'BUY' && walletBalance !== null && charges.totalPayable > walletBalance;

    // Fetch wallet balance when modal opens (for BUY)
    useEffect(() => {
        if (isOpen && userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }
    }, [isOpen, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Invalid quantity');
            setLoading(false);
            return;
        }

        if (type === 'SELL' && maxSellQuantity !== undefined && qty > maxSellQuantity) {
            toast.error(`Cannot sell more than you own (${maxSellQuantity})`);
            setLoading(false);
            return;
        }

        try {
            // Re-calculate charges at submission time to ensure consistency
            const finalCharges = calculateCharges(qty * currentPrice, type);

            let result;
            if (type === 'BUY') {
                result = await buyStock(userId, symbol, companyName, qty, currentPrice, {
                    brokerage: finalCharges.brokerage,
                    exchangeCharges: finalCharges.exchangeCharges,
                    stampDuty: finalCharges.stampDuty,
                    ipftCharges: finalCharges.ipftCharges,
                    sebiFees: finalCharges.sebiFees,
                    stt: finalCharges.stt,
                    gst: finalCharges.gst,
                    totalCharges: finalCharges.totalCharges,
                });
            } else {
                result = await sellStock(userId, symbol, qty, currentPrice, {
                    brokerage: finalCharges.brokerage,
                    exchangeCharges: finalCharges.exchangeCharges,
                    stampDuty: finalCharges.stampDuty,
                    ipftCharges: finalCharges.ipftCharges,
                    sebiFees: finalCharges.sebiFees,
                    stt: finalCharges.stt,
                    gst: finalCharges.gst,
                    totalCharges: finalCharges.totalCharges,
                });
            }

            if (result.success) {
                toast.success(`Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${symbol}`);
                setIsOpen(false);
                onSuccess?.();
                router.refresh();
            } else {
                toast.error(result.error || 'Transaction failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant={type === 'BUY' ? 'default' : 'destructive'}>{type}</Button>}
            </DialogTrigger>
            <DialogContent className="bg-[#141414] border-gray-800 text-gray-100 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{type === 'BUY' ? 'Buy' : 'Sell'} {companyName} ({symbol})</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Current Price</Label>
                        <div className="text-xl font-bold">${currentPrice.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0.0001"
                            step="any"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="bg-[#0F0F0F] border-gray-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Estimated Total</Label>
                        <div className="text-xl font-bold text-blue-400">${estimatedTotal.toFixed(2)}</div>
                    </div>

                    {/* Charges Breakdown */}
                    <ChargesBreakdown tradeValue={estimatedTotal} type={type} />

                    {/* Total Payable / Receivable */}
                    {estimatedTotal > 0 && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-sm font-semibold text-gray-300">
                                {type === 'BUY' ? 'Total Payable' : 'You Receive'}
                            </span>
                            <span className={`text-lg font-bold ${type === 'BUY' ? 'text-orange-400' : 'text-green-400'}`}>
                                ${totalWithCharges.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {type === 'BUY' && walletBalance !== null && (
                        <div className="space-y-1">
                            <Label>Your Balance</Label>
                            <div className={`text-lg font-semibold ${insufficientFunds ? 'text-red-400' : 'text-green-400'}`}>
                                ${walletBalance.toFixed(2)}
                            </div>
                            {insufficientFunds && (
                                <p className="text-xs text-red-400">Insufficient funds. You need ${charges.totalPayable.toFixed(2)} (trade + charges) but have ${walletBalance.toFixed(2)}.</p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" variant={type === 'BUY' ? 'default' : 'destructive'} disabled={loading || insufficientFunds}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm {type}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
