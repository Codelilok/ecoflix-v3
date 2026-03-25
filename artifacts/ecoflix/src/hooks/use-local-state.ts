import { useLocalStorage } from "usehooks-ts";

export interface WishlistItem {
  id: string | number;
  type: 'movie' | 'tv';
  title: string;
  poster?: string;
  addedAt: number;
}

export interface ContinueWatchingItem {
  id: string | number;
  type: 'movie' | 'tv';
  title: string;
  poster?: string;
  progress: number;
  timestamp: number;
  season?: string;
  episode?: string;
}

export interface WatchHistoryItem {
  id: string | number;
  type: 'movie' | 'tv';
  title: string;
  poster?: string;
  watchedAt: number;
  season?: string;
  episode?: string;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useLocalStorage<WishlistItem[]>('ecoflix_wishlist', []);

  const toggleWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
    setWishlist(prev => {
      const exists = prev.find(i => String(i.id) === String(item.id));
      if (exists) {
        return prev.filter(i => String(i.id) !== String(item.id));
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  };

  const clearWishlist = () => setWishlist([]);

  const isInWishlist = (id: string | number) => {
    return wishlist.some(i => String(i.id) === String(id));
  };

  const addManyToWishlist = (items: Omit<WishlistItem, 'addedAt'>[]): number => {
    let added = 0;
    setWishlist(prev => {
      const existingIds = new Set(prev.map(i => String(i.id)));
      const newItems = items
        .filter(i => !existingIds.has(String(i.id)))
        .map(i => ({ ...i, addedAt: Date.now() }));
      added = newItems.length;
      return [...prev, ...newItems];
    });
    return added;
  };

  return { wishlist, toggleWishlist, clearWishlist, isInWishlist, addManyToWishlist };
}

export function useContinueWatching() {
  const [continueList, setContinueList] = useLocalStorage<ContinueWatchingItem[]>('ecoflix_continue', []);

  const saveProgress = (item: Omit<ContinueWatchingItem, 'timestamp'>) => {
    setContinueList(prev => {
      const filtered = prev.filter(i => !(
        String(i.id) === String(item.id) &&
        i.season === item.season &&
        i.episode === item.episode
      ));
      if (item.progress > 98) return filtered;
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered];
      return updated.slice(0, 20);
    });
  };

  const getProgress = (id: string | number, season?: string, episode?: string) => {
    return continueList.find(i =>
      String(i.id) === String(id) &&
      i.season === season &&
      i.episode === episode
    )?.progress || 0;
  };

  const removeFromContinueWatching = (id: string | number) => {
    setContinueList(prev => prev.filter(i => String(i.id) !== String(id)));
  };

  const clearContinueWatching = () => setContinueList([]);

  return { continueList, saveProgress, getProgress, removeFromContinueWatching, clearContinueWatching };
}

export function useWatchHistory() {
  const [history, setHistory] = useLocalStorage<WatchHistoryItem[]>('ecoflix_watch_history', []);

  const addToHistory = (item: Omit<WatchHistoryItem, 'watchedAt'>) => {
    setHistory(prev => {
      const filtered = prev.filter(i => !(String(i.id) === String(item.id) && i.season === item.season && i.episode === item.episode));
      return [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, 200);
    });
  };

  const removeFromHistory = (id: string | number, season?: string, episode?: string) => {
    setHistory(prev => prev.filter(i => !(String(i.id) === String(id) && i.season === season && i.episode === episode)));
  };

  const clearHistory = () => setHistory([]);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('ecoflix_search_history', []);

  const addSearch = (term: string) => {
    if (!term.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 20);
    });
  };

  const removeSearch = (term: string) => {
    setSearchHistory(prev => prev.filter(t => t !== term));
  };

  const clearSearchHistory = () => setSearchHistory([]);

  return { searchHistory, addSearch, removeSearch, clearSearchHistory };
}
