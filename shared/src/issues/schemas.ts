/**
 * Zod schemas for issue-related entities.
 * These schemas provide runtime validation and type inference for both
 * frontend forms and backend DTOs.
 *
 * @module issues/schemas
 */
import { z } from "zod";

/**
 * Schema for issue status enum.
 * Matches the Prisma IssueStatus enum.
 */
export const IssueStatusSchema = z.enum(["backlog", "todo", "in_progress", "done"]);

/**
 * Schema for Issue entity as returned from API.
 */
export const IssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  boardId: z.string(),
  sprintId: z.string().nullable(),
  status: IssueStatusSchema,
  order: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000),
  assigneeId: z.string().nullable(),
  watcherIds: z.array(z.string()),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new issue.
 * Validates all required fields and applies transformations.
 *
 * @example
 * const result = CreateIssueInputSchema.parse({
 *   boardId: "board-123",
 *   title: "Fix the bug",
 *   status: "todo"
 * });
 */
export const CreateIssueInputSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  sprintId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? null),
  status: IssueStatusSchema.default("backlog"),
  order: z.number().int().nonnegative().default(0),
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be at most 500 characters")
    .transform((title) => title.trim()),
  description: z.string().max(10000, "Description must be at most 10000 characters").default(""),
  assigneeId: z.string().nullable().optional(),
  watcherIds: z.array(z.string()).optional().default([]),
});

/**
 * Schema for the patch object within PatchIssueInput.
 * At least one field must be present.
 */
export const IssuePatchSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(500, "Title must be at most 500 characters")
      .optional(),
    description: z.string().max(10000, "Description must be at most 10000 characters").optional(),
    status: IssueStatusSchema.optional(),
    order: z.number().int().nonnegative().optional(),
    sprintId: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    watcherIds: z.array(z.string()).optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Patch must contain at least one field to update",
  });

/**
 * Schema for patching a single issue.
 *
 * @example
 * const result = PatchIssueInputSchema.parse({
 *   id: "issue-123",
 *   patch: { title: "Updated title" }
 * });
 */
export const PatchIssueInputSchema = z.object({
  id: z.string().min(1, "Issue ID is required"),
  patch: IssuePatchSchema,
});

/**
 * Schema for batch patching multiple issues.
 * Limits batch size to prevent performance issues.
 *
 * @example
 * const result = BatchPatchInputSchema.parse([
 *   { id: "issue-1", patch: { status: "done" } },
 *   { id: "issue-2", patch: { status: "done" } }
 * ]);
 */
export const BatchPatchInputSchema = z
  .array(PatchIssueInputSchema)
  .min(1, "Batch must contain at least one patch")
  .max(100, "Batch cannot exceed 100 patches");

/**
 * Schema for listing issues with optional filters.
 */
export const ListIssuesInputSchema = z.object({
  boardId: z.string().min(1, "Board ID is required"),
  sprintId: z.string().optional().nullable(),
});

// Type exports for TypeScript
export type IssueStatus = z.infer<typeof IssueStatusSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type CreateIssueInput = z.infer<typeof CreateIssueInputSchema>;
export type IssuePatch = z.infer<typeof IssuePatchSchema>;
export type PatchIssueInput = z.infer<typeof PatchIssueInputSchema>;
export type BatchPatchInput = z.infer<typeof BatchPatchInputSchema>;
export type ListIssuesInput = z.infer<typeof ListIssuesInputSchema>;
