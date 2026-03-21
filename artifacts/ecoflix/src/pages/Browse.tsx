import { useState, useCallback, useEffect } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { Spinner } from "@/components/ui/spinner";
import { useBrowse, useSearchCategory } from "@/hooks/use-ecoflix";
import { MediaItem } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Horror", "Romance", "Documentary", "Animation", "Crime", "Adventure", "K-Drama", "C-Drama", "Nollywood"];

const CATEGORY_MAP: Record<string, { label: string; useSearch?: boolean; keyword?: string; genre?: string }> = {
  "Popular Series": { label: "Popular Series", genre: "Drama" },
  "Popular Movies": { label: "Popular Movies", genre: "Action" },
  "Nollywood Movies": { label: "Nollywood Movies", useSearch: true, keyword: "Nollywood" },
  "Anime": { label: "Anime", genre: "Animation" },
  "South African Drama": { label: "South African Drama", useSearch: true, keyword: "South African" },
  "K-Drama": { label: "K-Drama", useSearch: true, keyword: "K-Drama" },
  "C-Drama": { label: "C-Drama", useSearch: true, keyword: "C-Drama" },
  "Thai Drama": { label: "Thai Drama", useSearch: true, keyword: "Thai Drama" },
  "Action Movies": { label: "Action Movies", genre: "Action" },
  "Horror Movies": { label: "Horror Movies", genre: "Horror" },
  "Teen Romance": { label: "Teen Romance", useSearch: true, keyword: "Teen Romance" },
};

function CategoryGrid({ category, genre, keyword, useSearchMode }: { category: string; genre?: string; keyword?: string; useSearchMode?: boolean }) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<MediaItem[]>([]);

  const browseQuery = useBrowse(genre || "Action", page);
  const searchQuery = useSearchCategory(keyword || "");

  const isLoading = useSearchMode ? false : (browseQuery.isLoading && page === 1);
  const isFetching = browseQuery.isFetching;
  const hasMore = useSearchMode ? false : (browseQuery.data?.hasMore || false);

  const currentItems = useSearchMode
    ? (searchQuery.data || [])
    : (browseQuery.data?.items || []);

  const combined = page === 1 ? currentItems : [
    ...allItems,
    ...currentItems.filter(i => !allItems.some(a => a.subjectId === i.subjectId))
  ];

  const displayItems = page === 1 ? currentItems : combined;

  const handleLoadMore = () => {
    setAllItems(combined);
    setPage(p => p + 1);
  };

  if (isLoading || searchQuery.isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>;
  }

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">No content found for {category}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {displayItems.map((item, i) => (
          <MediaCard key={`${item.subjectId}-${i}`} item={item} />
        ))}
      </div>

      {hasMore && !useSearchMode && (
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
  );
}

export default function Browse() {
  const [search] = useSearch();
  const params = new URLSearchParams(search || "");
  const initialGenre = params.get("genre") || "";
  const initialCategory = params.get("category") || "";

  const preselectedCategory = CATEGORY_MAP[initialCategory];
  const preselectedGenre = initialGenre || preselectedCategory?.genre || GENRES[0];

  const [mode, setMode] = useState<'genre' | 'category'>(initialCategory && CATEGORY_MAP[initialCategory] ? 'category' : 'genre');
  const [selectedGenre, setSelectedGenre] = useState(preselectedGenre);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<MediaItem[]>([]);

  const { data, isLoading, isFetching } = useBrowse(selectedGenre, page);
  const currentItems = data?.items || [];
  const hasMore = data?.hasMore || false;

  const combined = page === 1 ? currentItems : [
    ...allItems,
    ...currentItems.filter(i => !allItems.some(a => a.subjectId === i.subjectId))
  ];
  const displayItems = page === 1 ? currentItems : combined;

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setMode('genre');
    setSelectedCategory('');
    setPage(1);
    setAllItems([]);
  }, []);

  const handleLoadMore = () => {
    setAllItems(combined);
    setPage(p => p + 1);
  };

  const catConfig = CATEGORY_MAP[selectedCategory];

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-screen pb-16">
        <div className="flex flex-col gap-5 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {mode === 'category' && selectedCategory ? selectedCategory : 'Browse'}
          </h1>

          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  mode === 'genre' && selectedGenre === genre
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-zinc-900 border-zinc-700 text-gray-300 hover:border-zinc-500 hover:text-white"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {mode === 'category' && catConfig ? (
          <CategoryGrid
            category={selectedCategory}
            genre={catConfig.genre}
            keyword={catConfig.keyword}
            useSearchMode={catConfig.useSearch}
          />
        ) : (
          <>
            {isLoading && page === 1 ? (
              <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
            ) : displayItems.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
          </>
        )}
      </div>
    </Layout>
  );
}
