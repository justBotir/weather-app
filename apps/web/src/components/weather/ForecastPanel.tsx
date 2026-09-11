'use client';

import { useState } from 'react';

import type { ForecastDay, Units } from '@/types/weather';
import { ForecastChart } from './ForecastChart';
import { ForecastList } from './ForecastList';

interface ForecastPanelProps {
  days: ForecastDay[];
  units: Units;
  timezoneOffset: number;
}

type View = 'chart' | 'list';

/**
 * Owns only the chart/list toggle. The two views stay independent components so
 * either can be dropped elsewhere — and the list doubles as the accessible
 * alternative to the chart.
 */
export function ForecastPanel({ days, units, timezoneOffset }: ForecastPanelProps) {
  const [view, setView] = useState<View>('chart');

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          7-day forecast
        </h2>

        <div role="tablist" aria-label="Forecast view" className="flex rounded-lg border border-slate-700 p-0.5">
          {(['chart', 'list'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={view === option}
              onClick={() => setView(option)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                view === option ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {view === 'chart' ? (
          <ForecastChart days={days} units={units} timezoneOffset={timezoneOffset} />
        ) : (
          <ForecastList days={days} units={units} timezoneOffset={timezoneOffset} />
        )}
      </div>
    </section>
  );
}
