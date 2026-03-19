import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { Spinner } from "@/components/ui/spinner";
import { useBrowse } from "@/hooks/use-ecoflix";
import { MediaItem } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Horror", "Romance", "Documentary", "Animation", "Fantasy", "Crime", "Adventure"];

export default function Browse() {
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<MediaItem[]>([]);

  const { data, isLoading, isFetching } = useBrowse(selectedGenre, page);

  const currentItems = data?.items || [];
  const hasMore = data?.hasMore || false;

  const combinedItems = page === 1 ? currentItems : [...allItems, ...currentItems.filter(
    item => !allItems.some(a => a.subjectId === item.subjectId)
  )];

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setPage(1);
    setAllItems([]);
  }, []);

  const handleLoadMore = () => {
    setAllItems(combinedItems);
    setPage(p => p + 1);
  };

  const displayItems = page === 1 ? currentItems : combinedItems;

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-screen">
        <div className="flex flex-col gap-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white">Browse</h1>

          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  selectedGenre === genre
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-zinc-900 border-zinc-700 text-gray-300 hover:border-zinc-500 hover:text-white"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {isLoading && page === 1 ? (
          <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
        ) : displayItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {displayItems.map((item, i) => (
                <MediaCard key={`${item.subjectId}-${i}`} item={item} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10 mb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors border border-zinc-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isFetching && <Spinner className="h-4 w-4" />}
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No content found for {selectedGenre}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
