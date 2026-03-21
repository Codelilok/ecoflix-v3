import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDetail, useRecommend, usePlay } from "@/hooks/use-ecoflix";
import { useWishlist } from "@/hooks/use-local-state";
import { ContentRow } from "@/components/ContentRow";
import { CastCard } from "@/components/CastCard";
import { QualityModal } from "@/components/QualityModal";
import { getTitle, getPoster, getYear, getGenres, cn } from "@/lib/utils";
import {
  Play, Plus, Check, Star, Calendar, Share2, Download,
  ChevronDown, Tv, Users, ArrowLeft, X, Loader2, Minus,
} from "lucide-react";
import { Stream, EpisodeItem } from "@/lib/api-types";

function shareMedia(title: string, id: string) {
  const url = `${window.location.origin}/tv/${id}`;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Link copied!")).catch(() => {});
  }
}

/* ─── EpisodeModal ─── */

interface EpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  showTitle: string;
  seasonNumber: number;
  epNum: number;
  epTitle: string;
}

function EpisodeModal({ isOpen, onClose, showId, showTitle, seasonNumber, epNum, epTitle }: EpisodeModalProps) {
  const [, setLocation] = useLocation();
  const { data: streamData, isLoading } = usePlay(showId, "tv", String(seasonNumber), String(epNum));
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const streams: Stream[] = streamData?.streams || [];
  const subtitles: any[] = (streamData as any)?.data?.subtitles || (streamData as any)?.subtitles || [];
  const modalTitle = `Season ${seasonNumber} - Episode ${epNum}`;

  if (!isOpen) return null;

  const handleStreamSelect = (stream: Stream) => {
    const url = stream.proxyUrl || stream.url;
    setLocation(`/player?id=${showId}&type=tv&season=${seasonNumber}&episode=${epNum}&streamUrl=${encodeURIComponent(url)}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div
          className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{modalTitle}</p>
              <h3 className="text-white font-bold text-base mt-0.5 line-clamp-2">
                {epTitle !== `Episode ${epNum}` ? epTitle : showTitle}
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors ml-3 flex-shrink-0">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-gray-400 text-sm">{modalTitle}</p>

            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (streams.length === 0) {
                      setLocation(`/player?id=${showId}&type=tv&season=${seasonNumber}&episode=${epNum}`);
                      onClose();
                    } else {
                      setShowStreamModal(true);
                    }
                  }}
                  className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-95 w-full justify-center"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Stream Episode
                </button>

                <button
                  onClick={() => { if (streams.length > 0) setShowDownloadModal(true); }}
                  disabled={streams.length === 0}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-95 w-full justify-center",
                    streams.length > 0
                      ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-400 text-white"
                      : "bg-zinc-800/50 border border-zinc-700 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download Episode
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <QualityModal
        isOpen={showStreamModal}
        onClose={() => setShowStreamModal(false)}
        streams={streams}
        title={showTitle}
        mode="stream"
        onSelectStream={handleStreamSelect}
        episodeLabel={modalTitle}
      />
      <QualityModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        streams={streams}
        title={showTitle}
        mode="download"
        episodeLabel={modalTitle}
        subtitles={subtitles}
      />
    </>
  );
}

/* ─── ManualEpisodePicker ─── shown when API returns no season data ─── */

function ManualEpisodePicker({ onSelect }: { onSelect: (season: number, ep: number) => void }) {
  const [season, setSeason] = useState(1);
  const [ep, setEp] = useState(1);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-6 max-w-sm">
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Season picker */}
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Season</p>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-700">
            <button
              onClick={() => setSeason(Math.max(1, season - 1))}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Minus className="h-3.5 w-3.5 text-white" />
            </button>
            <span className="flex-1 text-center text-white font-black text-xl">{season}</span>
            <button
              onClick={() => setSeason(season + 1)}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <span className="text-white font-bold text-lg leading-none">+</span>
            </button>
          </div>
        </div>

        {/* Episode picker */}
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Episode</p>
          <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-700">
            <button
              onClick={() => setEp(Math.max(1, ep - 1))}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Minus className="h-3.5 w-3.5 text-white" />
            </button>
            <span className="flex-1 text-center text-white font-black text-xl">{ep}</span>
            <button
              onClick={() => setEp(ep + 1)}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <span className="text-white font-bold text-lg leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSelect(season, ep)}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 w-full justify-center"
      >
        <Play className="h-4 w-4 fill-current" />
        Watch Season {season} · Episode {ep}
      </button>
    </div>
  );
}

/* ─── TVDetail ─── */

export default function TVDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: show, isLoading, error } = useDetail(id);
  const { data: recommend } = useRecommend(id);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [expandedSeasonIdx, setExpandedSeasonIdx] = useState<number | null>(0);
  const [selectedEpisode, setSelectedEpisode] = useState<{ seasonNum: number; epNum: number; epTitle: string } | null>(null);

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
  const seasons = Array.isArray(show.resource) ? show.resource : [];
  const hasSeasons = seasons.length > 0;
  const totalEpisodes = seasons.reduce((sum, s) => sum + (s.episodes?.length || 0), 0);

  return (
    <Layout>
      {/* Hero */}
      <div className="relative w-full h-[55vh] md:h-[70vh]">
        {poster && <img src={poster} alt={title} className="w-full h-full object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <button
          onClick={() => window.history.back()}
          className="absolute top-20 left-6 md:left-14 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 border border-white/20 hover:bg-black/80 transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-6 md:px-14 pb-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="hidden md:block w-40 lg:w-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              {poster && <img src={poster} alt={title} className="w-full h-auto" />}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">{title}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                {show.imdbRatingValue && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="h-4 w-4 fill-current" /> {show.imdbRatingValue} IMDb
                  </span>
                )}
                {year && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {year}</span>}
                {show.countryName && <span className="flex items-center gap-1 text-gray-300">{show.countryName}</span>}
                <span className="px-2 py-0.5 border border-gray-600 rounded text-xs uppercase font-bold bg-black/40">TV Series</span>
                {hasSeasons && <span className="text-gray-400">{seasons.length} Season{seasons.length !== 1 ? "s" : ""}</span>}
                {totalEpisodes > 0 && <span className="text-gray-400">{totalEpisodes} Episode{totalEpisodes !== 1 ? "s" : ""}</span>}
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map(g => (
                    <span key={g} className="text-xs text-gray-300 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">{g}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button
                  onClick={() => toggleWishlist({ id: show.subjectId, type: "tv", title, poster })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all",
                    isSaved ? "bg-green-600/20 border-green-500 text-green-400" : "bg-zinc-800/80 border-zinc-600 text-white hover:border-white"
                  )}
                >
                  {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSaved ? "In My List" : "Add to List"}
                </button>

                <button
                  onClick={() => shareMedia(title, show.subjectId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border border-zinc-600 bg-zinc-800/80 text-white hover:border-white transition-all"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto w-full px-6 md:px-14 py-8 space-y-10">

        {/* Overview */}
        <section>
          <h3 className="text-xl font-bold text-white mb-3">Overview</h3>
          {show.description ? (
            <p className="text-gray-300 text-base leading-relaxed max-w-3xl">{show.description}</p>
          ) : (
            <p className="text-gray-500 text-sm italic">No overview available for this title.</p>
          )}
        </section>

        {/* Cast */}
        {show.stars && show.stars.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Users className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-bold text-white">Cast</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
              {show.stars.slice(0, 15).map((actor, i) => (
                <CastCard
                  key={i}
                  name={actor.name}
                  role={actor.role || actor.character}
                  avatarUrl={(actor as any).avatarUrl || actor.avatar?.url}
                />
              ))}
            </div>
          </section>
        )}

        {/* Episodes & Seasons — always shown for TV shows */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Tv className="h-5 w-5 text-red-500" />
            <h3 className="text-xl font-bold text-white">Episodes &amp; Seasons</h3>
          </div>

          {!hasSeasons ? (
            /* Fallback: manual season + episode picker */
            <ManualEpisodePicker
              onSelect={(season, ep) =>
                setSelectedEpisode({ seasonNum: season, epNum: ep, epTitle: `Episode ${ep}` })
              }
            />
          ) : (
            /* Full accordion with season + episode data from API */
            <div className="space-y-3 max-w-2xl">
              {seasons.map((s, i) => {
                const sNum = s.seasonNumber ?? s.season ?? (i + 1);
                const epCount = s.episodes?.length || 0;
                const isExpanded = expandedSeasonIdx === i;

                return (
                  <div key={i} className="rounded-xl overflow-hidden border border-zinc-800">
                    <button
                      onClick={() => setExpandedSeasonIdx(isExpanded ? null : i)}
                      className={cn(
                        "w-full flex items-center justify-between px-5 py-4 text-left transition-all",
                        isExpanded ? "bg-zinc-800 border-b border-zinc-700" : "bg-zinc-900/60 hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black transition-colors",
                          isExpanded ? "bg-red-600 text-white" : "bg-zinc-700 text-gray-300"
                        )}>
                          {sNum}
                        </div>
                        <p className={cn("font-semibold text-sm", isExpanded ? "text-white" : "text-gray-200")}>
                          Season {sNum}{s.seasonName ? ` — ${s.seasonName}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {epCount > 0 && (
                          <span className="text-xs text-gray-400 font-medium">
                            {epCount} episode{epCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <ChevronDown className={cn(
                          "h-5 w-5 text-gray-400 transition-transform duration-200",
                          isExpanded ? "rotate-180 text-red-400" : ""
                        )} />
                      </div>
                    </button>

                    {isExpanded && s.episodes && s.episodes.length > 0 && (
                      <div className="bg-zinc-950/60 divide-y divide-zinc-800/50">
                        {s.episodes.map((ep: EpisodeItem, epIdx: number) => {
                          const epNum = ep.episodeNumber ?? ep.episode ?? (epIdx + 1);
                          const epTitle = ep.title ?? ep.name ?? `Episode ${epNum}`;

                          return (
                            <button
                              key={epIdx}
                              onClick={() => setSelectedEpisode({ seasonNum: sNum, epNum, epTitle })}
                              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/60 transition-colors text-left group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-red-600/20 border border-zinc-700 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-red-400 transition-colors flex-shrink-0">
                                {epNum}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200 group-hover:text-white font-medium truncate transition-colors">
                                  {epTitle}
                                </p>
                                {ep.duration && (
                                  <p className="text-xs text-gray-500">{Math.floor(ep.duration / 60)} min</p>
                                )}
                              </div>
                              <Play className="h-4 w-4 text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && (!s.episodes || s.episodes.length === 0) && (
                      <div className="bg-zinc-950/60 py-8 text-center text-gray-500 text-sm">
                        No episodes available for this season
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommendations */}
        {recommend && recommend.length > 0 && (
          <ContentRow title="More Like This" items={recommend} />
        )}
      </div>

      {selectedEpisode && (
        <EpisodeModal
          isOpen={true}
          onClose={() => setSelectedEpisode(null)}
          showId={show.subjectId}
          showTitle={title}
          seasonNumber={selectedEpisode.seasonNum}
          epNum={selectedEpisode.epNum}
          epTitle={selectedEpisode.epTitle}
        />
      )}
    </Layout>
  );
}
