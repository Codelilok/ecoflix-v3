import { useParams, Link } from "wouter";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FullPageLoader } from "@/components/ui/spinner";
import { useDetail, useRecommend, usePlay } from "@/hooks/use-ecoflix";
import { useWishlist } from "@/hooks/use-local-state";
import { ContentRow } from "@/components/ContentRow";
import { CastCard } from "@/components/CastCard";
import { QualityModal } from "@/components/QualityModal";
import { getTitle, getPoster, getYear, getGenres, cn } from "@/lib/utils";
import { Play, Plus, Check, Star, Calendar, Globe, Download, Share2, Film, Users, ArrowLeft } from "lucide-react";
import { Stream } from "@/lib/api-types";
import { useLocation } from "wouter";

function shareMedia(title: string, id: string) {
  const url = `${window.location.origin}/movie/${id}`;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!")).catch(() => {});
  }
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: movie, isLoading, error } = useDetail(id);
  const { data: recommend } = useRecommend(id);
  const { data: streamData, isLoading: streamLoading } = usePlay(id, 'movie');
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  if (isLoading) return <Layout><FullPageLoader /></Layout>;

  if (error || !movie) {
    return (
      <Layout>
        <div className="pt-32 text-center text-white">
          <p className="text-xl">Could not load movie details.</p>
          <Link href="/"><button className="mt-4 bg-red-600 px-6 py-2 rounded font-bold">Go Home</button></Link>
        </div>
      </Layout>
    );
  }

  const title = getTitle(movie);
  const poster = getPoster(movie);
  const year = getYear(movie);
  const genres = getGenres(movie);
  const isSaved = isInWishlist(movie.subjectId);
  const streams: Stream[] = streamData?.streams || [];
  const subtitles: any[] = (streamData as any)?.data?.subtitles || (streamData as any)?.subtitles || [];

  const handleStreamSelect = (stream: Stream) => {
    const url = stream.proxyUrl || stream.url;
    setLocation(`/player?id=${movie.subjectId}&type=movie&streamUrl=${encodeURIComponent(url)}`);
  };

  return (
    <Layout>
      <div className="relative w-full h-[55vh] md:h-[70vh]">
        {poster && <img src={poster} alt={title} className="w-full h-full object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <button
          onClick={() => window.history.back()}
          className="absolute top-20 left-6 md:left-14 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 border border-white/20 hover:bg-black/80 transition-all backdrop-blur-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-6 md:px-14 pb-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="hidden md:block w-40 lg:w-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10">
              {poster && <img src={poster} alt={title} className="w-full h-auto" />}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                {movie.imdbRatingValue && (
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Star className="h-4 w-4 fill-current" /> {movie.imdbRatingValue} IMDb
                  </span>
                )}
                {year && <span className="flex items-center gap-1 text-gray-300"><Calendar className="h-4 w-4" /> {year}</span>}
                {movie.countryName && <span className="flex items-center gap-1 text-gray-300"><Globe className="h-4 w-4" /> {movie.countryName}</span>}
                <span className="px-2 py-0.5 border border-gray-600 rounded text-xs uppercase font-bold tracking-wider bg-black/40">Movie</span>
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
                  onClick={() => toggleWishlist({ id: movie.subjectId, type: 'movie', title, poster })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all",
                    isSaved ? "bg-green-600/20 border-green-500 text-green-400" : "bg-zinc-800/80 border-zinc-600 text-white hover:border-white"
                  )}
                >
                  {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSaved ? "In My List" : "Add to List"}
                </button>

                <button
                  onClick={() => shareMedia(title, movie.subjectId)}
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
          {movie.description ? (
            <p className="text-gray-300 text-base leading-relaxed max-w-3xl">{movie.description}</p>
          ) : (
            <p className="text-gray-500 text-sm italic">No overview available for this title.</p>
          )}
        </section>

        {/* Cast */}
        {movie.stars && movie.stars.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Users className="h-5 w-5 text-red-500" />
              <h3 className="text-xl font-bold text-white">Cast</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {movie.stars.slice(0, 15).map((actor, i) => (
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

        {/* Watch & Download */}
        <section className="bg-zinc-900/70 rounded-2xl border border-zinc-800 p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-5">Watch &amp; Download</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                if (streams.length === 0) {
                  setLocation(`/player?id=${movie.subjectId}&type=movie`);
                } else {
                  setShowStreamModal(true);
                }
              }}
              disabled={streamLoading}
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-base transition-colors shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 fill-current" />
              {streamLoading ? 'Loading...' : 'Stream Now'}
            </button>

            <button
              onClick={() => {
                if (streams.length > 0) setShowDownloadModal(true);
              }}
              disabled={streamLoading || streams.length === 0}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base transition-colors active:scale-95",
                streams.length > 0 && !streamLoading
                  ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-400 text-white"
                  : "bg-zinc-800/50 border border-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              <Download className="h-5 w-5" />
              Download
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Stream in your browser or download for offline viewing.</p>
        </section>

        {/* Recommendations */}
        {recommend && recommend.length > 0 && (
          <ContentRow title="You May Also Like" items={recommend} />
        )}
      </div>

      <QualityModal
        isOpen={showStreamModal}
        onClose={() => setShowStreamModal(false)}
        streams={streams}
        title={title}
        mode="stream"
        onSelectStream={handleStreamSelect}
      />

      <QualityModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        streams={streams}
        title={title}
        mode="download"
        subtitles={subtitles}
      />
    </Layout>
  );
}
