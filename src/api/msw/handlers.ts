import { http, HttpResponse } from "msw";
import type { Issue } from "../jira.types";

const STORAGE_KEY = "jira-lab:issuesDb";

function newId() {
  return crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random()}`;
}

function makeDemoIssues(): Issue[] {
  return [
    {
      id: newId(),
      key: "ISSUE-101",
      boardId: "B-1",
      sprintId: "S-1",
      status: "todo",
      order: 1000,
      title: "DnD ordering + optimistic updates",
      description: "",
      assigneeId: null,
      watcherIds: [],
    },
    {
      id: newId(),
      key: "ISSUE-102",
      boardId: "B-1",
      sprintId: "S-1",
      status: "in_progress",
      order: 1000,
      title: "EntityPicker UX polish",
      description: "",
      assigneeId: null,
      watcherIds: [],
    },
  ];
}

function loadDb(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDemoIssues();
    const parsed = JSON.parse(raw) as Issue[];
    return Array.isArray(parsed) ? parsed : makeDemoIssues();
  } catch {
    return makeDemoIssues();
  }
}

function saveDb(next: Issue[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
// In-memory DB (backed by localStorage)
let issuesDb: Issue[] = loadDb() ?? makeDemoIssues();

function normalizeSprintId(raw: string | null) {
  if (raw == null) return null;
  const v = raw.trim();
  return v === "" ? null : v;
}

export const handlers = [
  http.get("*/api/issues", ({ request }) => {
    const url = new URL(request.url);
    const boardId = url.searchParams.get("boardId") ?? "";
    const sprintId = normalizeSprintId(url.searchParams.get("sprintId"));

    const filtered = issuesDb
      .filter((i) => i.boardId === boardId && i.sprintId === sprintId)
      .slice()
      .sort((a, b) => a.order - b.order);

    return HttpResponse.json(filtered);
  }),

  http.patch("*/api/issues/batch", async ({ request }) => {
    const body = (await request.json()) as {
      boardId?: string;
      sprintId?: string; // "" means null
      changes: Array<{ id: string; patch: Partial<Issue> }>;
    };

    const byId = new Map(body.changes.map((c) => [c.id, c.patch]));
    issuesDb = issuesDb.map((it) => {
      const patch = byId.get(it.id);
      return patch ? { ...it, ...patch } : it;
    });
    saveDb(issuesDb);

    const boardId = body.boardId ?? "";
    const sprintId = normalizeSprintId(body.sprintId ?? "");

    const scoped = issuesDb
      .filter((i) => i.boardId === boardId && i.sprintId === sprintId)
      .slice()
      .sort((a, b) => a.order - b.order);

    return HttpResponse.json(scoped);
  }),
  http.patch("*/api/issues/:id", async ({ params, request }) => {
    const id = String(params.id);
    const patch = (await request.json()) as Partial<Issue>;

    issuesDb = issuesDb.map((it) => (it.id === id ? { ...it, ...patch } : it));
    saveDb(issuesDb);

    const updated = issuesDb.find((x) => x.id === id);
    if (!updated) return new HttpResponse("Not found", { status: 404 });

    return HttpResponse.json(updated);
  }),
  http.post("*/api/issues", async ({ request }) => {
    const body = (await request.json()) as Partial<Issue>;

    const created: Issue = {
      id: newId(),
      key: `ISSUE-${100 + issuesDb.length + 1}`,
      boardId: String(body.boardId ?? ""),
      sprintId: normalizeSprintId((body.sprintId as string) ?? null),
      status: (body.status as any) ?? "todo",
      order: Number(body.order ?? 999999),
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      assigneeId: (body.assigneeId ?? null) as any,
      watcherIds: (body.watcherIds ?? []) as any[],
    };

    issuesDb = [...issuesDb, created];
    saveDb(issuesDb);

    return HttpResponse.json(created);
  }),
];
