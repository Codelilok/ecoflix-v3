import { Layout } from "@/components/Layout";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { FullPageLoader } from "@/components/ui/spinner";
import { useTrending, useHot, useRanking } from "@/hooks/use-ecoflix";
import { useContinueWatching } from "@/hooks/use-local-state";
import { MediaItem } from "@/lib/api-types";

export default function Home() {
  const { data: trending, isLoading: loadTrending } = useTrending();
  const { data: hot, isLoading: loadHot } = useHot();
  const { data: popularMovies, isLoading: loadPop } = useRanking('movie');
  const { continueList } = useContinueWatching();

  const isLoading = loadTrending && loadHot && loadPop;

  if (isLoading) {
    return <Layout><FullPageLoader /></Layout>;
  }

  const trendingList: MediaItem[] = trending || [];
  const hotAll: MediaItem[] = hot?.all || [];
  const popularList: MediaItem[] = popularMovies || [];

  const heroItem = trendingList[0] || hotAll[0] || popularList[0];

  const continueItems: MediaItem[] = continueList.map(c => ({
    subjectId: c.id,
    subjectType: c.type === 'movie' ? 1 : 2,
    title: c.title,
    cover: c.poster ? { url: c.poster } : undefined,
  }));

  const progressMap = continueList.reduce((acc, c) => {
    acc[c.id] = c.progress;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      {heroItem && <HeroBanner item={heroItem} />}

      <div className="pb-20 -mt-16 relative z-20 space-y-2">
        {continueItems.length > 0 && (
          <ContentRow title="Continue Watching" items={continueItems} progressMap={progressMap} />
        )}
        <ContentRow title="Trending Now" items={trendingList} />
        <ContentRow title="Hot This Week" items={hotAll} />
        <ContentRow title="Popular Movies" items={popularList} />
      </div>
    </Layout>
  );
}
