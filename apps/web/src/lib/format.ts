import type { Units } from '@/types/weather';

export function formatTemp(value: number, units: Units): string {
  return `${Math.round(value)}°${units === 'metric' ? 'C' : 'F'}`;
}

export function formatWind(value: number, units: Units): string {
  return units === 'metric' ? `${value.toFixed(1)} m/s` : `${value.toFixed(1)} mph`;
}

/** Renders a UTC timestamp in the *observed city's* local time, not the viewer's. */
export function formatLocalTime(unixSeconds: number, timezoneOffset: number): string {
  const date = new Date((unixSeconds + timezoneOffset) * 1000);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/**
 * Weekday in the *forecast city's* timezone, not the viewer's.
 *
 * Forecast timestamps sit at local midnight. Formatting one in a viewer's
 * timezone that is hours behind rolls it back to the previous day, so a user in
 * London reading a Tokyo forecast would see every label shifted by one.
 */
export function formatWeekday(unixSeconds: number, index: number, timezoneOffset: number): string {
  if (index === 0) return 'Today';
  return new Date((unixSeconds + timezoneOffset) * 1000).toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** WHO/OpenWeather UV bands — drives both the label and the colour token. */
export function uvBand(uvIndex: number): { label: string; tone: string } {
  if (uvIndex < 3) return { label: 'Low', tone: 'text-emerald-400' };
  if (uvIndex < 6) return { label: 'Moderate', tone: 'text-yellow-400' };
  if (uvIndex < 8) return { label: 'High', tone: 'text-orange-400' };
  if (uvIndex < 11) return { label: 'Very high', tone: 'text-red-400' };
  return { label: 'Extreme', tone: 'text-purple-400' };
}

export function windDirection(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(degrees / 45) % 8];
}
