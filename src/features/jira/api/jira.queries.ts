import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jiraClient } from "./jira.client";
import type { Issue } from "../domain/types";

type IssueChange = { id: string; patch: Partial<Issue> };

// ----------------------------
// Query keys
// ----------------------------
export const jiraKeys = {
  issues: (boardId: string, sprintId: string | null) =>
    ["issues", boardId, sprintId] as const,
};

// ----------------------------
// Queries
// ----------------------------
export function useIssues(boardId: string, sprintId: string | null) {
  return useQuery({
    queryKey: jiraKeys.issues(boardId, sprintId),
    queryFn: () => jiraClient.listIssues({ boardId, sprintId }),
    enabled: !!boardId,
  });
}

// ----------------------------
// Mutations
// ----------------------------
export function useBatchPatchIssues(boardId: string, sprintId: string | null) {
  const qc = useQueryClient();

  return useMutation<Issue[], Error, IssueChange[], { prev: Issue[] }>({
    mutationFn: (changes) =>
      jiraClient.patchIssuesBatch({ boardId, sprintId, changes }),

    onMutate: async (changes) => {
      const key = jiraKeys.issues(boardId, sprintId);
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<Issue[]>(key) ?? [];

      const byId = new Map(changes.map((c) => [c.id, c.patch]));
      const next = prev.map((it) => {
        const patch = byId.get(it.id);
        return patch ? { ...it, ...patch } : it;
      });

      qc.setQueryData<Issue[]>(key, next);
      return { prev };
    },

    onError: (_err, _changes, ctx) => {
      const key = jiraKeys.issues(boardId, sprintId);
      if (ctx?.prev) qc.setQueryData<Issue[]>(key, ctx.prev);
    },

    onSuccess: (serverIssues) => {
      const key = jiraKeys.issues(boardId, sprintId);
      qc.setQueryData<Issue[]>(key, serverIssues);
    },

    onSettled: () => {
      const key = jiraKeys.issues(boardId, sprintId);
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function usePatchIssue(boardId: string, sprintId: string | null) {
  const qc = useQueryClient();

  return useMutation<
    Issue,
    Error,
    { id: string; patch: Partial<Issue> },
    { prev: Issue[] }
  >({
    mutationFn: (args) => jiraClient.patchIssue(args),

    onMutate: async ({ id, patch }) => {
      const key = jiraKeys.issues(boardId, sprintId);
      await qc.cancelQueries({ queryKey: key });

      const prev = qc.getQueryData<Issue[]>(key) ?? [];

      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      qc.setQueryData<Issue[]>(key, next);

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      const key = jiraKeys.issues(boardId, sprintId);
      if (ctx?.prev) qc.setQueryData<Issue[]>(key, ctx.prev);
    },

    onSuccess: (updated) => {
      const key = jiraKeys.issues(boardId, sprintId);
      const prev = qc.getQueryData<Issue[]>(key) ?? [];
      qc.setQueryData<Issue[]>(
        key,
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );
    },

    onSettled: () => {
      const key = jiraKeys.issues(boardId, sprintId);
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
export function useCreateIssue(boardId: string, sprintId: string | null) {
  const qc = useQueryClient();
  const key = jiraKeys.issues(boardId, sprintId);

  return useMutation({
    mutationFn: (issue: Omit<Issue, "id" | "key">) =>
      jiraClient.createIssue({ issue }),

    onSuccess: (created) => {
      const prev = qc.getQueryData<Issue[]>(key) ?? [];
      qc.setQueryData<Issue[]>(key, [...prev, created]);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
