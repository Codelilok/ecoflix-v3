import { useState, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Search, Loader2, AlertCircle, Trophy, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Helpers ─── */

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

const TEAM_COLORS = [
  "bg-red-700", "bg-blue-700", "bg-green-700", "bg-purple-700",
  "bg-orange-700", "bg-yellow-600", "bg-pink-700", "bg-teal-700",
  "bg-indigo-700", "bg-rose-700", "bg-emerald-700", "bg-cyan-700",
  "bg-violet-700", "bg-lime-700", "bg-sky-700", "bg-fuchsia-700",
];

function teamColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return TEAM_COLORS[Math.abs(h) % TEAM_COLORS.length];
}

/* ─── Types ─── */

interface LiveMatch {
  type: "live";
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  date: string;
  period: string;
  league: string;
}

interface FinishedMatch {
  type: "finished";
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  date: string;
  league: string;
}

interface UpcomingMatch {
  type: "upcoming";
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
}

type AnyMatch = LiveMatch | FinishedMatch | UpcomingMatch;

/* ─── API Fetchers ─── */

async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const res = await fetch("https://apiskeith.vercel.app/livescore");
  const json = await res.json();
  const games: Record<string, any> = json?.result?.games || {};
  const out: LiveMatch[] = [];
  for (const [key, g] of Object.entries(games)) {
    const sh = Number(g.sh);
    const st: string = g.R?.st || "";
    if ((sh === 2 || sh === 3) && (st === "1T" || st === "2T" || st === "HT")) {
      out.push({
        type: "live",
        id: key,
        homeTeam: g.p1 || "Home",
        awayTeam: g.p2 || "Away",
        homeScore: String(g.R?.r1 ?? 0),
        awayScore: String(g.R?.r2 ?? 0),
        date: g.dt || "",
        period: st === "1T" ? "1st Half" : st === "2T" ? "2nd Half" : "Halftime",
        league: "",
      });
    }
  }
  return out;
}

const FINISHED_ENDPOINTS = [
  "https://apiskeith.vercel.app/epl/matches",
  "https://apiskeith.vercel.app/bundesliga/matches",
  "https://apiskeith.vercel.app/laliga/matches",
  "https://apiskeith.vercel.app/euros/matches",
  "https://apiskeith.vercel.app/ucl/matches",
  "https://apiskeith.vercel.app/seriea/matches",
  "https://apiskeith.vercel.app/ligue1/matches",
];

const UPCOMING_ENDPOINTS = [
  "https://apiskeith.vercel.app/epl/upcomingmatches",
  "https://apiskeith.vercel.app/bundesliga/upcomingmatches",
  "https://apiskeith.vercel.app/euros/upcomingmatches",
  "https://apiskeith.vercel.app/laliga/upcomingmatches",
  "https://apiskeith.vercel.app/fifa/upcomingmatches",
  "https://apiskeith.vercel.app/ucl/upcomingmatches",
  "https://apiskeith.vercel.app/seriea/upcomingmatches",
  "https://apiskeith.vercel.app/ligue1/upcomingmatches",
];

async function fetchFinished(url: string): Promise<FinishedMatch[]> {
  const res = await fetch(url);
  const json = await res.json();
  const league: string = json?.result?.competition || url.split("/").slice(-2, -1)[0];
  const items: any[] = json?.result?.matches || [];
  return items.map((m, i) => {
    const parts = (m.score || "0 - 0").split(" - ");
    return {
      type: "finished" as const,
      id: `${url}-${i}`,
      homeTeam: m.homeTeam || "Home",
      awayTeam: m.awayTeam || "Away",
      homeScore: parts[0]?.trim() || "0",
      awayScore: parts[1]?.trim() || "0",
      date: m.matchday ? `Matchday ${m.matchday}` : "",
      league,
    };
  });
}

async function fetchUpcoming(url: string): Promise<UpcomingMatch[]> {
  const res = await fetch(url);
  const json = await res.json();
  const league: string = json?.result?.competition || url.split("/").slice(-2, -1)[0];
  const items: any[] = json?.result?.upcomingMatches || [];
  return items.map((m, i) => ({
    type: "upcoming" as const,
    id: `${url}-${i}`,
    homeTeam: m.homeTeam || "Home",
    awayTeam: m.awayTeam || "Away",
    date: m.date || "",
    league,
  }));
}

/* ─── Components ─── */

function TeamCircle({ name }: { name: string }) {
  const initials = getInitials(name);
  const color = teamColor(name);
  return (
    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md", color)}>
      {initials}
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

  return (
    <div className={cn(
      "bg-zinc-900 border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-zinc-600",
      isLive ? "border-red-500/30 bg-red-950/10" : "border-zinc-800"
    )}>
      {/* Top row: badge + league */}
      <div className="flex items-center justify-between gap-2 min-h-[24px]">
        {isLive ? <LiveBadge /> : <span className="text-gray-500 text-xs font-medium truncate">{(match as FinishedMatch | UpcomingMatch).league}</span>}
        {isLive && (
          <span className="text-gray-500 text-xs font-medium truncate">{(match as FinishedMatch | UpcomingMatch).league || ""}</span>
        )}
      </div>

      {/* Teams + Score row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamCircle name={match.homeTeam} />
          <p className="text-xs text-gray-200 font-semibold text-center leading-tight w-full">{match.homeTeam}</p>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center flex-shrink-0 px-2">
          {isUpcoming ? (
            <span className="text-gray-500 font-black text-2xl">vs</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn("font-black text-2xl tabular-nums", isLive ? "text-red-300" : "text-white")}>
                {scored.homeScore}
              </span>
              <span className="text-gray-600 font-bold text-lg">–</span>
              <span className={cn("font-black text-2xl tabular-nums", isLive ? "text-red-300" : "text-white")}>
                {scored.awayScore}
              </span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <TeamCircle name={match.awayTeam} />
          <p className="text-xs text-gray-200 font-semibold text-center leading-tight w-full">{match.awayTeam}</p>
        </div>
      </div>

      {/* Footer: date + status */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
        <span className="text-gray-500 text-xs">{match.date}</span>
        {isLive && (
          <span className="text-red-400 text-xs font-bold">{(match as LiveMatch).period}</span>
        )}
        {match.type === "finished" && (
          <span className="text-green-400 text-xs font-semibold">Full Time</span>
        )}
        {isUpcoming && (
          <span className="text-yellow-400 text-xs font-semibold">Not Started</span>
        )}
      </div>
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      <p className="text-gray-400 text-sm">Fetching matches...</p>
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

type Tab = "live" | "finished" | "upcoming" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Matches" },
];

export default function Sports() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [search, setSearch] = useState("");

  /* Live */
  const { data: liveMatches = [], isLoading: loadingLive } = useQuery({
    queryKey: ["sports-live"],
    queryFn: fetchLiveMatches,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  /* Finished — parallel queries */
  const finishedQueries = useQueries({
    queries: FINISHED_ENDPOINTS.map((url) => ({
      queryKey: ["sports-finished", url],
      queryFn: () => fetchFinished(url),
      staleTime: 5 * 60_000,
    })),
  });

  /* Upcoming — parallel queries */
  const upcomingQueries = useQueries({
    queries: UPCOMING_ENDPOINTS.map((url) => ({
      queryKey: ["sports-upcoming", url],
      queryFn: () => fetchUpcoming(url),
      staleTime: 5 * 60_000,
    })),
  });

  const finishedMatches: FinishedMatch[] = useMemo(
    () => finishedQueries.flatMap((q) => (q.data as FinishedMatch[] | undefined) || []),
    [finishedQueries]
  );

  const upcomingMatches: UpcomingMatch[] = useMemo(
    () => upcomingQueries.flatMap((q) => (q.data as UpcomingMatch[] | undefined) || []),
    [upcomingQueries]
  );

  const loadingFinished = finishedQueries.some((q) => q.isLoading);
  const loadingUpcoming = upcomingQueries.some((q) => q.isLoading);

  const allMatches: AnyMatch[] = useMemo(
    () => [...liveMatches, ...finishedMatches, ...upcomingMatches],
    [liveMatches, finishedMatches, upcomingMatches]
  );

  /* Search filter */
  const q = search.trim().toLowerCase();

  function matchesSearch(m: AnyMatch): boolean {
    if (!q) return true;
    return (
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      ((m as FinishedMatch | UpcomingMatch).league || "").toLowerCase().includes(q)
    );
  }

  const displayedMatches = useMemo((): AnyMatch[] => {
    let base: AnyMatch[];
    if (activeTab === "live") base = liveMatches;
    else if (activeTab === "finished") base = finishedMatches;
    else if (activeTab === "upcoming") base = upcomingMatches;
    else base = allMatches;
    return base.filter(matchesSearch);
  }, [activeTab, liveMatches, finishedMatches, upcomingMatches, allMatches, q]);

  const isLoading =
    (activeTab === "live" && loadingLive) ||
    (activeTab === "finished" && loadingFinished) ||
    (activeTab === "upcoming" && loadingUpcoming) ||
    (activeTab === "all" && (loadingLive || loadingFinished || loadingUpcoming));

  const emptyMessage =
    q
      ? `No matches found for "${search}"`
      : activeTab === "live"
      ? "No live matches right now"
      : activeTab === "finished"
      ? "No finished matches available"
      : activeTab === "upcoming"
      ? "No upcoming matches found"
      : "No matches available";

  return (
    <Layout>
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-screen-lg mx-auto px-4 md:px-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
              <Wifi className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Sports</h1>
              <p className="text-gray-500 text-xs mt-0.5">Live scores, results & upcoming fixtures</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by team, league or competition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count =
                tab.id === "live" ? liveMatches.length
                : tab.id === "finished" ? finishedMatches.length
                : tab.id === "upcoming" ? upcomingMatches.length
                : allMatches.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-red-600 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  {tab.id === "live" && (
                    <span className={cn("relative flex h-2 w-2 flex-shrink-0", !isActive && "opacity-60")}>
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isActive ? "bg-white" : "bg-red-500")} />
                      <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-white" : "bg-red-500")} />
                    </span>
                  )}
                  {tab.label}
                  {!loadingLive && !loadingFinished && !loadingUpcoming && count > 0 && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-bold", isActive ? "bg-white/20" : "bg-zinc-700 text-gray-300")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <SectionLoader />
          ) : displayedMatches.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
