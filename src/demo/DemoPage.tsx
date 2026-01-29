import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { TaskBoard } from "./TaskBoard";
import type { Task } from "./taskboardTypes";
import { useLocalStorageState } from "./useLocalStorageState";

import { searchPeople, getPeopleDataset } from "./search";

import { EntityPicker, type EntityBase } from "../components/EntityPicker";
import { EntityMultiPicker } from "../components/EntityMultiPicker";
import { useSearchMetrics } from "./useSearchMetrics";
import { SearchMetricsPanel } from "./SearchMetricsPanel";
import type { Person } from "../data/mockPeople";
import { buildPersonIndex } from "../data/peopleIndex";

const ACTIVE_TASK_KEY = "entity-picker-lab:activeTaskId";

type PersonEntity = EntityBase & { raw: Person };

function makeInitialTasks(): Task[] {
  return [
    {
      id: "T-1001",
      title: "Add virtualization to user picker",
      description: "When results are huge, render only visible rows. Keep keyboard UX smooth.",
      assigneeId: null,
      watcherIds: [],
    },
    {
      id: "T-1002",
      title: "Improve create-row UX",
      description: 'Show "Create …" when no results match and minChars is satisfied.',
      assigneeId: null,
      watcherIds: [],
    },
    {
      id: "T-1003",
      title: "Ship Storybook catalog",
      description: "Document states: disabled, custom item renderer, maxSelected, big dataset.",
      assigneeId: null,
      watcherIds: [],
    },
  ];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function DemoPage() {
  const navigate = useNavigate();
  const params = useParams<{ taskId?: string }>();

  const [tasks, setTasks] = useLocalStorageState<Task[]>("entity-picker-lab:tasks", makeInitialTasks());

  const [virtualize, setVirtualize] = useState(true);
  const [useBig, setUseBig] = useState(false);

  const [showLab, setShowLab] = useState(false);
  const [debounceMs, setDebounceMs] = useState(250);
  const [minChars, setMinChars] = useState(2);
  const [maxSelected, setMaxSelected] = useState(5);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const routeTaskId = params.taskId ?? null;
  const persistedTaskId = window.localStorage.getItem(ACTIVE_TASK_KEY);

  const searchMetrics = useSearchMetrics();

  useEffect(() => {
    const first = tasks[0]?.id ?? null;

    if (routeTaskId && !tasksById.has(routeTaskId)) {
      const fallback = persistedTaskId && tasksById.has(persistedTaskId) ? persistedTaskId : first;
      if (fallback) navigate(`/tasks/${fallback}`, { replace: true });
      return;
    }

    if (!routeTaskId) {
      const chosen = (persistedTaskId && tasksById.has(persistedTaskId) && persistedTaskId) || first;
      if (chosen) navigate(`/tasks/${chosen}`, { replace: true });
    }
  }, [routeTaskId, tasksById, tasks, persistedTaskId, navigate]);

  const activeTask = useMemo(() => {
    if (!routeTaskId) return null;
    return tasksById.get(routeTaskId) ?? null;
  }, [routeTaskId, tasksById]);

  useEffect(() => {
    if (routeTaskId && tasksById.has(routeTaskId)) {
      window.localStorage.setItem(ACTIVE_TASK_KEY, routeTaskId);
    }
  }, [routeTaskId, tasksById]);

  const selectTask = useCallback(
    (id: string) => {
      navigate(`/tasks/${id}`);
    },
    [navigate]
  );

  const [labAssignee, setLabAssignee] = useState<PersonEntity | null>(null);
  const [labWatchers, setLabWatchers] = useState<PersonEntity[]>([]);
  const [labDisabled, setLabDisabled] = useState<PersonEntity[]>([]);

  const mapPerson = useCallback((p: Person): PersonEntity => {
    return { id: p.id, label: p.fullName, subLabel: p.email, raw: p };
  }, []);

  const personIndex = useMemo(() => {
    const data = getPeopleDataset(useBig);
    return buildPersonIndex(data);
  }, [useBig]);

  const search = useCallback(
    async (q: string, signal?: AbortSignal): Promise<PersonEntity[]> => {
      searchMetrics.onStart();

      try {
        const res = await searchPeople(q, signal, useBig);
        searchMetrics.onSuccess(res.length);
        return res.map(mapPerson);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          searchMetrics.onAbort();
        }
        throw e;
      }
    },
    [mapPerson, useBig, searchMetrics]
  );


  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white">
      <div className="w-full px-6 py-8 2xl:px-10">
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">React Entity Picker Lab</h1>
              <p className="mt-2 text-white/70">
                Async search • debounce • abort • keyboard • multi-select chips • virtualization
              </p>
              <div className="mt-2 text-sm text-white/60">
                Try searching: “john”, “smith”, “emily”, “miller”
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setVirtualize((v) => !v)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                Virtualization: {virtualize ? "ON" : "OFF"}
              </button>

              <button
                type="button"
                onClick={() => setUseBig((v) => !v)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                Dataset: {useBig ? "10,000" : "Small"}
              </button>

              <button
                type="button"
                onClick={() => setShowLab((v) => !v)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                Lab: {showLab ? "Visible" : "Hidden"}
              </button>

              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                <div>Virtualize: {String(virtualize)}</div>
                <div>Dataset: {useBig ? "10,000" : "Small"}</div>
                <div>Persist: localStorage</div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <TaskBoard
            tasks={tasks}
            setTasks={setTasks}
            activeTask={activeTask}
            onSelectTask={selectTask}
            virtualize={virtualize}
            useBig={useBig}
            showPlayground={showLab} 
          />

          {showLab && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60">Component Lab</div>
                  <h2 className="mt-1 text-xl font-semibold text-white">Knobs + stress tests</h2>
                  <p className="mt-1 text-sm text-white/70">
                    This section is intentionally “engineering UI”: it demonstrates behavior under different constraints
                    (debounce/minChars/maxSelected/virtualization) without cluttering the Taskboard.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <SearchMetricsPanel
                    metrics={searchMetrics.metrics}
                    onReset={searchMetrics.reset}
                  />

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                    <div>Virtualize: {String(virtualize)}</div>
                    <div>Dataset: {useBig ? "10,000" : "Small"}</div>
                    <div>Index size: {personIndex.byId.size.toLocaleString()}</div>
                  </div>
                </div>

              </div>

              {/* Knobs */}
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Search knobs</div>

                  <label className="block text-xs text-white/60">Debounce: {debounceMs}ms</label>
                  <input
                    type="range"
                    min={100}
                    max={700}
                    step={25}
                    value={debounceMs}
                    onChange={(e) => setDebounceMs(clamp(Number(e.target.value), 100, 700))}
                    className="mt-2 w-full accent-white"
                  />

                  <label className="mt-4 block text-xs text-white/60">minChars: {minChars}</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={minChars}
                    onChange={(e) => setMinChars(clamp(Number(e.target.value), 1, 5))}
                    className="mt-2 w-full accent-white"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Multi-select knobs</div>

                  <label className="block text-xs text-white/60">maxSelected: {maxSelected}</label>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={maxSelected}
                    onChange={(e) => setMaxSelected(clamp(Number(e.target.value), 1, 15))}
                    className="mt-2 w-full accent-white"
                  />

                  <div className="mt-4 text-xs text-white/60">
                    Tip: set maxSelected low and try creating / selecting quickly to see chip UX.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Quick actions</div>

                  <button
                    type="button"
                    onClick={() => {
                      setLabAssignee(null);
                      setLabWatchers([]);
                      setLabDisabled([]);
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    Reset Lab state
                  </button>

                  <div className="mt-3 text-xs text-white/60">
                    These resets are separate from the Taskboard localStorage state.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Multi picker (create + max)</div>

                  <EntityMultiPicker<PersonEntity>
                    virtualize={virtualize}
                    allowCreate
                    onCreate={(name) => ({
                      id: `new-${Date.now()}`,
                      label: name,
                      subLabel: "created locally",
                      raw: { id: -1, fullName: name, email: undefined },
                    })}
                    label="Watchers"
                    placeholder="Search people…"
                    value={labWatchers}
                    onChange={setLabWatchers}
                    search={search}
                    minChars={minChars}
                    debounceMs={debounceMs}
                    maxSelected={maxSelected}
                  />

                  <div className="mt-3 text-xs text-white/60">
                    Try: create a new watcher, then toggle dataset/virtualization.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Single picker (assignee)</div>

                  <EntityPicker<PersonEntity>
                    label="Assignee"
                    placeholder="Search people…"
                    value={labAssignee}
                    onChange={setLabAssignee}
                    search={search}
                    minChars={minChars}
                    debounceMs={debounceMs}
                  />

                  <div className="mt-3 text-xs text-white/60">
                    This is the “simple” API: a great contrast to multi-select complexity.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Disabled state</div>

                  <EntityMultiPicker<PersonEntity>
                    virtualize={virtualize}
                    label="Disabled (should not open)"
                    placeholder="Search people…"
                    value={labDisabled}
                    onChange={setLabDisabled}
                    search={search}
                    disabled
                    minChars={minChars}
                    debounceMs={debounceMs}
                    maxSelected={maxSelected}
                  />

                  <div className="mt-3 text-xs text-white/60">
                    disabled + focus behavior.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Custom renderItem</div>

                  <EntityMultiPicker<PersonEntity>
                    virtualize={virtualize}
                    label="Custom rows"
                    placeholder="Search people…"
                    value={labWatchers}
                    onChange={setLabWatchers}
                    search={search}
                    minChars={minChars}
                    debounceMs={debounceMs}
                    maxSelected={maxSelected}
                    renderItem={(item) => (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white">{item.label}</span>
                        <span className="text-xs text-white/60">{item.subLabel}</span>
                      </div>
                    )}
                  />

                  <div className="mt-3 text-xs text-white/60">
                    Shows render prop flexibility + separation of concerns.
                  </div>
                </div>
              </div>

              <details className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white/80">
                  Inspect state (debug)
                </summary>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs text-white/60">Active task</div>
                    <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                      {JSON.stringify(activeTask, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="mb-2 text-xs text-white/60">Lab selections</div>
                    <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
                      {JSON.stringify(
                        {
                          debounceMs,
                          minChars,
                          maxSelected,
                          labAssignee: labAssignee?.label ?? null,
                          labWatchers: labWatchers.map((w) => w.label),
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </details>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
