import { create } from "zustand";
import type { IssueStatus } from "@/features/jira/domain";

export type IssueDraft = {
  boardId: string;
  sprintId: string | null;
  status: IssueStatus;
  title: string;
  description: string;
  assigneeId: string | number | null;
  watcherIds: Array<string | number>;
};

type JiraUiState = {
  selectedIssueId: string | null;
  draftIssue: IssueDraft | null;

  openIssue: (issueId: string) => void;
  closeIssue: () => void;

  openNewIssue: (seed: { boardId: string; sprintId: string | null; status: IssueStatus }) => void;

  updateDraft: (patch: Partial<IssueDraft>) => void;
  discardDraft: () => void;
  clearDraftAfterCreate: () => void;
};

export const useJiraStore = create<JiraUiState>((set) => ({
  selectedIssueId: null,
  draftIssue: null,

  openIssue: (issueId) => set({ selectedIssueId: issueId, draftIssue: null }),
  closeIssue: () => set({ selectedIssueId: null }),

  openNewIssue: ({ boardId, sprintId, status }) =>
    set({
      selectedIssueId: null,
      draftIssue: {
        boardId,
        sprintId,
        status,
        title: "",
        description: "",
        assigneeId: null,
        watcherIds: [],
      },
    }),

  updateDraft: (patch) =>
    set((s) => (s.draftIssue ? { draftIssue: { ...s.draftIssue, ...patch } } : s)),

  discardDraft: () => set({ draftIssue: null }),
  clearDraftAfterCreate: () => set({ draftIssue: null }),
}));
