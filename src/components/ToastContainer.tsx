import { useState } from "react";
import { useToastStore, type Toast } from "@/stores/toastStore";

const STYLE: Record<string, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/20 bg-red-500/10 text-red-200",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((s) => s.dismissToast);
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => dismissToast(toast.id), 200);
  };

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
        "min-w-[280px] max-w-[400px]",
        exiting ? "animate-toast-out" : "animate-toast-in",
        STYLE[toast.type],
      ].join(" ")}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-2 text-current opacity-50 hover:opacity-80"
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
