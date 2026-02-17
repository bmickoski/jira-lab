import { useEffect } from "react";
import { useAuthStore } from "./authStore";

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15min expiry)

/**
 * Hook to automatically refresh access tokens before they expire.
 *
 * - Refreshes immediately on mount (handles page reload)
 * - Sets up periodic refresh every 14 minutes
 * - Only runs when user is authenticated
 */
export function useTokenRefresh() {
  const { user, refresh } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Refresh immediately on mount (in case token expired during page reload)
    refresh().catch(() => {
      // Silent fail - the http client will handle it on next request
    });

    // Set up periodic refresh
    const interval = setInterval(() => {
      refresh().catch(() => {
        // Silent fail
      });
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refresh]);
}
