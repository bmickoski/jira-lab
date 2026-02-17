/**
 * @jira-lab/shared
 *
 * Shared Zod schemas for full-stack type safety.
 * This package provides runtime validation schemas used by both
 * the frontend (React forms) and backend (NestJS DTOs).
 *
 * @example
 * // Import schemas for form validation
 * import { LoginInputSchema, RegisterInputSchema } from '@jira-lab/shared';
 *
 * @example
 * // Import types with Zod inference
 * import type { LoginInput, Issue } from '@jira-lab/shared';
 */

// Auth schemas
export {
  LoginInputSchema,
  RegisterInputSchema,
  AuthUserSchema,
  AuthResponseSchema,
  type LoginInput,
  type RegisterInput,
  type AuthUser,
  type AuthResponse,
} from "./auth/schemas.js";

// Board schemas
export {
  BoardSchema,
  CreateBoardInputSchema,
  type Board,
  type CreateBoardInput,
} from "./boards/schemas.js";

// Sprint schemas
export {
  SprintSchema,
  CreateSprintInputSchema,
  SetActiveSprintInputSchema,
  MoveIssueInputSchema,
  type Sprint,
  type CreateSprintInput,
  type SetActiveSprintInput,
  type MoveIssueInput,
} from "./sprints/schemas.js";

// Issue schemas
export {
  IssueStatusSchema,
  IssueSchema,
  CreateIssueInputSchema,
  IssuePatchSchema,
  PatchIssueInputSchema,
  BatchPatchInputSchema,
  ListIssuesInputSchema,
  type IssueStatus,
  type Issue,
  type CreateIssueInput,
  type IssuePatch,
  type PatchIssueInput,
  type BatchPatchInput,
  type ListIssuesInput,
} from "./issues/schemas.js";
