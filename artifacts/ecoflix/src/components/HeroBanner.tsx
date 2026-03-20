import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Play, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { MediaItem } from "@/lib/api-types";
import { getTitle, getPoster, getType, getYear, getGenres } from "@/lib/utils";

interface HeroBannerProps {
  items: MediaItem[];
}

function shareItem(title: string, type: string, id: string) {
  const url = `${window.location.origin}/${type}/${id}`;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    }).catch(() => {});
  }
}

export function HeroBanner({ items: itemsProp }: HeroBannerProps) {
  const items = itemsProp || [];
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 600);
  }, [animating]);

  const count = items.length;

  const goNext = useCallback(() => {
    if (count < 2) return;
    goTo((current + 1) % count);
  }, [current, count, goTo]);

  const goPrev = useCallback(() => {
    if (count < 2) return;
    goTo((current - 1 + count) % count);
  }, [current, count, goTo]);

  useEffect(() => {
    if (count <= 1) return;
    intervalRef.current = setInterval(goNext, 7000);
    return () => clearInterval(intervalRef.current);
  }, [goNext, count]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      clearInterval(intervalRef.current);
      if (diff > 0) goNext(); else goPrev();
    }
  };

  if (items.length === 0) return null;

  const item = items[current];
  const title = getTitle(item);
  const type = getType(item);
  const year = getYear(item);
  const genres = getGenres(item);
  const bgImage = getPoster(item);
  const detailUrl = `/${type}/${item.subjectId}`;

  return (
    <div
      className="relative h-[80vh] md:h-[90vh] w-full flex items-center justify-start overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {items.map((it, idx) => {
        const bg = getPoster(it);
        return (
          <div
            key={it.subjectId}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {bg && (
              <img
                src={bg}
                alt={getTitle(it)}
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />

      <div className="relative z-20 w-full max-w-screen-2xl mx-auto px-6 md:px-16 pt-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-red-500 font-bold text-sm uppercase tracking-widest">
              {type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            {year && <span className="text-gray-400 text-sm">{year}</span>}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-2xl leading-tight transition-all duration-500">
            {title}
          </h1>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {genres.slice(0, 4).map(g => (
                <span key={g} className="text-xs text-gray-300 border border-gray-600 px-2 py-1 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Link href={detailUrl}>
              <button className="flex items-center gap-2 bg-white text-black px-7 py-3 rounded font-bold text-base md:text-lg hover:bg-gray-200 transition-colors shadow-xl active:scale-95">
                <Play className="h-5 w-5 fill-current" />
                Play
              </button>
            </Link>

            <button
              onClick={() => shareItem(title, type, item.subjectId)}
              className="flex items-center gap-2 bg-zinc-800/80 text-white px-5 py-3 rounded font-bold text-base md:text-lg hover:bg-zinc-700 transition-colors backdrop-blur-sm active:scale-95"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={() => { clearInterval(intervalRef.current); goPrev(); }}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <button
            onClick={() => { clearInterval(intervalRef.current); goNext(); }}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {items.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                onClick={() => { clearInterval(intervalRef.current); goTo(idx); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
