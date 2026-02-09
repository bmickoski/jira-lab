import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazyWithPreload } from "@/shared/utils/lazyWithPreload";
import { RouteFallback } from "@/features/jira/ui";

const BoardsPage = lazyWithPreload(() => import("@/app/routes/BoardsPage"));
const BoardPage = lazyWithPreload(() => import("@/app/routes/BoardPage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/boards" replace />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/:boardId/backlog" element={<BoardPage />} />
        <Route
          path="/boards/:boardId/sprints/:sprintId"
          element={<BoardPage />}
        />
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Routes>
    </Suspense>
  );
}
