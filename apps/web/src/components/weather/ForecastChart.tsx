'use client';

import { useId } from 'react';

import type { ForecastDay, Units } from '@/types/weather';
import { formatTemp, formatWeekday } from '@/lib/format';

interface ForecastChartProps {
  days: ForecastDay[];
  units: Units;
  timezoneOffset: number;
}

// Fixed viewBox: the SVG scales to its container, so these are design units,
// not pixels. Keeping them constant makes the geometry below readable.
const VIEW = { width: 700, height: 260 };
const PAD = { top: 26, right: 18, bottom: 30, left: 38 };

const INNER_W = VIEW.width - PAD.left - PAD.right;
const INNER_H = VIEW.height - PAD.top - PAD.bottom;

export function ForecastChart({ days, units, timezoneOffset }: ForecastChartProps) {
  // Two charts on one page would otherwise share one gradient id and one would
  // silently render unfilled.
  const gradientId = useId();

  if (days.length < 2) return null;

  const lows = days.map((day) => day.tempMin);
  const highs = days.map((day) => day.tempMax);

  // One degree of headroom keeps the extremes off the frame edge. The `|| 1`
  // guards a flat week, where hi === lo would divide by zero.
  const lo = Math.min(...lows) - 1;
  const hi = Math.max(...highs) + 1;
  const span = hi - lo || 1;

  const x = (index: number) => PAD.left + (index / (days.length - 1)) * INNER_W;
  const y = (temp: number) => PAD.top + (1 - (temp - lo) / span) * INNER_H;

  const toPoints = (temps: number[]) =>
    temps.map((temp, i) => `${x(i).toFixed(1)},${y(temp).toFixed(1)}`).join(' ');

  const highPoints = toPoints(highs);
  const lowPoints = toPoints(lows);

  // Close the band by walking the highs forward and the lows back.
  const bandPath = `M ${highPoints.split(' ').join(' L ')} L ${lowPoints
    .split(' ')
    .reverse()
    .join(' L ')} Z`;

  const summary = `7-day forecast from ${formatTemp(Math.min(...lows), units)} to ${formatTemp(
    Math.max(...highs),
    units,
  )}`;

  return (
    // 7 weekday labels need ~60px each before they touch, so 420px is the real
    // floor. Setting it higher (560 was the first guess) makes a 530px card
    // scroll by a useless 30px sliver instead of just scaling the chart down.
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="h-auto w-full min-w-[420px]"
        role="img"
        aria-label={summary}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(251 191 36)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Horizontal guides at quarter steps — enough to read the trend, few
            enough not to compete with the data. */}
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const lineY = PAD.top + step * INNER_H;
          const temp = hi - step * span;
          return (
            <g key={step}>
              <line
                x1={PAD.left}
                y1={lineY}
                x2={VIEW.width - PAD.right}
                y2={lineY}
                stroke="rgb(30 41 59)"
                strokeWidth="1"
              />
              <text x={PAD.left - 8} y={lineY + 4} textAnchor="end" className="fill-slate-600 text-[11px]">
                {Math.round(temp)}°
              </text>
            </g>
          );
        })}

        <path d={bandPath} fill={`url(#${gradientId})`} />

        <polyline
          points={highPoints}
          fill="none"
          stroke="rgb(251 191 36)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={lowPoints}
          fill="none"
          stroke="rgb(56 189 248)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {days.map((day, i) => (
          <g key={day.date}>
            <circle cx={x(i)} cy={y(day.tempMax)} r="3.5" fill="rgb(251 191 36)" />
            <circle cx={x(i)} cy={y(day.tempMin)} r="3.5" fill="rgb(56 189 248)" />

            <text
              x={x(i)}
              y={y(day.tempMax) - 11}
              textAnchor="middle"
              className="fill-amber-300 text-[11px] font-medium"
            >
              {Math.round(day.tempMax)}°
            </text>
            <text
              x={x(i)}
              y={y(day.tempMin) + 19}
              textAnchor="middle"
              className="fill-sky-300 text-[11px] font-medium"
            >
              {Math.round(day.tempMin)}°
            </text>

            <text
              x={x(i)}
              y={VIEW.height - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {formatWeekday(day.date, i, timezoneOffset)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
