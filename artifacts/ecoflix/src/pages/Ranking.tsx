import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { useRanking, useSearchCategory, useBrowseCategory } from "@/hooks/use-ecoflix";
import { getTitle, getPoster, getYear, getType, cn } from "@/lib/utils";
import { Trophy, Film, Star, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { MediaItem } from "@/lib/api-types";

type Category = {
  id: string;
  label: string;
  source: "ranking-movie" | "ranking-tv" | "search" | "browse";
  filterGenre?: string;
  keyword?: string;
  browseGenre?: string;
};

const CATEGORIES: Category[] = [
  { id: "popular-series",   label: "Popular Series",      source: "ranking-tv" },
  { id: "popular-movies",   label: "Popular Movies",      source: "ranking-movie" },
  { id: "nollywood",        label: "Nollywood Movies",    source: "search",         keyword: "Nollywood" },
  { id: "anime",            label: "Anime",               source: "ranking-tv",     filterGenre: "Animation", browseGenre: "Animation" },
  { id: "south-african",    label: "South African Drama", source: "search",         keyword: "South African" },
  { id: "k-drama",          label: "K-Drama",             source: "search",         keyword: "K-Drama" },
  { id: "c-drama",          label: "C-Drama",             source: "search",         keyword: "C-Drama" },
  { id: "thai-drama",       label: "Thai Drama",          source: "search",         keyword: "Thai Drama" },
  { id: "action-movies",    label: "Action Movies",       source: "ranking-movie",  filterGenre: "Action",     browseGenre: "Action" },
  { id: "horror-movies",    label: "Horror Movies",       source: "ranking-movie",  filterGenre: "Horror",     browseGenre: "Horror" },
  { id: "teen-romance",     label: "Teen Romance",        source: "search",         keyword: "Teen Romance" },
];

function getMedalStyle(index: number) {
  if (index === 0) return "text-yellow-400 text-4xl md:text-5xl font-black";
  if (index === 1) return "text-gray-300 text-3xl md:text-4xl font-black";
  if (index === 2) return "text-amber-600 text-3xl md:text-4xl font-black";
  return "text-zinc-500 text-2xl md:text-3xl font-bold";
}

function RankingItem({ item, index }: { item: MediaItem; index: number }) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const year = getYear(item);
  const itemType = getType(item);
  const rating = (item as any).imdbRatingValue;

  return (
    <Link href={`/${itemType}/${item.subjectId}`}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border group",
        index < 3
          ? "bg-gradient-to-r from-zinc-900 to-black border-zinc-700 hover:border-zinc-500"
          : "bg-zinc-950 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-700"
      )}>
        <div className="w-10 md:w-14 text-center flex-shrink-0">
          <span className={getMedalStyle(index)}>{index + 1}</span>
        </div>

        <div className="w-10 md:w-14 aspect-[2/3] rounded bg-zinc-800 flex-shrink-0 overflow-hidden">
          {poster ? (
            <img src={poster} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-5 w-5 text-zinc-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm md:text-base truncate group-hover:text-red-400 transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
            {year && <span>{year}</span>}
            {item.genre && <span>{item.genre.split(",")[0]}</span>}
            {rating && (
              <span className="flex items-center gap-0.5 text-yellow-400 font-semibold">
                <Star className="h-3 w-3 fill-current" /> {rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function RankingContent({ category }: { category: Category }) {
  const movieRanking = useRanking("movie");
  const tvRanking = useRanking("tv");
  const searchResult = useSearchCategory(category.keyword || "");
  const browseResult = useBrowseCategory(category.browseGenre || "");

  const isRankingSource = category.source === "ranking-movie" || category.source === "ranking-tv";
  const rankingData = category.source === "ranking-tv" ? tvRanking : movieRanking;
  const isLoading = isRankingSource
    ? rankingData.isLoading
    : category.source === "search"
    ? searchResult.isLoading
    : browseResult.isLoading;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>;
  }

  let items: MediaItem[] = [];

  if (category.source === "search") {
    items = searchResult.data || [];
  } else if (category.source === "browse") {
    items = browseResult.data || [];
  } else {
    const raw = rankingData.data || [];
    if (category.filterGenre) {
      const filtered = raw.filter(i =>
        ((i as any).genre || "").toLowerCase().includes(category.filterGenre!.toLowerCase())
      );
      items = filtered.length > 0 ? filtered : (browseResult.data || raw);
    } else {
      items =
        category.source === "ranking-movie"
          ? raw.filter(i => i.subjectType === 1).length > 0
            ? raw.filter(i => i.subjectType === 1)
            : raw
          : raw;
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Film className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
        <p className="text-lg">No content available for {category.label} right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <RankingItem key={`${item.subjectId}-${index}`} item={item} index={index} />
      ))}
    </div>
  );
}

export default function Ranking() {
  const [selectedId, setSelectedId] = useState("popular-series");
  const selectedCategory = CATEGORIES.find(c => c.id === selectedId) || CATEGORIES[0];

  return (
    <Layout>
      <div className="pt-24 px-4 md:px-14 max-w-screen-xl mx-auto w-full min-h-screen pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-all flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-red-500" />
            Top Rankings
          </h1>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-4 md:gap-6">

          {/* Left sidebar */}
          <div className="w-36 md:w-48 flex-shrink-0">
            <div className="flex flex-col gap-1 sticky top-24">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  className={cn(
                    "text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    selectedId === cat.id
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-3">
              {selectedCategory.label}
            </h2>
            <RankingContent key={selectedCategory.id} category={selectedCategory} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
