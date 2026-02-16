import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/features/auth/auth.client";
import { useAuthStore } from "@/features/auth/authStore";
import { ColdStartWarning } from "@/components/ColdStartWarning";

export default function RegisterPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    try {
      const { token, user } = await authClient.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setAuth(token, user);
      nav("/boards", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-white/60">
          Get started with Jira Lab.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-white/70">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="Your name"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="Min. 6 characters"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading && <ColdStartWarning />}

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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/login" className="text-white/80 hover:text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
