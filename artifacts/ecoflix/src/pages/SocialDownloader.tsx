import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Download, Loader2, AlertCircle, CheckCircle, Music, Video, Image, Link as LinkIcon, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Platform icons ─── */
function YoutubeLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      <path d="M19.6 8.2a2 2 0 00-1.4-1.4C16.8 6.5 12 6.5 12 6.5s-4.8 0-6.2.3A2 2 0 004.4 8.2C4 9.5 4 12 4 12s0 2.5.4 3.8a2 2 0 001.4 1.4c1.4.3 6.2.3 6.2.3s4.8 0 6.2-.3a2 2 0 001.4-1.4C20 14.5 20 12 20 12s0-2.5-.4-3.8z" fill="white" />
      <path d="M10 14.5V9.5L15 12l-5 2.5z" fill="#FF0000" />
    </svg>
  );
}
function TiktokLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#010101" />
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.29s-1.96.1-3.24-1.47z" fill="white" />
    </svg>
  );
}
function TwitterLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#000" />
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white" />
    </svg>
  );
}
function InstagramLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5" fill="url(#ig)" />
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17" cy="7" r="1" fill="white" />
    </svg>
  );
}
function FacebookLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path d="M16.5 3H13.5C11.015 3 9 5.015 9 7.5V10H6v3.5h3V21h3.5v-7.5h2.5l.5-3.5H12.5V7.5c0-.276.224-.5.5-.5h3.5V3z" fill="white" />
    </svg>
  );
}
function SnapchatLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#FFFC00" />
      <path d="M12 3.5c-2.49 0-4.5 2.01-4.5 4.5v1.5l-1 .5c.3.8.3.8 0 1.5l1 .3s.5 2.2 4.5 2.2c4 0 4.5-2.2 4.5-2.2l1-.3c-.3-.7-.3-.7 0-1.5l-1-.5V8c0-2.49-2.01-4.5-4.5-4.5zM8 16.5s.5 1 1.5 1.5l-.3 1s-3.7.5-3.7 1.5h13c0-1-3.7-1.5-3.7-1.5l-.3-1c1-.5 1.5-1.5 1.5-1.5H8z" fill="#1F1F1F" />
    </svg>
  );
}
function MusicLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#10b981" />
      <path d="M9 18V6l12-2v12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="6" cy="18" r="3" fill="white"/>
      <circle cx="18" cy="16" r="3" fill="white"/>
    </svg>
  );
}

/* ─── Platform config ─── */
type Platform = "youtube" | "tiktok" | "twitter" | "instagram" | "facebook" | "snapchat" | "music";

interface PlatformConfig {
  id: Platform;
  name: string;
  accent: string;
  patterns: RegExp[];
  example: string;
  Logo: () => React.ReactElement;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "youtube", name: "YouTube", accent: "text-red-500",
    patterns: [/youtube\.com/, /youtu\.be/],
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    Logo: () => <YoutubeLogo />,
  },
  {
    id: "music", name: "Music", accent: "text-emerald-400",
    patterns: [],
    example: "",
    Logo: () => <MusicLogo />,
  },
  {
    id: "tiktok", name: "TikTok", accent: "text-pink-400",
    patterns: [/tiktok\.com/],
    example: "https://www.tiktok.com/@tiktok/video/7106594312292453675",
    Logo: () => <TiktokLogo />,
  },
  {
    id: "twitter", name: "X / Twitter", accent: "text-gray-200",
    patterns: [/twitter\.com/, /x\.com/],
    example: "https://x.com/i/status/2049066563920130386",
    Logo: () => <TwitterLogo />,
  },
  {
    id: "instagram", name: "Instagram", accent: "text-pink-500",
    patterns: [/instagram\.com/],
    example: "https://www.instagram.com/reel/DXylIiWItuD/",
    Logo: () => <InstagramLogo />,
  },
  {
    id: "facebook", name: "Facebook", accent: "text-blue-400",
    patterns: [/facebook\.com/, /fb\.com/, /fb\.watch/],
    example: "https://web.facebook.com/reel/1153246306691628",
    Logo: () => <FacebookLogo />,
  },
  {
    id: "snapchat", name: "Snapchat", accent: "text-yellow-400",
    patterns: [/snapchat\.com/],
    example: "https://www.snapchat.com/add/example",
    Logo: () => <SnapchatLogo />,
  },
];

function detectPlatform(url: string): Platform | null {
  for (const p of PLATFORMS) {
    if (p.patterns.some((r) => r.test(url))) return p.id;
  }
  return null;
}

/* ─── Download link type ─── */
interface DLLink {
  label: string;
  url: string;
  quality?: string;
  type: "video" | "audio" | "image";
  thumbnail?: string;
}

interface DLResult {
  title?: string;
  thumbnail?: string;
  links: DLLink[];
  snapGrid?: { thumbnail?: string; url: string; title?: string }[];
}

/* ─── Instant download helper ─── */
async function triggerDownload(url: string, name = "download", setDlLoading?: (v: boolean) => void) {
  setDlLoading?.(true);
  try {
    // If URL is already one of our own streaming endpoints, use it directly.
    // Otherwise route through the proxy so the server fetches the CDN URL.
    const href = url.startsWith("/api/")
      ? url
      : `/api/dl/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setDlLoading?.(false);
  }
}

/* ─── API helpers ─── */
const CASPER = "https://apis.xcasper.space/api/downloader";
const JERRY = "https://jerrycoder.oggyapi.workers.dev";

async function tryFetch(urls: string[]): Promise<any> {
  let lastErr: Error = new Error("All sources failed");
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function fetchYouTube(url: string): Promise<DLResult> {
  const res = await fetch(`/api/dl/yt-info?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || "Could not fetch YouTube video");
  return {
    title: json.title,
    thumbnail: json.thumbnail,
    links: json.links.map((l: any) => ({
      label: l.label,
      url: l.streamUrl,
      type: l.type as "video" | "audio" | "image",
    })),
  };
}

async function fetchTikTok(url: string): Promise<DLResult> {
  const json = await tryFetch([
    `${CASPER}/tiktok?url=${encodeURIComponent(url)}`,
    `${CASPER}/tiktok2?url=${encodeURIComponent(url)}`,
    `${CASPER}/tiktok3?url=${encodeURIComponent(url)}`,
  ]);

  const links: DLLink[] = [];
  const noWm = json.no_watermark ?? json.nowm ?? json.data?.no_watermark;
  const play = json.download_url ?? json.play ?? json.url ?? json.data?.play ?? json.video?.play;
  const audio = json.audio ?? json.music_url ?? json.data?.music;

  if (noWm) links.push({ label: "Without Watermark", url: noWm, type: "video" });
  if (play && play !== noWm) links.push({ label: "Without Watermark (Alt)", url: play, type: "video" });
  if (audio) links.push({ label: "Audio Only", url: audio, type: "audio" });

  if (links.length === 0) throw new Error("No download links in response");
  return {
    title: json.title ?? json.caption ?? json.desc ?? json.data?.title,
    thumbnail: json.thumbnail ?? json.cover ?? json.data?.cover,
    links,
  };
}

async function fetchTwitter(url: string): Promise<DLResult> {
  const res = await fetch(`/api/dl/twitter-info?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || "Could not fetch Twitter/X video");
  return {
    title: json.title,
    thumbnail: json.thumbnail,
    links: json.links.map((l: any) => ({ label: l.label, url: l.url, type: l.type as "video" | "audio" | "image" })),
  };
}

async function fetchInstagram(url: string): Promise<DLResult> {
  const json = await tryFetch([`https://apis.xcasper.space/api/downloader/ig?url=${encodeURIComponent(url)}`]);
  if (!json.success) throw new Error(json.message || "Could not fetch Instagram content");

  const allMedia: any[] = json.all_media ?? [];
  const links: DLLink[] = allMedia
    .filter((m: any) => m.url)
    .map((m: any, i: number) => ({
      label: m.type === "audio" ? `Audio ${i + 1}` : m.type === "video" ? `Video ${i + 1} (${m.quality ?? "HD"})` : `Image ${i + 1}`,
      url: m.url,
      type: (m.type === "video" ? "video" : m.type === "audio" ? "audio" : "image") as "video" | "audio" | "image",
      thumbnail: m.thumbnail ?? json.thumbnail,
    }));

  if (links.length === 0) {
    const fallback = json.download_url ?? json.mp4_url ?? "";
    if (!fallback) throw new Error("No download links in response — try a public post link");
    links.push({ label: "Download", url: fallback, type: "video" });
  }

  const author = json.author?.display_name ?? json.author?.username ?? "Instagram";
  return { title: json.caption ? `${author} — ${json.caption}` : author, thumbnail: json.thumbnail, links };
}

async function fetchFacebook(url: string): Promise<DLResult> {
  const json = await tryFetch([
    `${CASPER}/fb?url=${encodeURIComponent(url)}`,
    `${CASPER}/fb2?url=${encodeURIComponent(url)}`,
  ]);
  const downloads: any[] = json.downloads ?? [];
  const links: DLLink[] = downloads
    .filter((d: any) => d.url)
    .map((d: any) => ({
      label: d.quality ?? "Video",
      url: d.url,
      quality: d.quality,
      type: "video" as const,
    }));
  if (links.length === 0 && json.primaryDownload) {
    links.push({ label: "Download Video", url: json.primaryDownload, type: "video" });
  }
  if (links.length === 0) throw new Error("No download links in response");
  return { title: json.title, thumbnail: json.thumbnail, links };
}

async function fetchSnapchat(url: string): Promise<DLResult> {
  const res = await fetch(`${JERRY}/snap?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const medias: any[] = json.medias ?? [];
  if (medias.length === 0) throw new Error("No media found — try a public Snap story or spotlight link");
  const snapGrid = medias
    .filter((m: any) => m.url)
    .map((m: any) => ({ thumbnail: m.thumbnail ?? json.thumbnail, url: m.url, title: json.title, type: m.type }));
  return {
    title: json.title,
    thumbnail: json.thumbnail,
    links: [],
    snapGrid,
  };
}

async function fetchMedia(platform: Platform, url: string): Promise<DLResult> {
  switch (platform) {
    case "youtube": return fetchYouTube(url);
    case "tiktok": return fetchTikTok(url);
    case "twitter": return fetchTwitter(url);
    case "instagram": return fetchInstagram(url);
    case "facebook": return fetchFacebook(url);
    case "snapchat": return fetchSnapchat(url);
    default: throw new Error("Unsupported platform");
  }
}

/* ─── Sub-components ─── */
function DownloadBtn({ link, title, loading, onDl }: {
  link: DLLink; title?: string; loading: boolean;
  onDl: () => void;
}) {
  return (
    <button
      onClick={onDl}
      disabled={loading}
      className="flex items-center justify-between gap-3 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-4 py-3 transition-colors group disabled:opacity-60 active:scale-[0.98]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {link.type === "audio"
          ? <Music className="h-4 w-4 text-green-400 flex-shrink-0" />
          : link.type === "image"
          ? <Image className="h-4 w-4 text-purple-400 flex-shrink-0" />
          : <Video className="h-4 w-4 text-blue-400 flex-shrink-0" />}
        <span className="text-white font-semibold text-sm truncate group-hover:text-red-300 transition-colors">{link.label}</span>
      </div>
      {loading ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" /> : <Download className="h-4 w-4 text-gray-500 group-hover:text-red-400 transition-colors flex-shrink-0" />}
    </button>
  );
}

function SnapGridItem({ item, title }: { item: { thumbnail?: string; url: string; title?: string }; title?: string }) {
  const [dlLoading, setDlLoading] = useState(false);
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden flex flex-col">
      {item.thumbnail
        ? <img src={item.thumbnail} alt="snap" className="w-full aspect-square object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        : <div className="w-full aspect-square bg-zinc-700 flex items-center justify-center"><SnapchatLogo size={40} /></div>
      }
      <button
        onClick={() => triggerDownload(item.url, title ?? "snap", setDlLoading)}
        disabled={dlLoading}
        className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-black font-bold text-sm py-2.5 px-3 w-full transition-colors active:scale-[0.98]"
      >
        {dlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {dlLoading ? "Saving..." : "Download"}
      </button>
    </div>
  );
}

/* ─── Music Search Component ─── */
interface MusicVideo {
  title: string;
  videoId: string;
  url: string;
  thumbnail: string;
  channel: string;
  duration: string;
  views: string;
}

function MusicSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MusicVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState<{ id: string; type: string } | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      const res = await fetch(`/api/dl/yt-search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Search failed");
      setResults(json.videos ?? []);
    } catch (e: any) {
      setError(e.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const download = async (video: MusicVideo, type: "video" | "audio") => {
    setDlLoading({ id: video.videoId, type });
    const streamUrl = `/api/dl/yt-stream?url=${encodeURIComponent(video.url)}&type=${type}`;
    const a = document.createElement("a");
    a.href = streamUrl;
    a.download = video.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDlLoading(null), 2000);
  };

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search for a song, artist or album…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && query.trim() && search()}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setError(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        onClick={search}
        disabled={loading || !query.trim()}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-[0.98] mb-5"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? "Searching…" : "Search"}
      </button>

      {error && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((video) => {
            const isDownloadingMp4 = dlLoading?.id === video.videoId && dlLoading.type === "video";
            const isDownloadingMp3 = dlLoading?.id === video.videoId && dlLoading.type === "audio";
            return (
              <div key={video.videoId} className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                <div className="flex gap-3 p-3">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded-xl flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{video.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{video.channel}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{video.duration} · {video.views}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  <button
                    onClick={() => download(video, "video")}
                    disabled={dlLoading?.id === video.videoId}
                    className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-xs font-bold transition-colors active:scale-[0.97]"
                  >
                    {isDownloadingMp4 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5 text-blue-400" />}
                    {isDownloadingMp4 ? "Saving…" : "MP4 Video"}
                  </button>
                  <button
                    onClick={() => download(video, "audio")}
                    disabled={dlLoading?.id === video.videoId}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-xs font-bold transition-colors active:scale-[0.97]"
                  >
                    {isDownloadingMp3 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Music className="h-3.5 w-3.5" />}
                    {isDownloadingMp3 ? "Saving…" : "MP3 Audio"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-10 text-gray-600">
          <Music className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search for any song to download as MP4 or MP3</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function SocialDownloader() {
  const [inputUrl, setInputUrl] = useState("");
  const [activePlatform, setActivePlatform] = useState<Platform>("youtube");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dlLoadingIdx, setDlLoadingIdx] = useState<number | null>(null);

  const detected = detectPlatform(inputUrl);
  const platform = detected ?? activePlatform;
  const platformCfg = PLATFORMS.find((p) => p.id === platform)!;

  const handleFetch = async () => {
    const url = inputUrl.trim();
    if (!url) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await fetchMedia(platform, url);
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDl = async (link: DLLink, idx: number, title?: string) => {
    setDlLoadingIdx(idx);
    await triggerDownload(link.url, title ?? "download");
    setDlLoadingIdx(null);
  };

  const clear = () => { setInputUrl(""); setResult(null); setError(null); };

  const useExample = () => {
    setInputUrl(platformCfg.example);
    setResult(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="pt-20 pb-20 min-h-screen">
        <div className="max-w-screen-sm mx-auto px-4">

          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/30 to-purple-600/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Social Downloader</h1>
              <p className="text-gray-500 text-xs mt-0.5">Save videos & media from any platform</p>
            </div>
          </div>

          {/* Platform tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActivePlatform(p.id); setResult(null); setError(null); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold flex-shrink-0 transition-all",
                  (detected ?? activePlatform) === p.id
                    ? "bg-zinc-800 border-zinc-500 text-white scale-105"
                    : "bg-zinc-900/60 border-zinc-800 text-gray-500 hover:text-gray-300 hover:border-zinc-700"
                )}
              >
                <p.Logo />
                <span className="hidden sm:inline">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Music Search — replaces the URL input section */}
          {activePlatform === "music" ? (
            <MusicSearch />
          ) : (
            <>
              {/* URL input */}
              <div className="relative mb-3">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <input
                  type="url"
                  placeholder={`Paste a ${platformCfg.name} link…`}
                  value={inputUrl}
                  onChange={(e) => { setInputUrl(e.target.value); setResult(null); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && !loading && inputUrl.trim() && handleFetch()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-10 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
                {inputUrl && (
                  <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Detected platform pill */}
              {detected && detected !== activePlatform && (
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700 mb-3 text-xs font-medium", platformCfg.accent)}>
                  <platformCfg.Logo />
                  <span>{platformCfg.name} link detected</span>
                </div>
              )}

              {/* Action row */}
              <div className="mb-5">
                <button
                  onClick={handleFetch}
                  disabled={loading || !inputUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {loading ? "Fetching…" : "Get Download Links"}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-semibold text-sm">Couldn't fetch download links</p>
                    <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Results ─── */}
          {result && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
              {/* Thumbnail */}
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt="thumbnail"
                  className="w-full h-44 object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}

              <div className="p-4">
                {result.title && (
                  <p className="text-white font-semibold text-sm mb-3 leading-snug line-clamp-2">{result.title}</p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm font-semibold">
                    {result.snapGrid
                      ? `${result.snapGrid.length} snap${result.snapGrid.length !== 1 ? "s" : ""} found`
                      : `${result.links.length} link${result.links.length !== 1 ? "s" : ""} found`}
                  </span>
                </div>

                {/* Snapchat 2-col grid */}
                {result.snapGrid && result.snapGrid.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {result.snapGrid.map((item, i) => (
                      <SnapGridItem key={i} item={item} title={result.title} />
                    ))}
                  </div>
                )}

                {/* Instagram media grid (images + videos side by side) */}
                {platform === "instagram" && result.links.length > 0 && (
                  <div>
                    {/* Preview thumbnails grid */}
                    {result.links.some((l) => l.thumbnail) && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {result.links.filter((l) => l.thumbnail).map((link, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden group cursor-pointer"
                            onClick={() => handleDl(link, i, result.title)}>
                            <img src={link.thumbnail!} alt={link.label} className="w-full aspect-square object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {dlLoadingIdx === i
                                ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                                : <Download className="h-6 w-6 text-white" />}
                            </div>
                            <div className="absolute bottom-1.5 left-1.5">
                              {link.type === "video"
                                ? <div className="bg-black/70 rounded-full p-1"><Video className="h-3 w-3 text-white" /></div>
                                : <div className="bg-black/70 rounded-full p-1"><Image className="h-3 w-3 text-white" /></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Download all list */}
                    <div className="flex flex-col gap-2">
                      {result.links.map((link, i) => (
                        <DownloadBtn key={i} link={link} title={result.title} loading={dlLoadingIdx === i}
                          onDl={() => handleDl(link, i, result.title)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All other platforms: list of download buttons */}
                {platform !== "instagram" && !result.snapGrid && result.links.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {result.links.map((link, i) => (
                      <DownloadBtn key={i} link={link} title={result.title} loading={dlLoadingIdx === i}
                        onDl={() => handleDl(link, i, result.title)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state: platform grid */}
          {!result && !error && !loading && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <p className="text-gray-500 text-xs text-center mb-4 font-medium uppercase tracking-wider">Supported Platforms</p>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatform(p.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 border rounded-xl p-3 transition-all",
                      activePlatform === p.id
                        ? "bg-zinc-800 border-zinc-600"
                        : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700"
                    )}
                  >
                    <p.Logo />
                    <span className="text-gray-400 text-xs font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
