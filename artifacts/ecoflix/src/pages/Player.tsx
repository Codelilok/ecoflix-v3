import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { usePlay, useDetail } from "@/hooks/use-ecoflix";
import { useContinueWatching } from "@/hooks/use-local-state";
import { getTitle, getPoster, getType } from "@/lib/utils";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

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
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const streamUrl = streamData?.streams?.[0]?.proxyUrl || streamData?.streams?.[0]?.url;

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

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
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
      onClick={handleMouseMove}
    >
      <div
        className={`absolute top-0 left-0 w-full p-5 z-50 transition-opacity duration-500 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
        >
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
