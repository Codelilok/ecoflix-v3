import { useState } from "react";
import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { getPoster, getTitle, getType, getYear, cn } from "@/lib/utils";
import { MediaItem } from "@/lib/api-types";

interface MediaCardProps {
  item: MediaItem;
  className?: string;
  showProgress?: number;
}

export function MediaCard({ item, className, showProgress }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const title = getTitle(item);
  const type = getType(item);
  const year = getYear(item);
  const posterUrl = imageError ? '' : getPoster(item);
  const detailUrl = `/${type}/${item.subjectId}`;

  return (
    <div className={cn("group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-all duration-300 hover:scale-105 hover:z-10 bg-zinc-900", className)}>
      <Link href={detailUrl} className="block w-full h-full relative">
        <div className="aspect-[2/3] w-full bg-zinc-800">
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
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h4 className="text-white font-semibold text-xs line-clamp-2">{title}</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
              <Play className="h-3 w-3 ml-0.5 fill-current" />
            </div>
            <div className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white flex items-center justify-center hover:border-white transition-colors">
              <Info className="h-3 w-3" />
            </div>
          </div>
          {year && <span className="text-xs text-gray-400 mt-1">{year}</span>}
        </div>

        <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase text-white border border-white/10">
          {type}
        </div>

        {showProgress !== undefined && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-700">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.max(0, Math.min(100, showProgress))}%` }}
            />
          </div>
        )}
      </Link>
    </div>
  );
}
