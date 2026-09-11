/**
 * Raw OpenWeatherMap response shapes. Nothing outside providers/ may import this.
 * Only the fields we actually consume are typed.
 */

export interface RawCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface RawCurrent {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: RawCondition[];
}

export interface RawDaily {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: { day: number; min: number; max: number; night: number };
  feels_like: { day: number };
  pressure: number;
  humidity: number;
  wind_speed: number;
  uvi: number;
  pop: number;
  rain?: number;
  snow?: number;
  weather: RawCondition[];
}

/** GET /data/3.0/onecall */
export interface RawOneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: RawCurrent;
  daily: RawDaily[];
}

/** GET /geo/1.0/direct and /geo/1.0/reverse */
export interface RawGeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
