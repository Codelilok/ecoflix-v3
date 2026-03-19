import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { MediaItem } from "@/lib/api-types";
import { getTitle, getPoster, getType, getYear, getGenres } from "@/lib/utils";

interface HeroBannerProps {
  item: MediaItem;
}

export function HeroBanner({ item }: HeroBannerProps) {
  if (!item) return null;

  const title = getTitle(item);
  const type = getType(item);
  const year = getYear(item);
  const genres = getGenres(item);
  const bgImage = getPoster(item);

  return (
    <div className="relative h-[75vh] md:h-[90vh] w-full flex items-center justify-start overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        {bgImage && (
          <img
            src={bgImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-6 md:px-16 pt-24">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-red-500 font-bold text-sm uppercase tracking-widest">
              {type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            {year && <span className="text-gray-400 text-sm">{year}</span>}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-2xl leading-tight">
            {title}
          </h1>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.slice(0, 4).map(g => (
                <span key={g} className="text-xs text-gray-300 border border-gray-600 px-2 py-1 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p className="text-gray-300 text-sm md:text-base mb-8 line-clamp-3 leading-relaxed">
            {item.description || "No description available."}
          </p>

          <div className="flex items-center gap-4">
            <Link href={`/player?id=${item.subjectId}&type=${type}`}>
              <button className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded font-bold text-base md:text-lg hover:bg-gray-200 transition-colors shadow-xl active:scale-95">
                <Play className="h-5 w-5 fill-current" />
                Play
              </button>
            </Link>

            <Link href={`/${type}/${item.subjectId}`}>
              <button className="flex items-center gap-2 bg-zinc-800/80 text-white px-6 md:px-8 py-3 rounded font-bold text-base md:text-lg hover:bg-zinc-700 transition-colors backdrop-blur-sm active:scale-95">
                <Info className="h-5 w-5" />
                More Info
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
