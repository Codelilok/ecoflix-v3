import { useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { MediaItem } from "@/lib/api-types";
import { MediaCard } from "./MediaCard";

interface ContentRowProps {
  title: string;
  items: MediaItem[];
  progressMap?: Record<string, number>;
  showMoreHref?: string;
  onRemove?: (id: string) => void;
}

export function ContentRow({ title, items, progressMap = {}, showMoreHref, onRemove }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative py-4">
      <div className="flex items-center justify-between px-6 md:px-14 mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-white tracking-wide">{title}</h2>
        <div className="flex items-center gap-2">
          {showMoreHref && (
            <Link href={showMoreHref}>
              <span className="text-sm text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer flex items-center gap-1 mr-2">
                Show More <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          )}
          {items.length > 4 && (
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-500 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-500 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-2 md:gap-3 overflow-x-auto px-6 md:px-14 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.subjectId}-${index}`}
            className="w-32 sm:w-36 md:w-40 lg:w-44 shrink-0"
          >
            <MediaCard
              item={item}
              showProgress={progressMap[item.subjectId]}
              onRemove={onRemove}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
