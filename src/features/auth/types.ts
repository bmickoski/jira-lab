export type AuthUser = { id: string; email: string; name: string };
export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; name: string; password: string };
export type AuthResponse = { token: string; user: AuthUser };
