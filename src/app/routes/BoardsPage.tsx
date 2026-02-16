import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoards, useCreateBoard, useSprints } from "@/features/jira/api";
import { useAuthStore } from "@/features/auth/authStore";
import { queryClient } from "@/app/providers/queryClient";

function BoardCard({ board }: { board: { id: string; name: string } }) {
  const nav = useNavigate();
  const { data: sprints = [], isLoading } = useSprints(board.id);

  const activeSprint = useMemo(
    () => sprints.find((sp) => sp.isActive) ?? null,
    [sprints],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
          disabled={isLoading || !activeSprint}
          onClick={() => {
            if (activeSprint)
              nav(`/boards/${board.id}/sprints/${activeSprint.id}`);
          }}
          className={[
            "rounded-xl border border-white/15 px-3 py-2 text-sm",
            activeSprint
              ? "bg-white/10 text-white hover:bg-white/15"
              : "bg-white/5 text-white/40 cursor-not-allowed",
          ].join(" ")}
        >
          {isLoading
            ? "Loading sprint…"
            : activeSprint
              ? `Open ${activeSprint.name}`
              : "No active sprint"}
        </button>
      </div>

      <div className="mt-3 text-xs text-white/60">
        Active sprint: {activeSprint?.name ?? "—"}
      </div>
    </div>
  );
}

export default function BoardsPage() {
  const nav = useNavigate();
  const { data: boards = [], isLoading, isError, error } = useBoards();
  const createBoard = useCreateBoard();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState("");

  const handleLogout = () => {
    logout();
    queryClient.clear();
    nav("/login", { replace: true });
  };

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

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">
              {user?.name ?? user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
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
            disabled={!name.trim() || createBoard.isPending}
            onClick={() => {
              const n = name.trim();
              if (!n) return;

              createBoard.mutate(
                { name: n },
                {
                  onSuccess: (b) => {
                    setName("");
                    nav(`/boards/${b.id}/backlog`);
                  },
                },
              );
            }}
            className={[
              "rounded-xl border border-white/15 px-3 py-2 text-sm",
              name.trim()
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-white/5 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            {createBoard.isPending ? "Creating…" : "Create board"}
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            Loading boards…
          </div>
        ) : isError ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            Failed to load boards: {String((error as Error)?.message ?? "")}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {boards.map((b) => (
              <BoardCard key={b.id} board={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
