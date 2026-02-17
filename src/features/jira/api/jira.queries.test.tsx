import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { ReactNode } from "react";

import {
  jiraKeys,
  useCreateBoard,
  useCreateSprint,
  useSetActiveSprint,
  usePatchIssue,
  useBatchPatchIssues,
  useCreateIssue,
  useMoveIssue,
} from "./jira.queries";
import type { Board, Issue, Sprint } from "../domain/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockBoard: Board = { id: "board-1", name: "Test Board" };

const mockSprint: Sprint = {
  id: "sprint-1",
  boardId: "board-1",
  name: "Sprint 1",
  isActive: true,
};
const mockSprint2: Sprint = {
  id: "sprint-2",
  boardId: "board-1",
  name: "Sprint 2",
  isActive: false,
};

const mockIssue: Issue = {
  id: "issue-1",
  key: "BOARD-1",
  boardId: "board-1",
  sprintId: "sprint-1",
  status: "todo",
  order: 1000,
  title: "Test Issue",
  description: "A test issue",
  assigneeId: null,
  watcherIds: [],
};

// ---------------------------------------------------------------------------
// MSW handlers (success by default)
// ---------------------------------------------------------------------------
const handlers = [
  http.post("*/boards", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({ id: "server-board", name: body.name });
  }),

  http.post("*/boards/:boardId/sprints", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      id: "server-sprint",
      boardId: "board-1",
      name: body.name,
      isActive: false,
    });
  }),

  http.patch("*/boards/:boardId/active-sprint", async ({ request }) => {
    const body = (await request.json()) as { sprintId: string };
    return HttpResponse.json({ ...mockSprint2, id: body.sprintId, isActive: true });
  }),

  http.post("*/issues", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockIssue, id: "server-issue", key: "BOARD-2", ...body });
  }),

  http.patch("*/issues/batch", async ({ request }) => {
    const body = (await request.json()) as Array<{ id: string; patch: Record<string, unknown> }>;
    return HttpResponse.json(body.map((c) => ({ ...mockIssue, ...c.patch, id: c.id })));
  }),

  http.patch("*/issues/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockIssue, id: params.id, ...body });
  }),

  // GET endpoints for refetch after invalidation
  http.get("*/boards", () => HttpResponse.json([mockBoard])),
  http.get("*/boards/:boardId/sprints", () => HttpResponse.json([mockSprint, mockSprint2])),
  http.get("*/issues", () => HttpResponse.json([mockIssue])),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function createWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

// ---------------------------------------------------------------------------
// useCreateBoard
// ---------------------------------------------------------------------------
describe("useCreateBoard", () => {
  it("optimistically adds a board to the cache", async () => {
    const qc = createTestQueryClient();
    qc.setQueryData<Board[]>(jiraKeys.boards, [mockBoard]);

    const { result } = renderHook(() => useCreateBoard(), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ name: "New Board" });

    // Optimistic: board should appear instantly
    await waitFor(() => {
      const boards = qc.getQueryData<Board[]>(jiraKeys.boards)!;
      expect(boards).toHaveLength(2);
      expect(boards[1].name).toBe("New Board");
      expect(boards[1].id).toMatch(/^tmp_/);
    });

    // After settle: server data replaces optimistic
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.post("*/boards", () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Board[]>(jiraKeys.boards, [mockBoard]);

    const { result } = renderHook(() => useCreateBoard(), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ name: "Will Fail" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const boards = qc.getQueryData<Board[]>(jiraKeys.boards)!;
    expect(boards).toHaveLength(1);
    expect(boards[0].id).toBe("board-1");
  });
});

// ---------------------------------------------------------------------------
// useCreateSprint
// ---------------------------------------------------------------------------
describe("useCreateSprint", () => {
  it("optimistically adds a sprint to the cache", async () => {
    const qc = createTestQueryClient();
    qc.setQueryData<Sprint[]>(jiraKeys.sprints("board-1"), [mockSprint]);

    const { result } = renderHook(() => useCreateSprint("board-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ name: "Sprint 3" });

    await waitFor(() => {
      const sprints = qc.getQueryData<Sprint[]>(jiraKeys.sprints("board-1"))!;
      expect(sprints).toHaveLength(2);
      expect(sprints[1].name).toBe("Sprint 3");
      expect(sprints[1].isActive).toBe(false);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.post("*/boards/:boardId/sprints", () =>
        HttpResponse.json({ message: "fail" }, { status: 500 })
      )
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Sprint[]>(jiraKeys.sprints("board-1"), [mockSprint]);

    const { result } = renderHook(() => useCreateSprint("board-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ name: "Will Fail" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const sprints = qc.getQueryData<Sprint[]>(jiraKeys.sprints("board-1"))!;
    expect(sprints).toHaveLength(1);
    expect(sprints[0].id).toBe("sprint-1");
  });
});

// ---------------------------------------------------------------------------
// useSetActiveSprint
// ---------------------------------------------------------------------------
describe("useSetActiveSprint", () => {
  it("optimistically toggles the active sprint", async () => {
    const qc = createTestQueryClient();
    qc.setQueryData<Sprint[]>(jiraKeys.sprints("board-1"), [mockSprint, mockSprint2]);

    const { result } = renderHook(() => useSetActiveSprint("board-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ sprintId: "sprint-2" });

    await waitFor(() => {
      const sprints = qc.getQueryData<Sprint[]>(jiraKeys.sprints("board-1"))!;
      expect(sprints.find((s) => s.id === "sprint-1")!.isActive).toBe(false);
      expect(sprints.find((s) => s.id === "sprint-2")!.isActive).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.patch("*/boards/:boardId/active-sprint", () =>
        HttpResponse.json({ message: "fail" }, { status: 500 })
      )
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Sprint[]>(jiraKeys.sprints("board-1"), [mockSprint, mockSprint2]);

    const { result } = renderHook(() => useSetActiveSprint("board-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ sprintId: "sprint-2" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const sprints = qc.getQueryData<Sprint[]>(jiraKeys.sprints("board-1"))!;
    expect(sprints.find((s) => s.id === "sprint-1")!.isActive).toBe(true);
    expect(sprints.find((s) => s.id === "sprint-2")!.isActive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// usePatchIssue
// ---------------------------------------------------------------------------
describe("usePatchIssue", () => {
  it("optimistically patches issue in cache", async () => {
    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => usePatchIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ id: "issue-1", patch: { title: "Updated" } });

    await waitFor(() => {
      const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
      expect(issues[0].title).toBe("Updated");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.patch("*/issues/:id", () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => usePatchIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ id: "issue-1", patch: { title: "Will Fail" } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
    expect(issues[0].title).toBe("Test Issue");
  });
});

// ---------------------------------------------------------------------------
// useBatchPatchIssues
// ---------------------------------------------------------------------------
describe("useBatchPatchIssues", () => {
  it("optimistically applies batch patches", async () => {
    const issue2: Issue = { ...mockIssue, id: "issue-2", key: "BOARD-2", order: 2000 };
    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue, issue2]);

    const { result } = renderHook(() => useBatchPatchIssues("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate([
      { id: "issue-1", patch: { order: 3000 } },
      { id: "issue-2", patch: { status: "done" as const } },
    ]);

    await waitFor(() => {
      const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
      expect(issues[0].order).toBe(3000);
      expect(issues[1].status).toBe("done");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.patch("*/issues/batch", () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const issue2: Issue = { ...mockIssue, id: "issue-2", key: "BOARD-2", order: 2000 };
    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue, issue2]);

    const { result } = renderHook(() => useBatchPatchIssues("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate([{ id: "issue-1", patch: { order: 9999 } }]);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
    expect(issues[0].order).toBe(1000);
    expect(issues[1].order).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// useCreateIssue
// ---------------------------------------------------------------------------
describe("useCreateIssue", () => {
  it("optimistically adds issue with temp ID then replaces with server data", async () => {
    // Delay server response so we can observe the optimistic state
    server.use(
      http.post("*/issues", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({
          ...mockIssue,
          id: "server-issue",
          key: "BOARD-2",
          ...body,
        });
      })
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => useCreateIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({
      boardId: "board-1",
      sprintId: "sprint-1",
      status: "todo",
      order: 2000,
      title: "New Issue",
      description: "",
      assigneeId: null,
      watcherIds: [],
    });

    // Optimistic: temp item appears immediately
    await waitFor(() => {
      const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
      expect(issues).toHaveLength(2);
      expect(issues[1].title).toBe("New Issue");
      expect(issues[1].id).toMatch(/^tmp_/);
      expect(issues[1].key).toBe("TMP");
    });

    // After server responds: temp replaced with real data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.post("*/issues", () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => useCreateIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({
      boardId: "board-1",
      sprintId: "sprint-1",
      status: "todo",
      order: 2000,
      title: "Will Fail",
      description: "",
      assigneeId: null,
      watcherIds: [],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("issue-1");
  });
});

// ---------------------------------------------------------------------------
// useMoveIssue
// ---------------------------------------------------------------------------
describe("useMoveIssue", () => {
  it("optimistically removes issue when moving to different sprint", async () => {
    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => useMoveIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ id: "issue-1", toSprintId: "sprint-2" });

    await waitFor(() => {
      const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
      expect(issues).toHaveLength(0);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back on server error", async () => {
    server.use(
      http.patch("*/issues/:id", () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const qc = createTestQueryClient();
    qc.setQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"), [mockIssue]);

    const { result } = renderHook(() => useMoveIssue("board-1", "sprint-1"), {
      wrapper: createWrapper(qc),
    });

    result.current.mutate({ id: "issue-1", toSprintId: "sprint-2" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const issues = qc.getQueryData<Issue[]>(jiraKeys.issues("board-1", "sprint-1"))!;
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("issue-1");
  });
});
