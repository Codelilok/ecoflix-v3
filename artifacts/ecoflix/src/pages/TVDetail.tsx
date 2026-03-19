import { useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDetail, useRecommend } from "@/hooks/use-ecoflix";
import { useWishlist } from "@/hooks/use-local-state";
import { ContentRow } from "@/components/ContentRow";
import { getTitle, getPoster, getYear, getGenres, cn } from "@/lib/utils";
import { Play, Plus, Check, Star, Calendar, ChevronDown, Tv } from "lucide-react";

export default function TVDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading, error } = useDetail(id);
  const { data: recommend } = useRecommend(id);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0);

  if (isLoading) return <Layout><FullPageLoader /></Layout>;

  if (error || !show) {
    return (
      <Layout>
        <div className="pt-32 text-center text-white">
          <p className="text-xl">Could not load TV show details.</p>
          <Link href="/"><button className="mt-4 bg-red-600 px-6 py-2 rounded font-bold">Go Home</button></Link>
        </div>
      </Layout>
    );
  }

  const title = getTitle(show);
  const poster = getPoster(show);
  const year = getYear(show);
  const genres = getGenres(show);
  const isSaved = isInWishlist(show.subjectId);

  const seasons = show.resource || [];
  const currentSeason = seasons[selectedSeasonIdx];
  const seasonNumber = currentSeason?.seasonNumber ?? currentSeason?.season ?? (selectedSeasonIdx + 1);

  return (
    <Layout>
      <div className="relative w-full h-[60vh] md:h-[75vh]">
        {poster && <img src={poster} alt={title} className="w-full h-full object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-14 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="hidden md:block w-40 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/10">
              {poster && <img src={poster} alt={title} className="w-full h-auto" />}
            </div>
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">{title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                {show.imdbRatingValue && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="h-4 w-4 fill-current" /> {show.imdbRatingValue} IMDb
                  </span>
                )}
                {year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {year}</span>}
                <span className="px-2 py-0.5 border border-gray-600 rounded bg-black/40 text-xs uppercase font-bold">TV Series</span>
                {seasons.length > 0 && <span>{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>}
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => (
                    <span key={g} className="text-xs text-gray-300 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">{g}</span>
                  ))}
                </div>
              )}

              <p className="text-gray-300 max-w-2xl leading-relaxed line-clamp-3">
                {show.description || "No description available."}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link href={`/player?id=${show.subjectId}&type=tv&season=${seasonNumber}&episode=1`}>
                  <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded font-bold text-base hover:bg-gray-200 transition-colors shadow-lg">
                    <Play className="h-5 w-5 fill-current" /> Play S{seasonNumber} E1
                  </button>
                </Link>

                <button
                  onClick={() => toggleWishlist({ id: show.subjectId, type: 'tv', title, poster })}
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
        {seasons.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-xl font-bold text-white">Episodes</h3>
              {seasons.length > 1 && (
                <div className="relative">
                  <select
                    className="appearance-none bg-zinc-800 border border-zinc-600 text-white px-4 py-2 pr-8 rounded focus:outline-none focus:border-red-500"
                    value={selectedSeasonIdx}
                    onChange={(e) => setSelectedSeasonIdx(Number(e.target.value))}
                  >
                    {seasons.map((s, i) => (
                      <option key={i} value={i}>
                        Season {s.seasonNumber ?? s.season ?? (i + 1)} {s.seasonName ? `— ${s.seasonName}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {currentSeason?.episodes && currentSeason.episodes.length > 0 ? (
                currentSeason.episodes.map((ep, epIdx) => {
                  const epNum = ep.episodeNumber ?? ep.episode ?? (epIdx + 1);
                  const epTitle = ep.title ?? ep.name ?? `Episode ${epNum}`;
                  return (
                    <Link
                      key={epIdx}
                      href={`/player?id=${show.subjectId}&type=tv&season=${seasonNumber}&episode=${epNum}`}
                    >
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 transition-colors">
                          <span className="text-sm font-bold text-gray-400 group-hover:text-white">{epNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-red-400 transition-colors">{epTitle}</p>
                          {ep.duration && (
                            <p className="text-xs text-gray-500">{Math.floor(ep.duration / 60)} min</p>
                          )}
                        </div>
                        <Play className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                  <Tv className="h-8 w-8" />
                  <p>No episode data available</p>
                </div>
              )}
            </div>
          </section>
        )}

        {show.stars && show.stars.length > 0 && (
          <section>
            <h3 className="text-xl font-bold mb-5 text-white">Cast</h3>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {show.stars.slice(0, 12).map((actor, i) => (
                <div key={i} className="flex flex-col items-center w-20 shrink-0 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    {actor.avatar?.url ? (
                      <img src={actor.avatar.url} alt={actor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Star className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-2">{actor.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {recommend && recommend.length > 0 && (
          <ContentRow title="More Like This" items={recommend} />
        )}
      </div>
    </Layout>
  );
}
