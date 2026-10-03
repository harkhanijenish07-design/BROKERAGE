"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Search } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";
import { useAuth } from "@clerk/nextjs";
import { getWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import BuySellModal from "./BuySellModal";

interface SearchCommandProps {
  renderAs?: 'button' | 'text';
  label?: string;
  initialStocks?: StockWithWatchlistStatus[];
}

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks || []);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());

  // Using Clerk client hook to get session
  const { userId } = useAuth();

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Fetch watchlist symbols when dialog opens or user logs in
  useEffect(() => {
    async function fetchWatchlist() {
      if (userId && open) {
        const symbols = await getWatchlistSymbols(userId);
        setWatchlistSymbols(new Set(symbols));
      }
    }
    fetchWatchlist();
  }, [userId, open]);


  // Fetch initial stocks only when open and stocks are empty
  useEffect(() => {
    async function fetchInitial() {
      if (open && stocks.length === 0) {
        setLoading(true);
        try {
          const results = await searchStocks();
          setStocks(results);
        } catch (e) {
          console.error("Failed to fetch initial stocks", e);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchInitial();
  }, [open, stocks.length]);

  const handleSearch = async () => {
    if (!isSearchMode) return;

    const currentSearchTerm = searchTerm.trim();

    setLoading(true)
    try {
      const results = await searchStocks(currentSearchTerm);

      if (currentSearchTerm !== searchTerm.trim()) return;

      // searchStocks already returns StockWithWatchlistStatus[]
      setStocks(results);
    } catch {
      setStocks([])
    } finally {
      if (currentSearchTerm === searchTerm.trim()) {
        setLoading(false)
      }
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    if (isSearchMode) {
      debouncedSearch();
    }
  }, [searchTerm, isSearchMode, debouncedSearch, open]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
  }

  // Generate a color/avatar for the stock
  const getAvatar = (symbol: string) => {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 border border-gray-700">
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {renderAs === 'text' ? (
          <span className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            {label}
          </span>
        ) : (
          <Button
            variant="outline"
            className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64 lg:w-80 border-gray-800 bg-[#0B0F19] hover:bg-gray-900 transition-all hover:text-white"
          >
            <span className="hidden lg:inline-flex">Search stocks...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex text-gray-400 border-gray-700">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}
      </div>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Stocks"
        description="Search for stocks to add to your watchlist"
      >

        <div className="flex items-center border-b border-gray-800 px-3 bg-[#0B0F19]">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="flex h-12 w-full rouded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        <CommandList className="max-h-[350px] overflow-y-auto overflow-x-hidden bg-[#0B0F19] p-2">
          {loading && stocks.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              Searching market...
            </div>
          ) : displayStocks?.length === 0 ? (
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              {isSearchMode ? 'No stocks found.' : 'Start typing to search...'}
            </CommandEmpty>
          ) : (
            <div className="space-y-1">
              {!isSearchMode && <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Popular</div>}
              {displayStocks?.map((stock, index) => {
                const isPositive = (stock.change || 0) >= 0;
                return (
                  <div
                    key={`${stock.symbol}-${index}`}
                    className="group flex items-center justify-between rounded-lg px-3 py-3 hover:bg-white/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-gray-800"
                  >
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      onClick={handleSelectStock}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {getAvatar(stock.symbol)}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-200 truncate">{stock.symbol}</span>
                        <span className="text-xs text-gray-500 truncate">{stock.name}</span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-4">
                      {/* Price Info (if available) - Only mostly for top results */}
                      {(stock.price !== undefined && stock.price !== 0) && (
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-gray-200">
                            ${stock.price.toFixed(2)}
                          </div>
                          <div className={`text-xs font-medium flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(stock.percentChange || 0).toFixed(2)}%
                          </div>
                        </div>
                      )}

                      <div className="pl-2 border-l border-gray-800 ml-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <BuySellModal
                          userId={userId || ""}
                          symbol={stock.symbol}
                          companyName={stock.description || stock.name}
                          currentPrice={stock.price || 0}
                          type="BUY"
                          trigger={
                            <Button
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 border border-green-500/20"
                            >
                              <span className="text-xs font-bold">+</span>
                            </Button>
                          }
                        />
                        <WatchlistButton
                          userId={userId || ""}
                          symbol={stock.symbol}
                          company={stock.description || stock.name}
                          type="icon"
                          isInWatchlist={watchlistSymbols.has(stock.symbol)}
                          onWatchlistChange={(sym, added) => {
                            const newSet = new Set(watchlistSymbols);
                            if (added) newSet.add(sym);
                            else newSet.delete(sym);
                            setWatchlistSymbols(newSet);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
