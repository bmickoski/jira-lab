import { describe, it, expect, beforeEach } from "vitest";
import { useJiraStore } from "./jiraStore";

describe("jiraStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useJiraStore.setState({
      selectedIssueId: null,
      draftIssue: null,
    });
  });

  describe("openIssue", () => {
    it("sets selectedIssueId and clears draft", () => {
      useJiraStore.getState().openIssue("issue-42");

      const state = useJiraStore.getState();
      expect(state.selectedIssueId).toBe("issue-42");
      expect(state.draftIssue).toBeNull();
    });

    it("clears any existing draft when opening an issue", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "b1",
        sprintId: null,
        status: "backlog",
      });
      expect(useJiraStore.getState().draftIssue).not.toBeNull();

      useJiraStore.getState().openIssue("issue-1");
      expect(useJiraStore.getState().draftIssue).toBeNull();
    });
  });

  describe("closeIssue", () => {
    it("clears selectedIssueId", () => {
      useJiraStore.getState().openIssue("issue-1");
      useJiraStore.getState().closeIssue();

      expect(useJiraStore.getState().selectedIssueId).toBeNull();
    });
  });

  describe("openNewIssue", () => {
    it("creates a draft with correct defaults", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "board-1",
        sprintId: "sprint-1",
        status: "todo",
      });

      const { draftIssue, selectedIssueId } = useJiraStore.getState();
      expect(selectedIssueId).toBeNull();
      expect(draftIssue).toEqual({
        boardId: "board-1",
        sprintId: "sprint-1",
        status: "todo",
        title: "",
        description: "",
        assigneeId: null,
        watcherIds: [],
      });
    });

    it("creates draft with null sprintId for backlog", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "b1",
        sprintId: null,
        status: "backlog",
      });

      expect(useJiraStore.getState().draftIssue?.sprintId).toBeNull();
      expect(useJiraStore.getState().draftIssue?.status).toBe("backlog");
    });
  });

  describe("updateDraft", () => {
    it("merges patch into existing draft", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "b1",
        sprintId: null,
        status: "todo",
      });

      useJiraStore.getState().updateDraft({ title: "My Issue" });
      expect(useJiraStore.getState().draftIssue?.title).toBe("My Issue");

      useJiraStore.getState().updateDraft({ description: "Details here" });
      expect(useJiraStore.getState().draftIssue?.title).toBe("My Issue");
      expect(useJiraStore.getState().draftIssue?.description).toBe(
        "Details here",
      );
    });

    it("does nothing when no draft exists", () => {
      const before = useJiraStore.getState();
      useJiraStore.getState().updateDraft({ title: "test" });
      const after = useJiraStore.getState();

      expect(after.draftIssue).toBeNull();
      expect(before.draftIssue).toBe(after.draftIssue);
    });
  });

  describe("discardDraft", () => {
    it("clears the draft", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "b1",
        sprintId: null,
        status: "todo",
      });
      expect(useJiraStore.getState().draftIssue).not.toBeNull();

      useJiraStore.getState().discardDraft();
      expect(useJiraStore.getState().draftIssue).toBeNull();
    });
  });

  describe("clearDraftAfterCreate", () => {
    it("clears the draft after a successful create", () => {
      useJiraStore.getState().openNewIssue({
        boardId: "b1",
        sprintId: "s1",
        status: "todo",
      });
      useJiraStore.getState().updateDraft({ title: "Created" });

      useJiraStore.getState().clearDraftAfterCreate();
      expect(useJiraStore.getState().draftIssue).toBeNull();
    });
  });
});
