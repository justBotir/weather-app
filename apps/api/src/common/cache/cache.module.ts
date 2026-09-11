import { Global, Module } from '@nestjs/common';
import { WeatherCacheService } from './weather-cache.service';

@Global()
@Module({
  providers: [WeatherCacheService],
  exports: [WeatherCacheService],
})
export class CacheModule {}
