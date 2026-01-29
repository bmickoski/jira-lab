import { useRef, useState } from "react";

type Metrics = {
  lastMs: number | null;
  lastCount: number | null;
  success: number;
  aborted: number;
};

export function useSearchMetrics() {
  const startRef = useRef<number | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({
    lastMs: null,
    lastCount: null,
    success: 0,
    aborted: 0,
  });

  function onStart() {
    startRef.current = performance.now();
  }

  function onSuccess(resultCount: number) {
    const end = performance.now();
    const start = startRef.current;

    setMetrics((m) => ({
      lastMs: start ? Math.round(end - start) : null,
      lastCount: resultCount,
      success: m.success + 1,
      aborted: m.aborted,
    }));
  }

  function onAbort() {
    setMetrics((m) => ({
      ...m,
      aborted: m.aborted + 1,
    }));
  }

  function reset() {
    setMetrics({
      lastMs: null,
      lastCount: null,
      success: 0,
      aborted: 0,
    });
  }

  return {
    metrics,
    onStart,
    onSuccess,
    onAbort,
    reset,
  };
}
