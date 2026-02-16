/**
 * Cold start warning banner for free tier backend hosting.
 * Informs users about potential 30-60 second delays on first requests
 * due to Render's free tier cold start behavior.
 */
export function ColdStartWarning() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <p className="text-sm text-amber-200">
        ⏱️ First request may take 30-60 seconds. Backend hosted on free tier -
        thanks for your patience!
      </p>
    </div>
  );
}
