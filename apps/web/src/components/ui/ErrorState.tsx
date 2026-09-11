interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center"
    >
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}
