'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Portfolio } from '@/database/models/portfolio.model';
import { Transaction, type TransactionCharges } from '@/database/models/transaction.model';
import { Wallet } from '@/database/models/wallet.model';
import { getQuote } from './finnhub.actions';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

const INITIAL_WALLET_BALANCE = 100000;

export async function buyStock(
    userId: string,
    symbol: string,
    companyName: string,
    quantity: number,
    price: number,
    charges?: TransactionCharges,
) {
    let session = null;
    try {
        await connectToDatabase();
        session = await mongoose.startSession();
        session.startTransaction();

        // ── Wallet check (trade value + all charges) ──
        const tradeValue = price * quantity;
        const totalCharges = charges?.totalCharges ?? 0;
        const totalDeduction = tradeValue + totalCharges;

        let wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) {
            [wallet] = await Wallet.create([{ userId, balance: INITIAL_WALLET_BALANCE }], { session });
        }
        if (wallet.balance < totalDeduction) {
            await session.abortTransaction();
            return { success: false, error: `Insufficient funds. You have $${wallet.balance.toFixed(2)} but need $${totalDeduction.toFixed(2)} (trade + charges)` };
        }
        wallet.balance -= totalDeduction;
        await wallet.save({ session });

        // ── Portfolio update ──
        const existing = await Portfolio.findOne({ userId, symbol }).session(session);

        if (existing) {
            const totalCost = existing.averageBuyPrice * existing.quantity + price * quantity;
            const newQuantity = existing.quantity + quantity;
            const newAvg = totalCost / newQuantity;

            existing.quantity = newQuantity;
            existing.averageBuyPrice = newAvg;
            existing.totalInvested = existing.totalInvested + price * quantity;
            await existing.save({ session });
        } else {
            await Portfolio.create([{
                userId,
                symbol,
                companyName,
                quantity,
                averageBuyPrice: price,
                totalInvested: price * quantity,
            }], { session });
        }

        // Record Transaction with charges
        await Transaction.create([{
            userId,
            symbol,
            type: 'BUY',
            quantity,
            price,
            charges: charges ?? {},
        }], { session });

        await session.commitTransaction();
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('Buy Stock Error:', error);
        return { success: false, error: 'Failed to buy stock' };
    } finally {
        if (session) session.endSession();
    }
}

export async function sellStock(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
    charges?: TransactionCharges,
) {
    let session = null;
    try {
        await connectToDatabase();
        session = await mongoose.startSession();
        session.startTransaction();

        const existing = await Portfolio.findOne({ userId, symbol }).session(session);

        if (!existing) {
            await session.abortTransaction();
            return { success: false, error: 'Stock not found in portfolio' };
        }

        if (existing.quantity < quantity) {
            await session.abortTransaction();
            return { success: false, error: 'Insufficient quantity' };
        }

        // ── Credit wallet (sale proceeds minus charges) ──
        const saleProceeds = price * quantity;
        const totalCharges = charges?.totalCharges ?? 0;
        const netCredit = saleProceeds - totalCharges;

        let wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) {
            [wallet] = await Wallet.create([{ userId, balance: INITIAL_WALLET_BALANCE }], { session });
        }
        wallet.balance += netCredit;
        await wallet.save({ session });

        // ── Update Portfolio ──
        const costOfSoldShares = existing.averageBuyPrice * quantity;
        existing.quantity -= quantity;
        existing.totalInvested -= costOfSoldShares;

        if (existing.quantity <= 0) {
            await Portfolio.deleteOne({ _id: existing._id }).session(session);
        } else {
            await existing.save({ session });
        }

        // Record Transaction with charges
        await Transaction.create([{
            userId,
            symbol,
            type: 'SELL',
            quantity,
            price,
            charges: charges ?? {},
        }], { session });

        await session.commitTransaction();
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        if (session) await session.abortTransaction();
        console.error('Sell Stock Error:', error);
        return { success: false, error: 'Failed to sell stock' };
    } finally {
        if (session) session.endSession();
    }
}

export async function getPortfolio(userId: string) {
    try {
        await connectToDatabase();

        // Optimize query: Select only necessary fields
        const items = await Portfolio.find({ userId })
            .select('symbol quantity averageBuyPrice totalInvested companyName')
            .lean();

        // Fetch real-time quotes for each item strictly
        // We can use Promise.all
        const portfolioWithData = await Promise.all(
            items.map(async (item) => {
                try {
                    // Use 30s cache for portfolio (faster updates than 60s)
                    // and a shorter internal timeout via the modified getQuote
                    const quote = await getQuote(item.symbol, 30);
                    const currentPrice = quote.currentPrice || 0;
                    const totalValue = item.quantity * currentPrice;
                    const profitLoss = totalValue - item.totalInvested;
                    const profitLossPercentage =
                        item.totalInvested > 0 ? (profitLoss / item.totalInvested) * 100 : 0;

                    return {
                        ...item,
                        _id: item._id.toString(),
                        currentPrice,
                        totalValue,
                        profitLoss,
                        profitLossPercentage,
                    };
                } catch (error) {
                    console.error(`Error fetching quote for ${item.symbol}:`, error);
                    // Return item with 0 price instead of failing the whole portfolio
                    return {
                        ...item,
                        _id: item._id.toString(),
                        currentPrice: 0,
                        totalValue: 0,
                        profitLoss: -item.totalInvested,
                        profitLossPercentage: -100,
                    };
                }
            })
        );

        return portfolioWithData;
    } catch (error) {
        console.error('Get Portfolio Error:', error);
        return [];
    }
}
