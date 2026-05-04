import { useState, useCallback } from "react";
import { Link } from "wouter";
import { X, Dice6, Play, Heart, RefreshCw, Star } from "lucide-react";
import { MediaItem } from "@/lib/api-types";
import { getTitle, getPoster, getType, getYear, getGenres } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";

const BASE_URL = "https://movieapi.xcasper.space/api";

const GENRES = [
  { label: "Any Genre", value: "" },
  { label: "Action", value: "Action" },
  { label: "Comedy", value: "Comedy" },
  { label: "Horror", value: "Horror" },
  { label: "Romance", value: "Romance" },
  { label: "Thriller", value: "Thriller" },
  { label: "Drama", value: "Drama" },
  { label: "Animation", value: "Animation" },
  { label: "Sci-Fi", value: "Science Fiction" },
];

async function fetchRandomMovie(genre: string): Promise<MediaItem | null> {
  const pages = [1, 2, 3];
  const page = pages[Math.floor(Math.random() * pages.length)];
  const endpoint = genre
    ? `${BASE_URL}/browse?genre=${encodeURIComponent(genre)}&page=${page}`
    : `${BASE_URL}/trending`;
  const res = await fetch(endpoint, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success) return null;
  let items: MediaItem[] = [];
  if (json.data?.items) items = json.data.items;
  else if (json.data?.subjectList) items = json.data.subjectList;
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

interface SurpriseMeProps {
  onClose: () => void;
}

type State = "pick" | "loading" | "result";

export function SurpriseMe({ onClose }: SurpriseMeProps) {
  const [genre, setGenre] = useState("");
  const [state, setState] = useState<State>("pick");
  const [result, setResult] = useState<MediaItem | null>(null);
  const [visible, setVisible] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const roll = useCallback(async () => {
    setState("loading");
    setVisible(false);
    setResult(null);
    try {
      const movie = await fetchRandomMovie(genre);
      setResult(movie);
      setState("result");
      setTimeout(() => setVisible(true), 50);
    } catch {
      setState("pick");
    }
  }, [genre]);

  const inWishlist = result ? isInWishlist(result.subjectId) : false;

  const handleWishlist = () => {
    if (!result) return;
    toggleWishlist({
      id: result.subjectId,
      type: getType(result),
      title: getTitle(result),
      poster: getPoster(result),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-zinc-900 dark-mode:bg-zinc-900 light-mode:bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-800 light-mode:border-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-white light-mode:hover:text-zinc-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {state === "pick" && (
          <div className="p-8 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center">
                <Dice6 className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white light-mode:text-zinc-900 text-center">
                Surprise Me
              </h2>
              <p className="text-zinc-400 light-mode:text-zinc-500 text-sm text-center">
                Can't decide? Let us pick something for you.
              </p>
            </div>

            <div className="w-full">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                Filter by Genre
              </p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenre(g.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      genre === g.value
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 light-mode:bg-zinc-100 light-mode:text-zinc-700 light-mode:hover:bg-zinc-200"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={roll}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-bold text-base transition-colors active:scale-95"
            >
              <Dice6 className="h-5 w-5" />
              Roll for a Movie
            </button>
          </div>
        )}

        {state === "loading" && (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center animate-bounce">
              <Dice6 className="h-8 w-8 text-red-500 animate-spin" />
            </div>
            <p className="text-zinc-400 light-mode:text-zinc-500 text-sm font-medium animate-pulse">
              Rolling the dice…
            </p>
          </div>
        )}

        {state === "result" && result && (
          <div
            className={cn(
              "flex flex-col transition-opacity duration-500",
              visible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
              {getPoster(result) ? (
                <img
                  src={getPoster(result)}
                  alt={getTitle(result)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <Dice6 className="h-12 w-12 text-zinc-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  {getType(result) === "tv" ? "TV Series" : "Movie"}
                </span>
                {getYear(result) && (
                  <span className="text-xs text-zinc-400">{getYear(result)}</span>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-white light-mode:text-zinc-900 mb-1">
                  {getTitle(result)}
                </h3>
                {getGenres(result).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {getGenres(result).slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="text-xs text-zinc-400 light-mode:text-zinc-500 border border-zinc-700 light-mode:border-zinc-200 px-2 py-0.5 rounded"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {(result as any).imdbRatingValue && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-zinc-300 light-mode:text-zinc-600">
                      {(result as any).imdbRatingValue}
                    </span>
                  </div>
                )}
                {result.description && (
                  <p className="text-sm text-zinc-400 light-mode:text-zinc-500 line-clamp-3">
                    {result.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/${getType(result)}/${result.subjectId}`} onClick={onClose}>
                  <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors active:scale-95">
                    <Play className="h-4 w-4 fill-current" />
                    Watch Now
                  </button>
                </Link>

                <button
                  onClick={roll}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 light-mode:bg-zinc-100 light-mode:hover:bg-zinc-200 text-white light-mode:text-zinc-800 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" />
                  Another
                </button>

                <button
                  onClick={handleWishlist}
                  className={cn(
                    "ml-auto flex items-center justify-center w-10 h-10 rounded-lg transition-colors active:scale-95",
                    inWishlist
                      ? "bg-red-600/20 text-red-500"
                      : "bg-zinc-800 text-zinc-400 hover:text-red-400 light-mode:bg-zinc-100 light-mode:hover:text-red-500"
                  )}
                  title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
                </button>
              </div>
            </div>
          </div>
        )}

        {state === "result" && !result && (
          <div className="p-8 flex flex-col items-center gap-4">
            <p className="text-zinc-400 light-mode:text-zinc-500 text-sm text-center">
              Couldn't find a movie. Try a different genre.
            </p>
            <button
              onClick={() => setState("pick")}
              className="text-red-500 text-sm font-semibold hover:underline"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
