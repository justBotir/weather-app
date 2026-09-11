import { Controller, Get, Query } from '@nestjs/common';

import { WeatherService } from './weather.service';
import { CitySearchQueryDto, CoordsQueryDto } from './dto/coords.dto';
import type { GeoLocation, WeatherSnapshot } from './weather.types';
import { toLocationKey } from './weather.utils';

/** Thin by design: validate, delegate, return. All logic lives in the service. */
@Controller()
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get('weather')
  getSnapshot(@Query() query: CoordsQueryDto): Promise<WeatherSnapshot> {
    const units = query.units ?? 'metric';

    // A caller that already knows the place (picked it from search) passes the
    // name through; only a bare coordinate pair needs reverse geocoding.
    if (query.name) {
      const location: GeoLocation = {
        name: query.name,
        country: query.country ?? '',
        state: query.state,
        lat: query.lat,
        lon: query.lon,
        locationKey: toLocationKey(query.lat, query.lon),
      };
      return this.weather.getSnapshotForLocation(location, units);
    }

    return this.weather.getSnapshot(query.lat, query.lon, units);
  }

  @Get('geo/search')
  searchCities(@Query() query: CitySearchQueryDto): Promise<GeoLocation[]> {
    return this.weather.searchCities(query.q, query.limit ?? 5);
  }
}
