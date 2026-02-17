import { describe, it, expect } from "vitest";
import {
  filterIssues,
  hasActiveFilters,
  emptyFilters,
  type IssueFilters,
} from "./issueFilters";
import type { Issue } from "./types";

const base: Issue = {
  id: "1",
  key: "BOARD-1",
  boardId: "b1",
  sprintId: "s1",
  status: "todo",
  order: 1000,
  title: "Setup project",
  description: "Initial setup",
  assigneeId: null,
  watcherIds: [],
};

const issues: Issue[] = [
  { ...base, id: "1", title: "Setup project", description: "Project scaffolding", status: "todo", assigneeId: "u1" },
  { ...base, id: "2", key: "BOARD-2", title: "Add tests", description: "Unit tests", status: "in_progress", assigneeId: "u2" },
  { ...base, id: "3", key: "BOARD-3", title: "Deploy app", description: "Production deploy", status: "done", assigneeId: "u1" },
  { ...base, id: "4", key: "BOARD-4", title: "Fix login bug", description: "Auth fix", status: "todo", assigneeId: null },
];

describe("hasActiveFilters", () => {
  it("returns false for empty filters", () => {
    expect(hasActiveFilters(emptyFilters)).toBe(false);
  });

  it("returns true when search is set", () => {
    expect(hasActiveFilters({ ...emptyFilters, search: "bug" })).toBe(true);
  });

  it("returns true when status is set", () => {
    expect(hasActiveFilters({ ...emptyFilters, status: "todo" })).toBe(true);
  });

  it("returns true when assigneeId is set", () => {
    expect(hasActiveFilters({ ...emptyFilters, assigneeId: "u1" })).toBe(true);
  });

  it("returns false for whitespace-only search", () => {
    expect(hasActiveFilters({ ...emptyFilters, search: "   " })).toBe(false);
  });
});

describe("filterIssues", () => {
  it("returns all issues with empty filters", () => {
    expect(filterIssues(issues, emptyFilters)).toHaveLength(4);
  });

  it("filters by title search", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "setup" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by key search", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "BOARD-3" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("filters by description search", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "scaffolding" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("search is case-insensitive", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "SETUP" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by status", () => {
    const result = filterIssues(issues, { ...emptyFilters, status: "todo" });
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id).sort()).toEqual(["1", "4"]);
  });

  it("filters by assigneeId", () => {
    const result = filterIssues(issues, { ...emptyFilters, assigneeId: "u1" });
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id).sort()).toEqual(["1", "3"]);
  });

  it("combines search + status filters", () => {
    const filters: IssueFilters = {
      search: "bug",
      status: "todo",
      assigneeId: null,
    };
    const result = filterIssues(issues, filters);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Fix login bug");
  });

  it("combines all three filters", () => {
    const filters: IssueFilters = {
      search: "setup",
      status: "todo",
      assigneeId: "u1",
    };
    const result = filterIssues(issues, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty when no matches", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "nonexistent" });
    expect(result).toHaveLength(0);
  });

  it("trims whitespace from search", () => {
    const result = filterIssues(issues, { ...emptyFilters, search: "  setup  " });
    expect(result).toHaveLength(1);
  });
});
