interface MetricTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}

export function MetricTile({ label, value, hint, tone }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone ?? 'text-slate-100'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
