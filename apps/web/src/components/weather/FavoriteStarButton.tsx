'use client';

import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { GeoLocation } from '@/types/weather';

interface FavoriteStarButtonProps {
  location: GeoLocation;
}

export function FavoriteStarButton({ location }: FavoriteStarButtonProps) {
  const toggle = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) =>
    state.items.some((item) => item.locationKey === location.locationKey),
  );
  const isPending = useFavoritesStore((state) => state.pending.includes(location.locationKey));

  return (
    <button
      type="button"
      onClick={() => void toggle(location)}
      disabled={isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Remove from favourites' : 'Save to favourites'}
      className="rounded-lg p-2 text-xl leading-none transition hover:bg-slate-800 disabled:opacity-50"
    >
      <span className={isFavorite ? 'text-amber-400' : 'text-slate-600'}>
        {isFavorite ? '★' : '☆'}
      </span>
    </button>
  );
}
