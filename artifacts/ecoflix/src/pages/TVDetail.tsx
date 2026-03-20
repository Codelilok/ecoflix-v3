import { useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDetail, useRecommend, usePlay } from "@/hooks/use-ecoflix";
import { useWishlist } from "@/hooks/use-local-state";
import { ContentRow } from "@/components/ContentRow";
import { getTitle, getPoster, getYear, getGenres, cn } from "@/lib/utils";
import { Play, Plus, Check, Star, Calendar, Share2, Download, ChevronRight, Tv, User, Film } from "lucide-react";

interface EpisodeActionsProps {
  showId: string;
  seasonNumber: number;
  epNum: number;
  epTitle: string;
}

function EpisodeActions({ showId, seasonNumber, epNum, epTitle }: EpisodeActionsProps) {
  const { data: streamData } = usePlay(showId, 'tv', String(seasonNumber), String(epNum));
  const streamUrl = streamData?.streams?.[0]?.proxyUrl || streamData?.streams?.[0]?.url;
  const downloadUrl = streamData?.streams?.[0]?.downloadUrl || streamUrl;

  return (
    <div className="mt-4 p-4 bg-zinc-800/60 rounded-xl border border-zinc-700">
      <p className="text-sm font-bold text-white mb-3">
        Season {seasonNumber} – Episode {epNum}
        {epTitle !== `Episode ${epNum}` && <span className="text-gray-400 font-normal ml-1">· {epTitle}</span>}
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link href={`/player?id=${showId}&type=tv&season=${seasonNumber}&episode=${epNum}`}>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-lg">
            <Play className="h-4 w-4 fill-current" /> Stream
          </button>
        </Link>
        {downloadUrl ? (
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors">
              <Download className="h-4 w-4" /> Download
            </button>
          </a>
        ) : (
          <button disabled className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 text-zinc-500 px-6 py-3 rounded-lg font-bold text-sm cursor-not-allowed">
            <Download className="h-4 w-4" /> Download
          </button>
        )}
      </div>
    </div>
  );
}

function shareMedia(title: string, id: string) {
  const url = `${window.location.origin}/tv/${id}`;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => {});
  }
}

export default function TVDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading, error } = useDetail(id);
  const { data: recommend } = useRecommend(id);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0);
  const [selectedEpisode, setSelectedEpisode] = useState<{ num: number; title: string } | null>(null);

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

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => toggleWishlist({ id: show.subjectId, type: 'tv', title, poster })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm border transition-all",
                    isSaved ? "bg-green-600/20 border-green-500 text-green-400" : "bg-zinc-800/80 border-zinc-600 text-white hover:border-white"
                  )}
                >
                  {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSaved ? "In My List" : "Add to List"}
                </button>

                <button
                  onClick={() => shareMedia(title, show.subjectId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm border border-zinc-600 bg-zinc-800/80 text-white hover:border-white transition-all"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto w-full px-6 md:px-14 py-10 space-y-12">

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Film className="h-5 w-5 text-red-500" />
            <h3 className="text-xl font-bold text-white">Trailer</h3>
          </div>
          <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video max-w-3xl">
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
              <Film className="h-12 w-12" />
              <p className="text-sm">Trailer not available</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-white mb-3">Overview</h3>
          {show.description ? (
            <p className="text-gray-300 text-base leading-relaxed max-w-3xl">{show.description}</p>
          ) : (
            <p className="text-gray-500 text-sm italic">No overview available for this title.</p>
          )}
        </section>

        {show.stars && show.stars.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <User className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-bold text-white">Cast</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {show.stars.slice(0, 15).map((actor, i) => (
                <div key={i} className="flex flex-col items-center w-24 shrink-0 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                    {actor.avatar?.url ? (
                      <img
                        src={actor.avatar.url}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-zinc-700 text-zinc-300 font-bold text-lg">${actor.name?.charAt(0) || '?'}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-zinc-300 font-bold text-lg">
                        {actor.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-2">{actor.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {seasons.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Tv className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-bold text-white">Episodes &amp; Seasons</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-56 flex-shrink-0">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 px-1">Seasons</p>
                <div className="space-y-1.5">
                  {seasons.map((s, i) => {
                    const sNum = s.seasonNumber ?? s.season ?? (i + 1);
                    const epCount = s.episodes?.length || 0;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedSeasonIdx(i); setSelectedEpisode(null); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all",
                          selectedSeasonIdx === i
                            ? "bg-red-600 text-white"
                            : "bg-zinc-900/60 text-gray-300 hover:bg-zinc-800 border border-zinc-800"
                        )}
                      >
                        <span>Season {sNum}{s.seasonName ? ` — ${s.seasonName}` : ''}</span>
                        {epCount > 0 && (
                          <span className={cn("text-xs font-bold rounded-full px-2 py-0.5", selectedSeasonIdx === i ? "bg-white/20" : "bg-zinc-700 text-zinc-400")}>
                            {epCount} ep
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 px-1">
                  Season {seasonNumber} Episodes
                </p>
                {currentSeason?.episodes && currentSeason.episodes.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {currentSeason.episodes.map((ep, epIdx) => {
                      const epNum = ep.episodeNumber ?? ep.episode ?? (epIdx + 1);
                      const epTitle = ep.title ?? ep.name ?? `Episode ${epNum}`;
                      const isSelected = selectedEpisode?.num === epNum;
                      return (
                        <div key={epIdx}>
                          <button
                            onClick={() => setSelectedEpisode(isSelected ? null : { num: epNum, title: epTitle })}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                              isSelected
                                ? "bg-zinc-800 border-red-600/50"
                                : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors",
                              isSelected ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400"
                            )}>
                              {epNum}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate transition-colors", isSelected ? "text-red-400" : "text-white")}>{epTitle}</p>
                              {ep.duration && <p className="text-xs text-gray-500">{Math.floor(ep.duration / 60)} min</p>}
                            </div>
                            <ChevronRight className={cn("h-4 w-4 flex-shrink-0 transition-transform", isSelected ? "rotate-90 text-red-400" : "text-gray-600")} />
                          </button>

                          {isSelected && (
                            <EpisodeActions showId={show.subjectId} seasonNumber={seasonNumber} epNum={epNum} epTitle={epTitle} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500 flex flex-col items-center gap-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
                    <Tv className="h-10 w-10" />
                    <p>No episode data available for this season</p>
                  </div>
                )}
              </div>
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
