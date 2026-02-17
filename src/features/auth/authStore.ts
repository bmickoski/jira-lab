import { create } from "zustand";
import type { AuthUser } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isRefreshing: boolean;
  refreshPromise: Promise<string> | null;

  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<string>;
};

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: loadUserFromStorage(),
  isRefreshing: false,
  refreshPromise: null,

  setAuth: (accessToken, user) => {
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ accessToken, user });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  refresh: async () => {
    const { refreshPromise, isRefreshing } = get();

    // If already refreshing, return existing promise
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    const promise = (async () => {
      try {
        set({ isRefreshing: true });
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include", // Send httpOnly cookie
        });

        if (!response.ok) {
          throw new Error("Refresh failed");
        }

        const { accessToken } = await response.json();
        set({ accessToken, isRefreshing: false, refreshPromise: null });
        return accessToken;
      } catch (error) {
        set({ accessToken: null, user: null, isRefreshing: false, refreshPromise: null });
        localStorage.removeItem("auth_user");
        throw error;
      }
    })();

    set({ refreshPromise: promise });
    return promise;
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${get().accessToken}`,
        },
      });
    } finally {
      localStorage.removeItem("auth_user");
      set({ accessToken: null, user: null });
    }
  },
}));
