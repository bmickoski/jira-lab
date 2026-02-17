import { describe, it, expect } from "vitest";
import {
  IssueStatusSchema,
  CreateIssueInputSchema,
  IssuePatchSchema,
  PatchIssueInputSchema,
  BatchPatchInputSchema,
  ListIssuesInputSchema,
} from "../dist/index.js";

describe("IssueStatusSchema", () => {
  it("accepts valid status values", () => {
    const statuses = ["backlog", "todo", "in_progress", "done"] as const;
    for (const status of statuses) {
      const result = IssueStatusSchema.parse(status);
      expect(result).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    const result = IssueStatusSchema.safeParse("invalid_status");
    expect(result.success).toBe(false);
  });
});

describe("CreateIssueInputSchema", () => {
  it("accepts valid input with required fields only", () => {
    const result = CreateIssueInputSchema.parse({
      boardId: "board-123",
      title: "Fix the bug",
    });
    expect(result.boardId).toBe("board-123");
    expect(result.title).toBe("Fix the bug");
    expect(result.status).toBe("backlog"); // default
    expect(result.description).toBe(""); // default
    expect(result.watcherIds).toEqual([]); // default
  });

  it("accepts valid input with all fields", () => {
    const result = CreateIssueInputSchema.parse({
      boardId: "board-123",
      sprintId: "sprint-456",
      status: "in_progress",
      order: 1000,
      title: "Fix the bug",
      description: "Detailed description",
      assigneeId: "user-789",
      watcherIds: ["user-1", "user-2"],
    });
    expect(result.sprintId).toBe("sprint-456");
    expect(result.status).toBe("in_progress");
    expect(result.order).toBe(1000);
    expect(result.assigneeId).toBe("user-789");
    expect(result.watcherIds).toEqual(["user-1", "user-2"]);
  });

  it("rejects empty title", () => {
    const result = CreateIssueInputSchema.safeParse({
      boardId: "board-123",
      title: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("rejects title longer than 500 characters", () => {
    const result = CreateIssueInputSchema.safeParse({
      boardId: "board-123",
      title: "a".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title must be at most 500 characters");
    }
  });

  it("rejects empty boardId", () => {
    const result = CreateIssueInputSchema.safeParse({
      boardId: "",
      title: "Fix the bug",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Board ID is required");
    }
  });

  it("trims title whitespace", () => {
    const result = CreateIssueInputSchema.parse({
      boardId: "board-123",
      title: "  Fix the bug  ",
    });
    expect(result.title).toBe("Fix the bug");
  });

  it("accepts null sprintId", () => {
    const result = CreateIssueInputSchema.parse({
      boardId: "board-123",
      sprintId: null,
      title: "Fix the bug",
    });
    expect(result.sprintId).toBeNull();
  });

  it("accepts null assigneeId", () => {
    const result = CreateIssueInputSchema.parse({
      boardId: "board-123",
      title: "Fix the bug",
      assigneeId: null,
    });
    expect(result.assigneeId).toBeNull();
  });
});

describe("IssuePatchSchema", () => {
  it("accepts patch with single field", () => {
    const result = IssuePatchSchema.parse({ title: "New title" });
    expect(result.title).toBe("New title");
  });

  it("accepts patch with multiple fields", () => {
    const result = IssuePatchSchema.parse({
      title: "New title",
      status: "done",
      order: 500,
    });
    expect(result.title).toBe("New title");
    expect(result.status).toBe("done");
    expect(result.order).toBe(500);
  });

  it("rejects empty patch", () => {
    const result = IssuePatchSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Patch must contain at least one field to update"
      );
    }
  });

  it("accepts null sprintId for moving to backlog", () => {
    const result = IssuePatchSchema.parse({ sprintId: null });
    expect(result.sprintId).toBeNull();
  });

  it("accepts null assigneeId for unassigning", () => {
    const result = IssuePatchSchema.parse({ assigneeId: null });
    expect(result.assigneeId).toBeNull();
  });
});

describe("PatchIssueInputSchema", () => {
  it("accepts valid input", () => {
    const result = PatchIssueInputSchema.parse({
      id: "issue-123",
      patch: { title: "New title" },
    });
    expect(result.id).toBe("issue-123");
    expect(result.patch.title).toBe("New title");
  });

  it("rejects empty id", () => {
    const result = PatchIssueInputSchema.safeParse({
      id: "",
      patch: { title: "New title" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Issue ID is required");
    }
  });
});

describe("BatchPatchInputSchema", () => {
  it("accepts valid batch", () => {
    const result = BatchPatchInputSchema.parse([
      { id: "issue-1", patch: { status: "done" } },
      { id: "issue-2", patch: { status: "done" } },
    ]);
    expect(result).toHaveLength(2);
  });

  it("rejects empty batch", () => {
    const result = BatchPatchInputSchema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Batch must contain at least one patch");
    }
  });

  it("rejects batch larger than 100", () => {
    const batch = Array.from({ length: 101 }, (_, i) => ({
      id: `issue-${i}`,
      patch: { status: "done" as const },
    }));
    const result = BatchPatchInputSchema.safeParse(batch);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Batch cannot exceed 100 patches");
    }
  });
});

describe("ListIssuesInputSchema", () => {
  it("accepts valid input with boardId only", () => {
    const result = ListIssuesInputSchema.parse({
      boardId: "board-123",
    });
    expect(result.boardId).toBe("board-123");
    expect(result.sprintId).toBeUndefined();
  });

  it("accepts valid input with sprintId", () => {
    const result = ListIssuesInputSchema.parse({
      boardId: "board-123",
      sprintId: "sprint-456",
    });
    expect(result.sprintId).toBe("sprint-456");
  });

  it("accepts null sprintId", () => {
    const result = ListIssuesInputSchema.parse({
      boardId: "board-123",
      sprintId: null,
    });
    expect(result.sprintId).toBeNull();
  });

  it("rejects empty boardId", () => {
    const result = ListIssuesInputSchema.safeParse({
      boardId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Board ID is required");
    }
  });
});
