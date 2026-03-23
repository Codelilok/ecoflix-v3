import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useWishlist, WishlistItem } from "@/hooks/use-local-state";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, AlertCircle, CheckCircle2, Eye, X, ArrowLeft, List,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SharedItem = Omit<WishlistItem, "addedAt">;

interface ParsedShare {
  name: string;
  items: SharedItem[];
}

function decodeShareData(raw: string): ParsedShare | null {
  try {
    const json = decodeURIComponent(atob(raw));
    const parsed = JSON.parse(json);
    if (!parsed?.name || !Array.isArray(parsed?.items)) return null;
    return parsed as ParsedShare;
  } catch {
    return null;
  }
}

type Status = "preview" | "accepted" | "error";

export default function SharedWishlist() {
  const [, navigate] = useLocation();
  const { wishlist, addManyToWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("preview");
  const [addedCount, setAddedCount] = useState(0);
  const [justView, setJustView] = useState(false);

  const params = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("d");
  }, []);

  const share = useMemo(() => (params ? decodeShareData(params) : null), [params]);

  if (!share) {
    return (
      <Layout>
        <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-dashed border-red-800 flex items-center justify-center">
            <AlertCircle className="h-9 w-9 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
            <p className="text-zinc-500 max-w-sm text-sm">This wishlist link is broken or has expired. Ask the sender for a new link.</p>
          </div>
          <Link href="/">
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  const alreadyHave = share.items.filter(i => isInWishlist(i.id)).length;
  const newCount = share.items.length - alreadyHave;

  const handleAccept = () => {
    const count = addManyToWishlist(share.items);
    setAddedCount(count);
    setStatus("accepted");
  };

  const handleDecline = () => {
    navigate("/");
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (status === "accepted") {
    return (
      <Layout>
        <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-950 border-2 border-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">All Set!</h2>
            {addedCount > 0 ? (
              <p className="text-zinc-400 max-w-sm text-sm">
                Added <span className="text-white font-semibold">{addedCount} new movie{addedCount !== 1 ? "s" : ""}</span> to your list.
                {alreadyHave > 0 && ` (${alreadyHave} you already had were skipped.)`}
              </p>
            ) : (
              <p className="text-zinc-400 max-w-sm text-sm">You already had all {share.items.length} movies in your list!</p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/wishlist">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2">
                <Heart className="h-4 w-4 fill-current" /> View My List
              </button>
            </Link>
            <Link href="/browse">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                Browse More
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Preview / accept screen ────────────────────────────────────────────────
  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto min-h-[80vh] pb-16">

        {/* Header card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="h-5 w-5 text-red-500 fill-current" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">Shared Wishlist</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">"{share.name}"</h1>
          <p className="text-zinc-400 text-sm">
            {share.items.length} movie{share.items.length !== 1 ? "s" : ""}
            {alreadyHave > 0 && <span className="text-zinc-600"> · {alreadyHave} already in your list</span>}
          </p>

          {/* Action buttons */}
          {!justView && (
            <div className="flex gap-3 mt-6 justify-center flex-wrap">
              <button
                onClick={handleAccept}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <Heart className="h-4 w-4 fill-current" />
                Accept{newCount > 0 ? ` (${newCount} new)` : " All"}
              </button>
              <button
                onClick={() => setJustView(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> Just View
              </button>
              <button
                onClick={handleDecline}
                className="bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 border border-zinc-800"
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          )}

          {justView && (
            <p className="mt-4 text-xs text-zinc-600">Viewing only — nothing has been added to your list.</p>
          )}
        </div>

        {/* Movies grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {share.items.map(item => {
            const owned = isInWishlist(item.id);
            return (
              <Link href={`/${item.type}/${item.id}`} key={`${item.type}-${item.id}`}>
                <div className="relative group rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer">
                  <div className="aspect-[2/3] w-full bg-zinc-800 relative">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 text-center">
                        <span className="text-xs text-zinc-500 line-clamp-3">{item.title}</span>
                      </div>
                    )}
                    {owned && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center" title="Already in your list">
                        <Heart className="h-2.5 w-2.5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-white font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom accept bar (sticky for easy access on long lists) */}
        {!justView && share.items.length > 6 && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex gap-3 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl px-5 py-3 shadow-2xl">
              <button
                onClick={handleAccept}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
              >
                <Heart className="h-4 w-4 fill-current" />
                Accept{newCount > 0 ? ` (${newCount} new)` : ""}
              </button>
              <button
                onClick={handleDecline}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
