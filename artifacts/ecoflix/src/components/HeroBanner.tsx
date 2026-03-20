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
  const [hovered, setHovered] = useState(false);
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
    setHovered(true);
    setTimeout(() => setHovered(false), 3000);
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
      className="relative h-[80vh] md:h-[90vh] w-full flex items-end justify-start overflow-hidden select-none group/hero"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images */}
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

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

      {/* Content — positioned at bottom-left */}
      <div className="relative z-20 w-full max-w-screen-2xl mx-auto px-6 md:px-16 pb-16 md:pb-20">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-red-500 font-bold text-sm uppercase tracking-widest">
              {type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            {year && <span className="text-gray-400 text-sm">{year}</span>}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-3 drop-shadow-2xl leading-tight">
            {title}
          </h1>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {genres.slice(0, 4).map(g => (
                <span key={g} className="text-xs text-gray-300 border border-gray-600 px-2 py-1 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
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

      {/* Navigation arrows — far right side, hidden by default, show on hover/tap */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => { clearInterval(intervalRef.current); goPrev(); }}
            className={`absolute right-16 md:right-20 bottom-8 md:bottom-10 z-30 w-10 h-10 rounded-full bg-black/60 border border-white/30 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all backdrop-blur-sm ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'} duration-300`}
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <button
            onClick={() => { clearInterval(intervalRef.current); goNext(); }}
            className={`absolute right-4 md:right-6 bottom-8 md:bottom-10 z-30 w-10 h-10 rounded-full bg-black/60 border border-white/30 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all backdrop-blur-sm ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'} duration-300`}
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>

          {/* Dot indicators — bottom right, clear of content area */}
          <div className={`absolute bottom-4 right-6 z-30 flex gap-1.5 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-60'}`}>
            {items.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                onClick={() => { clearInterval(intervalRef.current); goTo(idx); }}
                className={`h-1 rounded-full transition-all duration-300 ${idx === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
