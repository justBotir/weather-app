/**
 * Raw Open-Meteo response shapes. Nothing outside providers/ may import this.
 *
 * Open-Meteo returns parallel arrays (a `time` array plus one array per variable)
 * rather than an array of objects — the provider zips them into our domain model.
 */

export interface RawOpenMeteoCurrent {
  time: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
}

export interface RawOpenMeteoHourly {
  time: number[];
  uv_index: number[];
  visibility: number[];
}

export interface RawOpenMeteoDaily {
  time: number[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: number[];
  sunset: number[];
  uv_index_max: number[];
  precipitation_sum: number[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: number[];
}

export interface RawOpenMeteoForecast {
  latitude: number;
  longitude: number;
  utc_offset_seconds: number;
  timezone: string;
  current: RawOpenMeteoCurrent;
  hourly: RawOpenMeteoHourly;
  daily: RawOpenMeteoDaily;
}

/** GET https://geocoding-api.open-meteo.com/v1/search */
export interface RawOpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  /** First-level administrative division, e.g. "Jizzakh Region". */
  admin1?: string;
}

export interface RawOpenMeteoGeoResponse {
  results?: RawOpenMeteoGeoResult[];
}

/** GET https://nominatim.openstreetmap.org/reverse */
export interface RawNominatimReverse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country_code?: string;
  };
}
