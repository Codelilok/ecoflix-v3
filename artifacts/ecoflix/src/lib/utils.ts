import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MediaItem, MediaDetail } from "./api-types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTitle(item: MediaItem | MediaDetail | null | undefined): string {
  if (!item) return 'Unknown Title';
  return item.title || 'Unknown Title';
}

export function getPoster(item: MediaItem | MediaDetail | null | undefined): string {
  if (!item) return '';
  return item.cover?.url || '';
}

export function getType(item: MediaItem | MediaDetail | null | undefined): 'movie' | 'tv' {
  if (!item) return 'movie';
  return item.subjectType === 2 ? 'tv' : 'movie';
}

export function getYear(item: MediaItem | MediaDetail | null | undefined): string {
  if (!item?.releaseDate) return '';
  return item.releaseDate.slice(0, 4);
}

export function getGenres(item: MediaItem | MediaDetail | null | undefined): string[] {
  if (!item?.genre) return [];
  return item.genre.split(',').map(g => g.trim()).filter(Boolean);
}
