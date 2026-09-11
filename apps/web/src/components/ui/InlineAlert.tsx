'use client';

interface InlineAlertProps {
  message: string;
  onDismiss: () => void;
}

/** Non-blocking failure notice for actions that already rolled themselves back. */
export function InlineAlert({ message, onDismiss }: InlineAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2.5"
    >
      <p className="text-sm text-red-200">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded px-1 text-sm text-red-300/70 transition hover:text-red-200"
      >
        ✕
      </button>
    </div>
  );
}
