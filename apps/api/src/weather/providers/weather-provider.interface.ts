import type { Units, GeoLocation, WeatherSnapshot } from '../weather.types';

export const WEATHER_PROVIDER = Symbol('WEATHER_PROVIDER');

/**
 * Everything WeatherService needs from an upstream vendor. Implement this
 * against a different API (Tomorrow.io, WeatherAPI, Open-Meteo) and rebind
 * WEATHER_PROVIDER in weather.module.ts — no other file changes.
 */
export interface WeatherProvider {
  searchCities(query: string, limit?: number): Promise<GeoLocation[]>;
  reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null>;
  getSnapshot(location: GeoLocation, units: Units): Promise<WeatherSnapshot>;
}
