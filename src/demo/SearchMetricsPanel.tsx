
export type SearchMetrics = {
  lastMs: number | null;
  lastCount: number | null;
  success: number;
  aborted: number;
};

export function SearchMetricsPanel(props: {
  title?: string;
  metrics: SearchMetrics;
  onReset?: () => void;
}) {
  const { title = "Search metrics", metrics, onReset } = props;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-white/80">{title}</div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white/80"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
        <div>Last: {metrics.lastMs ?? "—"} ms</div>
        <div>Results: {metrics.lastCount ?? "—"}</div>
        <div>Success: {metrics.success}</div>
        <div>Aborted: {metrics.aborted}</div>
      </div>
    </div>
  );
}
