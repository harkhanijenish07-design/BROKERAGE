'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(id);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Fetch timeout after 5 seconds');
    }
    throw err;
  }
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';
    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top popular symbols
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 5);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            const profile = await fetchJSON<ProfileData>(url, 3600); // 1h cache
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          if (!profile?.name) return undefined;
          return {
            symbol: sym.toUpperCase(),
            description: profile.name,
            displaySymbol: sym.toUpperCase(),
            type: 'Common Stock',
            __exchange: profile.exchange
          } as FinnhubSearchResult;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800); // 30m cache for search list
      results = Array.isArray(data?.result) ? data.result : [];
    }

    // Limit to top 15 for general results
    const initialMapped = results.slice(0, 15).map((r: FinnhubSearchResult) => {
      const upper = (r.symbol || '').toUpperCase();
      return {
        symbol: upper,
        name: r.description || upper,
        exchange: (r.displaySymbol || (r as FinnhubSearchResult & { __exchange?: string }).__exchange) || 'US',
        type: r.type || 'Stock',
        isInWatchlist: false,
        price: 0,
        change: 0,
        percentChange: 0,
      };
    });

    // Fetch real-time quotes for the top 6 results ONLY to avoid rate limits
    // We do this in parallel
    const top6 = initialMapped.slice(0, 6);
    const rest = initialMapped.slice(6);

    const quotePromises = top6.map(async (stock) => {
      try {
        // Use a very short cache or no cache for "real-time" feel in search
        // For search, 60s cache is probably fine and safer for quotas
        const qUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(stock.symbol)}&token=${token}`;
        const qData = await fetchJSON<{ c: number; d: number; dp: number }>(qUrl, 60);
        return {
          ...stock,
          price: qData.c || 0,
          change: qData.d || 0,
          percentChange: qData.dp || 0
        };
      } catch (e) {
        console.error(`Failed to fetch quote for search item ${stock.symbol}`, e);
        return stock;
      }
    });

    const enrichedTop6 = await Promise.all(quotePromises);

    // Combine back
    return [...enrichedTop6, ...rest];

  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});

export async function getQuote(symbol: string, cacheSeconds: number = 60) {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) throw new Error('FINNHUB API key is not configured');

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    // Use specified cache duration or default to 60s
    const data = await fetchJSON<{ c: number; d: number; dp: number }>(url, cacheSeconds);
    return {
      currentPrice: data.c || 0,
      change: data.d || 0,
      percentChange: data.dp || 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return {
      currentPrice: 0,
      change: 0,
      percentChange: 0,
    };
  }
}

export async function getCompanyProfile(symbol: string) {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) throw new Error('FINNHUB API key is not configured');

    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    const data = await fetchJSON<ProfileData>(url);

    return {
      country: data.country,
      currency: data.currency,
      exchange: data.exchange,
      name: data.name,
      ticker: data.ticker,
      ipo: data.ipo,
      marketCapitalization: data.marketCapitalization,
      shareOutstanding: data.shareOutstanding,
      logo: data.logo,
      phone: data.phone,
      weburl: data.weburl,
      finnhubIndustry: data.finnhubIndustry,
    };
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
}
