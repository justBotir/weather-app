import type { ForecastDay, Units } from '@/types/weather';
import { formatTemp, formatWeekday } from '@/lib/format';

interface ForecastDayRowProps {
  day: ForecastDay;
  index: number;
  units: Units;
  /** Min/max across the whole week — lets every bar share one scale. */
  range: { min: number; max: number };
  /** Seconds to add to UTC for the forecast city's local date. */
  timezoneOffset: number;
}

export function ForecastDayRow({ day, index, units, range, timezoneOffset }: ForecastDayRowProps) {
  const span = Math.max(range.max - range.min, 1);
  const offset = ((day.tempMin - range.min) / span) * 100;
  const width = ((day.tempMax - day.tempMin) / span) * 100;

  return (
    <li className="flex items-center gap-3 py-2.5 sm:gap-4">
      <span className="w-12 shrink-0 text-sm font-medium text-slate-300">
        {formatWeekday(day.date, index, timezoneOffset)}
      </span>

      {/* truncate: "thunderstorm" overflows this column and pushes the bar out. */}
      <span
        className="w-16 shrink-0 truncate text-xs capitalize text-slate-500"
        title={day.condition.description}
      >
        {day.condition.kind}
      </span>

      <span className="w-10 shrink-0 text-right text-sm text-slate-500">
        {formatTemp(day.tempMin, units)}
      </span>

      <div className="h-1.5 flex-1 rounded-full bg-slate-800" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
          style={{ marginLeft: `${offset}%`, width: `${Math.max(width, 4)}%` }}
        />
      </div>

      <span className="w-10 shrink-0 text-sm font-medium text-slate-200">
        {formatTemp(day.tempMax, units)}
      </span>

      <span className="hidden w-12 shrink-0 text-right text-xs text-sky-400 sm:block">
        {Math.round(day.pop * 100)}%
      </span>
    </li>
  );
}
