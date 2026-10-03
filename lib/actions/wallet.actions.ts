'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Wallet } from '@/database/models/wallet.model';

const INITIAL_BALANCE = 100000;

/**
 * Returns the wallet for the given user, creating one with the
 * initial balance ($1000) if it doesn't exist yet.
 */
export async function getOrCreateWallet(userId: string) {
    try {
        await connectToDatabase();

        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            wallet = await Wallet.create({ userId, balance: INITIAL_BALANCE });
        }

        return wallet;
    } catch (error) {
        console.error('getOrCreateWallet Error:', error);
        return { userId, balance: INITIAL_BALANCE } as any;
    }
}

/**
 * Convenience wrapper that returns just the numeric balance.
 */
export async function getWalletBalance(userId: string): Promise<number> {
    try {
        const wallet = await getOrCreateWallet(userId);
        return wallet ? wallet.balance : INITIAL_BALANCE;
    } catch (error) {
        console.error('getWalletBalance Error:', error);
        return INITIAL_BALANCE;
    }
}
