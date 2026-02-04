import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task } from "./taskboardTypes";

import { searchPeople, getPeopleDataset } from "./search";
import { EntityPicker, type EntityBase } from "../components/EntityPicker";
import { EntityMultiPicker } from "../components/EntityMultiPicker";
import type { Person } from "../data/mockPeople";
import { buildPersonIndex } from "../data/peopleIndex";
import { useTaskboardStore } from "./taskboardStore";

type PersonEntity = EntityBase & { raw: Person };

// --- Kanban model (kept local to this file) ---
type TaskStatus = "backlog" | "todo" | "in_progress" | "done";

const STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "done"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

function getStatus(t: Task): TaskStatus {
  const s = (t as any).status as TaskStatus | undefined;
  if (s && STATUS_ORDER.includes(s)) return s;
  return "todo"; // default for older persisted tasks
}

function setStatusPatch(status: TaskStatus): Partial<Task> {
  // If your Task type doesn’t include status yet, this still works at runtime.
  return { ...({ status } as any) };
}

function makeInitialTasks(): Task[] {
  return [
    {
      id: "T-1001",
      title: "Add virtualization to user picker",
      description:
        "When results are huge, render only visible rows. Keep keyboard UX smooth.",
      assigneeId: null,
      watcherIds: [],
      ...(setStatusPatch("todo") as any),
    },
    {
      id: "T-1002",
      title: "Improve create-row UX",
      description:
        'Show "Create …" when no results match and minChars is satisfied.',
      assigneeId: null,
      watcherIds: [],
      ...(setStatusPatch("backlog") as any),
    },
    {
      id: "T-1003",
      title: "Ship Storybook catalog",
      description:
        "Document states: disabled, custom item renderer, maxSelected, big dataset.",
      assigneeId: null,
      watcherIds: [],
      ...(setStatusPatch("in_progress") as any),
    },
  ];
}

function getNextTaskId(): string {
  const KEY = "entity-picker-lab:nextTaskNumber";
  const current = Number(localStorage.getItem(KEY) ?? "1004");
  localStorage.setItem(KEY, String(current + 1));
  return `T-${current}`;
}

export function TaskBoard(props: {
  tasks: Task[];
  activeTask: Task | null;
  onSelectTask: (id: string) => void;
  virtualize: boolean;
  useBig: boolean;
}) {
  const tasks = props.tasks;

  const activeId = props.activeTask?.id ?? "";
  const activeTask = props.activeTask;

  const addTaskToStore = useTaskboardStore((s) => s.addTask);
  const updateTaskInStore = useTaskboardStore((s) => s.updateTask);
  const deleteTaskFromStore = useTaskboardStore((s) => s.deleteTask);
  const resetTasksInStore = useTaskboardStore((s) => s.resetTasks);

  // New task UI
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [undo, setUndo] = useState<{
    task: Task;
    index: number;
    prevActiveId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), 6000);
    return () => window.clearTimeout(t);
  }, [undo]);

  const mapPerson = useCallback((p: Person): PersonEntity => {
    return { id: p.id, label: p.fullName, subLabel: p.email, raw: p };
  }, []);

  const search = useCallback(
    async (q: string, signal?: AbortSignal): Promise<PersonEntity[]> => {
      const res = await searchPeople(q, signal, props.useBig);
      return res.map(mapPerson);
    },
    [mapPerson, props.useBig],
  );

  const personIndex = useMemo(() => {
    const data = getPeopleDataset(props.useBig);
    return buildPersonIndex(data);
  }, [props.useBig]);

  const toEntity = useCallback(
    (id: string | number): PersonEntity => {
      const p = personIndex.byId.get(String(id));
      if (p) return mapPerson(p);

      return {
        id,
        label: `User ${String(id)}`,
        subLabel: undefined,
        raw: {
          id: Number(id),
          fullName: `User ${String(id)}`,
          email: undefined,
        },
      };
    },
    [personIndex, mapPerson],
  );

  const assigneeEntity = useMemo<PersonEntity | null>(() => {
    const id = activeTask?.assigneeId;
    return id == null ? null : toEntity(id);
  }, [activeTask?.assigneeId, toEntity]);

  const watchersEntities = useMemo<PersonEntity[]>(() => {
    return (activeTask?.watcherIds ?? []).map(toEntity);
  }, [activeTask?.watcherIds, toEntity]);

  function updateTask(next: Partial<Task>) {
    const id = activeTask?.id;
    if (!id) return;
    updateTaskInStore(id, next);
  }

  function resetDemo() {
    const init = makeInitialTasks();
    resetTasksInStore(init);

    localStorage.setItem("entity-picker-lab:nextTaskNumber", "1004");

    setCreating(false);
    setNewTitle("");
    setNewDesc("");

    if (init[0]?.id) props.onSelectTask(init[0].id);
  }

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;

    const task: Task = {
      id: getNextTaskId(),
      title,
      description: newDesc.trim() || "—",
      assigneeId: null,
      watcherIds: [],
      ...(setStatusPatch("todo") as any),
    };

    addTaskToStore(task);
    props.onSelectTask(task.id);

    setCreating(false);
    setNewTitle("");
    setNewDesc("");
  }

  function deleteTask(id: string) {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const task = tasks[idx];
    const next = tasks.filter((t) => t.id !== id);

    setUndo({
      task,
      index: idx,
      prevActiveId: props.activeTask?.id ?? null,
    });

    deleteTaskFromStore(id);

    // If deleting the active one, pick a safe fallback
    if (props.activeTask?.id === id) {
      const fallback =
        next[idx]?.id ?? next[idx - 1]?.id ?? next[0]?.id ?? null;
      if (fallback) props.onSelectTask(fallback);
    }
  }

  function undoDelete() {
    if (!undo) return;

    // if already exists, ignore
    if (tasks.some((t) => t.id === undo.task.id)) {
      setUndo(null);
      return;
    }

    addTaskToStore(undo.task);
    props.onSelectTask(undo.task.id);
    setUndo(null);
  }

  // ---- Kanban grouping ----
  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const t of tasks) map.get(getStatus(t))!.push(t);

    // optional: stable ordering
    for (const s of STATUS_ORDER) {
      map.get(s)!.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    return map;
  }, [tasks]);

  function moveTask(id: string, dir: -1 | 1) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

    const current = getStatus(t);
    const i = STATUS_ORDER.indexOf(current);
    const next = STATUS_ORDER[i + dir];
    if (!next) return;

    updateTaskInStore(id, setStatusPatch(next));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(560px,1fr)_minmax(360px,520px)] lg:items-start">
      {/* Board */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm text-white/60">Board</div>
            <div className="text-lg font-semibold text-white">Demo Kanban</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              New task
            </button>

            <button
              type="button"
              onClick={resetDemo}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        {creating && (
          <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={addTask}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Kanban columns */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const col = tasksByStatus.get(status) ?? [];
            return (
              <div
                key={status}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">
                    {STATUS_LABEL[status]}
                  </div>
                  <div className="text-xs text-white/60">{col.length}</div>
                </div>

                <div className="space-y-2">
                  {col.map((t) => {
                    const isActive = t.id === activeId;
                    return (
                      <div
                        key={t.id}
                        className={[
                          "relative rounded-xl border bg-black/20",
                          isActive
                            ? "border-white/25 bg-white/10"
                            : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                          aria-label={`Delete ${t.id}`}
                        >
                          ✕
                        </button>

                        <button
                          type="button"
                          onClick={() => props.onSelectTask(t.id)}
                          className="w-full rounded-xl px-3 py-3 pr-12 text-left hover:bg-white/5"
                        >
                          <div className="flex items-center justify-between gap-2 pr-2">
                            <div className="text-xs text-white/60">{t.id}</div>
                            <div className="text-xs text-white/50">
                              {t.watcherIds?.length ?? 0} watcher
                              {(t.watcherIds?.length ?? 0) === 1 ? "" : "s"}
                            </div>
                          </div>

                          <div className="mt-1">
                            <div className="font-medium text-white">
                              {t.title}
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm text-white/60">
                              {t.description}
                            </div>
                          </div>
                        </button>

                        {/* Move controls */}
                        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => moveTask(t.id, -1)}
                            disabled={STATUS_ORDER.indexOf(getStatus(t)) === 0}
                            className={[
                              "rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                              STATUS_ORDER.indexOf(getStatus(t)) === 0
                                ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                                : "cursor-pointer",
                            ].join(" ")}
                          >
                            ←
                          </button>

                          <div className="text-[11px] text-white/50">
                            {STATUS_LABEL[getStatus(t)]}
                          </div>

                          <button
                            type="button"
                            onClick={() => moveTask(t.id, +1)}
                            disabled={
                              STATUS_ORDER.indexOf(getStatus(t)) ===
                              STATUS_ORDER.length - 1
                            }
                            className={[
                              "rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                              STATUS_ORDER.indexOf(getStatus(t)) ===
                              STATUS_ORDER.length - 1
                                ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                                : "cursor-pointer",
                            ].join(" ")}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {col.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-4 text-center text-xs text-white/50">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details panel */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {!activeTask ? (
          <div className="text-white/70">Select a task</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/60">{activeTask.id}</div>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {activeTask.title}
                </h2>
                <p className="mt-2 max-w-3xl text-white/70">
                  {activeTask.description}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                <div>Virtualize: {String(props.virtualize)}</div>
                <div>Dataset: {props.useBig ? "10,000" : "Small"}</div>
                <div>Status: {STATUS_LABEL[getStatus(activeTask)]}</div>
              </div>
            </div>

            {/* Status quick change */}
            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold text-white/90">
                Status
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => {
                  const active = getStatus(activeTask) === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateTask(setStatusPatch(s))}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm",
                        active
                          ? "border-white/25 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 text-sm font-semibold text-white">
                  Assignee
                </div>

                <EntityPicker<PersonEntity>
                  label="Assign to"
                  placeholder="Search people…"
                  value={assigneeEntity}
                  onChange={(next) =>
                    updateTask({ assigneeId: next?.id ?? null })
                  }
                  search={search}
                  minChars={2}
                  debounceMs={250}
                />

                <div className="mt-3 text-xs text-white/60">
                  Tip: search “john”, “smith”, “emily”
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 text-sm font-semibold text-white">
                  Watchers
                </div>

                <EntityMultiPicker<PersonEntity>
                  virtualize={props.virtualize}
                  label="Add watchers"
                  placeholder="Search people…"
                  value={watchersEntities}
                  onChange={(next) =>
                    updateTask({ watcherIds: next.map((x) => x.id) })
                  }
                  search={search}
                  minChars={2}
                  debounceMs={250}
                  maxSelected={10}
                />

                <div className="mt-3 text-xs text-white/60">
                  Add watchers to show chip UX + virtualization.
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm font-semibold text-white/90">
                Task state
              </div>
              <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/80">
                {JSON.stringify(activeTask, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>

      {/* Undo toast */}
      {undo && (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] rounded-2xl border border-white/10 bg-neutral-950/80 p-4 text-sm text-white shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">Task deleted</div>
              <div className="mt-1 line-clamp-2 text-white/70">
                {undo.task.title}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUndo(null)}
              className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={undoDelete}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
