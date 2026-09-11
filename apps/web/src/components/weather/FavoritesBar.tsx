'use client';

import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { GeoLocation } from '@/types/weather';

interface FavoritesBarProps {
  onSelect: (location: GeoLocation) => void;
  activeKey?: string;
}

export function FavoritesBar({ onSelect, activeKey }: FavoritesBarProps) {
  const items = useFavoritesStore((state) => state.items);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Saved locations" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((favorite) => {
        const isActive = favorite.locationKey === activeKey;
        return (
          <button
            key={favorite.id}
            type="button"
            onClick={() => onSelect(favorite)}
            aria-current={isActive ? 'true' : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              isActive
                ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {favorite.label ?? favorite.name}
          </button>
        );
      })}
    </nav>
  );
}
