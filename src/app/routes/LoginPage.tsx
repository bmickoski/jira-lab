import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/features/auth/auth.client";
import { useAuthStore } from "@/features/auth/authStore";
import { ColdStartWarning } from "@/components/ColdStartWarning";
import { toast } from "@/stores/toastStore";
import { LoginInputSchema, type LoginInput } from "@jira-lab/shared";

export default function LoginPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const canSubmit = isValid && !loading;

  const onSubmit = async (data: LoginInput) => {
    setError("");
    setLoading(true);

    try {
      const { token, user } = await authClient.login(data);
      setAuth(token, user);
      nav("/boards", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-white/60">Welcome back to Jira Lab.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/70">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
              placeholder="Your password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
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
