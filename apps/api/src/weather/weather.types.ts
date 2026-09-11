/**
 * Our domain model. Deliberately NOT the OpenWeather response shape —
 * the vendor shape stops at the provider boundary (see dto/openweather.raw.ts).
 * The frontend mirrors this file in apps/web/src/types/weather.ts.
 */

export type Units = 'metric' | 'imperial';

export interface GeoLocation {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  /** `${lat.toFixed(4)}:${lon.toFixed(4)}` — matches FavoriteLocation.locationKey. */
  locationKey: string;
}

export interface WeatherCondition {
  /** Vendor-neutral slug: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | ... */
  kind: string;
  description: string;
  /** OpenWeather icon code, e.g. '10d'. The client maps this to its own icon set. */
  iconCode: string;
  isDay: boolean;
}

export interface CurrentWeather {
  observedAt: number; // unix seconds, UTC
  timezoneOffset: number; // seconds to add to UTC for local time
  temp: number;
  feelsLike: number;
  humidity: number; // %
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // metres
  windSpeed: number;
  windDeg: number;
  windGust?: number;
  cloudCover: number; // %
  sunrise: number;
  sunset: number;
  condition: WeatherCondition;
}

export interface ForecastDay {
  date: number; // unix seconds, local noon
  tempMin: number;
  tempMax: number;
  /** Optional: only some vendors split day/night. Open-Meteo does not. */
  tempDay?: number;
  tempNight?: number;
  /** Optional: not every vendor exposes humidity in its daily aggregate. */
  humidity?: number;
  windSpeed: number;
  uvIndex: number;
  /** 0..1 probability of precipitation */
  pop: number;
  precipitation: number; // mm
  condition: WeatherCondition;
}

export interface WeatherSnapshot {
  location: GeoLocation;
  units: Units;
  current: CurrentWeather;
  /** Exactly 7 entries, today first. */
  forecast: ForecastDay[];
  /** When this payload was produced (unix ms) — lets the UI show "updated 3 min ago". */
  fetchedAt: number;
}
