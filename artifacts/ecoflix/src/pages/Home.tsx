import { Layout } from "@/components/Layout";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { FullPageLoader } from "@/components/ui/spinner";
import { useTrending, useRanking, useBrowseCategory, useSearchCategory } from "@/hooks/use-ecoflix";
import { useContinueWatching } from "@/hooks/use-local-state";
import { MediaItem } from "@/lib/api-types";

export default function Home() {
  const { data: trending, isLoading: loadTrending } = useTrending();
  const { data: popularMovies } = useRanking('movie');
  const { data: popularSeries } = useRanking('tv');
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

      <div className="pb-20 -mt-16 relative z-20 space-y-1">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueItems}
            progressMap={progressMap}
            onRemove={removeFromContinueWatching}
          />
        )}

        <ContentRow
          title="Popular Series"
          items={popularSeries || []}
          showMoreHref="/ranking?type=tv"
        />

        <ContentRow
          title="Popular Movies"
          items={popularMovies || []}
          showMoreHref="/ranking?type=movie"
        />

        <ContentRow
          title="Nollywood Movies"
          items={nollywood || []}
          showMoreHref="/browse?genre=Nollywood"
        />

        <ContentRow
          title="Anime"
          items={anime || []}
          showMoreHref="/browse?genre=Animation"
        />

        <ContentRow
          title="South African Drama"
          items={southAfrican || []}
          showMoreHref="/browse?genre=Drama"
        />

        <ContentRow
          title="K-Drama"
          items={kdrama || []}
          showMoreHref="/browse?genre=K-Drama"
        />

        <ContentRow
          title="C-Drama"
          items={cdrama || []}
          showMoreHref="/browse?genre=C-Drama"
        />

        <ContentRow
          title="Thai Drama"
          items={thaiDrama || []}
          showMoreHref="/browse?genre=Thai+Drama"
        />

        <ContentRow
          title="Action Movies"
          items={action || []}
          showMoreHref="/browse?genre=Action"
        />

        <ContentRow
          title="Horror Movies"
          items={horror || []}
          showMoreHref="/browse?genre=Horror"
        />

        <ContentRow
          title="Teen Romance"
          items={teenRomance || []}
          showMoreHref="/browse?genre=Romance"
        />
      </div>
    </Layout>
  );
}
