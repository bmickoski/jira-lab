/**
 * Zod schemas for authentication-related entities.
 * These schemas provide runtime validation and type inference for both
 * frontend forms and backend DTOs.
 *
 * @module auth/schemas
 */
import { z } from "zod";

/**
 * Schema for login form input.
 * Validates email format and ensures password is present.
 *
 * @example
 * const result = LoginInputSchema.parse({ email: "user@example.com", password: "secret" });
 */
export const LoginInputSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for registration form input.
 * Validates email format, name length, and password strength.
 *
 * @example
 * const result = RegisterInputSchema.parse({
 *   email: "user@example.com",
 *   name: "John Doe",
 *   password: "securePassword123"
 * });
 */
export const RegisterInputSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((email) => email.trim().toLowerCase()),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .transform((name) => name.trim()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

/**
 * Schema for authenticated user data returned from API.
 */
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

/**
 * Schema for authentication response containing JWT token and user data.
 */
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
