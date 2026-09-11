import type { CurrentWeather, Units } from '@/types/weather';
import { formatLocalTime, formatWind, uvBand, windDirection } from '@/lib/format';
import { MetricTile } from './MetricTile';

interface WeatherMetricGridProps {
  current: CurrentWeather;
  units: Units;
}

export function WeatherMetricGrid({ current, units }: WeatherMetricGridProps) {
  const uv = uvBand(current.uvIndex);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <MetricTile label="Humidity" value={`${current.humidity}%`} />
      <MetricTile
        label="Wind"
        value={formatWind(current.windSpeed, units)}
        hint={windDirection(current.windDeg)}
      />
      <MetricTile
        label="UV index"
        value={current.uvIndex.toFixed(1)}
        hint={uv.label}
        tone={uv.tone}
      />
      <MetricTile label="Pressure" value={`${current.pressure} hPa`} />
      <MetricTile label="Visibility" value={`${(current.visibility / 1000).toFixed(1)} km`} />
      <MetricTile label="Cloud cover" value={`${current.cloudCover}%`} />
      <MetricTile
        label="Sunrise"
        value={formatLocalTime(current.sunrise, current.timezoneOffset)}
      />
      <MetricTile label="Sunset" value={formatLocalTime(current.sunset, current.timezoneOffset)} />
    </div>
  );
}
