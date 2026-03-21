import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { usePlay, useDetail } from "@/hooks/use-ecoflix";
import { useContinueWatching, useWatchHistory } from "@/hooks/use-local-state";
import { getTitle, getPoster } from "@/lib/utils";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export default function Player() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const id = searchParams.get('id') || '';
  const type = (searchParams.get('type') as 'movie' | 'tv') || 'movie';
  const season = searchParams.get('season') || undefined;
  const episode = searchParams.get('episode') || undefined;
  const directStreamUrl = searchParams.get('streamUrl')
    ? decodeURIComponent(searchParams.get('streamUrl')!)
    : null;

  const { data: streamData, isLoading: loadStream, error: streamError } = usePlay(id, type, season, episode);
  const { data: detailData } = useDetail(id);
  const { saveProgress, getProgress } = useContinueWatching();
  const { addToHistory } = useWatchHistory();

  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const historyLoggedRef = useRef(false);

  const streams = streamData?.streams || [];
  const streamUrl = directStreamUrl
    || streams[0]?.proxyUrl
    || streams[0]?.url
    || null;

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    if (plyrRef.current) {
      plyrRef.current.destroy();
      plyrRef.current = null;
    }

    const player = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['captions', 'quality', 'speed'],
      keyboard: { focused: true, global: false },
      tooltips: { controls: true, seek: true },
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      autoplay: true,
    });

    plyrRef.current = player;

    const saved = getProgress(id);
    if (saved > 0 && saved < 98) {
      player.once('ready', () => {
        if (player.duration) {
          player.currentTime = (saved / 100) * player.duration;
        }
      });
    }

    const handleTimeUpdate = () => {
      const currentTime = player.currentTime;
      const duration = player.duration;
      if (!duration || isNaN(duration) || duration === 0 || !id) return;

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

      if (!historyLoggedRef.current && currentTime > 5) {
        addToHistory({
          id,
          type,
          title: getTitle(detailData),
          poster: getPoster(detailData),
          season,
          episode,
        });
        historyLoggedRef.current = true;
      }
    };

    player.on('timeupdate', handleTimeUpdate);

    return () => {
      player.off('timeupdate', handleTimeUpdate);
      player.destroy();
      plyrRef.current = null;
    };
  }, [streamUrl]);

  const titleText = getTitle(detailData);

  if (!id) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p>Invalid playback parameters.</p>
        <button onClick={() => setLocation('/')} className="mt-2 px-6 py-2 bg-red-600 rounded font-bold">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex-shrink-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        {titleText && (
          <div>
            <h2 className="text-white font-bold text-base leading-tight line-clamp-1">{titleText}</h2>
            {type === 'tv' && season && episode && (
              <p className="text-gray-400 text-xs">S{season}E{episode}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative bg-black min-h-0">
        {(loadStream && !directStreamUrl) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
            <Loader2 className="h-14 w-14 animate-spin text-red-500" />
            <p className="text-lg">Loading stream...</p>
          </div>
        ) : (streamError && !directStreamUrl) || !streamUrl ? (
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
            key={streamUrl}
            src={streamUrl}
            className="plyr-video"
            crossOrigin="anonymous"
            playsInline
          />
        )}
      </div>
    </div>
  );
}
