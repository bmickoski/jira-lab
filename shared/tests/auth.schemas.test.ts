import { describe, it, expect } from "vitest";
import {
  LoginInputSchema,
  RegisterInputSchema,
  AuthUserSchema,
  AuthResponseSchema,
} from "../dist/index.js";

describe("LoginInputSchema", () => {
  it("accepts valid input", () => {
    const result = LoginInputSchema.parse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result).toEqual({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("rejects invalid email", () => {
    const result = LoginInputSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email format");
    }
  });

  it("rejects empty email", () => {
    const result = LoginInputSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email is required");
    }
  });

  it("rejects empty password", () => {
    const result = LoginInputSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });

  it("trims and lowercases email", () => {
    const result = LoginInputSchema.parse({
      email: "  TEST@EXAMPLE.COM  ",
      password: "password123",
    });
    expect(result.email).toBe("test@example.com");
  });
});

describe("RegisterInputSchema", () => {
  it("accepts valid input", () => {
    const result = RegisterInputSchema.parse({
      email: "test@example.com",
      name: "John Doe",
      password: "password123",
    });
    expect(result).toEqual({
      email: "test@example.com",
      name: "John Doe",
      password: "password123",
    });
  });

  it("rejects password shorter than 6 characters", () => {
    const result = RegisterInputSchema.safeParse({
      email: "test@example.com",
      name: "John Doe",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 6 characters");
    }
  });

  it("rejects empty name", () => {
    const result = RegisterInputSchema.safeParse({
      email: "test@example.com",
      name: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = RegisterInputSchema.safeParse({
      email: "test@example.com",
      name: "a".repeat(101),
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name must be at most 100 characters");
    }
  });

  it("trims name whitespace", () => {
    const result = RegisterInputSchema.parse({
      email: "test@example.com",
      name: "  John Doe  ",
      password: "password123",
    });
    expect(result.name).toBe("John Doe");
  });
});

describe("AuthUserSchema", () => {
  it("accepts valid user object", () => {
    const result = AuthUserSchema.parse({
      id: "user-123",
      email: "test@example.com",
      name: "John Doe",
    });
    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
      name: "John Doe",
    });
  });

  it("rejects invalid email", () => {
    const result = AuthUserSchema.safeParse({
      id: "user-123",
      email: "not-an-email",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("AuthResponseSchema", () => {
  it("accepts valid response", () => {
    const result = AuthResponseSchema.parse({
      token: "jwt-token-here",
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "John Doe",
      },
    });
    expect(result.token).toBe("jwt-token-here");
    expect(result.user.email).toBe("test@example.com");
  });
});
