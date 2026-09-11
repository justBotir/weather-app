/**
 * WMO 4677 weather codes → our vendor-neutral condition vocabulary.
 *
 * `icon` deliberately reuses OpenWeather's icon naming (e.g. '10d') so a single
 * icon set on the client works no matter which provider is bound.
 */
interface WmoEntry {
  kind: string;
  description: string;
  /** OpenWeather-style icon code, without the day/night suffix. */
  icon: string;
}

const WMO: Record<number, WmoEntry> = {
  0: { kind: 'clear', description: 'clear sky', icon: '01' },
  1: { kind: 'clear', description: 'mainly clear', icon: '02' },
  2: { kind: 'clouds', description: 'partly cloudy', icon: '03' },
  3: { kind: 'clouds', description: 'overcast', icon: '04' },
  45: { kind: 'fog', description: 'fog', icon: '50' },
  48: { kind: 'fog', description: 'depositing rime fog', icon: '50' },
  51: { kind: 'drizzle', description: 'light drizzle', icon: '09' },
  53: { kind: 'drizzle', description: 'moderate drizzle', icon: '09' },
  55: { kind: 'drizzle', description: 'dense drizzle', icon: '09' },
  56: { kind: 'drizzle', description: 'light freezing drizzle', icon: '09' },
  57: { kind: 'drizzle', description: 'dense freezing drizzle', icon: '09' },
  61: { kind: 'rain', description: 'slight rain', icon: '10' },
  63: { kind: 'rain', description: 'moderate rain', icon: '10' },
  65: { kind: 'rain', description: 'heavy rain', icon: '10' },
  66: { kind: 'rain', description: 'light freezing rain', icon: '13' },
  67: { kind: 'rain', description: 'heavy freezing rain', icon: '13' },
  71: { kind: 'snow', description: 'slight snowfall', icon: '13' },
  73: { kind: 'snow', description: 'moderate snowfall', icon: '13' },
  75: { kind: 'snow', description: 'heavy snowfall', icon: '13' },
  77: { kind: 'snow', description: 'snow grains', icon: '13' },
  80: { kind: 'rain', description: 'slight rain showers', icon: '09' },
  81: { kind: 'rain', description: 'moderate rain showers', icon: '09' },
  82: { kind: 'rain', description: 'violent rain showers', icon: '09' },
  85: { kind: 'snow', description: 'slight snow showers', icon: '13' },
  86: { kind: 'snow', description: 'heavy snow showers', icon: '13' },
  95: { kind: 'thunderstorm', description: 'thunderstorm', icon: '11' },
  96: { kind: 'thunderstorm', description: 'thunderstorm with slight hail', icon: '11' },
  99: { kind: 'thunderstorm', description: 'thunderstorm with heavy hail', icon: '11' },
};

const UNKNOWN: WmoEntry = { kind: 'unknown', description: 'unknown', icon: '01' };

export function describeWmoCode(code: number, isDay: boolean) {
  const entry = WMO[code] ?? UNKNOWN;
  return {
    kind: entry.kind,
    description: entry.description,
    iconCode: `${entry.icon}${isDay ? 'd' : 'n'}`,
    isDay,
  };
}
