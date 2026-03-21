import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Spinner } from "@/components/ui/spinner";
import { useRanking } from "@/hooks/use-ecoflix";
import { getTitle, getPoster, getYear, getType, cn } from "@/lib/utils";
import { Trophy, Film, Star } from "lucide-react";

export default function Ranking() {
  const { data: movieData, isLoading } = useRanking('movie');

  const rawMovies = Array.isArray(movieData) ? movieData : [];
  const movies = rawMovies.filter(i => i.subjectType === 1).length > 0
    ? rawMovies.filter(i => i.subjectType === 1)
    : rawMovies;

  const getMedalStyle = (index: number) => {
    if (index === 0) return "text-yellow-400 text-4xl md:text-5xl font-black";
    if (index === 1) return "text-gray-300 text-3xl md:text-4xl font-black";
    if (index === 2) return "text-amber-600 text-3xl md:text-4xl font-black";
    return "text-zinc-500 text-2xl md:text-3xl font-bold";
  };

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-lg mx-auto w-full min-h-screen pb-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-6 flex items-center justify-center gap-3">
            <Trophy className="h-9 w-9 text-red-500" />
            Top Rankings
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No movies found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movies.map((item, index) => {
              const title = getTitle(item);
              const poster = getPoster(item);
              const year = getYear(item);
              const itemType = getType(item);
              const rating = (item as any).imdbRatingValue;

              return (
                <Link key={item.subjectId} href={`/${itemType}/${item.subjectId}`}>
                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border group",
                    index < 3
                      ? "bg-gradient-to-r from-zinc-900 to-black border-zinc-700 hover:border-zinc-500"
                      : "bg-zinc-950 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-700"
                  )}>
                    <div className="w-12 md:w-16 text-center flex-shrink-0">
                      <span className={getMedalStyle(index)}>{index + 1}</span>
                    </div>

                    <div className="w-12 md:w-16 aspect-[2/3] rounded bg-zinc-800 flex-shrink-0 overflow-hidden">
                      {poster ? (
                        <img src={poster} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base md:text-lg truncate group-hover:text-red-400 transition-colors">
                        {title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {year && <span>{year}</span>}
                        {item.genre && <span>{item.genre.split(',')[0]}</span>}
                        {rating && (
                          <span className="flex items-center gap-0.5 text-yellow-400 font-semibold">
                            <Star className="h-3 w-3 fill-current" /> {rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
