import { useEffect, useState } from "react";

/**
 * Cold start warning banner for free tier backend hosting.
 * Only appears after `delayMs` (default 3 seconds) to avoid flashing
 * the warning when the backend is already warm.
 */
export function ColdStartWarning({ delayMs = 3000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <p className="text-sm text-amber-200">
        ⏱️ First request may take 30-60 seconds. Backend hosted on free tier -
        thanks for your patience!
      </p>
    </div>
  );
}
