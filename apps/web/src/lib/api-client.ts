import type { FavoriteLocation, GeoLocation, Units, WeatherSnapshot } from '@/types/weather';

/**
 * Every call here targets OUR origin (`/api/...`), never OpenWeatherMap.
 * The vendor key lives on the server and is unreachable from this file.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? 'Request failed', response.status);
  }
  return (await response.json()) as T;
}

export function fetchSnapshot(
  location: GeoLocation,
  units: Units,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    units,
  });

  // Pass the name we already have so the server skips reverse geocoding. Without
  // this, picking "Jizzakh" from search and getting back whichever settlement
  // owns that pixel is a coin flip — and it costs an extra upstream call.
  if (!location.isProvisional && location.name) {
    params.set('name', location.name);
    if (location.country) params.set('country', location.country);
    if (location.state) params.set('state', location.state);
  }

  return getJson<WeatherSnapshot>(`/api/weather?${params}`, signal);
}

export function searchCities(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  const params = new URLSearchParams({ q: query });
  return getJson<GeoLocation[]>(`/api/geo/search?${params}`, signal);
}

export function fetchFavorites(signal?: AbortSignal): Promise<FavoriteLocation[]> {
  return getJson<FavoriteLocation[]>('/api/favorites', signal);
}

export async function addFavorite(location: GeoLocation): Promise<FavoriteLocation> {
  // Send exactly the documented payload, not the whole GeoLocation. `locationKey`
  // is derived server-side from lat/lon, so posting it back would let the client
  // claim a key that disagrees with its own coordinates — the API rejects it
  // (forbidNonWhitelisted) rather than trusting one of the two.
  const { name, country, state, lat, lon } = location;

  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, country, state, lat, lon }),
  });
  if (!response.ok) throw new ApiError('Could not save favourite', response.status);
  return (await response.json()) as FavoriteLocation;
}

export async function removeFavorite(id: string): Promise<void> {
  const response = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new ApiError('Could not remove favourite', response.status);
}
