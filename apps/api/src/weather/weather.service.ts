import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';

import { WeatherCacheService } from '../common/cache/weather-cache.service';
import {
  WEATHER_PROVIDER,
  type WeatherProvider,
} from './providers/weather-provider.interface';
import type { GeoLocation, Units, WeatherSnapshot } from './weather.types';
import { toCacheKey, toLocationKey } from './weather.utils';

/** Seconds. Tuned to OpenWeather's own refresh cadence — polling faster buys nothing. */
const TTL = {
  snapshot: 10 * 60,
  geocode: 24 * 60 * 60,
} as const;

const MIN_QUERY_LENGTH = 2;

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @Inject(WEATHER_PROVIDER) private readonly provider: WeatherProvider,
    private readonly cache: WeatherCacheService,
  ) {}

  /**
   * City autocomplete. The client debounces; we cache for a day because the
   * set of cities on earth does not change between requests.
   */
  async searchCities(query: string, limit = 5): Promise<GeoLocation[]> {
    const normalised = query.trim().toLowerCase();
    if (normalised.length < MIN_QUERY_LENGTH) {
      return [];
    }

    return this.cache.wrap(`geo:search:${normalised}:${limit}`, TTL.geocode, () =>
      this.provider.searchCities(normalised, limit),
    );
  }

  /** Turns browser geolocation coordinates into a named place. */
  async resolveCoords(lat: number, lon: number): Promise<GeoLocation> {
    this.assertValidCoords(lat, lon);

    const resolved = await this.cache.wrap(
      `geo:reverse:${toCacheKey(lat, lon)}`,
      TTL.geocode,
      () => this.provider.reverseGeocode(lat, lon),
    );

    if (!resolved) {
      // Mid-ocean, Antarctica, etc. Weather still works — the label doesn't.
      return {
        name: 'Unknown location',
        country: '',
        lat,
        lon,
        locationKey: toLocationKey(lat, lon),
      };
    }
    return resolved;
  }

  /**
   * Current conditions + 7-day forecast in one payload, one upstream call.
   * This is the endpoint the dashboard hits on every location change.
   */
  async getSnapshot(lat: number, lon: number, units: Units = 'metric'): Promise<WeatherSnapshot> {
    this.assertValidCoords(lat, lon);

    const location = await this.resolveCoords(lat, lon);

    return this.cache.wrap(
      `weather:${toCacheKey(lat, lon)}:${units}`,
      TTL.snapshot,
      async () => {
        this.logger.debug(`Cache miss for ${location.name} (${units}) — calling upstream.`);
        return this.provider.getSnapshot(location, units);
      },
    );
  }

  /** Same, but for a place the user picked from search results (name already known). */
  async getSnapshotForLocation(location: GeoLocation, units: Units = 'metric'): Promise<WeatherSnapshot> {
    this.assertValidCoords(location.lat, location.lon);

    return this.cache.wrap(
      `weather:${toCacheKey(location.lat, location.lon)}:${units}`,
      TTL.snapshot,
      () => this.provider.getSnapshot(location, units),
    );
  }

  private assertValidCoords(lat: number, lon: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('lat and lon must be numbers.');
    }
    if (lat < -90 || lat > 90) {
      throw new BadRequestException('lat must be between -90 and 90.');
    }
    if (lon < -180 || lon > 180) {
      throw new BadRequestException('lon must be between -180 and 180.');
    }
  }
}
