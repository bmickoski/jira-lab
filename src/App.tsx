import { Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "./demo/BoardPage";
import { BoardsPage } from "./demo/BoardsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boards" replace />} />
      <Route path="/boards" element={<BoardsPage />} />

      {/* Backlog (no sprint) */}
      <Route path="/boards/:boardId/backlog" element={<BoardPage mode="backlog" />} />

      {/* Sprint board */}
      <Route path="/boards/:boardId/sprints/:sprintId" element={<BoardPage mode="sprint" />} />

      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Routes>
  );
}
