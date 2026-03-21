import { useState, useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";
import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { Spinner } from "@/components/ui/spinner";
import { useSearch, useTrending } from "@/hooks/use-ecoflix";
import { useSearchHistory } from "@/hooks/use-local-state";
import { Search as SearchIcon, Film, Tv, LayoutGrid, X, TrendingUp, Clock } from "lucide-react";
import { cn, getType } from "@/lib/utils";

const POPULAR_SEARCHES = ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Horror", "Romance", "Documentary", "Fantasy", "Adventure"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounceValue(query, 500);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const { data, isLoading } = useSearch(debouncedQuery);
  const { data: trending } = useTrending();
  const { searchHistory, addSearch, removeSearch, clearSearchHistory } = useSearchHistory();

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      addSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const results = Array.isArray(data) ? data : [];
  const filteredResults = filter === 'all'
    ? results
    : results.filter(item => getType(item) === filter);

  const everyoneSearching = (trending || []).slice(0, 10);

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-[80vh]">
        <div className="relative mb-8 max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-red-500 rounded-full py-4 pl-12 pr-4 text-lg text-white placeholder:text-gray-500 focus:outline-none transition-all"
            placeholder="Search movies, TV shows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex justify-center gap-3 mb-10">
          {[
            { id: 'all', label: 'All', icon: LayoutGrid },
            { id: 'movie', label: 'Movies', icon: Film },
            { id: 'tv', label: 'TV Shows', icon: Tv },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as 'all' | 'movie' | 'tv')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all border text-sm",
                filter === f.id
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-zinc-900 border-zinc-700 text-gray-300 hover:border-zinc-500"
              )}
            >
              <f.icon className="h-4 w-4" />
              {f.label}
            </button>
          ))}
        </div>

        {query.length < 2 ? (
          <div>
            {searchHistory.length > 0 && (
              <div className="max-w-2xl mx-auto mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent
                  </h3>
                  <button
                    onClick={clearSearchHistory}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map(term => (
                    <div
                      key={term}
                      className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-full pl-4 pr-2 py-2 group hover:border-zinc-500 transition-colors"
                    >
                      <button
                        onClick={() => setQuery(term)}
                        className="text-sm text-gray-200 hover:text-white transition-colors"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeSearch(term)}
                        className="w-5 h-5 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mb-10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Popular Searches</h3>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                {POPULAR_SEARCHES.map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="bg-zinc-900 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/50 border border-zinc-700 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {everyoneSearching.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-bold text-white">Everyone is Searching</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {everyoneSearching.map((item, i) => (
                    <MediaCard key={`${item.subjectId}-${i}`} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
            ) : filteredResults.length > 0 ? (
              <>
                <p className="text-gray-400 text-sm mb-4">{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{debouncedQuery}"</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {filteredResults.map((item, i) => (
                    <MediaCard key={`${item.subjectId}-${i}`} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <SearchIcon className="h-14 w-14 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No results for "{query}"</p>
                <p className="text-sm mt-2">Try a different keyword</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
