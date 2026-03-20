import { useParams } from "wouter";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { MediaCard } from "@/components/MediaCard";
import { Spinner } from "@/components/ui/spinner";
import { useBrowseCategory, useSearchCategory, useRanking } from "@/hooks/use-ecoflix";

const CATEGORY_CONFIG: Record<string, {
  label: string;
  mode: 'browse' | 'search' | 'ranking';
  param: string;
  filterType?: 'movie' | 'tv';
}> = {
  "popular-series": { label: "Popular Series", mode: 'ranking', param: 'tv', filterType: 'tv' },
  "popular-movies": { label: "Popular Movies", mode: 'ranking', param: 'movie', filterType: 'movie' },
  "nollywood": { label: "Nollywood Movies", mode: 'search', param: 'Nollywood' },
  "anime": { label: "Anime", mode: 'browse', param: 'Animation' },
  "south-african": { label: "South African Drama", mode: 'search', param: 'South African' },
  "kdrama": { label: "K-Drama", mode: 'search', param: 'K-Drama' },
  "cdrama": { label: "C-Drama", mode: 'search', param: 'C-Drama' },
  "thai-drama": { label: "Thai Drama", mode: 'search', param: 'Thai Drama' },
  "action": { label: "Action Movies", mode: 'browse', param: 'Action' },
  "horror": { label: "Horror Movies", mode: 'browse', param: 'Horror' },
  "teen-romance": { label: "Teen Romance", mode: 'search', param: 'Teen Romance' },
};

function CategoryContent({ slug }: { slug: string }) {
  const config = CATEGORY_CONFIG[slug];

  const browseQuery = useBrowseCategory(config?.param || "");
  const searchQuery = useSearchCategory(config?.param || "");
  const rankingQuery = useRanking(config?.param as 'movie' | 'tv' || 'movie');

  if (!config) return null;

  const isLoading =
    config.mode === 'browse' ? browseQuery.isLoading :
    config.mode === 'search' ? searchQuery.isLoading :
    rankingQuery.isLoading;

  let items =
    config.mode === 'browse' ? (browseQuery.data || []) :
    config.mode === 'search' ? (searchQuery.data || []) :
    (rankingQuery.data || []);

  if (config.filterType) {
    const targetType = config.filterType === 'movie' ? 1 : 2;
    items = items.filter(i => i.subjectType === targetType);
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-10 w-10" /></div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-20 text-gray-500"><p className="text-xl">No content found.</p></div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {items.map((item, i) => (
        <MediaCard key={`${item.subjectId}-${i}`} item={item} />
      ))}
    </div>
  );
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const config = CATEGORY_CONFIG[slug || ""];
  const label = config?.label || slug || "Category";

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-screen pb-16">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-8">{label}</h1>
        <CategoryContent slug={slug || ""} />
      </div>
    </Layout>
  );
}
