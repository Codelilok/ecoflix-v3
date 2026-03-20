import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { usePlay, useDetail } from "@/hooks/use-ecoflix";
import { useContinueWatching } from "@/hooks/use-local-state";
import { getTitle, getPoster, getType } from "@/lib/utils";
import { ArrowLeft, Loader2, AlertCircle, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stream } from "@/lib/api-types";

export default function Player() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const id = searchParams.get('id') || '';
  const type = (searchParams.get('type') as 'movie' | 'tv') || 'movie';
  const season = searchParams.get('season') || undefined;
  const episode = searchParams.get('episode') || undefined;

  const { data: streamData, isLoading: loadStream, error: streamError } = usePlay(id, type, season, episode);
  const { data: detailData } = useDetail(id);
  const { saveProgress, getProgress } = useContinueWatching();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [audioTracks, setAudioTracks] = useState<string[]>([]);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const streams: Stream[] = streamData?.streams || [];
  const currentStream = streams[selectedStreamIdx] || streams[0];
  const streamUrl = currentStream?.proxyUrl || currentStream?.url;

  const streamQualities = streams.map((s, i) => {
    const label = s.resolutions || s.format?.toUpperCase() || `Quality ${i + 1}`;
    return { label, index: i };
  });

  useEffect(() => {
    if (videoRef.current && id) {
      const saved = getProgress(id);
      if (saved > 0 && saved < 98) {
        videoRef.current.addEventListener('loadedmetadata', () => {
          if (videoRef.current && videoRef.current.duration) {
            videoRef.current.currentTime = (saved / 100) * videoRef.current.duration;
          }
        }, { once: true });
      }
    }
  }, [id, streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      const tracks: string[] = [];
      for (let i = 0; i < (video as any).audioTracks?.length; i++) {
        const t = (video as any).audioTracks[i];
        tracks.push(t.label || t.language || `Track ${i + 1}`);
      }
      if (tracks.length > 0) setAudioTracks(tracks);
    };
    video.addEventListener('loadedmetadata', update);
    return () => video.removeEventListener('loadedmetadata', update);
  }, [streamUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !id) return;
    const { currentTime, duration } = videoRef.current;
    if (isNaN(duration) || duration === 0) return;
    const pct = (currentTime / duration) * 100;
    if (Math.floor(currentTime) % 10 === 0 && currentTime > 0) {
      saveProgress({
        id,
        type,
        title: getTitle(detailData),
        poster: getPoster(detailData),
        progress: pct,
        season,
        episode,
      });
    }
  };

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  const switchAudioTrack = (idx: number) => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = (video as any).audioTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].enabled = i === idx;
    }
    setSelectedAudioTrack(idx);
    setShowAudioMenu(false);
  };

  if (!id) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p>Invalid playback parameters.</p>
        <button onClick={() => setLocation('/')} className="mt-2 px-6 py-2 bg-red-600 rounded font-bold">Go Home</button>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full bg-black relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={() => { setShowQualityMenu(false); setShowAudioMenu(false); handleMouseMove(); }}
    >
      <div className={cn(
        "absolute top-0 left-0 w-full p-5 z-50 transition-opacity duration-500 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between",
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="h-7 w-7" />
          </button>
          {detailData && (
            <div>
              <h2 className="text-white font-bold text-lg">{getTitle(detailData)}</h2>
              {type === 'tv' && season && episode && (
                <p className="text-gray-300 text-sm">Season {season} · Episode {episode}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {audioTracks.length > 1 && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setShowAudioMenu(v => !v); setShowQualityMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                Audio: {audioTracks[selectedAudioTrack] || `Track ${selectedAudioTrack + 1}`}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showAudioMenu && (
                <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl min-w-[180px]">
                  {audioTracks.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => switchAudioTrack(idx)}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-colors",
                        selectedAudioTrack === idx ? "bg-red-600 text-white" : "text-gray-200 hover:bg-zinc-800"
                      )}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {streamQualities.length > 1 && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setShowQualityMenu(v => !v); setShowAudioMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <Settings className="h-4 w-4" />
                {streamQualities[selectedStreamIdx]?.label || 'Quality'}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showQualityMenu && (
                <div className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl min-w-[160px]">
                  {streamQualities.map((q) => (
                    <button
                      key={q.index}
                      onClick={() => {
                        const currentTime = videoRef.current?.currentTime || 0;
                        setSelectedStreamIdx(q.index);
                        setShowQualityMenu(false);
                        setTimeout(() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = currentTime;
                            videoRef.current.play().catch(() => {});
                          }
                        }, 500);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-colors",
                        selectedStreamIdx === q.index ? "bg-red-600 text-white" : "text-gray-200 hover:bg-zinc-800"
                      )}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loadStream ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
          <Loader2 className="h-14 w-14 animate-spin text-red-500" />
          <p className="text-lg">Loading stream...</p>
        </div>
      ) : streamError || !streamUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
          <AlertCircle className="h-14 w-14 text-red-500" />
          <p className="text-xl font-bold">Stream Unavailable</p>
          <p className="text-gray-400 text-sm max-w-sm text-center">
            The API didn't return a valid playback URL for this title.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-zinc-800 border border-zinc-600 rounded font-semibold hover:bg-zinc-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        <video
          key={streamUrl}
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
}
