import { Navigate, Route, Routes } from "react-router-dom";
import { DemoPage } from "./demo/DemoPage";

export default function App() {
  return (
    <Routes>
      {/* Send root to tasks */}
      <Route path="/" element={<Navigate to="/tasks" replace />} />

      {/* Taskboard supports optional route param */}
      <Route path="/tasks" element={<DemoPage />}>
        <Route path=":taskId" element={<DemoPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}
