'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { revalidatePath } from 'next/cache';
import { getQuote } from './finnhub.actions';

export async function toggleWatchlist(userId: string, symbol: string, company: string) {
  try {
    await connectToDatabase();

    const existing = await Watchlist.findOne({ userId, symbol });

    if (existing) {
      await Watchlist.deleteOne({ _id: existing._id });
      revalidatePath('/watchlist');
      revalidatePath('/search'); // Update search results if they show watchlist status
      return { success: true, added: false, message: 'Removed from watchlist' };
    } else {
      await Watchlist.create({
        userId,
        symbol,
        company: company || symbol,
      });
      revalidatePath('/watchlist');
      revalidatePath('/search');
      return { success: true, added: true, message: 'Added to watchlist' };
    }
  } catch (error) {
    console.error('Toggle Watchlist Error:', error);
    return { success: false, error: 'Failed to update watchlist' };
  }
}

export async function getWatchlist(userId: string) {
  try {
    await connectToDatabase();

    // Optimize query: select only needed fields
    const items = await Watchlist.find({ userId })
      .select('symbol company addedAt')
      .sort({ addedAt: -1 })
      .lean();

    const watchlistWithData = await Promise.all(
      items.map(async (item) => {
        // Safe quote fetching - will return 0s if API key missing
        // Use 60s cache for watchlist to improve performance
        const quote = await getQuote(item.symbol, 60);

        return {
          _id: item._id.toString(),
          symbol: item.symbol,
          company: item.company,
          price: quote.currentPrice,
          change: quote.change,
          changePercentage: quote.percentChange,
          addedAt: item.addedAt,
        };
      })
    );

    return watchlistWithData;

  } catch (error) {
    console.error('Get Watchlist Error:', error);
    return [];
  }
}

export async function getWatchlistSymbols(userId: string): Promise<string[]> {
  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map(item => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols:", error);
    return [];
  }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  try {
    const mongoose = await connectToDatabase();

    if (!email) return [];

    const db = mongoose.connection.db;
    if (!db) return [];

    const user = await db.collection('user').findOne({ email });
    if (!user) return [];

    return getWatchlistSymbols(user._id.toString());
  } catch (error) {
    console.error("Error fetching watchlist symbols by email:", error);
    return [];
  }
}
