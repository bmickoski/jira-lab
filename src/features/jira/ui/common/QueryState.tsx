import React from "react";

export function QueryState(props: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
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
        Failed to load: {String((props.error as Error)?.message ?? "")}
      </div>
    );
  }
  return <>{props.children}</>;
}
