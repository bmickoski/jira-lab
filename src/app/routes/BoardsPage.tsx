import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJiraStore } from "@/features/jira/store";

export default function BoardsPage() {
  const nav = useNavigate();

  const boards = useJiraStore((s) => s.boards);
  const sprints = useJiraStore((s) => s.sprints);

  const createBoard = useJiraStore((s) => s.createBoard);
  const resetDemoData = useJiraStore((s) => s.resetDemoData);

  const [name, setName] = useState("");

  const rows = useMemo(() => {
    return boards.map((b) => {
      const active = sprints.find((sp) => sp.boardId === b.id && sp.isActive);
      return { board: b, activeSprint: active };
    });
  }, [boards, sprints]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Boards</h1>
            <p className="mt-2 text-white/70">
              Choose a board → backlog or active sprint board.
            </p>
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            Reset demo data
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New board name…"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
          />

          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => {
              const b = createBoard(name);
              setName("");
              nav(`/boards/${b.id}/backlog`);
            }}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
          >
            Create board
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rows.map(({ board, activeSprint }) => (
            <div
              key={board.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-sm text-white/60">{board.id}</div>
              <div className="mt-1 text-xl font-semibold">{board.name}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => nav(`/boards/${board.id}/backlog`)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Backlog
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeSprint)
                      nav(`/boards/${board.id}/sprints/${activeSprint.id}`);
                    else nav(`/boards/${board.id}/backlog`);
                  }}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                >
                  {activeSprint
                    ? `Open ${activeSprint.name}`
                    : "No active sprint"}
                </button>
              </div>

              <div className="mt-3 text-xs text-white/60">
                Active sprint: {activeSprint?.name ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
