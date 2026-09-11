'use client';

import { useEffect } from 'react';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeatherSnapshot } from '@/hooks/useWeatherSnapshot';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useLocationStore } from '@/store/useLocationStore';
import { provisionalLocation } from '@/lib/geo';

import { SearchBar } from './SearchBar';
import { FavoritesBar } from './FavoritesBar';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { ForecastPanel } from './ForecastPanel';
import { DashboardSkeleton } from './DashboardSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { InlineAlert } from '../ui/InlineAlert';

/**
 * The only component in components/weather/ that talks to the network or the store.
 * Everything below it is a pure presentational component fed by props — which is
 * what keeps them testable and keeps this file a composition root, not a god component.
 */
export function WeatherDashboard() {
  const selected = useLocationStore((state) => state.selected);
  const units = useLocationStore((state) => state.units);
  const selectLocation = useLocationStore((state) => state.selectLocation);
  const setLocationFromGeolocation = useLocationStore((state) => state.setLocationFromGeolocation);
  const toggleUnits = useLocationStore((state) => state.toggleUnits);

  const loadFavorites = useFavoritesStore((state) => state.load);
  const favoritesError = useFavoritesStore((state) => state.error);
  const clearFavoritesError = useFavoritesStore((state) => state.clearError);

  // Only ask for coordinates when we have nothing persisted to show.
  const { coords, status: geoStatus } = useGeolocation(!selected);
  const { data, isLoading, error, refresh } = useWeatherSnapshot(selected, units);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (coords) setLocationFromGeolocation(provisionalLocation(coords.lat, coords.lon));
  }, [coords, setLocationFromGeolocation]);

  const awaitingLocation = !selected && (geoStatus === 'idle' || geoStatus === 'prompting');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Weather</h1>
        <div className="flex items-center gap-3">
          <SearchBar onSelect={selectLocation} />
          <button
            type="button"
            onClick={toggleUnits}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            aria-label={`Switch to ${units === 'metric' ? 'Fahrenheit' : 'Celsius'}`}
          >
            °{units === 'metric' ? 'C' : 'F'}
          </button>
        </div>
      </header>

      {/* A failed save already rolled the star back; without this the user just
          sees it silently un-star itself. */}
      {favoritesError && <InlineAlert message={favoritesError} onDismiss={clearFavoritesError} />}

      <FavoritesBar onSelect={selectLocation} activeKey={selected?.locationKey} />

      {awaitingLocation && <DashboardSkeleton message="Finding your location…" />}

      {!awaitingLocation && !selected && (
        <ErrorState
          title="We couldn't detect your location"
          message="Search for a city above to get started."
        />
      )}

      {selected && error && <ErrorState title="Couldn't load weather" message={error} onRetry={refresh} />}

      {selected && !error && (isLoading || !data) && <DashboardSkeleton message="Loading forecast…" />}

      {selected && !error && data && (
        <div className="flex flex-col gap-6">
          <CurrentWeatherCard snapshot={data} onRefresh={refresh} />
          <ForecastPanel
            days={data.forecast}
            units={data.units}
            timezoneOffset={data.current.timezoneOffset}
          />
        </div>
      )}
    </main>
  );
}
