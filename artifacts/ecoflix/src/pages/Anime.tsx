import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Search, X, Play, Loader2, ChevronLeft, TrendingUp, Flame, Clock, Star, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const ANIME_API = "https://apis.xcasper.space/api/anime";

/* ─── Types ─── */
interface AnimeItem { id: string; name: string; image: string; episode: string; type: string; poster: string; }
interface AnimeDetail { id?: string; name?: string; image?: string; poster?: string; description?: string; type?: string; status?: string; genres?: string[]; }
interface EpisodeItem { id: string; number: number; title?: string; hasSub?: boolean; hasDub?: boolean; }
interface ServerItem { id: string; name: string; type?: string; }
type SourceResult = { type: "iframe"; link: string } | { type: "direct"; url: string };

/* ─── API ─── */
async function fetchAnimeList(action: string): Promise<AnimeItem[]> {
  const res = await fetch(`${ANIME_API}?action=${action}`);
  const json = await res.json();
  return json.data?.animes || json.data?.results || [];
}

async function searchAnime(q: string): Promise<AnimeItem[]> {
  const res = await fetch(`${ANIME_API}?action=search&q=${encodeURIComponent(q)}`);
  const json = await res.json();
  return json.data?.animes || json.data?.results || [];
}

async function fetchAnimeDetail(id: string): Promise<AnimeDetail | null> {
  const res = await fetch(`${ANIME_API}?action=detail&id=${encodeURIComponent(id)}`);
  const json = await res.json();
  return json.data?.anime || json.data || null;
}

async function fetchEpisodes(id: string): Promise<EpisodeItem[]> {
  const res = await fetch(`${ANIME_API}?action=episodes&id=${encodeURIComponent(id)}`);
  const json = await res.json();
  const eps = json.data?.episodes || json.data || [];
  return Array.isArray(eps) ? eps : [];
}

async function fetchServers(id: string, epId: string): Promise<ServerItem[]> {
  const res = await fetch(`${ANIME_API}?action=servers&id=${encodeURIComponent(id)}&ep=${encodeURIComponent(epId)}`);
  const json = await res.json();
  const servers = json.data?.servers || json.data || [];
  return Array.isArray(servers) ? servers : [];
}

async function fetchSources(serverId: string): Promise<SourceResult | null> {
  const res = await fetch(`${ANIME_API}?action=sources&id=${encodeURIComponent(serverId)}`);
  const json = await res.json();
  const d = json.data;
  if (!d) return null;
  if (d.type === "iframe" && d.link) return { type: "iframe", link: d.link };
  const sources: any[] = d.sources || [];
  const best = sources.find((s: any) => s.isM3U8 || s.url?.includes(".m3u8")) || sources[0];
  if (best?.url) return { type: "direct", url: best.url };
  return null;
}

/* ─── Iframe Player (full screen) ─── */
function IframePlayer({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-white font-semibold text-sm truncate flex-1">{title}</p>
      </div>
      <iframe
        src={src}
        className="w-full flex-1 border-none bg-black"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/* ─── Anime Card ─── */
function AnimeCard({ anime, onClick }: { anime: AnimeItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-all text-left">
      <div className="aspect-[2/3] bg-zinc-800 relative overflow-hidden">
        <img
          src={anime.poster || anime.image}
          alt={anime.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
            <Play className="h-4 w-4 text-white fill-current" />
          </div>
        </div>
        {anime.type && (
          <span className="absolute top-1.5 right-1.5 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            {anime.type}
          </span>
        )}
        {anime.episode && (
          <span className="absolute top-1.5 left-1.5 bg-black/75 text-gray-200 text-[9px] font-medium px-1.5 py-0.5 rounded">
            {anime.episode}
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-gray-200 text-xs font-medium line-clamp-2 leading-tight">{anime.name}</p>
      </div>
    </button>
  );
}

/* ─── Type badge colours ─── */
const TYPE_STYLES: Record<string, string> = {
  sub: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  hsub: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  dub: "bg-green-600/20 text-green-300 border-green-500/30",
};
const TYPE_LABEL: Record<string, string> = { sub: "SUB", hsub: "HSUB", dub: "DUB" };

/* ─── Detail Panel ─── */
function DetailPanel({
  animeId,
  animeName,
  animePoster,
  onClose,
  onPlay,
}: {
  animeId: string;
  animeName: string;
  animePoster: string;
  onClose: () => void;
  onPlay: (src: string, title: string) => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loadingEps, setLoadingEps] = useState(true);
  const [selectedEp, setSelectedEp] = useState<EpisodeItem | null>(null);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("sub");

  const { data: detail } = useQuery({
    queryKey: ["anime-detail", animeId],
    queryFn: () => fetchAnimeDetail(animeId),
  });

  useEffect(() => {
    setLoadingEps(true);
    fetchEpisodes(animeId)
      .then(eps => { setEpisodes(eps); setLoadingEps(false); })
      .catch(() => setLoadingEps(false));
  }, [animeId]);

  const handleEpisodeClick = async (ep: EpisodeItem) => {
    setSelectedEp(ep);
    setLoadingServers(true);
    setServers([]);
    try {
      const svrs = await fetchServers(animeId, ep.id);
      setServers(svrs);
      const types = [...new Set(svrs.map(s => s.type?.toLowerCase() || "sub"))];
      if (types.includes("sub")) setActiveTypeFilter("sub");
      else if (types.includes("hsub")) setActiveTypeFilter("hsub");
      else setActiveTypeFilter(types[0] || "sub");
    } catch { setServers([]); }
    setLoadingServers(false);
  };

  const handleServerClick = async (server: ServerItem) => {
    setLoadingSourceId(server.id);
    try {
      const result = await fetchSources(server.id);
      if (result?.type === "iframe") {
        onPlay(result.link, `${animeName} — Ep ${selectedEp?.number} (${server.name})`);
      } else if (result?.type === "direct") {
        onPlay(result.url, `${animeName} — Ep ${selectedEp?.number} (${server.name})`);
      }
    } catch {}
    setLoadingSourceId(null);
  };

  const poster = animePoster || detail?.image || "";
  const typeGroups = [...new Set(servers.map(s => (s.type?.toLowerCase()) || "sub"))];
  const filteredServers = servers.filter(s => (s.type?.toLowerCase() || "sub") === activeTypeFilter);

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-5 py-4 flex items-center justify-between z-10">
          {selectedEp ? (
            <>
              <button onClick={() => { setSelectedEp(null); setServers([]); }} className="text-gray-400 hover:text-white transition-colors mr-3">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-white font-bold text-sm truncate flex-1">Episode {selectedEp.number}</h2>
            </>
          ) : (
            <h2 className="text-white font-bold text-base truncate flex-1 pr-4">{animeName}</h2>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white flex-shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5">
          {/* Anime info row */}
          {!selectedEp && (
            <div className="flex gap-4 mb-5">
              {poster && (
                <img src={poster} alt={animeName} className="w-20 h-28 rounded-xl object-cover flex-shrink-0 bg-zinc-800" />
              )}
              <div className="flex-1 min-w-0">
                {detail?.status && (
                  <span className="inline-block bg-green-600/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded mb-2">{detail.status}</span>
                )}
                {detail?.genres && detail.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {detail.genres.slice(0, 4).map(g => (
                      <span key={g} className="bg-zinc-800 text-gray-400 text-[10px] px-2 py-0.5 rounded">{g}</span>
                    ))}
                  </div>
                )}
                {detail?.description ? (
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{detail.description}</p>
                ) : (
                  <p className="text-gray-500 text-xs">Select an episode to start watching.</p>
                )}
              </div>
            </div>
          )}

          {/* Episodes list */}
          {!selectedEp && (
            <>
              <h3 className="text-white font-bold text-sm mb-3">
                Episodes
                {episodes.length > 0 && <span className="text-gray-500 font-normal ml-1">({episodes.length})</span>}
              </h3>
              {loadingEps ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                </div>
              ) : episodes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No episodes found</p>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {episodes.map((ep, i) => (
                    <button
                      key={ep.id || i}
                      onClick={() => handleEpisodeClick(ep)}
                      className="bg-zinc-800 hover:bg-red-600 border border-zinc-700 hover:border-red-500 rounded-xl py-3 text-center font-bold text-sm transition-all text-white"
                    >
                      {ep.number ?? i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Server selection */}
          {selectedEp && (
            <>
              <p className="text-gray-400 text-sm mb-4">Choose a server for Episode {selectedEp.number}</p>

              {loadingServers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                </div>
              ) : servers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No servers available for this episode</p>
              ) : (
                <>
                  {/* Type tabs */}
                  {typeGroups.length > 1 && (
                    <div className="flex gap-2 mb-4">
                      {typeGroups.map(t => (
                        <button
                          key={t}
                          onClick={() => setActiveTypeFilter(t)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            activeTypeFilter === t
                              ? "bg-purple-600 text-white border-purple-500"
                              : cn("border", TYPE_STYLES[t] || "bg-zinc-800 text-gray-300 border-zinc-600")
                          )}
                        >
                          {TYPE_LABEL[t] || t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Server buttons */}
                  <div className="flex flex-col gap-2">
                    {filteredServers.map((server, i) => {
                      const isLoading = loadingSourceId === server.id;
                      return (
                        <button
                          key={server.id || i}
                          onClick={() => handleServerClick(server)}
                          disabled={!!loadingSourceId}
                          className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/50 rounded-xl px-4 py-3.5 text-left transition-all disabled:opacity-60"
                        >
                          <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                            {isLoading
                              ? <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                              : <Play className="h-4 w-4 text-purple-400 fill-current" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{server.name}</p>
                            <p className="text-gray-500 text-xs">{isLoading ? "Loading stream…" : "Click to play"}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Hooks ─── */
function useAnimeList(action: string, enabled = true) {
  return useQuery({
    queryKey: ["anime", action],
    queryFn: () => fetchAnimeList(action),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

/* ─── Main Page ─── */
type AnimeTab = "trending" | "popular" | "latest" | "recent";
const TABS: { id: AnimeTab; label: string; icon: typeof TrendingUp }[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "latest", label: "Latest", icon: Star },
  { id: "recent", label: "Recent", icon: Clock },
];

export default function Anime() {
  const [activeTab, setActiveTab] = useState<AnimeTab>("trending");
  const [search, setSearch] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [player, setPlayer] = useState<{ src: string; title: string } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQ(val.trim()), 500);
  };

  const isSearching = searchQ.length > 1;

  const { data: trending, isLoading: loadingTrending } = useAnimeList("trending", activeTab === "trending" && !isSearching);
  const { data: popular, isLoading: loadingPopular } = useAnimeList("popular", activeTab === "popular" && !isSearching);
  const { data: latest, isLoading: loadingLatest } = useAnimeList("latest", activeTab === "latest" && !isSearching);
  const { data: recent, isLoading: loadingRecent } = useAnimeList("recent", activeTab === "recent" && !isSearching);

  const { data: searchData, isLoading: loadingSearch } = useQuery({
    queryKey: ["anime-search", searchQ],
    queryFn: () => searchAnime(searchQ),
    enabled: isSearching,
    staleTime: 2 * 60 * 1000,
  });

  const animeList = isSearching ? (searchData || []) :
    activeTab === "trending" ? (trending || []) :
    activeTab === "popular" ? (popular || []) :
    activeTab === "latest" ? (latest || []) :
    (recent || []);

  const isLoading = isSearching ? loadingSearch :
    activeTab === "trending" ? loadingTrending :
    activeTab === "popular" ? loadingPopular :
    activeTab === "latest" ? loadingLatest : loadingRecent;

  const handlePlay = useCallback((src: string, title: string) => {
    setSelectedAnime(null);
    setPlayer({ src, title });
  }, []);

  if (player) {
    return <IframePlayer src={player.src} title={player.title} onClose={() => setPlayer(null)} />;
  }

  return (
    <Layout>
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <Tv className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Anime</h1>
              <p className="text-gray-500 text-xs mt-0.5">Stream your favourite anime series</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anime..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(""); setSearchQ(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs (hidden when searching) */}
          {!isSearching && (
            <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                      isActive ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {isSearching && (
            <p className="text-gray-500 text-sm mb-4">
              {loadingSearch ? "Searching…" : `${animeList.length} result${animeList.length !== 1 ? "s" : ""} for "${searchQ}"`}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : animeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Tv className="h-12 w-12 text-zinc-700" />
              <p className="text-gray-400 text-sm">{isSearching ? `No anime found for "${searchQ}"` : "No anime available"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {animeList.map(anime => (
                <AnimeCard key={anime.id} anime={anime} onClick={() => setSelectedAnime(anime)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAnime && (
        <DetailPanel
          animeId={selectedAnime.id}
          animeName={selectedAnime.name}
          animePoster={selectedAnime.poster || selectedAnime.image}
          onClose={() => setSelectedAnime(null)}
          onPlay={handlePlay}
        />
      )}
    </Layout>
  );
}
