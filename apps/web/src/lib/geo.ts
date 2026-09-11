import type { GeoLocation } from '@/types/weather';

/** Must stay byte-identical to apps/api/src/weather/weather.utils.ts. */
export function toLocationKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

/** Placeholder used between "geolocation resolved" and "server told us the city name". */
export function provisionalLocation(lat: number, lon: number): GeoLocation {
  return {
    name: 'Your location',
    country: '',
    lat,
    lon,
    locationKey: toLocationKey(lat, lon),
    isProvisional: true,
  };
}

export function formatPlace(location: GeoLocation): string {
  return [location.name, location.state, location.country].filter(Boolean).join(', ');
}
