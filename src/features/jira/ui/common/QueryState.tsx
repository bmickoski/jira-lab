import React from "react";

export function QueryState(props: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (props.isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
        Loading…
      </div>
    );
  }
  if (props.isError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
        <p>Failed to load: {String((props.error as Error)?.message ?? "")}</p>
        {props.onRetry && (
          <button
            type="button"
            onClick={props.onRetry}
            className="mt-3 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  return <>{props.children}</>;
}
