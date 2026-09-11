import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { WeatherProvider } from './weather-provider.interface';
import type {
  RawNominatimReverse,
  RawOpenMeteoForecast,
  RawOpenMeteoGeoResponse,
  RawOpenMeteoGeoResult,
} from '../dto/open-meteo.raw';
import type {
  CurrentWeather,
  ForecastDay,
  GeoLocation,
  Units,
  WeatherSnapshot,
} from '../weather.types';
import { toLocationKey } from '../weather.utils';
import { describeWmoCode } from './wmo-codes';

/** Open-Meteo takes unit names rather than a single `units` switch. */
const UNIT_PARAMS: Record<Units, Record<string, string>> = {
  metric: { temperature_unit: 'celsius', wind_speed_unit: 'ms', precipitation_unit: 'mm' },
  imperial: { temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', precipitation_unit: 'inch' },
};

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  // Sea-level pressure, not surface: at 400 m altitude the two differ by ~40 hPa,
  // and every weather UI (and every reading a user can compare us to) means MSL.
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',');

/** Current UV and visibility are hourly-only in Open-Meteo; we read the current hour. */
const HOURLY_FIELDS = ['uv_index', 'visibility'].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
].join(',');

/**
 * Open-Meteo: no API key, no account, no card. Free for non-commercial use.
 *
 * Three upstreams hide behind this one class:
 *   - api.open-meteo.com           -> forecast
 *   - geocoding-api.open-meteo.com -> city search
 *   - nominatim.openstreetmap.org  -> reverse geocoding (Open-Meteo has none)
 *
 * Nothing above this file knows any of that.
 */
@Injectable()
export class OpenMeteoProvider implements WeatherProvider {
  private readonly logger = new Logger(OpenMeteoProvider.name);
  private readonly timeoutMs = 8_000;

  private readonly forecastUrl: string;
  private readonly geocodingUrl: string;
  private readonly reverseUrl: string;
  /** Nominatim's usage policy requires a contactable identifier on every request. */
  private readonly userAgent: string;

  constructor(config: ConfigService) {
    this.forecastUrl = config.get('OPEN_METEO_URL') ?? 'https://api.open-meteo.com/v1/forecast';
    this.geocodingUrl =
      config.get('OPEN_METEO_GEOCODING_URL') ?? 'https://geocoding-api.open-meteo.com/v1/search';
    this.reverseUrl = config.get('NOMINATIM_URL') ?? 'https://nominatim.openstreetmap.org/reverse';
    this.userAgent = config.get('APP_USER_AGENT') ?? 'weather-app/0.1 (dev)';
  }

  async searchCities(query: string, limit = 5): Promise<GeoLocation[]> {
    const raw = await this.request<RawOpenMeteoGeoResponse>(this.geocodingUrl, {
      name: query,
      count: String(limit),
      language: 'en',
      format: 'json',
    });

    return (raw.results ?? []).map((result) => this.toGeoLocation(result));
  }

  /**
   * Open-Meteo has no reverse endpoint, so this leans on Nominatim. It is the
   * only cosmetic call in the app: a failure costs us the city's name, not its
   * weather, so we degrade to null instead of throwing.
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
    try {
      const raw = await this.request<RawNominatimReverse>(this.reverseUrl, {
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        // zoom 10 stops at the district level and returns no settlement name at
        // all outside big cities; 12 is the first level that carries town/village.
        zoom: '12',
        // Match the language of the search endpoint, or the UI mixes scripts.
        'accept-language': 'en',
      });

      const address = raw.address;
      // Ordered most- to least-specific. Rural coordinates often only reach
      // `county`, which still beats showing "Unknown location".
      const name =
        address?.city ??
        address?.town ??
        address?.village ??
        address?.municipality ??
        address?.county ??
        address?.state;
      if (!name) return null;

      return {
        name,
        country: address?.country_code?.toUpperCase() ?? '',
        state: address?.state,
        lat,
        lon,
        locationKey: toLocationKey(lat, lon),
      };
    } catch (error) {
      this.logger.warn(`Reverse geocoding failed, falling back to coordinates: ${String(error)}`);
      return null;
    }
  }

  async getSnapshot(location: GeoLocation, units: Units): Promise<WeatherSnapshot> {
    const raw = await this.request<RawOpenMeteoForecast>(this.forecastUrl, {
      latitude: String(location.lat),
      longitude: String(location.lon),
      current: CURRENT_FIELDS,
      hourly: HOURLY_FIELDS,
      daily: DAILY_FIELDS,
      forecast_days: '7',
      timezone: 'auto',
      // Unix seconds everywhere, so our domain model needs no date parsing.
      timeformat: 'unixtime',
      ...UNIT_PARAMS[units],
    });

    return {
      location,
      units,
      current: this.toCurrent(raw),
      forecast: this.toForecast(raw),
      fetchedAt: Date.now(),
    };
  }

  // ---------------------------------------------------------------- transport

  private async request<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const url = new URL(endpoint);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { Accept: 'application/json', 'User-Agent': this.userAgent },
      });
    } catch (error) {
      this.logger.error(`Upstream ${url.host} failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Weather provider is unreachable.');
    }

    if (!response.ok) {
      // Open-Meteo puts the real cause in a `reason` field; keep it in our logs only.
      const detail = await response.text().catch(() => '');
      this.logger.error(
        `Upstream ${url.host} responded ${response.status}: ${detail.slice(0, 200)}`,
      );
      throw new ServiceUnavailableException('Weather provider returned an error.');
    }

    return (await response.json()) as T;
  }

  // ------------------------------------------------------------------ mapping

  private toGeoLocation(raw: RawOpenMeteoGeoResult): GeoLocation {
    return {
      name: raw.name,
      country: raw.country_code?.toUpperCase() ?? '',
      state: raw.admin1,
      lat: raw.latitude,
      lon: raw.longitude,
      locationKey: toLocationKey(raw.latitude, raw.longitude),
    };
  }

  /** Index of the hourly slot covering `timestamp`; -1 when the series misses it. */
  private hourIndex(times: number[], timestamp: number): number {
    if (!times?.length) return -1;
    let index = -1;
    for (let i = 0; i < times.length; i += 1) {
      if (times[i] <= timestamp) index = i;
      else break;
    }
    return index;
  }

  private toCurrent(raw: RawOpenMeteoForecast): CurrentWeather {
    const { current, hourly, daily } = raw;
    const index = this.hourIndex(hourly?.time ?? [], current.time);

    return {
      observedAt: current.time,
      timezoneOffset: raw.utc_offset_seconds,
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      pressure: Math.round(current.pressure_msl),
      uvIndex: index >= 0 ? (hourly.uv_index?.[index] ?? 0) : 0,
      visibility: index >= 0 ? (hourly.visibility?.[index] ?? 0) : 0,
      windSpeed: current.wind_speed_10m,
      windDeg: current.wind_direction_10m,
      windGust: current.wind_gusts_10m,
      cloudCover: current.cloud_cover,
      sunrise: daily.sunrise?.[0] ?? current.time,
      sunset: daily.sunset?.[0] ?? current.time,
      condition: describeWmoCode(current.weather_code, current.is_day === 1),
    };
  }

  private toForecast(raw: RawOpenMeteoForecast): ForecastDay[] {
    const { daily } = raw;

    // Parallel arrays -> objects. `time` is the authoritative length.
    return daily.time.map((date, i) => ({
      date,
      tempMin: daily.temperature_2m_min[i],
      tempMax: daily.temperature_2m_max[i],
      windSpeed: daily.wind_speed_10m_max[i],
      uvIndex: daily.uv_index_max[i] ?? 0,
      pop: (daily.precipitation_probability_max[i] ?? 0) / 100,
      precipitation: daily.precipitation_sum[i] ?? 0,
      condition: describeWmoCode(daily.weather_code[i], true),
    }));
  }
}
