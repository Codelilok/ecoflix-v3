import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Search, Loader2, Trophy, Wifi, Play, Newspaper, Film, X, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

/* ─── Helpers ─── */
function getInitials(name: string): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}
const TEAM_COLORS = ["bg-red-700","bg-blue-700","bg-green-700","bg-purple-700","bg-orange-700","bg-yellow-600","bg-pink-700","bg-teal-700","bg-indigo-700","bg-rose-700","bg-emerald-700","bg-cyan-700","bg-violet-700","bg-lime-700","bg-sky-700","bg-fuchsia-700"];
function teamColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return TEAM_COLORS[Math.abs(h) % TEAM_COLORS.length];
}
function formatTime(ms: number): string {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Types ─── */
interface LiveMatch { type: "live"; id: string; homeTeam: string; awayTeam: string; homeScore: string; awayScore: string; date: string; period: string; league: string; avatar1?: string; avatar2?: string; playPath?: string; sportType?: string; }
interface FinishedMatch { type: "finished"; id: string; homeTeam: string; awayTeam: string; homeScore: string; awayScore: string; date: string; league: string; avatar1?: string; avatar2?: string; }
interface UpcomingMatch { type: "upcoming"; id: string; homeTeam: string; awayTeam: string; date: string; league: string; avatar1?: string; avatar2?: string; }
type AnyMatch = LiveMatch | FinishedMatch | UpcomingMatch;
interface StandingRow { position: number; team: string; played: number; won: number; draw: number; lost: number; goalDifference: number; points: number; }
interface LeagueStandings { competition: string; standings: StandingRow[]; }
interface NewsItem { id: string; title: string; cover: string; }
interface HighlightItem { id: string; title: string; path: string; cover: { url: string } | null; duration: string; }
interface SportsData { live: LiveMatch[]; finished: FinishedMatch[]; upcoming: UpcomingMatch[]; standings: LeagueStandings[]; news: NewsItem[]; highlights: HighlightItem[]; }

/* ─── Old API (primary) ─── */
const OLD_FINISHED = ["https://apiskeith.vercel.app/epl/matches","https://apiskeith.vercel.app/bundesliga/matches","https://apiskeith.vercel.app/laliga/matches","https://apiskeith.vercel.app/euros/matches","https://apiskeith.vercel.app/ucl/matches","https://apiskeith.vercel.app/seriea/matches","https://apiskeith.vercel.app/ligue1/matches"];
const OLD_UPCOMING = ["https://apiskeith.vercel.app/epl/upcomingmatches","https://apiskeith.vercel.app/bundesliga/upcomingmatches","https://apiskeith.vercel.app/euros/upcomingmatches","https://apiskeith.vercel.app/laliga/upcomingmatches","https://apiskeith.vercel.app/fifa/upcomingmatches","https://apiskeith.vercel.app/ucl/upcomingmatches","https://apiskeith.vercel.app/seriea/upcomingmatches","https://apiskeith.vercel.app/ligue1/upcomingmatches"];
const OLD_STANDINGS = ["https://apiskeith.vercel.app/epl/standings","https://apiskeith.vercel.app/bundesliga/standings","https://apiskeith.vercel.app/laliga/standings","https://apiskeith.vercel.app/ligue1/standings","https://apiskeith.vercel.app/seriea/standings","https://apiskeith.vercel.app/ucl/standings"];

async function fetchOldLive(): Promise<LiveMatch[]> {
  const res = await fetch("https://apiskeith.vercel.app/livescore");
  const json = await res.json();
  const games: Record<string, any> = json?.result?.games || {};
  const out: LiveMatch[] = [];
  for (const [key, g] of Object.entries(games)) {
    const sh = Number(g.sh);
    const st: string = g.R?.st || "";
    if ((sh === 2 || sh === 3) && (st === "1T" || st === "2T" || st === "HT")) {
      out.push({ type: "live", id: key, homeTeam: g.p1 || "Home", awayTeam: g.p2 || "Away", homeScore: String(g.R?.r1 ?? 0), awayScore: String(g.R?.r2 ?? 0), date: g.dt || "", period: st === "1T" ? "1st Half" : st === "2T" ? "2nd Half" : "Halftime", league: "" });
    }
  }
  return out;
}
async function fetchOldFinished(): Promise<FinishedMatch[]> {
  const results = await Promise.allSettled(OLD_FINISHED.map(async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    const league: string = json?.result?.competition || "";
    return (json?.result?.matches || []).map((m: any, i: number) => {
      const parts = (m.score || "0 - 0").split(" - ");
      return { type: "finished" as const, id: `${url}-${i}`, homeTeam: m.homeTeam || "Home", awayTeam: m.awayTeam || "Away", homeScore: parts[0]?.trim() || "0", awayScore: parts[1]?.trim() || "0", date: m.matchday ? `Matchday ${m.matchday}` : "", league };
    });
  }));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
async function fetchOldUpcoming(): Promise<UpcomingMatch[]> {
  const results = await Promise.allSettled(OLD_UPCOMING.map(async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    const league: string = json?.result?.competition || "";
    return (json?.result?.upcomingMatches || []).map((m: any, i: number) => ({ type: "upcoming" as const, id: `${url}-${i}`, homeTeam: m.homeTeam || "Home", awayTeam: m.awayTeam || "Away", date: m.date || "", league }));
  }));
  return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
}
async function fetchOldStandings(): Promise<LeagueStandings[]> {
  const results = await Promise.allSettled(OLD_STANDINGS.map(async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    if (!json?.status || !json?.result?.standings) return null;
    return { competition: json.result.competition || url.split("/").slice(-2, -1)[0], standings: json.result.standings } as LeagueStandings;
  }));
  return results.flatMap(r => (r.status === "fulfilled" && r.value) ? [r.value] : []);
}

/* ─── New/Backup API ─── */
async function fetchNewSportsData(): Promise<Omit<SportsData, "standings">> {
  const res = await fetch("https://movieapi.xcasper.space/api/live");
  const json = await res.json();
  const matchList: any[] = json?.data?.matchList || [];
  const newsList: any[] = json?.data?.newsList || [];
  const highlightsList: any[] = json?.data?.highlights || [];

  const live: LiveMatch[] = [];
  const finished: FinishedMatch[] = [];
  const upcoming: UpcomingMatch[] = [];

  for (const m of matchList) {
    const date = formatTime(m.startTime);
    const avatar1 = m.team1?.avatar || "";
    const avatar2 = m.team2?.avatar || "";
    if (m.statusLive === "Living") {
      live.push({ type: "live", id: m.id, homeTeam: m.team1?.name || "Home", awayTeam: m.team2?.name || "Away", homeScore: m.team1?.score || "0", awayScore: m.team2?.score || "0", date, period: m.timeDesc || "Live", league: m.league || "", avatar1, avatar2, playPath: m.playPath || "", sportType: m.type || "" });
    } else if (m.status === "MatchEnded") {
      finished.push({ type: "finished", id: m.id, homeTeam: m.team1?.name || "Home", awayTeam: m.team2?.name || "Away", homeScore: m.team1?.score || "0", awayScore: m.team2?.score || "0", date, league: m.league || "", avatar1, avatar2 });
    } else {
      upcoming.push({ type: "upcoming", id: m.id, homeTeam: m.team1?.name || "Home", awayTeam: m.team2?.name || "Away", date, league: m.league || "", avatar1, avatar2 });
    }
  }

  return {
    live, finished, upcoming,
    news: newsList.map((n: any) => ({ id: n.id, title: n.title || "", cover: n.cover || "" })),
    highlights: highlightsList.filter((h: any) => h.path).map((h: any) => ({ id: h.id, title: h.title || "Highlight", path: h.path, cover: h.cover || null, duration: h.duration || "0" })),
  };
}

/* ─── Combined fetch (primary + backup) ─── */
async function fetchSportsData(): Promise<SportsData> {
  const [newResult, oldLiveResult, oldFinishedResult, oldUpcomingResult, oldStandingsResult] = await Promise.allSettled([
    fetchNewSportsData(),
    fetchOldLive(),
    fetchOldFinished(),
    fetchOldUpcoming(),
    fetchOldStandings(),
  ]);

  const newData = newResult.status === "fulfilled" ? newResult.value : { live: [], finished: [], upcoming: [], news: [], highlights: [] };
  const oldLive = oldLiveResult.status === "fulfilled" ? oldLiveResult.value : [];
  const oldFinished = oldFinishedResult.status === "fulfilled" ? oldFinishedResult.value : [];
  const oldUpcoming = oldUpcomingResult.status === "fulfilled" ? oldUpcomingResult.value : [];
  const oldStandings = oldStandingsResult.status === "fulfilled" ? oldStandingsResult.value : [];

  return {
    live: oldLive.length > 0 ? oldLive : newData.live,
    finished: oldFinished.length > 0 ? oldFinished : newData.finished,
    upcoming: oldUpcoming.length > 0 ? oldUpcoming : newData.upcoming,
    standings: oldStandings,
    news: newData.news,
    highlights: newData.highlights,
  };
}

/* ─── Inline Video Player ─── */
function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return undefined;
    const isHLS = url.includes(".m3u8");
    if (isHLS && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError(true);
      });
      video.play().catch(() => {});
      return () => hls.destroy();
    }
    video.src = url;
    video.play().catch(() => {});
    return undefined;
  }, [url]);

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-white font-semibold text-sm truncate flex-1">{title}</p>
          <button onClick={onClose} className="ml-3 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {error ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-700">
            <p className="text-red-400 font-bold mb-2">Stream access restricted</p>
            <p className="text-gray-400 text-sm mb-4">This live stream is locked to the mobile app. You can try opening it in a media player like VLC.</p>
            <button onClick={copyUrl} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-xl mx-auto transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Stream URL"}
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            className="w-full rounded-2xl bg-black aspect-video"
            onError={() => setError(true)}
          />
        )}
      </div>
    </div>
  );
}

/* ─── News Modal ─── */
function NewsModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
          <X className="h-4 w-4" />
        </button>
        {item.cover && (
          <img src={item.cover} alt={item.title} className="w-full aspect-video object-cover" />
        )}
        <div className="p-5">
          <p className="text-white font-bold text-base leading-snug">{item.title}</p>
          <p className="text-gray-500 text-xs mt-2">Sports News</p>
        </div>
      </div>
    </div>
  );
}

/* ─── UI Components ─── */
function TeamCircle({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <div className={cn("w-12 h-12 rounded-full flex-shrink-0 shadow-md overflow-hidden border border-zinc-700", teamColor(name))}>
        <img src={avatar} alt={name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md", teamColor(name))}>
      {getInitials(name)}
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 bg-red-600/15 border border-red-500/30 px-2.5 py-1 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Live</span>
    </div>
  );
}

function MatchCard({ match }: { match: AnyMatch }) {
  const isLive = match.type === "live";
  const isUpcoming = match.type === "upcoming";
  const scored = match as LiveMatch | FinishedMatch;
  const liveMatch = match as LiveMatch;

  return (
    <div className={cn("bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-zinc-600", isLive ? "border-red-500/30 bg-red-950/10" : "border-zinc-800")}>
      <div className="flex items-center justify-between gap-2 min-h-[24px]">
        {isLive ? <LiveBadge /> : <span className="text-gray-500 text-xs font-medium truncate">{(match as FinishedMatch | UpcomingMatch).league}</span>}
        {isLive && <span className="text-gray-500 text-xs font-medium truncate">{liveMatch.league}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamCircle name={match.homeTeam} avatar={(match as any).avatar1} />
          <p className="text-xs text-gray-200 font-semibold text-center leading-tight w-full">{match.homeTeam}</p>
        </div>
        <div className="flex flex-col items-center flex-shrink-0 px-2">
          {isUpcoming ? (
            <span className="text-gray-500 font-black text-2xl">vs</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn("font-black text-2xl tabular-nums", isLive ? "text-red-300" : "text-white")}>{scored.homeScore}</span>
              <span className="text-gray-600 font-bold text-lg">–</span>
              <span className={cn("font-black text-2xl tabular-nums", isLive ? "text-red-300" : "text-white")}>{scored.awayScore}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamCircle name={match.awayTeam} avatar={(match as any).avatar2} />
          <p className="text-xs text-gray-200 font-semibold text-center leading-tight w-full">{match.awayTeam}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 gap-2">
        <span className="text-gray-500 text-xs">{match.date}</span>
        {isLive && <span className="text-red-400 text-xs font-bold">{liveMatch.period}</span>}
        {match.type === "finished" && <span className="text-green-400 text-xs font-semibold">Full Time</span>}
        {isUpcoming && <span className="text-yellow-400 text-xs font-semibold">Upcoming</span>}
      </div>
    </div>
  );
}

function StandingsTable({ league }: { league: LeagueStandings }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-3">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-800/60 transition-colors">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-white font-bold text-sm">{league.competition}</span>
          <span className="text-gray-500 text-xs">{league.standings.length} teams</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open ? "rotate-180" : "")} />
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-800/60 text-gray-400">
                <th className="text-left px-3 py-2 font-semibold w-8">#</th>
                <th className="text-left px-3 py-2 font-semibold">Team</th>
                <th className="text-center px-2 py-2 font-semibold">P</th>
                <th className="text-center px-2 py-2 font-semibold">W</th>
                <th className="text-center px-2 py-2 font-semibold">D</th>
                <th className="text-center px-2 py-2 font-semibold">L</th>
                <th className="text-center px-2 py-2 font-semibold">GD</th>
                <th className="text-center px-2 py-2 font-semibold text-yellow-400">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {league.standings.map((row, i) => (
                <tr key={i} className={cn("transition-colors hover:bg-zinc-800/40", i < 4 ? "border-l-2 border-blue-500" : i < 6 ? "border-l-2 border-orange-500" : i >= league.standings.length - 3 ? "border-l-2 border-red-600" : "border-l-2 border-transparent")}>
                  <td className="px-3 py-2.5 text-gray-400 font-bold">{row.position}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[9px] flex-shrink-0", teamColor(row.team))}>{getInitials(row.team).slice(0, 2)}</div>
                      <span className="text-gray-200 font-medium whitespace-nowrap">{row.team}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-400">{row.played}</td>
                  <td className="px-2 py-2.5 text-center text-green-400">{row.won}</td>
                  <td className="px-2 py-2.5 text-center text-gray-400">{row.draw}</td>
                  <td className="px-2 py-2.5 text-center text-red-400">{row.lost}</td>
                  <td className="px-2 py-2.5 text-center text-gray-300">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td className="px-2 py-2.5 text-center text-yellow-400 font-black">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 px-3 py-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-1.5"><div className="w-2 h-3 bg-blue-500 rounded-sm" /><span className="text-gray-500 text-[10px]">Champions League</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-3 bg-orange-500 rounded-sm" /><span className="text-gray-500 text-[10px]">Europa League</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-3 bg-red-600 rounded-sm" /><span className="text-gray-500 text-[10px]">Relegation</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      <p className="text-gray-400 text-sm">Fetching data...</p>
    </div>
  );
}
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Trophy className="h-12 w-12 text-zinc-700" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

/* ─── Main Page ─── */
type Tab = "live" | "finished" | "upcoming" | "all" | "standings" | "news";
const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Matches" },
  { id: "standings", label: "Standings" },
  { id: "news", label: "News & Highlights" },
];

export default function Sports() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [search, setSearch] = useState("");
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [newsModal, setNewsModal] = useState<NewsItem | null>(null);

  const { data, isLoading, isError } = useQuery<SportsData>({
    queryKey: ["sports-data"],
    queryFn: fetchSportsData,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const liveMatches = data?.live ?? [];
  const finishedMatches = data?.finished ?? [];
  const upcomingMatches = data?.upcoming ?? [];
  const allStandings = data?.standings ?? [];
  const allMatches: AnyMatch[] = useMemo(() => [...liveMatches, ...finishedMatches, ...upcomingMatches], [liveMatches, finishedMatches, upcomingMatches]);

  const q = search.trim().toLowerCase();
  function matchesSearch(m: AnyMatch): boolean {
    if (!q) return true;
    return m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q) || (m.league || "").toLowerCase().includes(q);
  }
  function standingSearch(l: LeagueStandings): boolean {
    if (!q) return true;
    return l.competition.toLowerCase().includes(q) || l.standings.some(r => r.team.toLowerCase().includes(q));
  }

  const displayedMatches = useMemo((): AnyMatch[] => {
    const base = activeTab === "live" ? liveMatches : activeTab === "finished" ? finishedMatches : activeTab === "upcoming" ? upcomingMatches : allMatches;
    return base.filter(matchesSearch);
  }, [activeTab, liveMatches, finishedMatches, upcomingMatches, allMatches, q]);

  const displayedStandings = useMemo(() => allStandings.filter(standingSearch), [allStandings, q]);

  const tabCount = (id: Tab) => {
    if (id === "live") return liveMatches.length;
    if (id === "finished") return finishedMatches.length;
    if (id === "upcoming") return upcomingMatches.length;
    if (id === "all") return allMatches.length;
    if (id === "standings") return allStandings.length;
    return (data?.news.length ?? 0) + (data?.highlights.length ?? 0);
  };

  return (
    <Layout>
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-screen-lg mx-auto px-4 md:px-10">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
              <Wifi className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sports</h1>
              <p className="text-gray-500 text-xs mt-0.5">Live scores, results, fixtures & highlights</p>
            </div>
          </div>

          {activeTab !== "news" && (
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <input type="text" placeholder="Search by team or league..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
            </div>
          )}

          <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tabCount(tab.id);
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all min-w-fit", isActive ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white hover:bg-zinc-800")}>
                  {tab.id === "live" && <span className={cn("relative flex h-2 w-2 flex-shrink-0", !isActive && "opacity-60")}><span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isActive ? "bg-white" : "bg-red-500")} /><span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-white" : "bg-red-500")} /></span>}
                  {tab.id === "standings" && <Trophy className="h-3.5 w-3.5 flex-shrink-0" />}
                  {tab.id === "news" && <Newspaper className="h-3.5 w-3.5 flex-shrink-0" />}
                  {tab.label}
                  {count > 0 && <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-bold", isActive ? "bg-white/20" : "bg-zinc-700 text-gray-300")}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Match tabs */}
          {(activeTab === "live" || activeTab === "finished" || activeTab === "upcoming" || activeTab === "all") && (
            isLoading ? <SectionLoader /> : isError ? <EmptyState message="Failed to load sports data." /> :
            displayedMatches.length === 0 ? (
              <EmptyState message={q ? `No matches found for "${search}"` : activeTab === "live" ? "No live matches right now" : activeTab === "finished" ? "No finished matches available" : activeTab === "upcoming" ? "No upcoming matches found" : "No matches available"} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            )
          )}

          {/* Standings tab */}
          {activeTab === "standings" && (
            isLoading ? <SectionLoader /> :
            displayedStandings.length === 0 ? <EmptyState message={q ? `No standings found for "${search}"` : "Standings not available right now"} /> :
            <div>{displayedStandings.map((l, i) => <StandingsTable key={i} league={l} />)}</div>
          )}

          {/* News & Highlights tab */}
          {activeTab === "news" && (
            isLoading ? <SectionLoader /> : (
              <div className="flex flex-col gap-8">
                {(data?.news.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Newspaper className="h-4 w-4 text-red-500" />
                      <h2 className="text-white font-bold text-base">Latest News</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                      {data!.news.map(item => (
                        <button key={item.id} onClick={() => setNewsModal(item)} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-zinc-600 transition-colors text-left w-full">
                          {item.cover && <img src={item.cover} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0 bg-zinc-800" />}
                          <p className="text-gray-200 text-sm font-medium line-clamp-2 leading-snug">{item.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(data?.highlights.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Film className="h-4 w-4 text-red-500" />
                      <h2 className="text-white font-bold text-base">Highlights</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data!.highlights.map(h => (
                        <button key={h.id} onClick={() => setVideoModal({ url: h.path, title: h.title })} className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors text-left">
                          <div className="relative aspect-video bg-zinc-800">
                            {h.cover?.url && <img src={h.cover.url} alt={h.title} className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                <Play className="h-5 w-5 text-white fill-current" />
                              </div>
                            </div>
                            {h.duration && Number(h.duration) > 0 && (
                              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {Math.floor(Number(h.duration) / 60)}:{String(Number(h.duration) % 60).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-gray-200 text-xs font-medium line-clamp-2 leading-snug">{h.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(data?.news.length ?? 0) === 0 && (data?.highlights.length ?? 0) === 0 && (
                  <EmptyState message="No news or highlights available right now" />
                )}
              </div>
            )
          )}
        </div>
      </div>

      {videoModal && <VideoModal url={videoModal.url} title={videoModal.title} onClose={() => setVideoModal(null)} />}
      {newsModal && <NewsModal item={newsModal} onClose={() => setNewsModal(null)} />}
    </Layout>
  );
}
