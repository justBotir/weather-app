'use client';

import { create } from 'zustand';

import { addFavorite, fetchFavorites, removeFavorite } from '@/lib/api-client';
import type { FavoriteLocation, GeoLocation } from '@/types/weather';

interface FavoritesState {
  items: FavoriteLocation[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** locationKeys with a write in flight, so a double-click cannot race itself. */
  pending: string[];

  load: () => Promise<void>;
  toggle: (location: GeoLocation) => Promise<void>;
  clearError: () => void;
}

/**
 * Server is the source of truth; the store mirrors it optimistically so the
 * star flips on the same frame as the click and rolls back if the write fails.
 */
export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  items: [],
  status: 'idle',
  error: null,
  pending: [],

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ items: await fetchFavorites(), status: 'ready' });
    } catch (error) {
      set({ status: 'error', error: (error as Error).message });
    }
  },

  toggle: async (location) => {
    const { locationKey } = location;

    // Two fast clicks would otherwise send an add and a delete for a row whose
    // real id has not come back yet, and the delete would 404 on `temp-…`.
    if (get().pending.includes(locationKey)) return;

    const before = get().items;
    const existing = before.find((item) => item.locationKey === locationKey);
    set({ pending: [...get().pending, locationKey], error: null });

    try {
      if (existing) {
        set({ items: before.filter((item) => item.id !== existing.id) });
        await removeFavorite(existing.id);
      } else {
        const optimistic: FavoriteLocation = {
          ...location,
          id: `temp-${locationKey}`,
          sortOrder: before.length,
        };
        set({ items: [...before, optimistic] });

        const saved = await addFavorite(location);
        // Swap the placeholder for the real row in place, rather than rebuilding
        // from `before` — that would discard anything else added meanwhile.
        set({
          items: get().items.map((item) => (item.id === optimistic.id ? saved : item)),
        });
      }
    } catch (error) {
      set({ items: before, error: (error as Error).message });
    } finally {
      set({ pending: get().pending.filter((key) => key !== locationKey) });
    }
  },

  // No isFavorite/isPending helpers here on purpose: components subscribe with
  // their own selectors, so they re-render on exactly the slice they read.
  clearError: () => set({ error: null }),
}));
