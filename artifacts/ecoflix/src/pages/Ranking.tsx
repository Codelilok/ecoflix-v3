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

function getRankBadgeStyle(index: number) {
  if (index === 0) return "bg-yellow-400 text-black";
  if (index === 1) return "bg-slate-300 text-black";
  if (index === 2) return "bg-amber-600 text-white";
  return "bg-zinc-800 text-zinc-300 border border-zinc-700";
}

function RankingItem({ item, index }: { item: MediaItem; index: number }) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const year = getYear(item);
  const itemType = getType(item);
  const rating = (item as any).imdbRatingValue;

  return (
    <Link href={`/${itemType}/${item.subjectId}`}>
      <div className="group cursor-pointer">
        {/* Poster card */}
        <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-[2/3] w-full shadow-lg">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="h-10 w-10 text-zinc-700" />
            </div>
          )}

          {/* Rank badge */}
          <div className={cn(
            "absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-md",
            getRankBadgeStyle(index)
          )}>
            {index + 1}
          </div>

          {/* Rating badge */}
          {rating && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-md">
              <Star className="h-2.5 w-2.5 fill-current" /> {rating}
            </div>
          )}

          {/* Bottom gradient + title overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-8 pb-2 px-2">
            <p className="text-white font-semibold text-xs leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
              {title}
            </p>
            {year && (
              <p className="text-zinc-400 text-[10px] mt-0.5">{year}</p>
            )}
          </div>
        </div>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
