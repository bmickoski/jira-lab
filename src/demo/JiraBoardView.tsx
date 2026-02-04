import { useCallback, useMemo, useState } from "react";
import { useJiraStore, type JiraIssue, type JiraStatus } from "./jiraStore";

import type { Person } from "../data/mockPeople";
import { searchPeople, getPeopleDataset } from "./search";
import { buildPersonIndex } from "../data/peopleIndex";

import { EntityPicker, type EntityBase } from "../components/EntityPicker";
import { EntityMultiPicker } from "../components/EntityMultiPicker";
import { useTaskboardStore } from "./taskboardStore"; // reuse knobs: virtualize/useBig if you want

type PersonEntity = EntityBase & { raw: Person };

const STATUS_ORDER: JiraStatus[] = ["backlog", "todo", "in_progress", "done"];
const STATUS_LABEL: Record<JiraStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export function JiraBoardView(props: { boardId: string; sprintId: string | null }) {
  const { boardId, sprintId } = props;

  const issues = useJiraStore((s) => s.issues);
  const createIssue = useJiraStore((s) => s.createIssue);
  const updateIssue = useJiraStore((s) => s.updateIssue);
  const deleteIssue = useJiraStore((s) => s.deleteIssue);

  // reuse your existing toggles
  const virtualize = useTaskboardStore((s) => s.virtualize);
  const useBig = useTaskboardStore((s) => s.useBig);
  const debounceMs = useTaskboardStore((s) => s.debounceMs);
  const minChars = useTaskboardStore((s) => s.minChars);
  const maxSelected = useTaskboardStore((s) => s.maxSelected);

  const filtered = useMemo(() => {
    return issues.filter((i) => i.boardId === boardId && i.sprintId === sprintId);
  }, [issues, boardId, sprintId]);

  const byStatus = useMemo(() => {
    const map = new Map<JiraStatus, JiraIssue[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const i of filtered) map.get(i.status)!.push(i);

    // optional stable sort
    for (const s of STATUS_ORDER) {
      map.get(s)!.sort((a, b) => a.id.localeCompare(b.id));
    }
    return map;
  }, [filtered]);

  const [activeIssueId, setActiveIssueId] = useState<string | null>(filtered[0]?.id ?? null);

  const activeIssue = useMemo(
    () => filtered.find((i) => i.id === activeIssueId) ?? null,
    [filtered, activeIssueId]
  );

  const personIndex = useMemo(() => {
    const data = getPeopleDataset(useBig);
    return buildPersonIndex(data);
  }, [useBig]);

  const mapPerson = useCallback((p: Person): PersonEntity => {
    return { id: p.id, label: p.fullName, subLabel: p.email, raw: p };
  }, []);

  const toEntity = useCallback(
    (id: string | number): PersonEntity => {
      const p = personIndex.byId.get(String(id));
      if (p) return mapPerson(p);
      return {
        id,
        label: `User ${String(id)}`,
        subLabel: undefined,
        raw: { id: Number(id), fullName: `User ${String(id)}`, email: undefined },
      };
    },
    [personIndex, mapPerson]
  );

  const search = useCallback(
    async (q: string, signal?: AbortSignal): Promise<PersonEntity[]> => {
      const res = await searchPeople(q, signal, useBig);
      return res.map(mapPerson);
    },
    [useBig, mapPerson]
  );

  const assigneeEntity = useMemo(() => {
    const id = activeIssue?.assigneeId;
    return id == null ? null : toEntity(id);
  }, [activeIssue?.assigneeId, toEntity]);

  const watchersEntities = useMemo(() => {
    return (activeIssue?.watcherIds ?? []).map(toEntity);
  }, [activeIssue?.watcherIds, toEntity]);

  function moveIssue(id: string, dir: -1 | 1) {
    const issue = filtered.find((x) => x.id === id);
    if (!issue) return;

    const i = STATUS_ORDER.indexOf(issue.status);
    const next = STATUS_ORDER[i + dir];
    if (!next) return;

    updateIssue(id, { status: next });
  }

  function addIssueQuick() {
    const created = createIssue({
      boardId,
      sprintId,
      title: "New issue",
      description: "Describe…",
      status: sprintId ? "todo" : "backlog",
      assigneeId: null,
      watcherIds: [],
    });
    setActiveIssueId(created.id);
  }

  function removeIssue(id: string) {
    deleteIssue(id);
    if (activeIssueId === id) {
      const rest = filtered.filter((x) => x.id !== id);
      setActiveIssueId(rest[0]?.id ?? null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(560px,1fr)_minmax(360px,520px)] lg:items-start">
      {/* Board */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-white/70">
            View: {sprintId ? "Sprint board" : "Backlog"}
          </div>

          <button
            type="button"
            onClick={addIssueQuick}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
          >
            + New issue
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const col = byStatus.get(status) ?? [];
            return (
              <div key={status} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">{STATUS_LABEL[status]}</div>
                  <div className="text-xs text-white/60">{col.length}</div>
                </div>

                <div className="space-y-2">
                  {col.map((i) => {
                    const isActive = i.id === activeIssueId;
                    return (
                      <div
                        key={i.id}
                        className={[
                          "relative rounded-xl border bg-black/20",
                          isActive ? "border-white/25 bg-white/10" : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => removeIssue(i.id)}
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/70 hover:bg-white/10 hover:text-white"
                          aria-label={`Delete ${i.id}`}
                        >
                          ✕
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveIssueId(i.id)}
                          className="w-full rounded-xl px-3 py-3 pr-12 text-left hover:bg-white/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-white/60">{i.id}</div>
                            <div className="text-xs text-white/50">
                              {(i.watcherIds?.length ?? 0)} watcher(s)
                            </div>
                          </div>
                          <div className="mt-1 font-medium">{i.title}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-white/60">{i.description}</div>
                        </button>

                        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => moveIssue(i.id, -1)}
                            disabled={STATUS_ORDER.indexOf(i.status) === 0}
                            className={[
                              "rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                              STATUS_ORDER.indexOf(i.status) === 0 ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
                            ].join(" ")}
                          >
                            ←
                          </button>

                          <div className="text-[11px] text-white/50">{STATUS_LABEL[i.status]}</div>

                          <button
                            type="button"
                            onClick={() => moveIssue(i.id, +1)}
                            disabled={STATUS_ORDER.indexOf(i.status) === STATUS_ORDER.length - 1}
                            className={[
                              "rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                              STATUS_ORDER.indexOf(i.status) === STATUS_ORDER.length - 1
                                ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                                : "",
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
                      No issues
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {!activeIssue ? (
          <div className="text-white/70">Select an issue</div>
        ) : (
          <>
            <div className="text-sm text-white/60">{activeIssue.id}</div>
            <input
              value={activeIssue.title}
              onChange={(e) => updateIssue(activeIssue.id, { title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-lg font-semibold text-white outline-none"
            />
            <textarea
              value={activeIssue.description}
              onChange={(e) => updateIssue(activeIssue.id, { description: e.target.value })}
              rows={5}
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 outline-none"
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 text-sm font-semibold">Assignee</div>

                <EntityPicker<PersonEntity>
                  label="Assign to"
                  placeholder="Search people…"
                  value={assigneeEntity}
                  onChange={(next) => updateIssue(activeIssue.id, { assigneeId: next?.id ?? null })}
                  search={search}
                  minChars={minChars}
                  debounceMs={debounceMs}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 text-sm font-semibold">Watchers</div>

                <EntityMultiPicker<PersonEntity>
                  virtualize={virtualize}
                  label="Add watchers"
                  placeholder="Search people…"
                  value={watchersEntities}
                  onChange={(next) => updateIssue(activeIssue.id, { watcherIds: next.map((x) => x.id) })}
                  search={search}
                  minChars={minChars}
                  debounceMs={debounceMs}
                  maxSelected={maxSelected}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
