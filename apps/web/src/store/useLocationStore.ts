'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GeoLocation, Units } from '@/types/weather';

interface LocationState {
  /** The place the dashboard is currently showing. `null` until geolocation or search resolves. */
  selected: GeoLocation | null;
  units: Units;
  /** Set once the user picks a city manually, so we stop overriding them with geolocation. */
  hasUserChoice: boolean;

  selectLocation: (location: GeoLocation) => void;
  setLocationFromGeolocation: (location: GeoLocation) => void;
  setUnits: (units: Units) => void;
  toggleUnits: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      selected: null,
      units: 'metric',
      hasUserChoice: false,

      selectLocation: (location) => set({ selected: location, hasUserChoice: true }),

      // Geolocation resolves asynchronously and must never clobber a deliberate pick.
      // The locationKey guard also stops React StrictMode's double-invoked effect
      // from handing us a fresh object for the same place and refetching twice.
      setLocationFromGeolocation: (location) => {
        const { hasUserChoice, selected } = get();
        if (hasUserChoice) return;
        if (selected?.locationKey === location.locationKey) return;
        set({ selected: location });
      },

      setUnits: (units) => set({ units }),
      toggleUnits: () => set({ units: get().units === 'metric' ? 'imperial' : 'metric' }),
    }),
    {
      name: 'weather:location',
      partialize: ({ selected, units, hasUserChoice }) => ({ selected, units, hasUserChoice }),
    },
  ),
);
