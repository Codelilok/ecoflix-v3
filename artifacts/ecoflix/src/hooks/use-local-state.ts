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

  return { wishlist, toggleWishlist, clearWishlist, isInWishlist };
}

export function useContinueWatching() {
  const [continueList, setContinueList] = useLocalStorage<ContinueWatchingItem[]>('ecoflix_continue', []);

  const saveProgress = (item: Omit<ContinueWatchingItem, 'timestamp'>) => {
    setContinueList(prev => {
      const filtered = prev.filter(i => String(i.id) !== String(item.id));
      if (item.progress > 98) return filtered;
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered];
      return updated.slice(0, 20);
    });
  };

  const getProgress = (id: string | number) => {
    return continueList.find(i => String(i.id) === String(id))?.progress || 0;
  };

  const removeFromContinueWatching = (id: string | number) => {
    setContinueList(prev => prev.filter(i => String(i.id) !== String(id)));
  };

  const clearContinueWatching = () => setContinueList([]);

  return { continueList, saveProgress, getProgress, removeFromContinueWatching, clearContinueWatching };
}
