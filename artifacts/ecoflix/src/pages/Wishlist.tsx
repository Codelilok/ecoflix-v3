import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useWishlist } from "@/hooks/use-local-state";
import { Heart, Trash2, Play, Search } from "lucide-react";
import { getType } from "@/lib/utils";

export default function Wishlist() {
  const { wishlist, toggleWishlist, clearWishlist } = useWishlist();
  const sorted = [...wishlist].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-[80vh]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            My List
          </h1>

          {wishlist.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Clear your entire wishlist?")) clearWishlist();
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded bg-zinc-900 border border-zinc-700 hover:border-red-500/50"
            >
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center">
              <Heart className="h-9 w-9 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your List is Empty</h2>
              <p className="text-gray-500 max-w-sm mx-auto text-sm">
                Save movies and shows to watch them later.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/browse">
                <button className="bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition-colors">
                  Browse Content
                </button>
              </Link>
              <Link href="/search">
                <button className="bg-zinc-800 text-white px-6 py-3 rounded font-bold hover:bg-zinc-700 transition-colors border border-zinc-600 flex items-center gap-2">
                  <Search className="h-4 w-4" /> Search
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {sorted.map((item) => {
              const type = item.type || 'movie';
              return (
                <div key={`${type}-${item.id}`} className="relative group rounded-md overflow-hidden bg-zinc-900 border border-zinc-800">
                  <Link href={`/${type}/${item.id}`}>
                    <div className="aspect-[2/3] w-full bg-zinc-800 relative cursor-pointer">
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

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="h-10 w-10 text-white fill-current" />
                      </div>
                    </div>
                  </Link>

                  <div className="p-2">
                    <p className="text-xs text-white font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{type}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(item);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full text-gray-300 hover:text-white hover:bg-red-600 border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from List"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
