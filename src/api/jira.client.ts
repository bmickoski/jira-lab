import type { Issue } from "./jira.types";

type Json = Record<string, unknown>;

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export const jiraClient = {
  listIssues(args: { boardId: string; sprintId: string | null }) {
    const qs = new URLSearchParams({
      boardId: args.boardId,
      sprintId: args.sprintId ?? "",
    });
    return http<Issue[]>(`/api/issues?${qs.toString()}`);
  },

  patchIssue(args: { id: string; patch: Partial<Issue> }) {
    return http<Issue>(`/api/issues/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify(args.patch satisfies Json),
    });
  },

  patchIssuesBatch(args: {
    boardId: string;
    sprintId: string | null;
    changes: Array<{ id: string; patch: Partial<Issue> }>;
  }) {
    return http<Issue[]>(`/api/issues/batch`, {
      method: "PATCH",
      body: JSON.stringify({
        boardId: args.boardId,
        sprintId: args.sprintId ?? "",
        changes: args.changes,
      } satisfies Json),
    });
  },
  createIssue(args: { issue: Omit<Issue, "id" | "key"> }) {
    return http<Issue>(`/api/issues`, {
      method: "POST",
      body: JSON.stringify(args.issue satisfies Json),
    });
  },
};
