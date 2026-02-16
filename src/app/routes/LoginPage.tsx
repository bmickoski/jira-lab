import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/features/auth/auth.client";
import { useAuthStore } from "@/features/auth/authStore";

export default function LoginPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim() && password && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    try {
      const { token, user } = await authClient.login({
        email: email.trim(),
        password,
      });
      setAuth(token, user);
      nav("/boards", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-white/60">
          Welcome back to Jira Lab.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="Your password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "w-full rounded-xl border border-white/15 px-3 py-2.5 text-sm font-medium",
              canSubmit
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-white/5 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-white/80 hover:text-white underline">
            Create one
          </Link>
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-medium text-white/50">Demo credentials</p>
          <p className="mt-1 text-sm text-white/70">
            <span className="text-white/90">demo@jiralab.dev</span>
            {" / "}
            <span className="text-white/90">demo123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
