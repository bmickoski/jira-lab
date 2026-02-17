import { describe, it, expect } from "vitest";
import {
  SprintSchema,
  CreateSprintInputSchema,
  SetActiveSprintInputSchema,
  MoveIssueInputSchema,
} from "../dist/index.js";

describe("SprintSchema", () => {
  it("accepts valid sprint object with required fields", () => {
    const result = SprintSchema.parse({
      id: "sprint-123",
      boardId: "board-456",
      name: "Sprint 1",
      isActive: true,
    });
    expect(result.id).toBe("sprint-123");
    expect(result.boardId).toBe("board-456");
    expect(result.name).toBe("Sprint 1");
    expect(result.isActive).toBe(true);
  });

  it("accepts valid sprint object with all fields", () => {
    const result = SprintSchema.parse({
      id: "sprint-123",
      boardId: "board-456",
      name: "Sprint 1",
      isActive: false,
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-16T14:20:00.000Z",
    });
    expect(result.isActive).toBe(false);
    expect(result.createdAt).toBe("2024-01-15T10:30:00.000Z");
    expect(result.updatedAt).toBe("2024-01-16T14:20:00.000Z");
  });

  it("rejects sprint with empty name", () => {
    const result = SprintSchema.safeParse({
      id: "sprint-123",
      boardId: "board-456",
      name: "",
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sprint with name longer than 100 characters", () => {
    const result = SprintSchema.safeParse({
      id: "sprint-123",
      boardId: "board-456",
      name: "a".repeat(101),
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sprint without id", () => {
    const result = SprintSchema.safeParse({
      boardId: "board-456",
      name: "Sprint 1",
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sprint without boardId", () => {
    const result = SprintSchema.safeParse({
      id: "sprint-123",
      name: "Sprint 1",
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sprint with non-boolean isActive", () => {
    const result = SprintSchema.safeParse({
      id: "sprint-123",
      boardId: "board-456",
      name: "Sprint 1",
      isActive: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format for createdAt", () => {
    const result = SprintSchema.safeParse({
      id: "sprint-123",
      boardId: "board-456",
      name: "Sprint 1",
      isActive: true,
      createdAt: "not-a-datetime",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateSprintInputSchema", () => {
  it("accepts valid sprint name with defaults", () => {
    const result = CreateSprintInputSchema.parse({
      name: "Sprint 1",
    });
    expect(result.name).toBe("Sprint 1");
    expect(result.isActive).toBe(false); // default
  });

  it("accepts valid sprint name with isActive true", () => {
    const result = CreateSprintInputSchema.parse({
      name: "Sprint 1",
      isActive: true,
    });
    expect(result.isActive).toBe(true);
  });

  it("rejects empty sprint name", () => {
    const result = CreateSprintInputSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sprint name is required");
    }
  });

  it("rejects whitespace-only sprint name", () => {
    const result = CreateSprintInputSchema.safeParse({
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sprint name is required");
    }
  });

  it("rejects sprint name longer than 100 characters", () => {
    const result = CreateSprintInputSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sprint name must be at most 100 characters");
    }
  });

  it("trims whitespace from sprint name", () => {
    const result = CreateSprintInputSchema.parse({
      name: "  Sprint 1  ",
    });
    expect(result.name).toBe("Sprint 1");
  });

  it("accepts sprint name with exactly 100 characters", () => {
    const result = CreateSprintInputSchema.parse({
      name: "a".repeat(100),
    });
    expect(result.name).toHaveLength(100);
  });

  it("rejects missing name field", () => {
    const result = CreateSprintInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("SetActiveSprintInputSchema", () => {
  it("accepts valid sprint id", () => {
    const result = SetActiveSprintInputSchema.parse({
      sprintId: "sprint-123",
    });
    expect(result.sprintId).toBe("sprint-123");
  });

  it("rejects empty sprint id", () => {
    const result = SetActiveSprintInputSchema.safeParse({
      sprintId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Sprint ID is required");
    }
  });

  it("rejects missing sprintId field", () => {
    const result = SetActiveSprintInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("MoveIssueInputSchema", () => {
  it("accepts valid input with sprintId only", () => {
    const result = MoveIssueInputSchema.parse({
      sprintId: "sprint-123",
    });
    expect(result.sprintId).toBe("sprint-123");
    expect(result.status).toBeUndefined();
    expect(result.order).toBeUndefined();
  });

  it("accepts valid input with all fields", () => {
    const result = MoveIssueInputSchema.parse({
      sprintId: "sprint-123",
      status: "in_progress",
      order: 500,
    });
    expect(result.sprintId).toBe("sprint-123");
    expect(result.status).toBe("in_progress");
    expect(result.order).toBe(500);
  });

  it("accepts null sprintId for moving to backlog", () => {
    const result = MoveIssueInputSchema.parse({
      sprintId: null,
    });
    expect(result.sprintId).toBeNull();
  });

  it("accepts valid status values", () => {
    const statuses = ["backlog", "todo", "in_progress", "done"] as const;
    for (const status of statuses) {
      const result = MoveIssueInputSchema.parse({
        sprintId: null,
        status,
      });
      expect(result.status).toBe(status);
    }
  });

  it("rejects invalid status", () => {
    const result = MoveIssueInputSchema.safeParse({
      sprintId: "sprint-123",
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative order", () => {
    const result = MoveIssueInputSchema.safeParse({
      sprintId: "sprint-123",
      order: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer order", () => {
    const result = MoveIssueInputSchema.safeParse({
      sprintId: "sprint-123",
      order: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero order", () => {
    const result = MoveIssueInputSchema.parse({
      sprintId: "sprint-123",
      order: 0,
    });
    expect(result.order).toBe(0);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = MoveIssueInputSchema.parse({});
    expect(result.sprintId).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.order).toBeUndefined();
  });
});
