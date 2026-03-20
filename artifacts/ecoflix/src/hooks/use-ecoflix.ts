import { useQuery } from "@tanstack/react-query";
import { MediaItem, MediaDetail, PlayResponse } from "@/lib/api-types";

const BASE_URL = "https://movieapi.xcasper.space/api";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "API request failed");
  }
  return json.data as T;
}

export function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const data = await fetchApi<{ subjectList: MediaItem[] }>("/trending");
      return data.subjectList || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHot() {
  return useQuery({
    queryKey: ["hot"],
    queryFn: async () => {
      const data = await fetchApi<{ movie: MediaItem[]; tv: MediaItem[] }>("/hot");
      return {
        movies: data.movie || [],
        tv: data.tv || [],
        all: [...(data.movie || []), ...(data.tv || [])],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearch(keyword: string) {
  return useQuery({
    queryKey: ["search", keyword],
    queryFn: async () => {
      const data = await fetchApi<{ items: MediaItem[] }>(`/search?keyword=${encodeURIComponent(keyword)}`);
      return data.items || [];
    },
    enabled: keyword.length > 1,
  });
}

export function useDetail(subjectId: string) {
  return useQuery({
    queryKey: ["detail", subjectId],
    queryFn: async () => {
      const data = await fetchApi<{ subject: MediaDetail; stars: unknown[]; resource: unknown[] }>(`/detail?subjectId=${subjectId}`);
      const detail: MediaDetail = {
        ...data.subject,
        stars: (data.stars as MediaDetail["stars"]) || [],
        resource: (data.resource as MediaDetail["resource"]) || [],
      };
      return detail;
    },
    enabled: !!subjectId,
  });
}

export function usePlay(subjectId: string, type: 'movie' | 'tv', season?: string, episode?: string) {
  const query = new URLSearchParams({ subjectId, type });
  if (season) query.append("season", season);
  if (episode) query.append("episode", episode);

  return useQuery({
    queryKey: ["play", subjectId, type, season, episode],
    queryFn: () => fetchApi<PlayResponse>(`/play?${query.toString()}`),
    enabled: !!subjectId && !!type,
    retry: 1,
    staleTime: 30 * 60 * 1000,
  });
}

export function useRecommend(subjectId: string) {
  return useQuery({
    queryKey: ["recommend", subjectId],
    queryFn: async () => {
      const data = await fetchApi<{ items: MediaItem[] }>(`/recommend?subjectId=${subjectId}`);
      return data.items || [];
    },
    enabled: !!subjectId,
  });
}

export function useBrowse(genre: string, page: number = 1) {
  return useQuery({
    queryKey: ["browse", genre, page],
    queryFn: async () => {
      const data = await fetchApi<{ items: MediaItem[]; pager: { hasMore: boolean } }>(
        `/browse?genre=${encodeURIComponent(genre)}&page=${page}`
      );
      return { items: data.items || [], hasMore: data.pager?.hasMore || false };
    },
  });
}

export function useBrowseCategory(genre: string) {
  return useQuery({
    queryKey: ["browse-cat", genre],
    queryFn: async () => {
      const data = await fetchApi<{ items: MediaItem[] }>(
        `/browse?genre=${encodeURIComponent(genre)}&page=1`
      );
      return data.items || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearchCategory(keyword: string) {
  return useQuery({
    queryKey: ["search-cat", keyword],
    queryFn: async () => {
      const data = await fetchApi<{ items: MediaItem[] }>(`/search?keyword=${encodeURIComponent(keyword)}`);
      return data.items || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useRanking(type: "movie" | "tv") {
  return useQuery({
    queryKey: ["ranking", type],
    queryFn: async () => {
      const data = await fetchApi<{ subjectList: MediaItem[] }>(`/ranking?type=${type}`);
      return data.subjectList || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
