'use client';

import type { WeatherSnapshot } from '@/types/weather';
import { formatTemp, formatLocalTime } from '@/lib/format';
import { formatPlace } from '@/lib/geo';
import { WeatherMetricGrid } from './WeatherMetricGrid';
import { FavoriteStarButton } from './FavoriteStarButton';

interface CurrentWeatherCardProps {
  snapshot: WeatherSnapshot;
  onRefresh: () => void;
}

export function CurrentWeatherCard({ snapshot, onRefresh }: CurrentWeatherCardProps) {
  const { location, current, units } = snapshot;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{formatPlace(location)}</h2>
          <p className="text-sm text-slate-500">
            Local time {formatLocalTime(current.observedAt, current.timezoneOffset)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg p-2 text-sm text-slate-400 transition hover:bg-slate-800"
            aria-label="Refresh weather"
          >
            ↻
          </button>
          <FavoriteStarButton location={location} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="text-6xl font-light tracking-tighter text-slate-50">
          {formatTemp(current.temp, units)}
        </p>
        <div className="pb-2">
          <p className="text-base capitalize text-slate-300">{current.condition.description}</p>
          <p className="text-sm text-slate-500">
            Feels like {formatTemp(current.feelsLike, units)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <WeatherMetricGrid current={current} units={units} />
      </div>
    </section>
  );
}
