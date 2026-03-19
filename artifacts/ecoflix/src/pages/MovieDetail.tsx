import { useParams } from "wouter";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDetail, useRecommend } from "@/hooks/use-ecoflix";
import { useWishlist } from "@/hooks/use-local-state";
import { ContentRow } from "@/components/ContentRow";
import { getTitle, getPoster, getYear, getGenres, cn } from "@/lib/utils";
import { Play, Plus, Check, Star, Calendar, Globe } from "lucide-react";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading, error } = useDetail(id);
  const { data: recommend } = useRecommend(id);
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (isLoading) return <Layout><FullPageLoader /></Layout>;

  if (error || !movie) {
    return (
      <Layout>
        <div className="pt-32 text-center text-white">
          <p className="text-xl">Could not load movie details.</p>
          <Link href="/">
            <button className="mt-4 bg-red-600 px-6 py-2 rounded font-bold">Go Home</button>
          </Link>
        </div>
      </Layout>
    );
  }

  const title = getTitle(movie);
  const poster = getPoster(movie);
  const year = getYear(movie);
  const genres = getGenres(movie);
  const isSaved = isInWishlist(movie.subjectId);

  return (
    <Layout>
      <div className="relative w-full h-[65vh] md:h-[80vh]">
        {poster && (
          <img src={poster} alt={title} className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-14 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="hidden md:block w-48 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/10">
              {poster && <img src={poster} alt={title} className="w-full h-auto" />}
            </div>
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg leading-tight">{title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                {movie.imdbRatingValue && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="h-4 w-4 fill-current" /> {movie.imdbRatingValue} IMDb
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {year}
                  </span>
                )}
                {movie.countryName && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" /> {movie.countryName}
                  </span>
                )}
                <span className="px-2 py-0.5 border border-gray-600 rounded bg-black/40 text-xs uppercase font-bold tracking-wider">
                  Movie
                </span>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <span key={g} className="text-xs text-gray-300 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-300 md:text-base max-w-2xl leading-relaxed line-clamp-4">
                {movie.description || "No description available."}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link href={`/player?id=${movie.subjectId}&type=movie`}>
                  <button className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded font-bold text-base hover:bg-red-700 transition-colors shadow-lg">
                    <Play className="h-5 w-5 fill-current" /> Play Now
                  </button>
                </Link>

                <button
                  onClick={() => toggleWishlist({
                    id: movie.subjectId,
                    type: 'movie',
                    title,
                    poster,
                  })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded font-semibold text-sm border transition-all",
                    isSaved
                      ? "bg-green-600/20 border-green-500 text-green-400"
                      : "bg-zinc-800/80 border-zinc-600 text-white hover:border-white"
                  )}
                >
                  {isSaved ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {isSaved ? "In List" : "Add to List"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto w-full px-6 md:px-14 py-10 space-y-10">
        {movie.stars && movie.stars.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-5 text-white">Cast</h3>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {movie.stars.slice(0, 12).map((actor, i) => (
                <div key={i} className="flex flex-col items-center w-20 shrink-0 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    {actor.avatar?.url ? (
                      <img src={actor.avatar.url} alt={actor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Star className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium leading-tight text-white line-clamp-2">{actor.name}</p>
                  {actor.role && <p className="text-xs text-gray-500 line-clamp-1">{actor.role}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {recommend && recommend.length > 0 && (
          <ContentRow title="You May Also Like" items={recommend} />
        )}
      </div>
    </Layout>
  );
}
