'use client';

import { useCallback, useEffect, useState } from 'react';

export type GeolocationStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable';

interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lon: number } | null;
  error: string | null;
}

/**
 * Asks the browser for coordinates once on mount. Callers must have a fallback:
 * users deny this prompt routinely, and it is unavailable on insecure origins.
 */
export function useGeolocation(enabled = true) {
  const [state, setState] = useState<GeolocationState>({
    status: 'idle',
    coords: null,
    error: null,
  });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({ status: 'unavailable', coords: null, error: 'Geolocation is not supported.' });
      return;
    }

    setState((prev) => ({ ...prev, status: 'prompting' }));

    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          status: 'granted',
          coords: { lat: position.coords.latitude, lon: position.coords.longitude },
          error: null,
        }),
      (error) =>
        setState({
          status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
          coords: null,
          error: error.message,
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    if (enabled) request();
  }, [enabled, request]);

  return { ...state, request };
}
