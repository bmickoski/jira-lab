import type { Board, Issue, Sprint } from "../domain/types";
import { useAuthStore } from "@/features/auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
type Json = Record<string, unknown>;

// Track retried requests to prevent infinite loops
const retriedRequests = new WeakMap<RequestInit, boolean>();

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;
  const authHeaders: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const requestInit: RequestInit = {
    ...init,
    credentials: "include", // Send httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  };

  let res = await fetch(`${API_BASE}${url}`, requestInit);

  // If 401 and we haven't retried yet, attempt token refresh
  if (res.status === 401 && !retriedRequests.has(requestInit)) {
    try {
      // Mark this request as retried
      retriedRequests.set(requestInit, true);

      // Attempt to refresh token
      const newToken = await useAuthStore.getState().refresh();

      // Retry with new token
      requestInit.headers = {
        ...requestInit.headers,
        Authorization: `Bearer ${newToken}`,
      };

      res = await fetch(`${API_BASE}${url}`, requestInit);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      await useAuthStore.getState().logout();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  // Still 401 after retry, logout
  if (res.status === 401) {
    await useAuthStore.getState().logout();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type CreateIssueInput = Omit<Issue, "id" | "key">;
export type PatchIssueInput = { id: string; patch: Partial<Issue> };
export type BatchPatchInput = Array<PatchIssueInput>;

export const jiraClient = {
  listIssues(args: { boardId: string; sprintId: string | null }) {
    const qs = new URLSearchParams({ boardId: args.boardId });
    if (args.sprintId) qs.set("sprintId", args.sprintId); // ✅ no empty string
    return http<Issue[]>(`/issues?${qs.toString()}`);
  },

  createIssue(issue: CreateIssueInput) {
    return http<Issue>(`/issues`, {
      method: "POST",
      body: JSON.stringify(issue satisfies Json),
    });
  },

  patchIssue(args: PatchIssueInput) {
    return http<Issue>(`/issues/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify(args.patch satisfies Json),
    });
  },

  patchIssuesBatch(changes: BatchPatchInput) {
    return http<Issue[]>(`/issues/batch`, {
      method: "PATCH",
      body: JSON.stringify(changes satisfies unknown[]),
    });
  },

  listBoards() {
    return http<Board[]>(`/boards`);
  },
  createBoard(args: { name: string }) {
    return http<Board>(`/boards`, {
      method: "POST",
      body: JSON.stringify(args),
    });
  },
  listSprints(boardId: string) {
    return http<Sprint[]>(`/boards/${boardId}/sprints`);
  },
  setActiveSprint(boardId: string, sprintId: string) {
    return http<Sprint>(`/boards/${boardId}/active-sprint`, {
      method: "PATCH",
      body: JSON.stringify({ sprintId } satisfies Json),
    });
  },
  moveIssue(args: { id: string; sprintId: string | null }) {
    return http<Issue>(`/issues/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({ sprintId: args.sprintId } satisfies Json),
    });
  },
  createSprint(boardId: string, args: { name: string }) {
    return http<Sprint>(`/boards/${boardId}/sprints`, {
      method: "POST",
      body: JSON.stringify(args),
    });
  },
};
