import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastState = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
};

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (input) => {
    const id = `toast_${++counter}`;
    const newToast: Toast = { ...input, id };

    set((s) => ({ toasts: [...s.toasts, newToast] }));

    if (input.duration > 0) {
      setTimeout(() => get().dismissToast(id), input.duration);
    }

    return id;
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

const DEFAULTS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
};

export function toast(type: ToastType, message: string, duration?: number) {
  return useToastStore.getState().addToast({
    type,
    message,
    duration: duration ?? DEFAULTS[type],
  });
}
