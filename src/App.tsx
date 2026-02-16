import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazyWithPreload } from "@/shared/utils/lazyWithPreload";
import { RouteFallback } from "@/features/jira/ui";
import { useAuthStore } from "@/features/auth/authStore";

const BoardsPage = lazyWithPreload(() => import("@/app/routes/BoardsPage"));
const BoardPage = lazyWithPreload(() => import("@/app/routes/BoardPage"));
const LoginPage = lazyWithPreload(() => import("@/app/routes/LoginPage"));
const RegisterPage = lazyWithPreload(() => import("@/app/routes/RegisterPage"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/boards" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route path="/" element={<Navigate to="/boards" replace />} />
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <BoardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:boardId/backlog"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:boardId/sprints/:sprintId"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Routes>
    </Suspense>
  );
}
