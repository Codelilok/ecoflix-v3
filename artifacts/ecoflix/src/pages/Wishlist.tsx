import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useWishlist, WishlistItem } from "@/hooks/use-local-state";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Trash2, Play, Search, X, Check, Share2,
  LayoutGrid, List, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "usehooks-ts";

type ViewMode = "grid" | "list";

function encodeShareData(name: string, items: WishlistItem[]): string {
  const payload = items.map(({ id, type, title, poster }) => ({ id, type, title, poster }));
  return btoa(encodeURIComponent(JSON.stringify({ name, items: payload })));
}

export default function Wishlist() {
  const { wishlist, toggleWishlist, clearWishlist } = useWishlist();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("ecoflix_wishlist_view", "grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [nameError, setNameError] = useState("");

  const sorted = [...wishlist].sort((a, b) => b.addedAt - a.addedAt);

  const enterSelectionMode = useCallback((id: string) => {
    setSelectionMode(true);
    setSelected(new Set([id]));
  }, []);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = () => {
    if (selected.size === 0) return;
    setListName("");
    setNameError("");
    setShareOpen(true);
  };

  const generateLink = () => {
    if (!listName.trim()) {
      setNameError("Please enter a name for your list.");
      return;
    }
    const selectedItems = sorted.filter(item => selected.has(String(item.id)));
    const encoded = encodeShareData(listName.trim(), selectedItems);
    const url = `${window.location.origin}/wishlist/shared?d=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareOpen(false);
      exitSelectionMode();
      toast({ title: "Link copied! 🎉", description: "Share it with your friends." });
    }).catch(() => {
      toast({ title: "Could not copy automatically", description: url, variant: "destructive" });
    });
  };

  if (wishlist.length === 0) {
    return (
      <Layout>
        <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-[80vh] flex flex-col items-center justify-center text-center space-y-5 py-24">
          <button
            onClick={() => window.history.back()}
            className="absolute top-20 left-4 md:left-12 flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center">
            <Heart className="h-9 w-9 text-zinc-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your List is Empty</h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">Save movies and shows to watch them later.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/browse">
              <button className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition-colors">Browse Content</button>
            </Link>
            <Link href="/search">
              <button className="bg-zinc-800 text-white px-6 py-3 rounded font-bold hover:bg-zinc-700 transition-colors border border-zinc-600 flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-[80vh]">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <Heart className="h-7 w-7 text-red-500 fill-current" />
              My List
              <span className="text-lg font-normal text-zinc-500">{wishlist.length}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grid / List toggle */}
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white")}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {!selectionMode && (
              <button
                onClick={() => { if (window.confirm("Clear your entire wishlist?")) clearWishlist(); }}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-red-500/50"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Selection mode toolbar */}
        {selectionMode && (
          <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700">
            <div className="flex items-center gap-3">
              <button onClick={exitSelectionMode} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                <X className="h-4 w-4" /> Cancel
              </button>
              <span className="text-sm text-white font-medium">
                {selected.size === 0 ? "Tap movies to select" : `${selected.size} selected`}
              </span>
            </div>
            <button
              onClick={handleShare}
              disabled={selected.size === 0}
              className={cn(
                "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all",
                selected.size > 0
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              <Share2 className="h-4 w-4" />
              Share {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        )}

        {!selectionMode && (
          <p className="text-xs text-zinc-600 mb-4">Long press a movie to share it with friends</p>
        )}

        {/* Grid view */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {sorted.map(item => (
              <WishlistCard
                key={`${item.type}-${item.id}`}
                item={item}
                selectionMode={selectionMode}
                isSelected={selected.has(String(item.id))}
                onToggleSelect={() => toggleSelect(String(item.id))}
                onRemove={() => toggleWishlist(item)}
                onLongPress={() => enterSelectionMode(String(item.id))}
                viewMode="grid"
              />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-2">
            {sorted.map(item => (
              <WishlistCard
                key={`${item.type}-${item.id}`}
                item={item}
                selectionMode={selectionMode}
                isSelected={selected.has(String(item.id))}
                onToggleSelect={() => toggleSelect(String(item.id))}
                onRemove={() => toggleWishlist(item)}
                onLongPress={() => enterSelectionMode(String(item.id))}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShareOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-red-500" />
              Share Your List
            </h2>
            <p className="text-sm text-zinc-400 mb-5">
              Give your list a name before sharing {selected.size} movie{selected.size !== 1 ? "s" : ""}.
            </p>

            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              List Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={listName}
              onChange={e => { setListName(e.target.value); setNameError(""); }}
              onKeyDown={e => { if (e.key === "Enter") generateLink(); }}
              placeholder='e.g. "Weekend Movies 🍿"'
              maxLength={60}
              className={cn(
                "w-full px-4 py-3 rounded-xl bg-zinc-900 border text-white placeholder:text-zinc-600 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all",
                nameError ? "border-red-500" : "border-zinc-700"
              )}
            />
            {nameError && <p className="text-red-400 text-xs mt-1.5">{nameError}</p>}
            <p className="text-zinc-600 text-xs mt-1">{listName.length}/60</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShareOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateLink}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Wishlist Card ──────────────────────────────────────────────────────────────

type CardProps = {
  item: WishlistItem;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onLongPress: () => void;
  viewMode: ViewMode;
};

function WishlistCard({ item, selectionMode, isSelected, onToggleSelect, onRemove, onLongPress, viewMode }: CardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);

  const startPress = () => {
    if (selectionMode) return;
    longFired.current = false;
    timerRef.current = setTimeout(() => {
      longFired.current = true;
      onLongPress();
    }, 500);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (longFired.current) { e.preventDefault(); return; }
    if (selectionMode) { e.preventDefault(); onToggleSelect(); }
  };

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl bg-zinc-900 border transition-all cursor-pointer select-none",
          isSelected ? "border-red-500 ring-1 ring-red-500 bg-red-950/20" : "border-zinc-800 hover:border-zinc-600"
        )}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onClick={handleClick}
      >
        {/* Poster thumbnail */}
        <div className="relative flex-shrink-0 w-12 h-16 rounded-md overflow-hidden bg-zinc-800">
          {item.poster
            ? <img src={item.poster} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="h-4 w-4 text-zinc-600" /></div>}
          {selectionMode && isSelected && (
            <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
          <span className="text-xs text-zinc-500 capitalize bg-zinc-800 px-2 py-0.5 rounded-full">{item.type}</span>
        </div>

        {/* Action */}
        {!selectionMode ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/${item.type}/${item.id}`}>
              <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-red-600 transition-colors flex items-center justify-center" title="Watch">
                <Play className="h-3.5 w-3.5 text-white fill-current" />
              </button>
            </Link>
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-red-900/50 transition-colors flex items-center justify-center"
              title="Remove"
            >
              <X className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </div>
        ) : (
          <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0", isSelected ? "border-red-500 bg-red-500" : "border-zinc-600")}>
            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        )}
      </div>
    );
  }

  // Grid view
  const cardContent = (
    <div
      className={cn(
        "relative group rounded-md overflow-hidden bg-zinc-900 border transition-all select-none",
        isSelected ? "border-red-500 ring-2 ring-red-500" : "border-zinc-800"
      )}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onClick={handleClick}
    >
      <div className="aspect-[2/3] w-full bg-zinc-800 relative">
        {item.poster ? (
          <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center">
            <span className="text-xs text-zinc-500 line-clamp-3">{item.title}</span>
          </div>
        )}

        {/* Selection overlay */}
        {selectionMode && (
          <div className={cn("absolute inset-0 transition-colors", isSelected ? "bg-red-600/25" : "bg-transparent")} />
        )}

        {/* Checkmark badge */}
        {selectionMode && isSelected && (
          <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg z-10">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Unselected indicator in selection mode */}
        {selectionMode && !isSelected && (
          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full border-2 border-white/40 bg-black/30 z-10" />
        )}

        {/* Hover play overlay (non-selection mode) */}
        {!selectionMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Play className="h-10 w-10 text-white fill-current" />
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-xs text-white font-medium line-clamp-1">{item.title}</p>
        <p className="text-xs text-gray-500 capitalize">{item.type}</p>
      </div>

      {/* Remove button (non-selection mode only) */}
      {!selectionMode && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600 border border-white/20 transition-all flex items-center justify-center z-10"
          title="Remove from List"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  if (selectionMode) return <div className="cursor-pointer">{cardContent}</div>;
  return <Link href={`/${item.type}/${item.id}`}>{cardContent}</Link>;
}
