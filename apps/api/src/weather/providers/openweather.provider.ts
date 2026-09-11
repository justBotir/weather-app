import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { WeatherProvider } from './weather-provider.interface';
import type {
  RawGeoResult,
  RawOneCallResponse,
  RawCurrent,
  RawDaily,
  RawCondition,
} from '../dto/openweather.raw';
import type {
  CurrentWeather,
  ForecastDay,
  GeoLocation,
  Units,
  WeatherCondition,
  WeatherSnapshot,
} from '../weather.types';
import { toLocationKey } from '../weather.utils';

/**
 * The ONLY place in the codebase that knows the OpenWeatherMap API key or URL shapes.
 * Nothing in apps/web can reach this; the key is never serialised into a response.
 */
@Injectable()
export class OpenWeatherProvider implements WeatherProvider {
  private readonly logger = new Logger(OpenWeatherProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs = 8_000;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENWEATHER_API_KEY');
    if (!apiKey) {
      // Fail at boot, not on the first user request.
      throw new Error('OPENWEATHER_API_KEY is not set.');
    }
    this.apiKey = apiKey;
    this.baseUrl = config.get<string>('OPENWEATHER_BASE_URL') ?? 'https://api.openweathermap.org';
  }

  async searchCities(query: string, limit = 5): Promise<GeoLocation[]> {
    const results = await this.request<RawGeoResult[]>('/geo/1.0/direct', {
      q: query,
      limit: String(limit),
    });
    return results.map((r) => this.toGeoLocation(r));
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
    const results = await this.request<RawGeoResult[]>('/geo/1.0/reverse', {
      lat: String(lat),
      lon: String(lon),
      limit: '1',
    });
    return results.length ? this.toGeoLocation(results[0]) : null;
  }

  async getSnapshot(location: GeoLocation, units: Units): Promise<WeatherSnapshot> {
    const raw = await this.request<RawOneCallResponse>('/data/3.0/onecall', {
      lat: String(location.lat),
      lon: String(location.lon),
      units,
      exclude: 'minutely,hourly,alerts',
    });

    return {
      location,
      units,
      current: this.toCurrent(raw.current, raw.timezone_offset),
      // One Call returns 8 days including today; the product spec asks for 7.
      forecast: raw.daily.slice(0, 7).map((day) => this.toForecastDay(day)),
      fetchedAt: Date.now(),
    };
  }

  // ---------------------------------------------------------------- transport

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('appid', this.apiKey);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      // Never let the URL (and therefore the key) reach the log or the client.
      this.logger.error(`Upstream request to ${path} failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Weather provider is unreachable.');
    }

    if (!response.ok) {
      this.logger.error(`Upstream ${path} responded ${response.status}`);
      if (response.status === 429) {
        throw new ServiceUnavailableException('Weather provider rate limit reached.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new InternalServerErrorException('Weather provider rejected our credentials.');
      }
      throw new ServiceUnavailableException('Weather provider returned an error.');
    }

    return (await response.json()) as T;
  }

  // ------------------------------------------------------------------ mapping

  private toGeoLocation(raw: RawGeoResult): GeoLocation {
    return {
      name: raw.name,
      country: raw.country,
      state: raw.state,
      lat: raw.lat,
      lon: raw.lon,
      locationKey: toLocationKey(raw.lat, raw.lon),
    };
  }

  private toCondition(raw: RawCondition | undefined, isDay: boolean): WeatherCondition {
    return {
      kind: (raw?.main ?? 'unknown').toLowerCase(),
      description: raw?.description ?? 'unknown',
      iconCode: raw?.icon ?? '01d',
      isDay,
    };
  }

  private toCurrent(raw: RawCurrent, timezoneOffset: number): CurrentWeather {
    return {
      observedAt: raw.dt,
      timezoneOffset,
      temp: raw.temp,
      feelsLike: raw.feels_like,
      humidity: raw.humidity,
      pressure: raw.pressure,
      uvIndex: raw.uvi,
      visibility: raw.visibility,
      windSpeed: raw.wind_speed,
      windDeg: raw.wind_deg,
      windGust: raw.wind_gust,
      cloudCover: raw.clouds,
      sunrise: raw.sunrise,
      sunset: raw.sunset,
      condition: this.toCondition(raw.weather[0], raw.dt >= raw.sunrise && raw.dt < raw.sunset),
    };
  }

  private toForecastDay(raw: RawDaily): ForecastDay {
    return {
      date: raw.dt,
      tempMin: raw.temp.min,
      tempMax: raw.temp.max,
      tempDay: raw.temp.day,
      tempNight: raw.temp.night,
      humidity: raw.humidity,
      windSpeed: raw.wind_speed,
      uvIndex: raw.uvi,
      pop: raw.pop,
      precipitation: (raw.rain ?? 0) + (raw.snow ?? 0),
      condition: this.toCondition(raw.weather[0], true),
    };
  }
}
