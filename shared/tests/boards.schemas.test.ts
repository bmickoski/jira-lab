import { describe, it, expect } from "vitest";
import {
  BoardSchema,
  CreateBoardInputSchema,
} from "../dist/index.js";

describe("BoardSchema", () => {
  it("accepts valid board object with required fields", () => {
    const result = BoardSchema.parse({
      id: "board-123",
      name: "My Project Board",
    });
    expect(result.id).toBe("board-123");
    expect(result.name).toBe("My Project Board");
  });

  it("accepts valid board object with all fields", () => {
    const result = BoardSchema.parse({
      id: "board-123",
      name: "My Project Board",
      userId: "user-456",
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-16T14:20:00.000Z",
    });
    expect(result.userId).toBe("user-456");
    expect(result.createdAt).toBe("2024-01-15T10:30:00.000Z");
    expect(result.updatedAt).toBe("2024-01-16T14:20:00.000Z");
  });

  it("rejects board with empty name", () => {
    const result = BoardSchema.safeParse({
      id: "board-123",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects board with name longer than 100 characters", () => {
    const result = BoardSchema.safeParse({
      id: "board-123",
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects board without id", () => {
    const result = BoardSchema.safeParse({
      name: "My Project Board",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format for createdAt", () => {
    const result = BoardSchema.safeParse({
      id: "board-123",
      name: "My Project Board",
      createdAt: "not-a-datetime",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateBoardInputSchema", () => {
  it("accepts valid board name", () => {
    const result = CreateBoardInputSchema.parse({
      name: "My New Board",
    });
    expect(result.name).toBe("My New Board");
  });

  it("rejects empty board name", () => {
    const result = CreateBoardInputSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Board name is required");
    }
  });

  it("rejects whitespace-only board name", () => {
    const result = CreateBoardInputSchema.safeParse({
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Board name is required");
    }
  });

  it("rejects board name longer than 100 characters", () => {
    const result = CreateBoardInputSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Board name must be at most 100 characters",
      );
    }
  });

  it("trims whitespace from board name", () => {
    const result = CreateBoardInputSchema.parse({
      name: "  My New Board  ",
    });
    expect(result.name).toBe("My New Board");
  });

  it("accepts board name with exactly 100 characters", () => {
    const result = CreateBoardInputSchema.parse({
      name: "a".repeat(100),
    });
    expect(result.name).toHaveLength(100);
  });

  it("rejects missing name field", () => {
    const result = CreateBoardInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});