"use client";

import React, { useMemo, useState, useEffect } from "react";
import { toggleWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

interface WatchlistButtonProps {
  userId: string;
  symbol: string;
  company: string;
  isInWatchlist?: boolean;
  showTrashIcon?: boolean;
  type?: "button" | "icon";
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
}

const WatchlistButton = ({
  userId,
  symbol,
  company,
  isInWatchlist = false,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(isInWatchlist);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAdded(isInWatchlist);
  }, [isInWatchlist]);

  const label = useMemo(() => {
    if (type === "icon") return added ? "Remove from Watchlist" : "Add to Watchlist";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Critical for search row interaction

    if (!userId) {
      // Prompt login if not authenticated (could assume parent handles login modal, but for now toast is safe)
      // Ideally, we'd trigger a login modal here if possible, but we'll stick to toast for now or existing flow
      toast.error("Please sign in to add to watchlist");
      return;
    }

    setAnimating(true);
    setTimeout(() => setAnimating(false), 300); // Reset animation state

    setLoading(true);
    try {
      // Optimistic update
      const next = !added;
      setAdded(next);
      onWatchlistChange?.(symbol, next);

      const result = await toggleWatchlist(userId, symbol, company);

      if (result.success) {
        toast.success(result.message, {
          position: 'top-right',
          duration: 2000,
        });

        // Verify state matches server
        if (result.added !== undefined && result.added !== next) {
          setAdded(result.added);
          onWatchlistChange?.(symbol, result.added);
        }
      } else {
        // Revert on failure
        setAdded(!next);
        onWatchlistChange?.(symbol, !next);
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
      setAdded(!added); // Revert
      onWatchlistChange?.(symbol, !added);
    } finally {
      setLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <button
        title={label}
        aria-label={label}
        className={`p-2 rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95 focus:outline-none group/btn ${animating ? "scale-125" : "scale-100"
          }`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <Star
            className={`w-5 h-5 transition-all duration-300 ${added
                ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                : "text-gray-500 group-hover/btn:text-yellow-400 fill-transparent"
              }`}
          />
        )}
      </button>
    );
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${added
          ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
          : "bg-blue-600 border-transparent text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
        }`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : (
        <Star className={`w-4 h-4 ${added ? "fill-current" : ""}`} />
      )}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
