/**
 * Zod schemas for board-related entities.
 * These schemas provide runtime validation and type inference for both
 * frontend forms and backend DTOs.
 *
 * @module boards/schemas
 */
import { z } from "zod";

/**
 * Schema for Board entity as returned from API.
 */
export const BoardSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  userId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Schema for creating a new board.
 * Validates board name length and trims whitespace.
 *
 * @example
 * const result = CreateBoardInputSchema.parse({ name: "My Project Board" });
 */
export const CreateBoardInputSchema = z.object({
  name: z
    .string()
    .min(1, "Board name is required")
    .max(100, "Board name must be at most 100 characters")
    .transform((name) => name.trim()),
});

// Type exports for TypeScript
export type Board = z.infer<typeof BoardSchema>;
export type CreateBoardInput = z.infer<typeof CreateBoardInputSchema>;
