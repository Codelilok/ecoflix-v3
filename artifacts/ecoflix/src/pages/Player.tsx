import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { usePlay, useDetail } from "@/hooks/use-ecoflix";
import { useContinueWatching, useWatchHistory } from "@/hooks/use-local-state";
import { getTitle, getPoster } from "@/lib/utils";
import { Stream } from "@/lib/api-types";
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Loader2, AlertCircle, Check,
} from "lucide-react";

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
  const subtitles: any[] = (streamData as any)?.data?.subtitles || (streamData as any)?.subtitles || [];

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
  const [settingsTab, setSettingsTab] = useState<"speed" | "quality">("speed");
  const [seekingTo, setSeekingTo] = useState<number | null>(null);
  const [centerAnim, setCenterAnim] = useState<"play" | "pause" | "fwd" | "rwd" | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyLoggedRef = useRef(false);
  const savedTimeRef = useRef(0);

  const title = getTitle(detailData);

  useEffect(() => {
    if (!directStreamUrl && streams.length > 0 && !currentStream) {
      const hq = streams.reduce((best, s) =>
        parseInt(s.resolutions || "0") > parseInt(best.resolutions || "0") ? s : best
      );
      setCurrentStream(hq.proxyUrl || hq.url);
    }
  }, [streams, directStreamUrl, currentStream]);

  const startHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

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
      const saved = getProgress(id);
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
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    showControlsTemporarily();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

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
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
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
    const video = videoRef.current;
    const t = video?.currentTime || 0;
    savedTimeRef.current = t;
    setCurrentStream(stream.proxyUrl || stream.url);
    setShowSettings(false);
    setTimeout(() => {
      if (video) video.currentTime = savedTimeRef.current;
    }, 500);
  }, []);

  const changeSpeed = useCallback((s: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = s;
    setSpeed(s);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case " ": e.preventDefault(); togglePlay(); break;
      case "ArrowRight": e.preventDefault(); seek(10); break;
      case "ArrowLeft": e.preventDefault(); seek(-10); break;
      case "ArrowUp": e.preventDefault(); handleVolumeChange(Math.min(1, volume + 0.1)); break;
      case "ArrowDown": e.preventDefault(); handleVolumeChange(Math.max(0, volume - 0.1)); break;
      case "f": case "F": toggleFullscreen(); break;
      case "m": case "M": toggleMute(); break;
    }
  }, [togglePlay, seek, handleVolumeChange, volume, toggleFullscreen, toggleMute]);

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
  const currentResolution = (() => {
    if (!currentStream) return null;
    const match = streams.find(s => (s.proxyUrl || s.url) === currentStream);
    return match?.resolutions ? `${match.resolutions}p` : null;
  })();

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-black flex items-center justify-center overflow-hidden relative"
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      {currentStream ? (
        <video
          ref={videoRef}
          key={currentStream}
          src={currentStream}
          className="w-full h-full object-contain"
          playsInline
          crossOrigin="anonymous"
        />
      ) : (loadStream && !directStreamUrl) ? null : null}

      {isBuffering && currentStream && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="h-14 w-14 animate-spin text-red-500 drop-shadow-lg" />
        </div>
      )}

      {(!currentStream && !loadStream && (streamError || streams.length === 0)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-black">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <p className="text-2xl font-bold">Stream Unavailable</p>
          <p className="text-gray-400 text-sm max-w-sm text-center">
            No playback URL was returned for this title. Please try again later.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-zinc-800 border border-zinc-600 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      )}

      {(!currentStream && loadStream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-black">
          <Loader2 className="h-16 w-16 animate-spin text-red-500" />
          <p className="text-lg text-gray-300">Loading stream...</p>
        </div>
      )}

      {centerAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-ping-once bg-white/20 rounded-full p-8">
            {centerAnim === "play" && <Play className="h-12 w-12 text-white fill-current" />}
            {centerAnim === "pause" && <Pause className="h-12 w-12 text-white fill-current" />}
            {centerAnim === "fwd" && <RotateCw className="h-12 w-12 text-white" />}
            {centerAnim === "rwd" && <RotateCcw className="h-12 w-12 text-white" />}
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

        <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-8 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors backdrop-blur-sm border border-white/10"
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
          {currentResolution && (
            <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded">{currentResolution}</span>
          )}
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={togglePlay}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seek(x < rect.width / 2 ? -10 : 10);
          }}
        />

        <div
          className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto"
          onDoubleClick={() => seek(-10)}
          onClick={togglePlay}
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-transparent" />
        </div>
        <div
          className="absolute right-1/4 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-auto"
          onDoubleClick={() => seek(10)}
          onClick={togglePlay}
        >
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-12 space-y-3">
          <div
            ref={progressRef}
            className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onMouseLeave={() => setIsScrubbing(false)}
            onMouseMove={handleProgressMouseMove}
          >
            <div
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-red-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => seek(-10)} className="text-white hover:text-red-400 transition-colors p-1" title="Back 10s">
              <RotateCcw className="h-5 w-5" />
            </button>

            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center text-white hover:scale-110 transition-transform" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying
                ? <Pause className="h-7 w-7 fill-current" />
                : <Play className="h-7 w-7 fill-current" />
              }
            </button>

            <button onClick={() => seek(10)} className="text-white hover:text-red-400 transition-colors p-1" title="Forward 10s">
              <RotateCw className="h-5 w-5" />
            </button>

            <div className="text-white text-sm font-mono select-none whitespace-nowrap">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="text-gray-400"> / {formatTime(duration)}</span>
            </div>

            <div className="flex-1" />

            <div className="hidden sm:flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-red-400 transition-colors p-1">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-red-500"
                />
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowSettings(v => !v); setSettingsTab("speed"); }}
                className={`text-white hover:text-red-400 transition-colors p-1 ${showSettings ? "text-red-400" : ""}`}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-10 right-0 w-52 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
                  <div className="flex border-b border-zinc-800">
                    {(["speed", ...(hasStreams ? ["quality"] : [])] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab as any)}
                        className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${settingsTab === tab ? "text-red-400 bg-zinc-800" : "text-gray-400 hover:text-white"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {settingsTab === "speed" && (
                    <div className="py-1">
                      {SPEEDS.map(s => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${speed === s ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}
                        >
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
                            <button
                              key={s.id || url}
                              onClick={() => switchQuality(s)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${active ? "text-red-400 bg-zinc-800" : "text-gray-300 hover:bg-zinc-800 hover:text-white"}`}
                            >
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
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="text-white hover:text-red-400 transition-colors p-1" title="Fullscreen">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping-once {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 0.7s ease-out forwards;
        }
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
      `}</style>
    </div>
  );
}
