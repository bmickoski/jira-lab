import type { AuthResponse, LoginInput, RegisterInput } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function authFetch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      message = text;
    }
    throw new Error(message);
  }

  return res.json();
}

export const authClient = {
  login(input: LoginInput) {
    return authFetch<AuthResponse>("/auth/login", input);
  },

  register(input: RegisterInput) {
    return authFetch<AuthResponse>("/auth/register", input);
  },
};
