import { Layout } from "@/components/Layout";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { FullPageLoader } from "@/components/ui/spinner";
import { useTrending, useRanking, useBrowseCategory, useSearchCategory } from "@/hooks/use-ecoflix";
import { useContinueWatching } from "@/hooks/use-local-state";
import { MediaItem } from "@/lib/api-types";

export default function Home() {
  const { data: trending, isLoading: loadTrending } = useTrending();
  const { data: popularMoviesRaw } = useRanking('movie');
  const { data: popularSeriesRaw } = useRanking('tv');
  const { data: nollywood } = useSearchCategory('Nollywood');
  const { data: anime } = useBrowseCategory('Animation');
  const { data: southAfrican } = useSearchCategory('South African');
  const { data: kdrama } = useSearchCategory('K-Drama');
  const { data: cdrama } = useSearchCategory('C-Drama');
  const { data: thaiDrama } = useSearchCategory('Thai Drama');
  const { data: action } = useBrowseCategory('Action');
  const { data: horror } = useBrowseCategory('Horror');
  const { data: teenRomance } = useSearchCategory('Teen Romance');
  const { continueList, removeFromContinueWatching } = useContinueWatching();

  if (loadTrending) {
    return <Layout><FullPageLoader /></Layout>;
  }

  const trendingList: MediaItem[] = trending || [];
  const heroItems = trendingList.slice(0, 10);

  const popularMovies = (popularMoviesRaw || []).filter(i => i.subjectType === 1);
  // Popular Series: use TV ranking, prefer subjectType 2, fall back to trending TV items
  const seriesFromRanking = (popularSeriesRaw || []).filter(i => i.subjectType === 2);
  const seriesFromTrending = (trending || []).filter(i => i.subjectType === 2);
  const popularSeries = seriesFromRanking.length > 0 ? seriesFromRanking : seriesFromTrending;

  const continueItems: MediaItem[] = continueList.map(c => ({
    subjectId: String(c.id),
    subjectType: c.type === 'movie' ? 1 : 2,
    title: c.title,
    cover: c.poster ? { url: c.poster } : undefined,
  }));

  const progressMap = continueList.reduce((acc, c) => {
    acc[String(c.id)] = c.progress;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      {heroItems.length > 0 && <HeroBanner items={heroItems} />}

      <div className="pb-20 -mt-4 relative z-20 space-y-1">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
            progressMap={progressMap}
            onRemove={removeFromContinueWatching}
            linkBuilder={(item) => {
              const c = continueList.find(c => String(c.id) === item.subjectId);
              if (!c) return `/${item.subjectType === 2 ? 'tv' : 'movie'}/${item.subjectId}`;
              const seasonParam = c.season ? `&season=${c.season}` : '';
              const epParam = c.episode ? `&episode=${c.episode}` : '';
              return `/player?id=${c.id}&type=${c.type}${seasonParam}${epParam}`;
            }}
          />
        )}

        <ContentRow
          title="Popular Series"
          items={popularSeries}
        />

        <ContentRow
          title="Popular Movies"
          items={popularMovies}
          showMoreHref="/category/popular-movies"
        />

        <ContentRow
          title="Nollywood Movies"
          items={nollywood || []}
          showMoreHref="/category/nollywood"
        />

        <ContentRow
          title="Anime"
          items={anime || []}
          showMoreHref="/category/anime"
        />

        <ContentRow
          title="South African Drama"
          items={southAfrican || []}
          showMoreHref="/category/south-african"
        />

        <ContentRow
          title="K-Drama"
          items={kdrama || []}
          showMoreHref="/category/kdrama"
        />

        <ContentRow
          title="C-Drama"
          items={cdrama || []}
          showMoreHref="/category/cdrama"
        />

        <ContentRow
          title="Thai Drama"
          items={thaiDrama || []}
          showMoreHref="/category/thai-drama"
        />

        <ContentRow
          title="Action Movies"
          items={action || []}
          showMoreHref="/category/action"
        />

        <ContentRow
          title="Horror Movies"
          items={horror || []}
          showMoreHref="/category/horror"
        />

        <ContentRow
          title="Teen Romance"
          items={teenRomance || []}
          showMoreHref="/category/teen-romance"
        />
      </div>
    </Layout>
  );
}
