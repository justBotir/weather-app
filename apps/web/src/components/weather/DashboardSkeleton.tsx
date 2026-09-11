interface DashboardSkeletonProps {
  message?: string;
}

export function DashboardSkeleton({ message }: DashboardSkeletonProps) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      {message && <span className="sr-only">{message}</span>}
      <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
    </div>
  );
}
