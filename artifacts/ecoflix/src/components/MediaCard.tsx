import { useState } from "react";
import { Link } from "wouter";
import { Play, Star, X } from "lucide-react";
import { getPoster, getTitle, getType, getYear, cn } from "@/lib/utils";
import { MediaItem } from "@/lib/api-types";

interface MediaCardProps {
  item: MediaItem;
  className?: string;
  showProgress?: number;
  onRemove?: (id: string) => void;
  hrefOverride?: string;
}

export function MediaCard({ item, className, showProgress, onRemove, hrefOverride }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const title = getTitle(item);
  const type = getType(item);
  const year = getYear(item);
  const rating = (item as any).imdbRatingValue || (item as any).rating || null;
  const posterUrl = imageError ? '' : getPoster(item);
  const detailUrl = hrefOverride || `/${type}/${item.subjectId}`;

  return (
    <div className={cn("group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-md bg-zinc-900 transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl", className)}>
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(String(item.subjectId)); }}
          className="absolute top-1.5 left-1.5 z-30 w-7 h-7 rounded-full bg-black/80 border border-white/30 flex items-center justify-center transition-opacity hover:bg-red-600 opacity-100"
          title="Remove"
        >
          <X className="h-3.5 w-3.5 text-white" />
        </button>
      )}

      <Link href={detailUrl} className="block">
        <div className="aspect-[2/3] w-full bg-zinc-800 relative">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
              <Play className="h-8 w-8 text-zinc-600 mb-2" />
              <span className="text-xs text-zinc-500 line-clamp-3">{title}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center backdrop-blur-sm">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase text-white border border-white/10">
            {type === 'tv' ? 'TV' : 'Movie'}
          </div>

          {showProgress !== undefined && showProgress > 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-700">
              <div
                className="h-full bg-red-600"
                style={{ width: `${Math.max(0, Math.min(100, showProgress))}%` }}
              />
            </div>
          )}
        </div>

        <div className="px-2 py-1.5 bg-zinc-900 border-t border-zinc-800">
          <p className="text-white text-xs font-medium line-clamp-1 leading-tight">{title}</p>
          <div className="flex items-center justify-between mt-0.5">
            {year && <span className="text-gray-500 text-[10px]">{year}</span>}
            {rating && (
              <span className="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold">
                <Star className="h-2.5 w-2.5 fill-current" /> {rating}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
