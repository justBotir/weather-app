import { Module } from '@nestjs/common';

import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { OpenMeteoProvider } from './providers/open-meteo.provider';
import { WEATHER_PROVIDER } from './providers/weather-provider.interface';

@Module({
  controllers: [WeatherController],
  providers: [
    WeatherService,
    // The vendor seam. Swap this single line to change weather providers:
    //   OpenMeteoProvider   - no key, no account (current default)
    //   OpenWeatherProvider - needs OPENWEATHER_API_KEY + a One Call 3.0 subscription
    { provide: WEATHER_PROVIDER, useClass: OpenMeteoProvider },
  ],
  exports: [WeatherService],
})
export class WeatherModule {}
