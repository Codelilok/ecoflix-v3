import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { useRanking, useSearchCategory, useBrowseCategory, useTrending } from "@/hooks/use-ecoflix";
import { getTitle, getPoster, getYear, getType, cn } from "@/lib/utils";
import { Trophy, Film, Star, ArrowLeft, Tv, Clapperboard } from "lucide-react";
import { MediaItem } from "@/lib/api-types";

type CategoryId = "series" | "movies" | "nollywood" | "sa-drama" | "action" | "horror" | "romance";

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
  { id: "series",    label: "Series",    icon: <Tv className="h-3.5 w-3.5" /> },
  { id: "movies",    label: "Movies",    icon: <Clapperboard className="h-3.5 w-3.5" /> },
  { id: "nollywood", label: "Nollywood", icon: null },
  { id: "sa-drama",  label: "SA Drama",  icon: null },
  { id: "action",    label: "Action",    icon: null },
  { id: "horror",    label: "Horror",    icon: null },
  { id: "romance",   label: "Romance",   icon: null },
];

function getMedalColor(index: number) {
  if (index === 0) return "text-yellow-400";
  if (index === 1) return "text-slate-300";
  if (index === 2) return "text-amber-600";
  return "text-zinc-600";
}

function RankingItem({ item, index }: { item: MediaItem; index: number }) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const year = getYear(item);
  const itemType = getType(item);
  const rating = (item as any).imdbRatingValue;
  const genres = (item as any).genre
    ? String((item as any).genre).split(",").map((g: string) => g.trim()).filter(Boolean).slice(0, 2)
    : [];

  const isTop3 = index < 3;

  return (
    <Link href={`/${itemType}/${item.subjectId}`}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer group",
        isTop3
          ? "bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-zinc-700 hover:border-red-500/40"
          : "bg-zinc-950 border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-600"
      )}>

        {/* Rank number */}
        <div className={cn(
          "flex-shrink-0 font-black tabular-nums text-right leading-none",
          getMedalColor(index),
          index === 0 ? "text-5xl w-12" :
          index === 1 ? "text-4xl w-12" :
          index === 2 ? "text-4xl w-12" :
          "text-2xl w-10 opacity-70"
        )}>
          {index + 1}
        </div>

        {/* Poster */}
        <div className={cn(
          "flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800 shadow-lg",
          isTop3 ? "w-16 md:w-20" : "w-14 md:w-16"
        )} style={{ aspectRatio: "2/3" }}>
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-6 w-6 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold text-white truncate group-hover:text-red-400 transition-colors leading-snug",
            isTop3 ? "text-base md:text-lg" : "text-sm md:text-base"
          )}>
            {title}
          </h3>

          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5">
            {year && (
              <span className="text-xs text-zinc-500">{year}</span>
            )}
            {rating && (
              <span className="flex items-center gap-0.5 text-yellow-400 font-semibold text-xs">
                <Star className="h-3 w-3 fill-current" /> {rating}
              </span>
            )}
          </div>

          {genres.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {genres.map(g => (
                <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                  {g}
                </span>
              ))}
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                itemType === "tv"
                  ? "bg-blue-950/60 border border-blue-800/50 text-blue-400"
                  : "bg-red-950/60 border border-red-800/50 text-red-400"
              )}>
                {itemType === "tv" ? "Series" : "Movie"}
              </span>
            </div>
          )}
        </div>

        {/* Top 3 glow accent */}
        {isTop3 && (
          <div className={cn(
            "flex-shrink-0 w-1 self-stretch rounded-full",
            index === 0 ? "bg-yellow-400" :
            index === 1 ? "bg-slate-300" :
            "bg-amber-600"
          )} />
        )}
      </div>
    </Link>
  );
}

function RankingContent({ categoryId }: { categoryId: CategoryId }) {
  const { data: movieRaw, isLoading: loadingMovies } = useRanking("movie");
  const { data: tvRaw,    isLoading: loadingTv }     = useRanking("tv");
  const { data: trending                             } = useTrending();
  const { data: nollywoodData, isLoading: loadingNollywood } = useSearchCategory("Nollywood");
  const { data: saData,        isLoading: loadingSA }        = useSearchCategory("South African");
  const { data: actionData,    isLoading: loadingAction }    = useBrowseCategory("Action");
  const { data: horrorData,    isLoading: loadingHorror }    = useBrowseCategory("Horror");
  const { data: romanceData,   isLoading: loadingRomance }   = useSearchCategory("Romance");

  let isLoading = false;
  let items: MediaItem[] = [];

  switch (categoryId) {
    case "series": {
      isLoading = loadingTv;
      const fromRanking = (tvRaw || []).filter(i => i.subjectType === 2);
      const fromTrending = (trending || []).filter(i => i.subjectType === 2);
      items = fromRanking.length > 0 ? fromRanking : fromTrending;
      break;
    }
    case "movies": {
      isLoading = loadingMovies;
      const fromRanking = (movieRaw || []).filter(i => i.subjectType === 1);
      items = fromRanking.length > 0 ? fromRanking : (movieRaw || []);
      break;
    }
    case "nollywood": {
      isLoading = loadingNollywood;
      items = nollywoodData || [];
      break;
    }
    case "sa-drama": {
      isLoading = loadingSA;
      items = saData || [];
      break;
    }
    case "action": {
      isLoading = loadingAction;
      items = actionData || [];
      break;
    }
    case "horror": {
      isLoading = loadingHorror;
      items = horrorData || [];
      break;
    }
    case "romance": {
      isLoading = loadingRomance;
      items = romanceData || [];
      break;
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24 text-gray-500">
        <Film className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
        <p>No content found right now. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <RankingItem key={`${item.subjectId}-${index}`} item={item} index={index} />
      ))}
    </div>
  );
}

export default function Ranking() {
  const [selectedId, setSelectedId] = useState<CategoryId>("series");
  const selected = CATEGORIES.find(c => c.id === selectedId)!;

  return (
    <Layout>
      <div className="pt-24 px-4 md:px-14 max-w-screen-xl mx-auto w-full min-h-screen pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
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

        <div className="flex gap-4 md:gap-8">

          {/* Left sidebar */}
          <div className="w-28 md:w-40 flex-shrink-0">
            <div className="flex flex-col gap-1 sticky top-24">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  className={cn(
                    "flex items-center gap-2 text-left px-3 py-3 rounded-xl text-sm font-semibold transition-all",
                    selectedId === cat.id
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-800/70"
                  )}
                >
                  {cat.icon && <span className="opacity-80">{cat.icon}</span>}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-5 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-white">{selected.label}</h2>
              <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">Top Ranked</span>
            </div>
            <RankingContent key={selectedId} categoryId={selectedId} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
