import { Navigate, Route, Routes } from "react-router-dom";
import { BoardsPage } from "./app/routes/BoardsPage";
import { BoardPage } from "./app/routes/BoardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boards" replace />} />
      <Route path="/boards" element={<BoardsPage />} />

      {/* Backlog (no sprint) */}
      <Route path="/boards/:boardId/backlog" element={<BoardPage />} />

      {/* Sprint board */}
      <Route
        path="/boards/:boardId/sprints/:sprintId"
        element={<BoardPage />}
      />

      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Routes>
  );
}
