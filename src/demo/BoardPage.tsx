import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { IssueCard } from "./IssueCard";

import type { EntityBase } from "../components/EntityPicker";
import { EntityPicker } from "../components/EntityPicker";
import { EntityMultiPicker } from "../components/EntityMultiPicker";
import type { Person } from "../data/mockPeople";
import { getPeopleDataset, searchPeople } from "../demo/search";
import { useJiraStore, type IssueStatus } from "./jiraStore";
import { buildPersonIndex } from "../data/peopleIndex";

type PersonEntity = EntityBase & { raw: Person };

const STATUSES: Array<{ key: IssueStatus; title: string }> = [
  { key: "backlog", title: "Backlog" },
  { key: "todo", title: "To do" },
  { key: "in_progress", title: "In progress" },
  { key: "done", title: "Done" },
];

function statusLabel(s: IssueStatus) {
  return STATUSES.find((x) => x.key === s)?.title ?? s;
}

export function BoardPage() {
  const navigate = useNavigate();
  const params = useParams<{ boardId: string; view?: string }>();

  const boardId = params.boardId ?? "";
  const view = (params.view ?? "sprint") as "sprint" | "backlog";

  // --- Store reads ---
  const issues = useJiraStore((s) => s.issues);
  const selectedIssueId = useJiraStore((s) => s.selectedIssueId);
  const draftIssue = useJiraStore((s) => s.draftIssue);

  const openIssue = useJiraStore((s) => s.openIssue);
  const closeIssue = useJiraStore((s) => s.closeIssue);

  const openNewIssue = useJiraStore((s) => s.openNewIssue);
  const updateDraft = useJiraStore((s) => s.updateDraft);
  const discardDraft = useJiraStore((s) => s.discardDraft);
  const saveDraft = useJiraStore((s) => s.saveDraft);

  const updateIssue = useJiraStore((s) => s.updateIssue);

  // You can wire this later to a knob/store
  const useBig = true;

  // --- People index for id -> entity rehydrate ---
  const personIndex = useMemo(() => {
    const data = getPeopleDataset(useBig);
    return buildPersonIndex(data);
  }, [useBig]);

  const toPersonEntity = useCallback(
    (id: string | number): PersonEntity => {
      const p = personIndex.byId.get(String(id));
      if (!p) {
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
      }
      return { id: p.id, label: p.fullName, subLabel: p.email, raw: p };
    },
    [personIndex],
  );

  // --- Derived ---
  const boardIssues = useMemo(
    () => issues.filter((i) => i.boardId === boardId),
    [issues, boardId],
  );

  const selectedIssue = useMemo(
    () =>
      selectedIssueId
        ? (issues.find((x) => x.id === selectedIssueId) ?? null)
        : null,
    [issues, selectedIssueId],
  );

  const issuesByStatus = useMemo(() => {
    const map: Record<IssueStatus, typeof boardIssues> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const it of boardIssues) {
      if (view === "backlog") {
        if (it.status === "backlog") map.backlog.push(it);
      } else {
        if (it.status !== "backlog") map[it.status].push(it);
      }
    }

    return map;
  }, [boardIssues, view]);

  // --- Draft entities ---
  const draftAssigneeEntity = useMemo(() => {
    const id = draftIssue?.assigneeId;
    return id == null ? null : toPersonEntity(id);
  }, [draftIssue?.assigneeId, toPersonEntity]);

  const draftWatchersEntities = useMemo(() => {
    return (draftIssue?.watcherIds ?? []).map(toPersonEntity);
  }, [draftIssue?.watcherIds, toPersonEntity]);

  // --- Selected issue entities ---
  const selectedAssigneeEntity = useMemo(() => {
    const id = selectedIssue?.assigneeId;
    return id == null ? null : toPersonEntity(id);
  }, [selectedIssue?.assigneeId, toPersonEntity]);

  const selectedWatchersEntities = useMemo(() => {
    return (selectedIssue?.watcherIds ?? []).map(toPersonEntity);
  }, [selectedIssue?.watcherIds, toPersonEntity]);

  // --- People search ---
  const mapPerson = (p: Person): PersonEntity => ({
    id: p.id,
    label: p.fullName,
    subLabel: p.email,
    raw: p,
  });

  const search = async (
    q: string,
    signal?: AbortSignal,
  ): Promise<PersonEntity[]> => {
    const res = await searchPeople(q, signal, true);
    return res.map(mapPerson);
  };

  // --- Header actions ---
  function onBack() {
    navigate("/boards");
  }
  function onBacklog() {
    navigate(`/boards/${boardId}/backlog`);
  }
  function onSprint() {
    navigate(`/boards/${boardId}/sprint`);
  }
  function onNewIssue() {
    const seedStatus: IssueStatus = view === "backlog" ? "backlog" : "todo";
    openNewIssue({ boardId, sprintId: null, status: seedStatus });
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white">
      <div className="w-full px-6 py-8 2xl:px-10">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-white/50">{boardId}</div>
            <div className="text-3xl font-semibold tracking-tight">Board</div>
            <div className="mt-1 text-sm text-white/60">
              View: {view === "backlog" ? "Backlog" : "Sprint board"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              ← Boards
            </button>

            <button
              type="button"
              onClick={onBacklog}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              Backlog
            </button>

            <button
              type="button"
              onClick={onSprint}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              Sprint
            </button>

            <button
              type="button"
              onClick={onNewIssue}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
            >
              + New issue
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* Board columns */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 text-sm text-white/60">
              {view === "backlog" ? "Backlog" : "Sprint board"}
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {STATUSES.filter((s) =>
                view === "backlog" ? s.key === "backlog" : s.key !== "backlog",
              ).map((col) => {
                const colIssues = issuesByStatus[col.key];

                return (
                  <div
                    key={col.key}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-semibold">{col.title}</div>
                      <div className="text-xs text-white/50">
                        {colIssues.length}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {colIssues.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-white/40">
                          No issues
                        </div>
                      ) : (
                        colIssues.map((it) => (
                          <IssueCard
                            key={it.id}
                            issue={it}
                            onOpen={() => openIssue(it.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Draft OR Details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 overflow-visible">
            {draftIssue ? (
              <>
                <div className="text-xs text-white/50">New issue</div>
                <div className="mt-1 text-xl font-semibold">Draft</div>

                <div className="mt-4 grid gap-5">
                  {/* Title */}
                  <div>
                    <div className="mb-1 text-sm text-white/70">Title *</div>
                    <input
                      value={draftIssue.title}
                      onChange={(e) => updateDraft({ title: e.target.value })}
                      placeholder="Short summary"
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="mb-1 text-sm text-white/70">
                      Description
                    </div>
                    <textarea
                      value={draftIssue.description}
                      onChange={(e) =>
                        updateDraft({ description: e.target.value })
                      }
                      placeholder="Details (optional)"
                      rows={6}
                      className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <div className="mb-1 text-sm text-white/70">Status</div>
                    <select
                      value={draftIssue.status}
                      onChange={(e) =>
                        updateDraft({ status: e.target.value as IssueStatus })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee + Watchers (stacked, one per row) */}
                  <div className="grid gap-4">
                    {/* Assignee */}
                    <div className="w-full">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="text-sm text-white/80">Assignee</div>

                        <button
                          type="button"
                          disabled={draftIssue.assigneeId == null}
                          onClick={() => updateDraft({ assigneeId: null })}
                          className={[
                            "min-w-[56px] rounded-lg px-2 py-1 text-xs",
                            draftIssue.assigneeId == null
                              ? "cursor-not-allowed text-white/30"
                              : "text-white/60 hover:bg-white/10 hover:text-white",
                          ].join(" ")}
                        >
                          Clear
                        </button>
                      </div>

                      <EntityPicker<PersonEntity>
                        hideClearButton
                        label=""
                        placeholder="Search people…"
                        value={draftAssigneeEntity}
                        onChange={(p) =>
                          updateDraft({ assigneeId: p?.id ?? null })
                        }
                        search={search}
                        minChars={2}
                        debounceMs={250}
                      />
                    </div>

                    {/* Watchers */}
                    <div className="w-full">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="text-sm text-white/80">Watchers</div>

                        <button
                          type="button"
                          disabled={(draftIssue.watcherIds?.length ?? 0) === 0}
                          onClick={() => updateDraft({ watcherIds: [] })}
                          className={[
                            "min-w-[56px] rounded-lg px-2 py-1 text-xs",
                            (draftIssue.watcherIds?.length ?? 0) === 0
                              ? "cursor-not-allowed text-white/30"
                              : "text-white/60 hover:bg-white/10 hover:text-white",
                          ].join(" ")}
                        >
                          Clear
                        </button>
                      </div>

                      <EntityMultiPicker<PersonEntity>
                        hideClearButton
                        label=""
                        placeholder="Search people…"
                        value={draftWatchersEntities}
                        onChange={(next) =>
                          updateDraft({ watcherIds: next.map((x) => x.id) })
                        }
                        search={search}
                        minChars={2}
                        debounceMs={250}
                        maxSelected={10}
                        virtualize
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={!draftIssue.title.trim()}
                      className={[
                        "rounded-xl border border-white/15 px-3 py-2 text-sm",
                        draftIssue.title.trim()
                          ? "bg-white/10 text-white hover:bg-white/15"
                          : "cursor-not-allowed bg-white/5 text-white/40",
                      ].join(" ")}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </>
            ) : selectedIssue ? (
              <>
                <div className="text-xs text-white/50">{selectedIssue.key}</div>
                <div className="mt-1 text-xl font-semibold">
                  {selectedIssue.title}
                </div>

                <div className="mt-4 grid gap-5">
                  {/* Description */}
                  <div>
                    <div className="mb-1 text-sm text-white/70">
                      Description
                    </div>
                    <textarea
                      value={selectedIssue.description}
                      onChange={(e) =>
                        updateIssue(selectedIssue.id, {
                          description: e.target.value,
                        })
                      }
                      rows={8}
                      className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <div className="mb-1 text-sm text-white/70">Status</div>
                    <select
                      value={selectedIssue.status}
                      onChange={(e) =>
                        updateIssue(selectedIssue.id, {
                          status: e.target.value as IssueStatus,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.title}
                        </option>
                      ))}
                    </select>

                    <div className="mt-1 text-xs text-white/50">
                      Currently: {statusLabel(selectedIssue.status)}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="w-full">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="text-sm text-white/80">Assignee</div>

                      <button
                        type="button"
                        disabled={selectedIssue.assigneeId == null}
                        onClick={() =>
                          updateIssue(selectedIssue.id, { assigneeId: null })
                        }
                        className={[
                          "min-w-[56px] rounded-lg px-2 py-1 text-xs",
                          selectedIssue.assigneeId == null
                            ? "cursor-not-allowed text-white/30"
                            : "text-white/60 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        Clear
                      </button>
                    </div>

                    <EntityPicker<PersonEntity>
                      hideClearButton
                      label=""
                      placeholder="Search people…"
                      value={selectedAssigneeEntity}
                      onChange={(p) =>
                        updateIssue(selectedIssue.id, {
                          assigneeId: p?.id ?? null,
                        })
                      }
                      search={search}
                      minChars={2}
                      debounceMs={250}
                    />
                  </div>

                  {/* Watchers */}
                  <div className="w-full">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="text-sm text-white/80">Watchers</div>

                      <button
                        type="button"
                        disabled={(selectedIssue.watcherIds?.length ?? 0) === 0}
                        onClick={() =>
                          updateIssue(selectedIssue.id, { watcherIds: [] })
                        }
                        className={[
                          "min-w-[56px] rounded-lg px-2 py-1 text-xs",
                          (selectedIssue.watcherIds?.length ?? 0) === 0
                            ? "cursor-not-allowed text-white/30"
                            : "text-white/60 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        Clear
                      </button>
                    </div>

                    <EntityMultiPicker<PersonEntity>
                      hideClearButton
                      label=""
                      placeholder="Search people…"
                      value={selectedWatchersEntities}
                      onChange={(next) =>
                        updateIssue(selectedIssue.id, {
                          watcherIds: next.map((x) => x.id),
                        })
                      }
                      search={search}
                      minChars={2}
                      debounceMs={250}
                      maxSelected={10}
                      virtualize
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={closeIssue}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white/70">
                Select an issue or create a new one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
