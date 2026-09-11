import type { ForecastDay, Units } from '@/types/weather';
import { ForecastDayRow } from './ForecastDayRow';

interface ForecastListProps {
  days: ForecastDay[];
  units: Units;
  timezoneOffset: number;
}

/**
 * Pure list view. The card, heading and view toggle belong to ForecastPanel —
 * this renders rows and nothing else, so it can be reused anywhere.
 */
export function ForecastList({ days, units, timezoneOffset }: ForecastListProps) {
  // One shared scale across the week, so bar widths are comparable row to row.
  const range = {
    min: Math.min(...days.map((day) => day.tempMin)),
    max: Math.max(...days.map((day) => day.tempMax)),
  };

  return (
    <ul className="divide-y divide-slate-800">
      {days.map((day, index) => (
        <ForecastDayRow
          key={day.date}
          day={day}
          index={index}
          units={units}
          range={range}
          timezoneOffset={timezoneOffset}
        />
      ))}
    </ul>
  );
}
