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
  maxItems?: number;
  linkBuilder?: (item: MediaItem) => string;
}

export function ContentRow({ title, items, progressMap = {}, showMoreHref, onRemove, maxItems = 10, linkBuilder }: ContentRowProps) {
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

  const displayItems = onRemove ? items : items.slice(0, maxItems);

  return (
    <div className="relative py-4">
      <div className="flex items-center justify-between px-6 md:px-14 mb-3">
        <h2 className="text-lg md:text-xl font-semibold text-white tracking-wide">{title}</h2>
        {showMoreHref && (
          <Link href={showMoreHref}>
            <span className="text-sm text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer flex items-center gap-1">
              Show More <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        )}
      </div>

      <div className="relative group/row">
        {displayItems.length > 3 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 h-full w-10 md:w-12 z-20 flex items-center justify-center bg-gradient-to-r from-black/80 to-transparent md:opacity-0 md:group-hover/row:opacity-100 transition-opacity hover:from-black active:from-black"
              aria-label="Scroll left"
            >
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 active:bg-white/20 transition-colors">
                <ChevronLeft className="h-4 w-4 text-white" />
              </div>
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 h-full w-10 md:w-12 z-20 flex items-center justify-center bg-gradient-to-l from-black/80 to-transparent md:opacity-0 md:group-hover/row:opacity-100 transition-opacity hover:from-black active:from-black"
              aria-label="Scroll right"
            >
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 active:bg-white/20 transition-colors">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
            </button>
          </>
        )}

        <div
          ref={rowRef}
          className="flex gap-2 md:gap-3 overflow-x-auto px-6 md:px-14 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayItems.map((item, index) => (
            <div
              key={`${item.subjectId}-${index}`}
              className="w-32 sm:w-36 md:w-40 lg:w-44 shrink-0"
            >
              <MediaCard
                item={item}
                showProgress={progressMap[item.subjectId]}
                onRemove={onRemove}
                hrefOverride={linkBuilder ? linkBuilder(item) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
