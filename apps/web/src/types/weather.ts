/**
 * Mirrors apps/api/src/weather/weather.types.ts.
 * In a larger repo, promote this to a shared `packages/contracts` workspace so
 * the two sides can never drift.
 */

export type Units = 'metric' | 'imperial';

export interface GeoLocation {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  locationKey: string;
  /**
   * Client-only marker: these coordinates came from the browser and the name is
   * a placeholder, so the server should reverse-geocode rather than trust it.
   * Never sent to the API.
   */
  isProvisional?: boolean;
}

export interface WeatherCondition {
  kind: string;
  description: string;
  iconCode: string;
  isDay: boolean;
}

export interface CurrentWeather {
  observedAt: number;
  timezoneOffset: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  windSpeed: number;
  windDeg: number;
  windGust?: number;
  cloudCover: number;
  sunrise: number;
  sunset: number;
  condition: WeatherCondition;
}

export interface ForecastDay {
  date: number;
  tempMin: number;
  tempMax: number;
  /** Optional: only some vendors split day/night. Open-Meteo does not. */
  tempDay?: number;
  tempNight?: number;
  /** Optional: not every vendor exposes humidity in its daily aggregate. */
  humidity?: number;
  windSpeed: number;
  uvIndex: number;
  pop: number;
  precipitation: number;
  condition: WeatherCondition;
}

export interface WeatherSnapshot {
  location: GeoLocation;
  units: Units;
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: number;
}

export interface FavoriteLocation extends GeoLocation {
  id: string;
  label?: string;
  sortOrder: number;
}
