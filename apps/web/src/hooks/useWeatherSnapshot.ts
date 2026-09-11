'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchSnapshot } from '@/lib/api-client';
import type { GeoLocation, Units, WeatherSnapshot } from '@/types/weather';

interface SnapshotState {
  data: WeatherSnapshot | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches a snapshot whenever the location or units change, aborting the
 * previous request so fast city-switching can't race a stale response onto screen.
 */
export function useWeatherSnapshot(location: GeoLocation | null, units: Units) {
  const [state, setState] = useState<SnapshotState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!location) return;

    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetchSnapshot(location, units, controller.signal)
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ data: null, isLoading: false, error: (error as Error).message });
      });

    return () => controller.abort();
    // Zustand hands back a stable object reference, so this fires on real
    // location/unit changes only — not on every render.
  }, [location, units, reloadToken]);

  return { ...state, refresh };
}
