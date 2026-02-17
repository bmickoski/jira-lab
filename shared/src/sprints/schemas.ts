/**
 * Zod schemas for sprint-related entities.
 * These schemas provide runtime validation and type inference for both
 * frontend forms and backend DTOs.
 *
 * @module sprints/schemas
 */
import { z } from "zod";

/**
 * Schema for Sprint entity as returned from API.
 */
export const SprintSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string().min(1).max(100),
  isActive: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new sprint.
 * Validates sprint name length and trims whitespace.
 *
 * @example
 * const result = CreateSprintInputSchema.parse({ name: "Sprint 1", isActive: true });
 */
export const CreateSprintInputSchema = z.object({
  name: z
    .string()
    .min(1, "Sprint name is required")
    .max(100, "Sprint name must be at most 100 characters")
    .transform((name) => name.trim()),
  isActive: z.boolean().optional().default(false),
});

/**
 * Schema for setting the active sprint on a board.
 *
 * @example
 * const result = SetActiveSprintInputSchema.parse({ sprintId: "abc123" });
 */
export const SetActiveSprintInputSchema = z.object({
  sprintId: z.string().min(1, "Sprint ID is required"),
});

/**
 * Schema for moving an issue between sprints.
 *
 * @example
 * const result = MoveIssueInputSchema.parse({ sprintId: "sprint-123" });
 */
export const MoveIssueInputSchema = z.object({
  sprintId: z.string().nullable(),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
  order: z.number().int().nonnegative().optional(),
});

// Type exports for TypeScript
export type Sprint = z.infer<typeof SprintSchema>;
export type CreateSprintInput = z.infer<typeof CreateSprintInputSchema>;
export type SetActiveSprintInput = z.infer<typeof SetActiveSprintInputSchema>;
export type MoveIssueInput = z.infer<typeof MoveIssueInputSchema>;
