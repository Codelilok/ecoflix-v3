import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useTrending, useSearch, useBrowse } from "@/hooks/use-ecoflix";
import { getTitle, getPoster, getYear } from "@/lib/utils";
import { MediaItem } from "@/lib/api-types";
import {
  Users, Plus, ArrowRight, Copy, Check, RefreshCw, Play, Pause,
  Volume2, VolumeX, Send, X, ChevronLeft, Shuffle,
  SkipForward, Star, Coins, Crown, Tv, ChevronDown, Loader2, List,
  LogOut, Minus, MessageSquare, RotateCcw, RotateCw, Search,
} from "lucide-react";

const API_BASE = "https://movieapi.xcasper.space/api";
const API_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

function parseTimestamp(ts: string): number {
  const clean = ts.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
}

function parseVTT(text: string): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes("-->")) {
      const [startRaw, endRaw] = lines[i].split("-->").map((s) => s.trim().split(" ")[0]);
      const start = parseTimestamp(startRaw);
      const end = parseTimestamp(endRaw);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        const stripped = lines[i].replace(/<[^>]+>/g, "").trim();
        if (stripped) textLines.push(stripped);
        i++;
      }
      if (textLines.length > 0) cues.push({ start, end, text: textLines.join("\n") });
    } else { i++; }
  }
  return cues;
}

interface SubtitleOption { label: string; url: string; }

/* ─── Types ─── */
interface WatchPartyMovie {
  id: string;
  type: string;
  title: string;
  poster: string;
  year?: string;
  rating?: string;
  season?: string;
  episode?: string;
  episodeTitle?: string;
}

interface StreamOption {
  url: string;
  label: string;
}

interface PartyMember {
  id: string;
  name: string;
  hasSelected: boolean;
}

interface PartyStateData {
  code: string;
  hostId: string;
  members: PartyMember[];
  phase: string;
  currentMovieIdx: number;
  playbackState: { playing: boolean; time: number; updatedAt: number } | null;
  movies: WatchPartyMovie[];
}

interface ChatMessage {
  from: string;
  message: string;
  ts: number;
}

type AppPhase =
  | "entry"
  | "lobby"
  | "selecting"
  | "flipping"
  | "override"
  | "watching"
  | "between"
  | "done";

/* ─── Coin Flip Animation ─── */
function CoinFlip({ winner, onDone }: { winner: WatchPartyMovie; onDone: () => void }) {
  const [flipping, setFlipping] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setFlipping(false);
      setTimeout(onDone, 600);
    }, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-10">
      <p className="text-white font-bold text-lg">Flipping coin...</p>
      <div
        className={`w-24 h-24 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-xl shadow-yellow-500/30 ${flipping ? "animate-spin" : "scale-110 transition-transform duration-500"}`}
      >
        <Coins className="h-10 w-10 text-yellow-900" />
      </div>
      {!flipping && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
          <p className="text-yellow-400 font-black text-xl">🎉 Winner!</p>
          <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
            {winner.poster && (
              <img src={winner.poster} alt={winner.title} className="w-10 h-14 object-cover rounded-lg" />
            )}
            <p className="text-white font-bold">{winner.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Episode Picker for TV Shows ─── */
function WatchPartyEpisodePicker({
  item,
  onConfirm,
  onClose,
}: {
  item: MediaItem;
  onConfirm: (movie: WatchPartyMovie) => void;
  onClose: () => void;
}) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [manualSeason, setManualSeason] = useState<number>(1);
  const [manualEpisode, setManualEpisode] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/detail?subjectId=${encodeURIComponent(item.subjectId)}`, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((json) => {
        const rawResource = json?.data?.resource;
        const resource = Array.isArray(rawResource) ? rawResource : [];
        setDetail({ resource });
        const firstSeason = resource[0]?.seasonNumber ?? resource[0]?.season ?? 1;
        setSelectedSeason(Number(firstSeason));
        setSelectedEpisode(1);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [item.subjectId]);

  const seasons: any[] = Array.isArray(detail?.resource) ? detail.resource : [];
  const currentSeason = seasons.find(
    (s: any) => Number(s.seasonNumber ?? s.season) === selectedSeason
  ) ?? seasons[0];
  const episodes: any[] = currentSeason?.episodes || [];

  const handleConfirm = () => {
    const ep = episodes.find(
      (e) => Number(e.episodeNumber || e.episode) === selectedEpisode
    ) || episodes[0];
    const epNum = ep ? Number(ep.episodeNumber || ep.episode) : selectedEpisode;
    const epTitle = ep?.title || ep?.name || `Episode ${epNum}`;
    onConfirm({
      id: item.subjectId,
      type: "tv",
      title,
      poster: poster || "",
      year: getYear(item) || "",
      season: String(selectedSeason),
      episode: String(epNum),
      episodeTitle: epTitle,
    });
  };

  const handleManualConfirm = () => {
    onConfirm({
      id: item.subjectId,
      type: "tv",
      title,
      poster: poster || "",
      year: getYear(item) || "",
      season: String(manualSeason),
      episode: String(manualEpisode),
      episodeTitle: `Episode ${manualEpisode}`,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {poster && <img src={poster} alt={title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Tv className="h-3 w-3" /> TV Series
              </p>
              <h3 className="text-white font-bold text-sm mt-0.5 line-clamp-2">{title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center flex-shrink-0 ml-2">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin text-red-500" />
            </div>
          ) : seasons.length === 0 ? (
            /* Manual +/- picker when API has no episode data */
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2">Season</p>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                  <button onClick={() => setManualSeason(Math.max(1, manualSeason - 1))} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0">
                    <Minus className="h-3.5 w-3.5 text-white" />
                  </button>
                  <span className="flex-1 text-center text-white font-black text-2xl">{manualSeason}</span>
                  <button onClick={() => setManualSeason(manualSeason + 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg">+</button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-2">Episode</p>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                  <button onClick={() => setManualEpisode(Math.max(1, manualEpisode - 1))} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0">
                    <Minus className="h-3.5 w-3.5 text-white" />
                  </button>
                  <span className="flex-1 text-center text-white font-black text-2xl">{manualEpisode}</span>
                  <button onClick={() => setManualEpisode(manualEpisode + 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg">+</button>
                </div>
              </div>
              <button onClick={handleManualConfirm} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> S{manualSeason} · E{manualEpisode} — Add to Queue
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Season</label>
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(1); }}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-red-500 text-sm"
                  >
                    {seasons.map((s, i) => {
                      const sNum = Number(s.seasonNumber || s.season || i + 1);
                      return <option key={i} value={sNum}>Season {sNum}</option>;
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-2">Episode</label>
                <div className="relative">
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-red-500 text-sm"
                  >
                    {episodes.map((ep, i) => {
                      const epNum = Number(ep.episodeNumber || ep.episode || i + 1);
                      const epTitle = ep.title || ep.name || `Episode ${epNum}`;
                      return <option key={i} value={epNum}>Ep {epNum} — {epTitle}</option>;
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> Add to My Queue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Movie Card ─── */
function MoviePickCard({
  item,
  selected,
  onSelect,
  onOpenEpisodePicker,
}: {
  item: MediaItem;
  selected: boolean;
  onSelect: (movie: WatchPartyMovie) => void;
  onOpenEpisodePicker: (item: MediaItem) => void;
}) {
  const title = getTitle(item);
  const poster = getPoster(item);
  const year = getYear(item);
  const isTv = Number(item.subjectType) === 2;

  const handleClick = () => {
    if (isTv) {
      onOpenEpisodePicker(item);
    } else {
      onSelect({
        id: item.subjectId,
        type: "movie",
        title,
        poster: poster || "",
        year: year || "",
        rating: item.imdbRatingValue || "",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 active:scale-95 group ${selected ? "ring-4 ring-red-500 scale-105" : "hover:scale-102"}`}
    >
      <div className="aspect-[2/3] bg-zinc-800">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Play className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      {isTv && !selected && (
        <div className="absolute top-2 left-2 bg-blue-600/80 rounded px-1.5 py-0.5">
          <span className="text-white text-[9px] font-bold">TV</span>
        </div>
      )}
      {selected && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-xs font-bold line-clamp-2 leading-tight">{title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {item.imdbRatingValue && (
            <span className="text-yellow-400 text-xs font-bold flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-current" /> {item.imdbRatingValue}
            </span>
          )}
          {year && <span className="text-gray-400 text-xs">{year}</span>}
        </div>
      </div>
    </button>
  );
}

const SELECTION_GENRES = ["Action", "Drama", "Comedy", "Romance", "Thriller", "Sci-Fi", "Horror", "Animation", "Crime", "Adventure"];

/* ─── Main Component ─── */
export default function WatchParty() {
  const [, setLocation] = useLocation();

  /* Selection browse/search state — declared BEFORE hook calls that use them */
  const [selectionMode, setSelectionMode] = useState<"trending" | "genre" | "search">("trending");
  const [selectionGenre, setSelectionGenre] = useState("Action");
  const [selectionSearchInput, setSelectionSearchInput] = useState("");
  const [selectionSearch, setSelectionSearch] = useState("");
  const [selectionPage, setSelectionPage] = useState(0);

  const { data: trending = [] } = useTrending();
  const { data: browseData } = useBrowse(selectionGenre, 1);
  const browseItems: MediaItem[] = browseData?.items || [];
  const { data: searchItems = [] } = useSearch(selectionSearch);

  const ITEMS_PER_PAGE = 12;

  const selectionItems: MediaItem[] =
    selectionMode === "search" ? searchItems :
    selectionMode === "genre"  ? browseItems :
    trending;

  const totalSelectionPages = Math.max(1, Math.ceil(selectionItems.length / ITEMS_PER_PAGE));
  const selectionPageItems = selectionItems.slice(selectionPage * ITEMS_PER_PAGE, (selectionPage + 1) * ITEMS_PER_PAGE);

  const changeSelectionMode = (mode: "trending" | "genre" | "search", genre?: string, search?: string) => {
    setSelectionMode(mode);
    setSelectionPage(0);
    if (genre !== undefined) setSelectionGenre(genre);
    if (search !== undefined) setSelectionSearch(search);
  };

  const [appPhase, setAppPhase] = useState<AppPhase>("entry");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [partyCode, setPartyCode] = useState("");
  const [clientId, setClientId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [partyState, setPartyState] = useState<PartyStateData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<WatchPartyMovie[]>([]);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [flipMovies, setFlipMovies] = useState<WatchPartyMovie[]>([]);
  const [flipSplit, setFlipSplit] = useState(0);
  const [flipWinner, setFlipWinner] = useState<WatchPartyMovie | null>(null);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const showChatRef = useRef(true);
  const [countdownSecs, setCountdownSecs] = useState<number | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>("");
  const [streamLoading, setStreamLoading] = useState(false);
  const [availableStreams, setAvailableStreams] = useState<StreamOption[]>([]);
  const [qualityPicked, setQualityPicked] = useState(false);
  const [episodePickerItem, setEpisodePickerItem] = useState<MediaItem | null>(null);
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOption[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");
  const [subtitleCues, setSubtitleCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  const [showWatchingEpPicker, setShowWatchingEpPicker] = useState(false);
  const [wpEpSeasons, setWpEpSeasons] = useState<any[]>([]);
  const [wpEpLoadingSeasons, setWpEpLoadingSeasons] = useState(false);
  const [wpSelectedSeason, setWpSelectedSeason] = useState(1);
  const [wpSelectedEpisode, setWpSelectedEpisode] = useState(1);
  const [wpManualSeason, setWpManualSeason] = useState(1);
  const [wpManualEpisode, setWpManualEpisode] = useState(1);
  const [pendingQualityLabel, setPendingQualityLabel] = useState<string | null>(null);
  const [pendingSubtitleLabel, setPendingSubtitleLabel] = useState<string | null>(null);

  const pendingPlayRef = useRef<{ playing: boolean; time: number } | null>(null);

  const isHostRef = useRef(false);
  const appPhaseRef = useRef<AppPhase>(appPhase);
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* keep refs in sync so WS handler can read current values without stale closures */
  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => { appPhaseRef.current = appPhase; }, [appPhase]);

  const sendWS = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const attachWsHandlers = useCallback((ws: WebSocket, onOpen: (ws: WebSocket) => void, attempt: number, maxAttempts: number, retryFn: () => void) => {
    ws.onopen = () => onOpen(ws);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === "joined") {
          setPartyCode(msg.partyCode);
          setClientId(msg.clientId);
          setIsHost(msg.isHost);
          isHostRef.current = msg.isHost;
          if (msg.hostToken) {
            sessionStorage.setItem(`wp_token_${msg.partyCode}`, msg.hostToken);
          }
          setAppPhase("lobby");
        } else if (msg.type === "error") {
          setError(msg.message);
        } else if (msg.type === "party_state") {
          const ps: PartyStateData = msg.party;
          setPartyState(ps);
          if (ps.phase === "selecting" && appPhaseRef.current !== "selecting") {
            setAppPhase("selecting");
          } else if (ps.phase === "done") {
            setAppPhase("done");
          }
          if ((ps.phase === "watching") && ps.movies.length > 0 && appPhaseRef.current !== "watching") {
            setAppPhase("watching");
          }
        } else if (msg.type === "phase_change") {
          if (msg.phase === "selecting") setAppPhase("selecting");
        } else if (msg.type === "ready_to_flip") {
          const g1: WatchPartyMovie[] = msg.group1 || [];
          const g2: WatchPartyMovie[] = msg.group2 || [];
          if (isHostRef.current) {
            setTimeout(() => {
              const hostWins = Math.random() < 0.5;
              const ordered = hostWins ? [...g1, ...g2] : [...g2, ...g1];
              const split = hostWins ? g1.length : g2.length;
              setFlipMovies(ordered);
              setFlipSplit(split);
              setFlipWinner(ordered[0]);
              setShowCoinFlip(true);
              setAppPhase("flipping");
              sendWS({ type: "flip_result", movies: ordered, split });
            }, 300);
          } else {
            setAppPhase("flipping");
          }
        } else if (msg.type === "flip_result") {
          setFlipMovies(msg.movies);
          setFlipSplit(msg.split ?? 1);
          setFlipWinner(msg.movies[0]);
          setShowCoinFlip(true);
          setAppPhase("flipping");
        } else if (msg.type === "next_movie") {
          setAppPhase("watching");
          setCurrentTime(0);
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.pause();
          }
        } else if (msg.type === "playback") {
          const video = videoRef.current;
          if (!video) { pendingPlayRef.current = { playing: msg.playing, time: msg.time }; return; }
          if (video.readyState < 2) {
            pendingPlayRef.current = { playing: msg.playing, time: msg.time };
            return;
          }
          const drift = Math.abs(video.currentTime - msg.time);
          if (drift > 1) video.currentTime = msg.time;
          if (msg.playing && video.paused) {
            video.play().catch(() => {});
            setIsPlaying(true);
          } else if (!msg.playing && !video.paused) {
            video.pause();
            setIsPlaying(false);
          }
        } else if (msg.type === "chat") {
          setChatMessages((prev) => [...prev, { from: msg.from, message: msg.message, ts: msg.ts }]);
          if (!showChatRef.current) setUnreadCount((n) => n + 1);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } else if (msg.type === "typing") {
          setTypingFrom(msg.isTyping ? msg.from : null);
        } else if (msg.type === "stream_url") {
          setCurrentStreamUrl(msg.url);
          setQualityPicked(true);
          setStreamLoading(false);
        } else if (msg.type === "quality_select") {
          setPendingQualityLabel(msg.label);
        } else if (msg.type === "subtitle_select") {
          setPendingSubtitleLabel(msg.label);
        } else if (msg.type === "episode_changed") {
          setShowWatchingEpPicker(false);
          setCurrentStreamUrl("");
          setAvailableStreams([]);
          setQualityPicked(false);
          setSubtitleOptions([]);
          setActiveSubtitle("off");
          setSubtitleCues([]);
          setPendingQualityLabel(null);
          setPendingSubtitleLabel(null);
          pendingPlayRef.current = null;
          if (videoRef.current) {
            videoRef.current.pause();
          }
          setIsPlaying(false);
          setCurrentTime(0);
          setDuration(0);
        } else if (msg.type === "member_left") {
          setError("Your party partner left the party.");
        }
      } catch {}
    };

    ws.onerror = () => {
      if (attempt < maxAttempts) {
        setError(`Connecting... (attempt ${attempt + 1}/${maxAttempts})`);
        setTimeout(retryFn, 1500);
      } else {
        setError("Could not connect to server. Please check your internet and try again.");
      }
    };

    ws.onclose = (event) => {
      if (wsRef.current !== ws) return;
      if (appPhaseRef.current === "entry") return;
      if (event.wasClean && event.code === 1000) return;
      setError("Connection lost. Please refresh and try again.");
    };
  }, [sendWS]);

  const connectWS = useCallback((onOpen: (ws: WebSocket) => void, attempt = 1) => {
    const maxAttempts = 3;
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.close();
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    attachWsHandlers(ws, onOpen, attempt, maxAttempts, () => connectWS(onOpen, attempt + 1));
  }, [attachWsHandlers]);

  const handleCreate = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError("");
    connectWS((ws) => ws.send(JSON.stringify({ type: "create_party", name: name.trim() })));
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!joinCode.trim() || joinCode.trim().length !== 6) { setError("Enter a valid 6-digit code."); return; }
    setError("");
    const code = joinCode.trim();
    const hostToken = sessionStorage.getItem(`wp_token_${code}`) || undefined;
    connectWS((ws) => ws.send(JSON.stringify({ type: "join_party", name: name.trim(), code, hostToken })));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleMovieToggle = (movie: WatchPartyMovie) => {
    if (selectionConfirmed) return;
    setSelectedMovies((prev) => {
      const alreadyIn = prev.some((m) => m.id === movie.id);
      if (alreadyIn) return prev.filter((m) => m.id !== movie.id);
      if (prev.length >= 2) return prev;
      return [...prev, movie];
    });
  };

  const handleConfirmSelection = () => {
    if (selectedMovies.length === 0 || selectionConfirmed) return;
    setSelectionConfirmed(true);
    sendWS({ type: "select_movies", movies: selectedMovies });
  };

  const handleFlipDone = () => {
    setShowCoinFlip(false);
    setAppPhase("override");
  };

  const handleSwap = () => {
    if (!isHost) return;
    const group1 = flipMovies.slice(0, flipSplit);
    const group2 = flipMovies.slice(flipSplit);
    const swapped = [...group2, ...group1];
    const newSplit = group2.length;
    setFlipMovies(swapped);
    setFlipSplit(newSplit);
    setFlipWinner(swapped[0]);
    sendWS({ type: "flip_result", movies: swapped, split: newSplit });
  };

  const handleReflip = () => {
    if (!isHost) return;
    const group1 = flipMovies.slice(0, flipSplit);
    const group2 = flipMovies.slice(flipSplit);
    const g1Wins = Math.random() < 0.5;
    const ordered = g1Wins ? [...group1, ...group2] : [...group2, ...group1];
    const newSplit = g1Wins ? group1.length : group2.length;
    setFlipMovies(ordered);
    setFlipSplit(newSplit);
    setFlipWinner(ordered[0]);
    setShowCoinFlip(true);
    setAppPhase("flipping");
    sendWS({ type: "flip_result", movies: ordered, split: newSplit });
  };

  const handleStartWatching = () => {
    sendWS({ type: "start_watching" });
    setAppPhase("watching");
  };

  const handleLeave = () => {
    sendWS({ type: "leave_party" });
    wsRef.current?.close();
    setLocation("/");
  };

  const sendPlayback = useCallback(
    (playing: boolean, time: number, force = false) => {
      if (!force && syncThrottle.current) return;
      if (!force) {
        syncThrottle.current = setTimeout(() => { syncThrottle.current = null; }, 200);
      }
      sendWS({ type: "playback", playing, time });
    },
    [sendWS]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      sendPlayback(true, video.currentTime, true);
    } else {
      video.pause();
      setIsPlaying(false);
      sendPlayback(false, video.currentTime, true);
    }
  }, [sendPlayback]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    sendWS({ type: "chat", message: chatInput.trim() });
    sendWS({ type: "typing", isTyping: false });
    setChatInput("");
  };

  const handleChatInput = (val: string) => {
    setChatInput(val);
    sendWS({ type: "typing", isTyping: val.length > 0 });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendWS({ type: "typing", isTyping: false }), 2000);
  };

  const handleNextMovie = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    sendWS({ type: "next_movie" });
    setCountdownSecs(null);
    setAppPhase("watching");
  };

  const handleSaveForLater = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setCountdownSecs(null);
    setAppPhase("done");
  };

  useEffect(() => {
    if (appPhase === "between") {
      setCountdownSecs(30);
      countdownTimer.current = setInterval(() => {
        setCountdownSecs((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownTimer.current!);
            handleNextMovie();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
    }
  }, [appPhase]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      if (partyState && partyState.currentMovieIdx < (partyState.movies?.length || 0) - 1) {
        setAppPhase("between");
      } else {
        sendWS({ type: "end_party" });
        setAppPhase("done");
      }
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration);
    const onCanPlay = () => {
      const pending = pendingPlayRef.current;
      if (pending) {
        pendingPlayRef.current = null;
        const drift = Math.abs(video.currentTime - pending.time);
        if (drift > 1) video.currentTime = pending.time;
        if (pending.playing && video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    };
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("canplay", onCanPlay);
    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [appPhase, partyState, sendWS, currentStreamUrl]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (syncThrottle.current) clearTimeout(syncThrottle.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const currentMovieForFetch = partyState?.movies?.[partyState?.currentMovieIdx || 0];

  useEffect(() => {
    if (!currentMovieForFetch?.id || (appPhase !== "watching" && appPhase !== "between")) return;
    setCurrentStreamUrl("");
    setAvailableStreams([]);
    setQualityPicked(false);
    setStreamLoading(true);
    setSubtitleOptions([]);
    setActiveSubtitle("off");
    setSubtitleCues([]);
    pendingPlayRef.current = null;
    const isTv = currentMovieForFetch.type === "tv" || Number(currentMovieForFetch.type) === 2;
    const qs = isTv && currentMovieForFetch.season && currentMovieForFetch.episode
      ? `subjectId=${encodeURIComponent(currentMovieForFetch.id)}&se=${encodeURIComponent(currentMovieForFetch.season)}&ep=${encodeURIComponent(currentMovieForFetch.episode)}`
      : `subjectId=${encodeURIComponent(currentMovieForFetch.id)}`;
    fetch(`${API_BASE}/play?${qs}`, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((json) => {
        const streams: any[] = json?.data?.streams || [];
        if (streams.length === 0) { setCurrentStreamUrl(""); return; }
        const options: StreamOption[] = streams
          .map((s: any, i: number) => ({
            url: s.proxyUrl || s.url || "",
            label: s.resolutions ? `${s.resolutions}p` : s.format ? s.format.toUpperCase() : `Quality ${i + 1}`,
          }))
          .filter((o) => o.url);
        if (options.length <= 1) {
          const autoUrl = options[0]?.url || "";
          setCurrentStreamUrl(autoUrl);
          setQualityPicked(true);
          if (isHostRef.current && autoUrl) {
            sendWS({ type: "stream_url", url: autoUrl });
          }
        } else {
          setAvailableStreams(options);
        }
        const rawSubs: any[] = json?.data?.subtitles || json?.data?.data?.subtitles || [];
        const subs: SubtitleOption[] = rawSubs
          .map((s: any) => ({ label: s.label || s.language || s.lang || "Subtitle", url: s.url || s.src || "" }))
          .filter((s) => s.url);
        setSubtitleOptions(subs);
      })
      .catch(() => setCurrentStreamUrl(""))
      .finally(() => setStreamLoading(false));
  }, [currentMovieForFetch?.id, currentMovieForFetch?.season, currentMovieForFetch?.episode, appPhase, sendWS]);

  useEffect(() => {
    if (activeSubtitle === "off") { setSubtitleCues([]); return; }
    const sub = subtitleOptions.find((s) => s.label === activeSubtitle);
    if (!sub) return;
    fetch(sub.url)
      .then((r) => r.text())
      .then((text) => setSubtitleCues(parseVTT(text)))
      .catch(() => setSubtitleCues([]));
  }, [activeSubtitle, subtitleOptions]);

  /* apply pending quality when streams become available */
  useEffect(() => {
    if (!pendingQualityLabel || availableStreams.length === 0) return;
    const match = availableStreams.find((s) => s.label === pendingQualityLabel);
    if (match) {
      setCurrentStreamUrl(match.url);
      setQualityPicked(true);
      setPendingQualityLabel(null);
    }
  }, [pendingQualityLabel, availableStreams]);

  /* apply pending subtitle when subtitle options become available */
  useEffect(() => {
    if (!pendingSubtitleLabel) return;
    if (pendingSubtitleLabel === "off") {
      setActiveSubtitle("off");
      setPendingSubtitleLabel(null);
      return;
    }
    if (subtitleOptions.length === 0) return;
    const match = subtitleOptions.find((s) => s.label === pendingSubtitleLabel);
    if (match) {
      setActiveSubtitle(match.label);
      setPendingSubtitleLabel(null);
    }
  }, [pendingSubtitleLabel, subtitleOptions]);

  /* periodic playback sync from host to keep both sides aligned */
  useEffect(() => {
    if (appPhase !== "watching") return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && isHostRef.current && video.readyState >= 2) {
        const playing = !video.paused && !video.ended;
        sendWS({ type: "playback", playing, time: video.currentTime });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [appPhase, sendWS]);

  const currentMovie = partyState?.movies?.[partyState?.currentMovieIdx || 0];
  const members = partyState?.members || [];
  const me = members.find((m) => m.id === clientId);
  const partner = members.find((m) => m.id !== clientId);
  const allSelected = members.length === 2 && members.every((m) => m.hasSelected);

  function formatTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  /* ─── ENTRY SCREEN ─── */
  if (appPhase === "entry") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 mb-4">
                <Users className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-3xl font-black text-white">Watch Party</h1>
              <p className="text-gray-400 text-sm mt-2">Watch movies together in real-time with a friend</p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "create" ? handleCreate() : handleJoin())}
                  placeholder="Enter your name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode("create")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${mode === "create" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 hover:text-white"}`}
                >
                  Create Party
                </button>
                <button
                  onClick={() => setMode("join")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${mode === "join" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 hover:text-white"}`}
                >
                  Join Party
                </button>
              </div>

              {mode === "join" && (
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Party Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors text-center text-xl font-mono tracking-widest"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                onClick={mode === "create" ? handleCreate : handleJoin}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-base transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                {mode === "create" ? <><Plus className="h-5 w-5" /> Create Party</> : <><ArrowRight className="h-5 w-5" /> Join Party</>}
              </button>
            </div>

            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-white font-bold text-sm mb-2">How it works</p>
              <ul className="space-y-1.5 text-gray-400 text-xs">
                <li>1. Create a party and share the 6-digit code with your friend</li>
                <li>2. Each of you picks a movie secretly</li>
                <li>3. A coin flip decides which movie plays first</li>
                <li>4. Watch together in sync with live chat</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── LOBBY ─── */
  if (appPhase === "lobby") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30">
              <Users className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Party Created!</h2>
              <p className="text-gray-400 text-sm mt-1">Share this code with your friend</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Party Code</p>
                <p className="text-white font-black text-5xl tracking-widest font-mono">{partyCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                {copied ? <><Check className="h-4 w-4 text-green-400" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Code</>}
              </button>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Party Members</p>
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-white font-medium text-sm">{m.name}</span>
                  {m.id === clientId && <span className="text-xs text-gray-500">(you)</span>}
                </div>
              ))}
              {members.length < 2 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 border-dashed flex items-center justify-center">
                    <span className="text-zinc-600 text-sm">?</span>
                  </div>
                  <span className="text-gray-500 text-sm italic">Waiting for friend...</span>
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleLeave} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
              Leave Party
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── MOVIE SELECTION ─── */
  if (appPhase === "selecting") {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-12 pb-2 border-b border-zinc-800/60">
          <button onClick={handleLeave} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/80 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-black leading-none">Pick Your Movies</p>
            <p className="text-gray-500 text-[10px] mt-px">Choose up to 2 secretly</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1 bg-zinc-800 rounded-full px-2 py-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.hasSelected ? "bg-green-400" : "bg-yellow-500 animate-pulse"}`} />
                <span className="text-[10px] text-gray-400 max-w-[48px] truncate">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status strip ── */}
        <div className="flex-shrink-0 px-3 pt-1.5 pb-1">
          {selectionConfirmed ? (
            <div className="bg-green-600/10 border border-green-600/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedMovies.map((m) => (
                  <div key={m.id} className="flex items-center gap-1">
                    {m.poster && <img src={m.poster} alt={m.title} className="w-5 h-7 object-cover rounded" />}
                    <span className="text-green-300 text-[11px] font-semibold line-clamp-1 max-w-[65px]">{m.title}</span>
                  </div>
                ))}
              </div>
              <span className="text-gray-500 text-[10px] flex-shrink-0">{allSelected ? "Flip coming…" : "Waiting…"}</span>
            </div>
          ) : selectedMovies.length > 0 ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedMovies.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-1">
                    <span className="text-gray-600 text-[9px] font-black">#{idx + 1}</span>
                    {m.poster && <img src={m.poster} alt={m.title} className="w-5 h-7 object-cover rounded" />}
                    <span className="text-gray-300 text-[11px] line-clamp-1 max-w-[55px]">{m.title}</span>
                  </div>
                ))}
                <span className="text-gray-600 text-[9px]">{selectedMovies.length}/2</span>
              </div>
              <button onClick={handleConfirmSelection} className="flex-shrink-0 bg-green-600 hover:bg-green-500 active:scale-95 text-white text-[11px] font-black px-3 py-1.5 rounded-lg transition-all">
                Lock In ✓
              </button>
            </div>
          ) : (
            <div className="text-center py-1.5 border border-zinc-800 border-dashed rounded-lg">
              <p className="text-gray-600 text-[11px]">Tap up to 2 movies to add to your queue</p>
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div className="flex-shrink-0 px-3 pb-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={selectionSearchInput}
              onChange={(e) => {
                const v = e.target.value;
                setSelectionSearchInput(v);
                if (v.length > 1) { changeSelectionMode("search", undefined, v); }
                else if (v.length === 0) { changeSelectionMode("trending", undefined, ""); setSelectionSearchInput(""); }
              }}
              placeholder="Search movies & shows…"
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-8 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            {selectionSearchInput && (
              <button onClick={() => { setSelectionSearchInput(""); changeSelectionMode("trending", undefined, ""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Genre tabs — proper mobile horizontal scroll ── */}
        <div className="flex-shrink-0 px-3 pb-2">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            <button
              onClick={() => changeSelectionMode("trending")}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-bold transition-colors border ${
                selectionMode === "trending"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-transparent text-gray-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
              }`}
            >
              🔥 Trending
            </button>
            {SELECTION_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => { setSelectionSearchInput(""); changeSelectionMode("genre", g, ""); }}
                className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-bold transition-colors border ${
                  selectionMode === "genre" && selectionGenre === g
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-transparent text-gray-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── Movie grid — scrollable within fixed zone, header+footer always pinned ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-1" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {selectionPageItems.length === 0 && selectionMode === "search" && selectionSearch.length > 1 ? (
            <div className="h-full flex items-center justify-center py-16">
              <p className="text-gray-500 text-sm">No results for "{selectionSearch}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {selectionPageItems.map((item) => (
                <MoviePickCard
                  key={item.subjectId}
                  item={item}
                  selected={selectedMovies.some((m) => m.id === item.subjectId)}
                  onSelect={selectionConfirmed ? () => {} : handleMovieToggle}
                  onOpenEpisodePicker={selectionConfirmed ? () => {} : (it) => setEpisodePickerItem(it)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination bar ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-zinc-800/60 bg-zinc-950">
          <button
            onClick={() => setSelectionPage((p) => Math.max(0, p - 1))}
            disabled={selectionPage === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-gray-500 text-xs font-medium">
            {selectionPage + 1} / {totalSelectionPages}
          </span>
          <button
            onClick={() => setSelectionPage((p) => Math.min(totalSelectionPages - 1, p + 1))}
            disabled={selectionPage >= totalSelectionPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {episodePickerItem && (
          <WatchPartyEpisodePicker
            item={episodePickerItem}
            onConfirm={(movie) => { handleMovieToggle(movie); setEpisodePickerItem(null); }}
            onClose={() => setEpisodePickerItem(null)}
          />
        )}
      </div>
    );
  }

  /* ─── COIN FLIP ─── */
  if (appPhase === "flipping") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="w-full max-w-md text-center space-y-6">
            <h2 className="text-2xl font-black text-white">🎲 Coin Flip!</h2>
            <p className="text-gray-400 text-sm">Both movies picked. Let fate decide which goes first!</p>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
              {showCoinFlip && flipWinner ? (
                <CoinFlip winner={flipWinner} onDone={handleFlipDone} />
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 justify-center">
                    {flipMovies.map((m, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800">
                          {m.poster && <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />}
                        </div>
                        <p className="text-white text-xs font-semibold line-clamp-2 text-center max-w-[80px]">{m.title}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                    <p className="text-gray-400 text-sm">Preparing coin flip...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── OVERRIDE / POST-FLIP ─── */
  if (appPhase === "override") {
    const winner = flipMovies[0];
    const second = flipMovies[1];
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Coin Flip Result</h2>
              <p className="text-gray-400 text-sm mt-1">The coin has spoken — but you can override!</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" /> Playing First
                </p>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                  {winner?.poster && <img src={winner.poster} alt={winner.title} className="w-10 h-14 object-cover rounded-lg" />}
                  <div>
                    <p className="text-white font-bold">{winner?.title}</p>
                    {winner?.year && <p className="text-gray-400 text-xs">{winner.year}</p>}
                  </div>
                </div>
              </div>
              {second && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Playing Second</p>
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    {second.poster && <img src={second.poster} alt={second.title} className="w-8 h-11 object-cover rounded-lg opacity-70" />}
                    <p className="text-gray-400 text-sm">{second.title}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStartWatching}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-colors active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" /> Start Watching
              </button>
              {isHost && (
                <>
                  <button
                    onClick={handleSwap}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <Shuffle className="h-4 w-4" /> Swap Order
                  </button>
                  <button
                    onClick={handleReflip}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" /> Flip Again
                  </button>
                </>
              )}
              {!isHost && (
                <p className="text-center text-gray-500 text-xs">Only the party host can swap or reflip</p>
              )}
            </div>
            <div className="text-center">
              <button onClick={handleLeave} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Leave Party</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ─── WATCHING ─── */
  if (appPhase === "watching" || appPhase === "between") {
    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/80 flex-shrink-0">
          <button
            onClick={handleLeave}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-red-600/20 hover:text-red-400 text-gray-400 transition-colors flex-shrink-0 border border-zinc-700/60"
            title="Leave Party"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm line-clamp-1 leading-tight">{currentMovie?.title || "Watch Party"}</p>
            {currentMovie?.season && currentMovie?.episode && (
              <p className="text-gray-500 text-[11px] leading-tight">S{currentMovie.season} · E{currentMovie.episode}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 bg-zinc-800/70 rounded-full border border-zinc-700/50 px-1.5 py-1 sm:px-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block flex-shrink-0" />
                <span className="hidden sm:inline text-xs text-gray-300 font-medium">{m.name}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowChat((v) => !v); setUnreadCount(0); }}
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-colors flex-shrink-0 ${showChat ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-zinc-800/80 border-zinc-700/60 text-gray-400 hover:text-white"}`}
            title="Toggle Chat"
          >
            <MessageSquare className="h-4 w-4" />
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Video area */}
          <div className="flex-1 flex flex-col bg-black relative">
            <div className="flex-1 flex items-center justify-center relative">
              {currentMovie ? (
                streamLoading ? (
                  <div className="flex flex-col items-center gap-4 text-white">
                    <RefreshCw className="h-10 w-10 animate-spin text-red-500" />
                    <p className="text-gray-400 text-sm">Loading stream for <span className="text-white font-semibold">{currentMovie.title}</span>...</p>
                  </div>
                ) : availableStreams.length > 0 && !qualityPicked ? (
                  <div className="flex flex-col items-center gap-5 p-6 w-full max-w-xs">
                    <div className="text-center">
                      <p className="text-white font-bold text-base">{currentMovie.title}</p>
                      {currentMovie.season && currentMovie.episode && (
                        <p className="text-gray-400 text-sm mt-0.5">Season {currentMovie.season} · Episode {currentMovie.episode}</p>
                      )}
                      <p className="text-gray-400 text-sm mt-2">Pick your stream quality</p>
                    </div>
                    <div className="w-full space-y-2">
                      {availableStreams.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentStreamUrl(s.url);
                            setQualityPicked(true);
                            sendWS({ type: "quality_select", label: s.label });
                            if (isHost) sendWS({ type: "stream_url", url: s.url });
                          }}
                          className="w-full flex items-center justify-between px-5 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-red-500 rounded-xl transition-colors"
                        >
                          <span className="text-white font-bold text-sm">{s.label}</span>
                          <Play className="h-4 w-4 text-red-400 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : currentStreamUrl ? (
                  <video
                    ref={videoRef}
                    key={`${currentMovie.id}-${currentStreamUrl}`}
                    src={currentStreamUrl}
                    className="max-h-full max-w-full"
                    playsInline
                    onClick={togglePlay}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white">
                    <Play className="h-12 w-12 text-zinc-700" />
                    <p className="text-gray-500 text-sm">Stream unavailable for this title</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 text-white">
                  <Play className="h-12 w-12 text-zinc-700" />
                  <p className="text-gray-500 text-sm">Stream not available — watching together</p>
                </div>
              )}

              {/* Sync indicator */}
              {syncPending && (
                <div className="absolute top-4 right-4 bg-black/70 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-400" />
                  <span className="text-xs text-gray-300">Syncing...</span>
                </div>
              )}

              {/* Subtitle overlay */}
              {(() => {
                const cue = subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end);
                return cue ? (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none px-4">
                    <div className="bg-black/75 rounded-lg px-3 py-1.5 max-w-[90%] text-center">
                      {cue.text.split("\n").map((line, i) => (
                        <p key={i} className="text-white text-sm font-medium leading-snug drop-shadow">{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Subtitle menu */}
              {showSubtitleMenu && (
                <div className="absolute bottom-16 right-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20 min-w-[160px]">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Subtitles</p>
                  </div>
                  <button
                    onClick={() => { setActiveSubtitle("off"); setShowSubtitleMenu(false); sendWS({ type: "subtitle_select", label: "off" }); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors ${activeSubtitle === "off" ? "text-red-400 font-semibold" : "text-gray-300"}`}
                  >
                    {activeSubtitle === "off" && <Check className="h-3.5 w-3.5" />}
                    <span className={activeSubtitle === "off" ? "" : "ml-5"}>Off</span>
                  </button>
                  {subtitleOptions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveSubtitle(s.label); setShowSubtitleMenu(false); sendWS({ type: "subtitle_select", label: s.label }); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors ${activeSubtitle === s.label ? "text-red-400 font-semibold" : "text-gray-300"}`}
                    >
                      {activeSubtitle === s.label && <Check className="h-3.5 w-3.5" />}
                      <span className={activeSubtitle === s.label ? "" : "ml-5"}>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-4 pb-4 pt-3 space-y-2 flex-shrink-0">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer" onClick={(e) => {
                if (!videoRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                const time = pct * duration;
                videoRef.current.currentTime = time;
                sendPlayback(isPlaying, time);
              }}>
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!videoRef.current) return;
                    const t = Math.max(0, videoRef.current.currentTime - 10);
                    videoRef.current.currentTime = t;
                    sendPlayback(isPlaying, t);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center text-white hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
                </button>
                <button
                  onClick={() => {
                    if (!videoRef.current || !duration) return;
                    const t = Math.min(duration, videoRef.current.currentTime + 10);
                    videoRef.current.currentTime = t;
                    sendPlayback(isPlaying, t);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  title="Forward 10s"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                <span className="text-white text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div className="flex-1" />
                {(currentMovie?.type === "tv" || Number(currentMovie?.type) === 2) && (
                  <button
                    onClick={() => {
                      setShowWatchingEpPicker(true);
                      setWpEpSeasons([]);
                      setWpEpLoadingSeasons(true);
                      const movieId = currentMovie?.id;
                      if (!movieId) { setWpEpLoadingSeasons(false); return; }
                      fetch(`${API_BASE}/detail?subjectId=${encodeURIComponent(movieId)}`, { headers: API_HEADERS })
                        .then((r) => r.json())
                        .then((json) => {
                          const res = json?.data?.resource;
                          setWpEpSeasons(Array.isArray(res) ? res : []);
                          const firstSeason = Array.isArray(res) ? Number(res[0]?.seasonNumber ?? res[0]?.season ?? 1) : 1;
                          setWpSelectedSeason(firstSeason);
                          setWpSelectedEpisode(1);
                        })
                        .catch(() => setWpEpSeasons([]))
                        .finally(() => setWpEpLoadingSeasons(false));
                    }}
                    className={`p-1.5 rounded transition-colors ${showWatchingEpPicker ? "text-red-400 bg-red-600/10" : "text-gray-400 hover:text-white"}`}
                    title="Change Episode"
                  >
                    <List className="h-5 w-5" />
                  </button>
                )}
                {subtitleOptions.length > 0 && (
                  <button
                    onClick={() => setShowSubtitleMenu((v) => !v)}
                    className={`text-sm font-bold px-2 py-1 rounded transition-colors ${activeSubtitle !== "off" ? "text-red-400 bg-red-600/10" : "text-gray-400 hover:text-white"}`}
                  >
                    CC
                  </button>
                )}
                <button onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted;
                    setIsMuted(v => !v);
                  }
                }} className="text-gray-400 hover:text-white transition-colors p-1">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Episode picker modal for TV shows in watch party */}
          {showWatchingEpPicker && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowWatchingEpPicker(false)}>
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xs mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
                  <p className="text-white font-bold text-sm">Change Episode</p>
                  <button onClick={() => setShowWatchingEpPicker(false)} className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {wpEpLoadingSeasons ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-7 w-7 animate-spin text-red-500" />
                    </div>
                  ) : wpEpSeasons.length === 0 ? (
                    /* Manual +/- picker fallback when no episode data from API */
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-2">Season</p>
                        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                          <button onClick={() => setWpManualSeason(Math.max(1, wpManualSeason - 1))} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0">
                            <Minus className="h-3.5 w-3.5 text-white" />
                          </button>
                          <span className="flex-1 text-center text-white font-black text-2xl">{wpManualSeason}</span>
                          <button onClick={() => setWpManualSeason(wpManualSeason + 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg">+</button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-2">Episode</p>
                        <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                          <button onClick={() => setWpManualEpisode(Math.max(1, wpManualEpisode - 1))} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0">
                            <Minus className="h-3.5 w-3.5 text-white" />
                          </button>
                          <span className="flex-1 text-center text-white font-black text-2xl">{wpManualEpisode}</span>
                          <button onClick={() => setWpManualEpisode(wpManualEpisode + 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg">+</button>
                        </div>
                      </div>
                      <button
                        onClick={() => { sendWS({ type: "change_episode", season: wpManualSeason, episode: wpManualEpisode }); setShowWatchingEpPicker(false); }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" /> S{wpManualSeason} · E{wpManualEpisode} — Switch for Everyone
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Season</label>
                        <div className="relative">
                          <select
                            value={wpSelectedSeason}
                            onChange={(e) => { setWpSelectedSeason(Number(e.target.value)); setWpSelectedEpisode(1); }}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-red-500 text-sm"
                          >
                            {wpEpSeasons.map((s: any, i: number) => {
                              const sNum = Number(s.seasonNumber || s.season || i + 1);
                              return <option key={i} value={sNum}>Season {sNum}</option>;
                            })}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Episode</label>
                        <div className="relative">
                          <select
                            value={wpSelectedEpisode}
                            onChange={(e) => setWpSelectedEpisode(Number(e.target.value))}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-red-500 text-sm"
                          >
                            {(() => {
                              const season = wpEpSeasons.find((s: any) => Number(s.seasonNumber || s.season) === wpSelectedSeason) || wpEpSeasons[0];
                              const eps: any[] = season?.episodes || [];
                              return eps.map((ep: any, i: number) => {
                                const epNum = Number(ep.episodeNumber || ep.episode || i + 1);
                                const epTitle = ep.title || ep.name || `Episode ${epNum}`;
                                return <option key={i} value={epNum}>Ep {epNum} — {epTitle}</option>;
                              });
                            })()}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sendWS({ type: "change_episode", season: wpSelectedSeason, episode: wpSelectedEpisode });
                          setShowWatchingEpPicker(false);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" /> Switch Episode for Everyone
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat panel — bottom drawer on mobile, side panel on md+ */}
          {showChat && (
            <>
              {/* Mobile backdrop */}
              <div
                className="absolute inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setShowChat(false)}
              />
              <div className="
                absolute bottom-0 left-0 right-0 z-50 flex flex-col
                bg-zinc-950 border-t border-zinc-800/80
                h-[65%] rounded-t-2xl
                md:relative md:bottom-auto md:left-auto md:right-auto
                md:z-auto md:h-auto md:w-72 md:rounded-none
                md:border-t-0 md:border-l md:flex-shrink-0
              ">
                {/* Drag handle (mobile only) */}
                <div className="flex justify-center pt-2.5 pb-1 md:hidden flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-zinc-700" />
                </div>

                <div className="px-4 py-2.5 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0 bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-red-400" />
                    <p className="text-white font-bold text-sm">Party Chat</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {typingFrom ? (
                      <p className="text-gray-500 text-xs italic">{typingFrom} typing...</p>
                    ) : (
                      <span className="text-xs text-gray-600">{chatMessages.length} msgs</span>
                    )}
                    <button onClick={() => setShowChat(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors md:hidden">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                      <MessageSquare className="h-7 w-7 text-zinc-700" />
                      <p className="text-gray-600 text-xs text-center">No messages yet.<br />Say hello!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => {
                    const isMe = msg.from === (me?.name || name);
                    return (
                      <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-600 mb-1 px-1 font-medium">{isMe ? "You" : msg.from}</span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-red-600 text-white rounded-tr-sm" : "bg-zinc-800 text-gray-200 rounded-tl-sm border border-zinc-700/50"}`}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-zinc-800/80 flex-shrink-0 bg-zinc-900/30 pb-safe">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => handleChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Say something..."
                      className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500/60 transition-colors"
                    />
                    <button onClick={sendChat} className="w-10 h-10 bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Between movies prompt */}
        {appPhase === "between" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-5">
              <div className="text-center">
                <p className="text-white font-black text-xl">🎬 Movie Ended!</p>
                <p className="text-gray-400 text-sm mt-1">Ready for the next one?</p>
              </div>
              {partyState?.movies?.[1] && (
                <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3">
                  {partyState.movies[1].poster && (
                    <img src={partyState.movies[1].poster} alt={partyState.movies[1].title} className="w-10 h-14 object-cover rounded-lg" />
                  )}
                  <div>
                    <p className="text-xs text-gray-400">Up next</p>
                    <p className="text-white font-bold text-sm">{partyState.movies[1].title}</p>
                  </div>
                </div>
              )}
              {countdownSecs !== null && (
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Auto-playing in</p>
                  <p className="text-red-400 font-black text-3xl">{countdownSecs}s</p>
                </div>
              )}
              <div className="space-y-2">
                {isHost && (
                  <button onClick={handleNextMovie} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                    <SkipForward className="h-4 w-4" /> Watch Next Movie Now
                  </button>
                )}
                <button onClick={handleSaveForLater} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                  <X className="h-4 w-4" /> End Party
                </button>
              </div>
              {!isHost && <p className="text-center text-gray-500 text-xs">Waiting for host to continue...</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── DONE / CELEBRATION ─── */
  if (appPhase === "done") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-3xl font-black text-white">Party Complete!</h2>
              <p className="text-gray-400 text-sm mt-2">You and your friend watched {partyState?.movies?.length || 0} movie{(partyState?.movies?.length || 0) !== 1 ? "s" : ""} together</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Movies Watched</p>
              {(partyState?.movies || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  {m.poster && <img src={m.poster} alt={m.title} className="w-10 h-14 object-cover rounded-lg" />}
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{m.title}</p>
                    {m.year && <p className="text-gray-400 text-xs">{m.year}</p>}
                  </div>
                  {i === 0 && <Crown className="h-4 w-4 text-yellow-400 ml-auto" />}
                </div>
              ))}

              <div className="border-t border-zinc-800 pt-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Party Members</p>
                {members.map((m) => (
                  <p key={m.id} className="text-white text-sm">{m.name}{m.id === clientId ? " (you)" : ""}</p>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  sendWS({ type: "leave_party" });
                  wsRef.current?.close();
                  setAppPhase("entry");
                  setPartyState(null);
                  setPartyCode("");
                  setSelectedMovies([]);
                  setFlipMovies([]);
                  setChatMessages([]);
                  setName("");
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                New Party
              </button>
              <Link href="/" className="flex-1">
                <button className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                  Go Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
