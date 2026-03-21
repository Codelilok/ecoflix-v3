export interface CoverImage {
  url: string;
  width?: number;
  height?: number;
  format?: string;
  blurHash?: string;
}

export interface MediaItem {
  subjectId: string;
  subjectType: 1 | 2;
  title: string;
  description?: string;
  releaseDate?: string;
  duration?: number;
  genre?: string;
  cover?: CoverImage;
}

export interface CastMember {
  name: string;
  role?: string;
  character?: string;
  avatar?: { url: string };
  avatarUrl?: string;
}

export interface EpisodeItem {
  episodeId?: string;
  episodeNumber?: number;
  episode?: number;
  title?: string;
  name?: string;
  duration?: number;
}

export interface SeasonItem {
  seasonId?: string;
  seasonNumber?: number;
  season?: number;
  seasonName?: string;
  title?: string;
  episodes?: EpisodeItem[];
}

export interface MediaDetail {
  subjectId: string;
  subjectType: 1 | 2;
  title: string;
  description?: string;
  releaseDate?: string;
  duration?: number;
  genre?: string;
  cover?: CoverImage;
  imdbRatingValue?: string;
  countryName?: string;
  subtitles?: string;
  hasResource?: boolean;
  stars?: CastMember[];
  resource?: SeasonItem[];
}

export interface Stream {
  format: string;
  id: string;
  url: string;
  resolutions?: string;
  proxyUrl?: string;
  downloadUrl?: string;
  duration?: number;
  size?: number;
  fileSize?: number;
}

export interface PlayResponse {
  streams: Stream[];
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'tv';
  progress: number;
  duration: number;
  timestamp: number;
  season?: string;
  episode?: string;
}

export interface WishlistItem {
  subjectId: string;
  subjectType: 1 | 2;
  title: string;
  cover?: CoverImage;
  genre?: string;
  releaseDate?: string;
  addedAt: number;
}

export function getTypeLabel(subjectType: 1 | 2): 'movie' | 'tv' {
  return subjectType === 1 ? 'movie' : 'tv';
}

export function getPosterUrl(item: { cover?: CoverImage }): string {
  return item.cover?.url || '';
}

export function getYear(item: { releaseDate?: string }): string {
  return item.releaseDate ? item.releaseDate.slice(0, 4) : '';
}
