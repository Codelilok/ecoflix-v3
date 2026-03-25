import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { usePlay, useDetail } from "@/hooks/use-ecoflix";
import { useContinueWatching, useWatchHistory } from "@/hooks/use-local-state";
import { getTitle, getPoster } from "@/lib/utils";
import { Stream, EpisodeItem, SeasonItem } from "@/lib/api-types";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Loader2, AlertCircle, Check,
  List, ChevronDown, X, Minus,
} from "lucide-react";

/* ─── helpers ─── */

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function parseTimestamp(ts: string): number {
  const clean = ts.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
}

function parseVTT(text: string): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("-->")) {
      const [startRaw, endRaw] = line.split("-->").map(s => s.trim().split(" ")[0]);
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
    } else {
      i++;
    }
  }
  return cues;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ─── Player ─── */

export default function Player() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);

  const id = params.get("id") || "";
  const type = (params.get("type") as "movie" | "tv") || "movie";
  const season = params.get("season") || undefined;
  const episode = params.get("episode") || undefined;
  const directStreamUrl = params.get("streamUrl")
    ? decodeURIComponent(params.get("streamUrl")!)
    : null;

  const { data: streamData, isLoading: loadStream, error: streamError } = usePlay(id, type, season, episode);
  const { data: detailData } = useDetail(id);
  const { saveProgress, getProgress } = useContinueWatching();
  const { addToHistory } = useWatchHistory();

  const streams: Stream[] = streamData?.streams || [];
  const rawSubtitles: any[] = (streamData as any)?.data?.subtitles || (streamData as any)?.subtitles || [];
  const seasonsRaw = (detailData as any)?.resource;
  const seasons: SeasonItem[] = Array.isArray(seasonsRaw) ? seasonsRaw : [];

  const [currentStream, setCurrentStream] = useState<string | null>(directStreamUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"speed" | "quality" | "subtitles">("speed");
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [centerAnim, setCenterAnim] = useState<"play" | "pause" | "fwd" | "rwd" | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState<string>("off");
  const [subtitleCues, setSubtitleCues] = useState<{ start: number; end: number; text: string }[]>([]);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(0);
  const [manualSeason, setManualSeason] = useState(Number(season) || 1);
  const [manualEp, setManualEp] = useState(Number(episode) || 1);
  const [epPickerModal, setEpPickerModal] = useState<{ season: number; ep: number } | null>(null);
  const [epPickerStreams, setEpPickerStreams] = useState<Stream[]>([]);
  const [epPickerLoading, setEpPickerLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyLoggedRef = useRef(false);
  const savedTimeRef = useRef(0);

  const title = getTitle(detailData);

  /* reset stream when episode/movie changes */
  useEffect(() => {
    setCurrentStream(directStreamUrl || null);
    historyLoggedRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, season, episode]);

  /* pick best stream automatically — prefer previously chosen quality */
  useEffect(() => {
    if (!directStreamUrl && streams.length > 0 && !currentStream) {
      const preferred = sessionStorage.getItem("ecoflix-quality");
      let chosen = preferred ? streams.find(s => s.resolutions === preferred) : null;
      if (!chosen) {
        chosen = streams.reduce((best, s) =>
          parseInt(s.resolutions || "0") > parseInt(best.resolutions || "0") ? s : best
        );
      }
      setCurrentStream(chosen.proxyUrl || chosen.url);
    }
  }, [streams, directStreamUrl, currentStream]);

  /* store quality when playing via direct URL from detail page */
  useEffect(() => {
    if (directStreamUrl && streams.length > 0) {
      const match = streams.find(s => (s.proxyUrl || s.url) === directStreamUrl);
      if (match?.resolutions) {
        sessionStorage.setItem("ecoflix-quality", match.resolutions);
      }
    }
  }, [directStreamUrl, streams]);

  /* controls auto-hide */
  const startHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

  /* video events */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onTimeUpdate = () => {
      const ct = video.currentTime;
      setCurrentTime(ct);
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / (video.duration || 1)) * 100);
      }
      if (!isNaN(video.duration) && video.duration > 0 && id) {
        const pct = (ct / video.duration) * 100;
        if (Math.floor(ct) % 10 === 0 && ct > 0) {
          saveProgress({ id, type, title, poster: getPoster(detailData), progress: pct, season, episode });
        }
        if (!historyLoggedRef.current && ct > 5) {
          addToHistory({ id, type, title, poster: getPoster(detailData), season, episode });
          historyLoggedRef.current = true;
        }
      }
    };
    const onDuration = () => setDuration(video.duration);
    const onEnded = () => { setIsPlaying(false); setShowControls(true); };
    const onLoadedData = () => {
      setIsBuffering(false);
      const saved = getProgress(id, season, episode);
      if (saved > 0 && saved < 98 && video.duration) {
        video.currentTime = (saved / 100) * video.duration;
      }
      video.play().catch(() => {});
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("ended", onEnded);
    video.addEventListener("loadeddata", onLoadedData);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, [currentStream, id]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      try {
        if (isFs) {
          screen.orientation.lock("landscape").catch(() => {});
        } else {
          screen.orientation.lock("portrait").catch(() => {});
        }
      } catch {}
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    showControlsTemporarily();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  /* custom subtitle fetching + parsing */
  useEffect(() => {
    if (activeSubtitle === "off") {
      setSubtitleCues([]);
      return;
    }
    const sub = rawSubtitles.find((s: any) => {
      const label = s.label || s.language || s.lang || "";
      return label === activeSubtitle;
    });
    if (!sub) return;
    const url = sub.url || sub.src;
    if (!url) return;

    fetch(url)
      .then(r => r.text())
      .then(text => {
        setSubtitleCues(parseVTT(text));
      })
      .catch(() => setSubtitleCues([]));
  }, [activeSubtitle]);

  /* actions */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setCenterAnim("play");
    } else {
      video.pause();
      setCenterAnim("pause");
    }
    setTimeout(() => setCenterAnim(null), 700);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setCenterAnim(seconds > 0 ? "fwd" : "rwd");
    setTimeout(() => setCenterAnim(null), 700);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const handleProgressMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [isScrubbing, duration]);

  const switchQuality = useCallback((stream: Stream) => {
    if (stream.resolutions) sessionStorage.setItem("ecoflix-quality", stream.resolutions);
    const video = videoRef.current;
    savedTimeRef.current = video?.currentTime || 0;
    setCurrentStream(stream.proxyUrl || stream.url);
    setShowSettings(false);
    setTimeout(() => {
      if (videoRef.current) videoRef.current.currentTime = savedTimeRef.current;
    }, 500);
  }, []);

  const changeSpeed = useCallback((s: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = s;
    setSpeed(s);
  }, []);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else setLocation(type === "tv" ? `/tv/${id}` : `/movie/${id}`);
  }, [id, type, setLocation]);

  const streamEpisode = useCallback((seasonNum: number, epNum: number, stream?: Stream) => {
    setShowEpisodes(false);
    setEpPickerModal(null);
    historyLoggedRef.current = false;
    const streamParam = stream ? `&streamUrl=${encodeURIComponent(stream.proxyUrl || stream.url)}` : "";
    setLocation(`/player?id=${id}&type=tv&season=${seasonNum}&episode=${epNum}${streamParam}`);
  }, [id, setLocation]);

  const handleEpisodeClick = useCallback((seasonNum: number, epNum: number) => {
    setEpPickerModal({ season: seasonNum, ep: epNum });
    setEpPickerStreams([]);
    setEpPickerLoading(true);
    const qs = `subjectId=${encodeURIComponent(id!)}&se=${encodeURIComponent(seasonNum)}&ep=${encodeURIComponent(epNum)}`;
    fetch(`https://movieapi.xcasper.space/api/play?${qs}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      }
    })
      .then((r) => r.json())
      .then((json) => {
        const streams: Stream[] = json?.data?.streams || [];
        if (streams.length <= 1) {
          streamEpisode(seasonNum, epNum, streams[0]);
        } else {
          setEpPickerStreams(streams);
        }
      })
      .catch(() => streamEpisode(seasonNum, epNum))
      .finally(() => setEpPickerLoading(false));
  }, [id, streamEpisode]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showEpisodes) return;
    switch (e.key) {
      case " ": e.preventDefault(); togglePlay(); break;
      case "ArrowRight": e.preventDefault(); seek(10); break;
      case "ArrowLeft": e.preventDefault(); seek(-10); break;
      case "ArrowUp": e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
      case "ArrowDown": e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
      case "f": case "F": toggleFullscreen(); break;
      case "m": case "M": toggleMute(); break;
      case "Escape": setShowEpisodes(false); setShowSettings(false); break;
    }
  }, [togglePlay, seek, handleVolumeChange, volume, toggleFullscreen, toggleMute, showEpisodes]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!id) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p>Invalid playback parameters.</p>
        <button onClick={() => setLocation("/")} className="mt-2 px-6 py-2 bg-red-600 rounded font-bold">Go Home</button>
      </div>
    );
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasStreams = streams.length > 1;
  const hasSubtitles = rawSubtitles.length > 0;
  const currentResolution = (() => {
    if (!currentStream) return null;
    const match = streams.find(s => (s.proxyUrl || s.url) === currentStream);
    return match?.resolutions ? `${match.resolutions}p` : null;
  })();
  const currentSubCue = subtitleCues.find(c => currentTime >= c.start && currentTime <= c.end);

  const settingsTabs: ("speed" | "quality" | "subtitles")[] = [
    "speed",
    ...(hasStreams ? (["quality"] as const) : []),
    ...(hasSubtitles ? (["subtitles"] as const) : []),
  ];

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-black flex items-center justify-center overflow-hidden relative select-none"
      onMouseMove={showControlsTemporarily}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {/* Video */}
      {currentStream && (
        <video
          ref={videoRef}
          key={currentStream}
          src={currentStream}
          className="w-full h-full object-contain"
          playsInline
        />
      )}

      {/* Buffering spinner */}
      {isBuffering && currentStream && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 className="h-14 w-14 animate-spin text-red-500 drop-shadow-lg" />
        </div>
      )}

      {/* Stream error */}
      {!currentStream && !loadStream && (streamError || streams.length === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-black z-20">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <p className="text-2xl font-bold">Stream Unavailable</p>
          <p className="text-gray-400 text-sm max-w-sm text-center">No playback URL was returned for this title.</p>
          <button onClick={handleBack} className="px-8 py-3 bg-zinc-800 border border-zinc-600 rounded-lg font-semibold hover:bg-zinc-700 transition-colors">
            Go Back
          </button>
        </div>
      )}

      {/* Loading stream */}
      {!currentStream && loadStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-black z-20">
          <Loader2 className="h-16 w-16 animate-spin text-red-500" />
          <p className="text-lg text-gray-300">Loading stream...</p>
        </div>
      )}

      {/* Center animation feedback */}
      {centerAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="animate-ping-once bg-white/20 rounded-full p-8">
            {centerAnim === "play" && <Play className="h-12 w-12 text-white fill-current" />}
            {centerAnim === "pause" && <Pause className="h-12 w-12 text-white fill-current" />}
            {centerAnim === "fwd" && <RotateCw className="h-12 w-12 text-white" />}
            {centerAnim === "rwd" && <RotateCcw className="h-12 w-12 text-white" />}
          </div>
        </div>
      )}

      {/* Custom subtitle overlay — positioned inside the video area */}
      {currentSubCue && (
        <div className="absolute left-0 right-0 pointer-events-none z-[25] flex justify-center" style={{ bottom: showControls ? "160px" : "32px" }}>
          <div className="bg-black/80 text-white text-base md:text-lg px-5 py-2 rounded-lg max-w-[85%] text-center leading-snug whitespace-pre-line font-medium shadow-2xl">
            {currentSubCue.text}
          </div>
        </div>
      )}

      {/* ── When controls are HIDDEN: full-screen tap zone that ONLY shows controls ── */}
      {!showControls && (
        <div
          className="absolute inset-0 z-20"
          onClick={showControlsTemporarily}
          onTouchEnd={(e) => { e.preventDefault(); showControlsTemporarily(); }}
        />
      )}

      {/* ── Controls overlay (visible only when showControls) ── */}
      {showControls && (
        <div className="absolute inset-0 z-20">
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

          {/* ── Top bar ── stop all events so nothing falls through to center zone */}
          <div
            className="absolute top-0 left-0 right-0 px-4 pt-4 pb-6 flex items-center gap-3"
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            <button
              onClick={handleBack}
              className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors backdrop-blur-sm border border-white/10 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {title && (
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base leading-tight drop-shadow line-clamp-1">{title}</h2>
                {type === "tv" && season && episode && (
                  <p className="text-gray-300 text-xs mt-0.5 drop-shadow">Season {season} · Episode {episode}</p>
                )}
              </div>
            )}
            {type === "tv" && (
              <button
                onClick={() => { setShowEpisodes(v => !v); setShowSettings(false); }}
                className={`p-2 rounded-lg border transition-colors backdrop-blur-sm ${showEpisodes ? "bg-red-600 border-red-500 text-white" : "bg-black/50 border-white/10 text-white hover:bg-black/80"}`}
                title="Episodes"
              >
                <List className="h-5 w-5" />
              </button>
            )}
            {currentResolution && (
              <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded flex-shrink-0">{currentResolution}</span>
            )}
          </div>

          {/* ── Center zone: ONLY this area toggles play/pause ── */}
          <div
            className="absolute left-0 right-0"
            style={{ top: "72px", bottom: "100px" }}
            onClick={togglePlay}
            onDoubleClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(e.clientX - rect.left < rect.width / 2 ? -10 : 10);
            }}
          />

          {/* ── Bottom controls ── stop all events */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-12 space-y-3"
            onClick={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
              onMouseDown={() => setIsScrubbing(true)}
              onMouseUp={() => setIsScrubbing(false)}
              onMouseLeave={() => setIsScrubbing(false)}
              onMouseMove={handleProgressMouseMove}
            >
              <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
              <div className="absolute inset-y-0 left-0 bg-red-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
                style={{ left: `${progressPct}%` }}
              />
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => seek(-10)} className="text-white hover:text-red-400 transition-colors p-1" title="Back 10s">
                <RotateCcw className="h-5 w-5" />
              </button>
              <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center text-white hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
              </button>
              <button onClick={() => seek(10)} className="text-white hover:text-red-400 transition-colors p-1" title="Forward 10s">
                <RotateCw className="h-5 w-5" />
              </button>
              <div className="text-white text-sm font-mono select-none whitespace-nowrap">
                <span>{formatTime(currentTime)}</span>
                <span className="text-gray-400"> / {formatTime(duration)}</span>
              </div>
              <div className="flex-1" />

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-red-400 transition-colors p-1">
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-red-500"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => { setShowSettings(v => !v); setShowEpisodes(false); setSettingsTab("speed"); }}
                  className={`text-white hover:text-red-400 transition-colors p-1 ${showSettings ? "text-red-400" : ""}`}
                >
                  <Settings className="h-5 w-5" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-10 right-0 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex border-b border-zinc-800">
                      {settingsTabs.map(tab => (
                        <button
                          key={tab}
                          onClick={() => setSettingsTab(tab)}
                          className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${settingsTab === tab ? "text-red-400 bg-zinc-800" : "text-gray-400 hover:text-white"}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {settingsTab === "speed" && (
                      <div className="py-1">
                        {SPEEDS.map(s => (
                          <button key={s} onClick={() => changeSpeed(s)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${speed === s ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}>
                            <span>{s === 1 ? "Normal" : `${s}×`}</span>
                            {speed === s && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {settingsTab === "quality" && hasStreams && (
                      <div className="py-1">
                        {[...streams]
                          .sort((a, b) => parseInt(b.resolutions || "0") - parseInt(a.resolutions || "0"))
                          .map(s => {
                            const url = s.proxyUrl || s.url;
                            const active = url === currentStream;
                            const sizeBytes = typeof s.size === "string" ? parseInt(s.size as any) : (s.size || 0);
                            const sizeMB = sizeBytes > 0 ? `${(sizeBytes / 1024 / 1024).toFixed(0)} MB` : "";
                            return (
                              <button key={s.id || url} onClick={() => switchQuality(s)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${active ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}>
                                <div className="text-left">
                                  <span className="font-semibold">{s.resolutions ? `${s.resolutions}p` : s.format}</span>
                                  {sizeMB && <span className="text-xs text-gray-500 ml-2">{sizeMB}</span>}
                                </div>
                                {active && <Check className="h-4 w-4" />}
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {settingsTab === "subtitles" && hasSubtitles && (
                      <div className="py-1">
                        <button onClick={() => setActiveSubtitle("off")}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${activeSubtitle === "off" ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}>
                          <span>Off</span>
                          {activeSubtitle === "off" && <Check className="h-4 w-4" />}
                        </button>
                        {rawSubtitles.map((sub: any, i: number) => {
                          const label = sub.label || sub.language || sub.lang || `Subtitle ${i + 1}`;
                          return (
                            <button key={i} onClick={() => setActiveSubtitle(label)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${activeSubtitle === label ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}>
                              <span>{label}</span>
                              {activeSubtitle === label && <Check className="h-4 w-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-red-400 transition-colors p-1">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Episodes side panel ── */}
      {showEpisodes && type === "tv" && (
        <div className="absolute inset-0 z-30 flex" onClick={() => setShowEpisodes(false)}>
          <div className="flex-1" />
          <div
            className="w-full max-w-xs bg-zinc-950/98 backdrop-blur-lg border-l border-zinc-800 h-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800 flex-shrink-0">
              <h3 className="text-white font-bold text-base">Episodes &amp; Seasons</h3>
              <button onClick={() => setShowEpisodes(false)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {seasons.length === 0 ? (
                /* Manual picker when no season data available */
                <div className="p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">Pick an episode</p>

                  <div className="space-y-4 mb-5">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Season</p>
                      <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                        <button
                          onClick={() => setManualSeason(Math.max(1, manualSeason - 1))}
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5 text-white" />
                        </button>
                        <span className="flex-1 text-center text-white font-black text-2xl">{manualSeason}</span>
                        <button
                          onClick={() => setManualSeason(manualSeason + 1)}
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Episode</p>
                      <div className="flex items-center gap-3 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700">
                        <button
                          onClick={() => setManualEp(Math.max(1, manualEp - 1))}
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5 text-white" />
                        </button>
                        <span className="flex-1 text-center text-white font-black text-2xl">{manualEp}</span>
                        <button
                          onClick={() => setManualEp(manualEp + 1)}
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0 text-white font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleEpisodeClick(manualSeason, manualEp);
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors w-full justify-center"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    S{manualSeason} · E{manualEp}
                  </button>
                </div>
              ) : (
                /* Full accordion with season data */
                seasons.map((s: SeasonItem, i: number) => {
                  const sNum = s.seasonNumber ?? s.season ?? (i + 1);
                  const epCount = s.episodes?.length || 0;
                  const isOpen = expandedSeason === i;

                  return (
                    <div key={i} className="border-b border-zinc-800/60">
                      <button
                        onClick={() => setExpandedSeason(isOpen ? null : i)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${isOpen ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${isOpen ? "bg-red-600 text-white" : "bg-zinc-700 text-gray-300"}`}>
                            {sNum}
                          </div>
                          <p className="text-sm font-semibold text-white">Season {sNum}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {epCount > 0 && <span className="text-xs text-gray-500">{epCount} ep</span>}
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-red-400" : ""}`} />
                        </div>
                      </button>

                      {isOpen && s.episodes && s.episodes.length > 0 && (
                        <div className="bg-zinc-950/60">
                          {s.episodes.map((ep: EpisodeItem, epIdx: number) => {
                            const epNum = ep.episodeNumber ?? ep.episode ?? (epIdx + 1);
                            const epTitle = ep.title ?? ep.name ?? `Episode ${epNum}`;
                            const isCurrent = String(sNum) === season && String(epNum) === episode;

                            return (
                              <button
                                key={epIdx}
                                onClick={() => !isCurrent && handleEpisodeClick(sNum, epNum)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${isCurrent ? "bg-red-600/10 border-l-2 border-red-500" : "hover:bg-zinc-800/60"}`}
                              >
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-400 group-hover:text-red-400"}`}>
                                  {epNum}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${isCurrent ? "text-red-400" : "text-gray-300 group-hover:text-white"}`}>
                                    {epTitle}
                                  </p>
                                  {ep.duration && <p className="text-xs text-gray-600">{Math.floor(ep.duration / 60)} min</p>}
                                </div>
                                {isCurrent && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isOpen && (!s.episodes || s.episodes.length === 0) && (
                        <div className="py-6 text-center text-gray-500 text-xs bg-zinc-950/60">No episodes available</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Episode quality picker modal */}
      {epPickerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setEpPickerModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base">Choose Quality</p>
                <p className="text-gray-400 text-xs mt-0.5">S{epPickerModal.season} · E{epPickerModal.ep}</p>
              </div>
              <button onClick={() => setEpPickerModal(null)} className="text-gray-500 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {epPickerLoading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="h-7 w-7 animate-spin text-red-500" />
                  <p className="text-gray-400 text-sm">Loading streams...</p>
                </div>
              ) : epPickerStreams.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-sm">No streams found</div>
              ) : (
                <div className="space-y-2">
                  {epPickerStreams.map((s, i) => {
                    const label = s.resolutions ? `${s.resolutions}p` : s.format ? s.format.toUpperCase() : `Quality ${i + 1}`;
                    return (
                      <button
                        key={i}
                        onClick={() => streamEpisode(epPickerModal.season, epPickerModal.ep, s)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-red-600/20 hover:border-red-500/40 border border-zinc-700 rounded-xl transition-all group"
                      >
                        <span className="text-white font-semibold text-sm group-hover:text-red-300">{label}</span>
                        <Play className="h-4 w-4 text-gray-500 group-hover:text-red-400 fill-current" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping-once {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-ping-once { animation: ping-once 0.7s ease-out forwards; }
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
      `}</style>
    </div>
  );
}
