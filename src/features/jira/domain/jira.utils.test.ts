import { describe, it, expect } from "vitest";
import {
  parseDropStatus,
  normalizeOrders,
  canShowStatus,
  nextOrderForStatus,
} from "./jira.utils";
import type { Issue } from "./types";

const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: "issue-1",
  key: "BOARD-1",
  boardId: "board-1",
  sprintId: null,
  status: "todo",
  order: 1000,
  title: "Test issue",
  description: "",
  assigneeId: null,
  watcherIds: [],
  ...overrides,
});

describe("parseDropStatus", () => {
  it("extracts status from a valid status: prefixed id", () => {
    expect(parseDropStatus("status:todo")).toBe("todo");
    expect(parseDropStatus("status:in_progress")).toBe("in_progress");
    expect(parseDropStatus("status:done")).toBe("done");
    expect(parseDropStatus("status:backlog")).toBe("backlog");
  });

  it("returns null when id does not start with status:", () => {
    expect(parseDropStatus("issue-123")).toBeNull();
    expect(parseDropStatus("something-else")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseDropStatus(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDropStatus("")).toBeNull();
  });
});

describe("normalizeOrders", () => {
  it("reindexes order values in increments of 1000", () => {
    const issues = [
      makeIssue({ id: "a", order: 50 }),
      makeIssue({ id: "b", order: 999 }),
      makeIssue({ id: "c", order: 5000 }),
    ];

    const result = normalizeOrders(issues);

    expect(result[0].order).toBe(1000);
    expect(result[1].order).toBe(2000);
    expect(result[2].order).toBe(3000);
  });

  it("does not mutate the original array", () => {
    const issues = [makeIssue({ order: 50 })];
    const result = normalizeOrders(issues);

    expect(result).not.toBe(issues);
    expect(issues[0].order).toBe(50);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeOrders([])).toEqual([]);
  });

  it("handles single item", () => {
    const result = normalizeOrders([makeIssue({ order: 7 })]);
    expect(result[0].order).toBe(1000);
  });
});

describe("canShowStatus", () => {
  it("shows only backlog status in backlog view", () => {
    expect(canShowStatus("backlog", "backlog")).toBe(true);
    expect(canShowStatus("backlog", "todo")).toBe(false);
    expect(canShowStatus("backlog", "in_progress")).toBe(false);
    expect(canShowStatus("backlog", "done")).toBe(false);
  });

  it("shows all non-backlog statuses in sprint view", () => {
    expect(canShowStatus("sprint", "todo")).toBe(true);
    expect(canShowStatus("sprint", "in_progress")).toBe(true);
    expect(canShowStatus("sprint", "done")).toBe(true);
    expect(canShowStatus("sprint", "backlog")).toBe(false);
  });
});

describe("nextOrderForStatus", () => {
  it("returns max order + 1000 for the given status", () => {
    const issues = [
      makeIssue({ status: "todo", order: 1000 }),
      makeIssue({ status: "todo", order: 3000 }),
      makeIssue({ status: "done", order: 5000 }),
    ];

    expect(nextOrderForStatus(issues, "todo")).toBe(4000);
  });

  it("returns 1000 when no issues match the status", () => {
    const issues = [makeIssue({ status: "done", order: 2000 })];

    expect(nextOrderForStatus(issues, "todo")).toBe(1000);
  });

  it("returns 1000 for empty issues array", () => {
    expect(nextOrderForStatus([], "backlog")).toBe(1000);
  });
});
