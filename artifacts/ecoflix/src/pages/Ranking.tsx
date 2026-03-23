import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { useRanking, useSearchCategory, useBrowseCategory, useTrending } from "@/hooks/use-ecoflix";
import { getTitle, getPoster, getYear, getType, cn } from "@/lib/utils";
import { Trophy, Film, Star, ArrowLeft, Tv, Clapperboard } from "lucide-react";
import { MediaItem } from "@/lib/api-types";

type CategoryId =
  | "series" | "movies" | "nollywood" | "sa-drama"
  | "action" | "horror" | "romance"
  | "anime" | "k-drama" | "c-drama" | "thai-drama";

const CATEGORIES: { id: CategoryId; label: string; icon?: React.ReactNode }[] = [
  { id: "series",     label: "Series",       icon: <Tv className="h-3.5 w-3.5" /> },
  { id: "movies",     label: "Movies",       icon: <Clapperboard className="h-3.5 w-3.5" /> },
  { id: "nollywood",  label: "Nollywood" },
  { id: "sa-drama",   label: "SA Drama" },
  { id: "action",     label: "Action" },
  { id: "horror",     label: "Horror" },
  { id: "romance",    label: "Romance" },
  { id: "anime",      label: "Anime" },
  { id: "k-drama",    label: "K-Drama" },
  { id: "c-drama",    label: "C-Drama" },
  { id: "thai-drama", label: "Thai Drama" },
];

function getRankLabel(index: number) {
  if (index === 0) return { text: "text-yellow-400", shadow: "drop-shadow-[0_1px_4px_rgba(250,204,21,0.6)]" };
  if (index === 1) return { text: "text-slate-300",  shadow: "drop-shadow-[0_1px_4px_rgba(203,213,225,0.5)]" };
  if (index === 2) return { text: "text-amber-500",  shadow: "drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]" };
  return { text: "text-white", shadow: "drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" };
}

function RankingItem({ item, index }: { item: MediaItem; index: number }) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const year = getYear(item);
  const itemType = getType(item);
  const rating = (item as any).imdbRatingValue;
  const isTop3 = index < 3;
  const { text: rankText, shadow: rankShadow } = getRankLabel(index);

  return (
    <Link href={`/${itemType}/${item.subjectId}`}>
      <div className="flex items-center gap-4 px-3 py-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 cursor-pointer group">

        {/* Poster with rank overlaid */}
        <div className="relative flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden bg-zinc-800 shadow-lg">
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
          {/* Rank number on poster */}
          <div className="absolute inset-0 flex items-start justify-start p-1.5">
            <span className={cn(
              "font-black leading-none select-none",
              rankText,
              rankShadow,
              isTop3 ? "text-4xl" : "text-3xl"
            )}
              style={{ WebkitTextStroke: isTop3 ? "0.5px rgba(0,0,0,0.4)" : "0.5px rgba(0,0,0,0.6)" }}
            >
              {index + 1}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-white leading-snug group-hover:text-red-400 transition-colors",
            isTop3 ? "text-base" : "text-sm"
          )}>
            {title}
          </p>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {year && <span className="text-xs text-zinc-500">{year}</span>}
            {rating && (
              <span className="flex items-center gap-0.5 text-yellow-400 text-xs font-semibold">
                <Star className="h-2.5 w-2.5 fill-current" /> {rating}
              </span>
            )}
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide",
              itemType === "tv"
                ? "bg-blue-900/40 text-blue-400 border border-blue-800/40"
                : "bg-red-900/40 text-red-400 border border-red-800/40"
            )}>
              {itemType === "tv" ? "Series" : "Movie"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RankingContent({ categoryId }: { categoryId: CategoryId }) {
  const { data: movieRaw, isLoading: loadingMovies } = useRanking("movie");
  const { data: tvRaw,    isLoading: loadingTv }     = useRanking("tv");
  const { data: trending }                            = useTrending();
  const { data: nollywoodData, isLoading: loadingNollywood } = useSearchCategory("Nollywood");
  const { data: saData,        isLoading: loadingSA }        = useSearchCategory("South African");
  const { data: actionData,    isLoading: loadingAction }    = useBrowseCategory("Action");
  const { data: horrorData,    isLoading: loadingHorror }    = useBrowseCategory("Horror");
  const { data: romanceData,   isLoading: loadingRomance }   = useSearchCategory("Romance");
  const { data: animeData,     isLoading: loadingAnime }     = useBrowseCategory("Animation");
  const { data: kdramaData,    isLoading: loadingKdrama }    = useSearchCategory("K-Drama");
  const { data: cdramaData,    isLoading: loadingCdrama }    = useSearchCategory("C-Drama");
  const { data: thaiData,      isLoading: loadingThai }      = useSearchCategory("Thai Drama");

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
    case "nollywood":  isLoading = loadingNollywood; items = nollywoodData || []; break;
    case "sa-drama":   isLoading = loadingSA;        items = saData        || []; break;
    case "action":     isLoading = loadingAction;    items = actionData    || []; break;
    case "horror":     isLoading = loadingHorror;    items = horrorData    || []; break;
    case "romance":    isLoading = loadingRomance;   items = romanceData   || []; break;
    case "anime":      isLoading = loadingAnime;     items = animeData     || []; break;
    case "k-drama":    isLoading = loadingKdrama;    items = kdramaData    || []; break;
    case "c-drama":    isLoading = loadingCdrama;    items = cdramaData    || []; break;
    case "thai-drama": isLoading = loadingThai;      items = thaiData      || []; break;
  }

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner className="h-10 w-10" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24 text-gray-500">
        <Film className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
        <p>No content found right now.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
                    "flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
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
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-4">
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
