import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { jiraClient } from "./jira.client";
import type { Board, Issue, Sprint } from "../domain/types";

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

const mockBoard: Board = { id: "board-1", name: "Test Board" };

const mockSprint: Sprint = {
  id: "sprint-1",
  boardId: "board-1",
  name: "Sprint 1",
  isActive: true,
};

const handlers = [
  http.get("*/issues", ({ request }) => {
    const url = new URL(request.url);
    const boardId = url.searchParams.get("boardId");
    if (!boardId) return HttpResponse.json([], { status: 200 });
    return HttpResponse.json([mockIssue]);
  }),

  http.post("*/issues", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ...mockIssue,
      id: "new-issue",
      key: "BOARD-2",
      ...body,
    });
  }),

  http.patch("*/issues/batch", async ({ request }) => {
    const body = (await request.json()) as Array<{
      id: string;
      patch: Record<string, unknown>;
    }>;
    return HttpResponse.json(
      body.map((change) => ({
        ...mockIssue,
        ...change.patch,
        id: change.id,
      }))
    );
  }),

  http.patch("*/issues/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...mockIssue, id: params.id, ...body });
  }),

  http.get("*/boards", () => {
    return HttpResponse.json([mockBoard]);
  }),

  http.post("*/boards", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({ ...mockBoard, id: "new-board", name: body.name });
  }),

  http.get("*/boards/:boardId/sprints", () => {
    return HttpResponse.json([mockSprint]);
  }),

  http.post("*/boards/:boardId/sprints", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      ...mockSprint,
      id: "new-sprint",
      name: body.name,
    });
  }),

  http.patch("*/boards/:boardId/active-sprint", async ({ request }) => {
    const body = (await request.json()) as { sprintId: string };
    return HttpResponse.json({ ...mockSprint, id: body.sprintId });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("jiraClient", () => {
  describe("listIssues", () => {
    it("fetches issues with boardId query param", async () => {
      const issues = await jiraClient.listIssues({
        boardId: "board-1",
        sprintId: null,
      });

      expect(issues).toHaveLength(1);
      expect(issues[0].id).toBe("issue-1");
    });

    it("includes sprintId query param when provided", async () => {
      const issues = await jiraClient.listIssues({
        boardId: "board-1",
        sprintId: "sprint-1",
      });

      expect(issues).toHaveLength(1);
    });
  });

  describe("createIssue", () => {
    it("posts a new issue and returns it", async () => {
      const result = await jiraClient.createIssue({
        boardId: "board-1",
        sprintId: null,
        status: "backlog",
        order: 1000,
        title: "New Issue",
        description: "",
        assigneeId: null,
        watcherIds: [],
      });

      expect(result.title).toBe("New Issue");
      expect(result.id).toBe("new-issue");
    });
  });

  describe("patchIssue", () => {
    it("patches an issue and returns the updated version", async () => {
      const result = await jiraClient.patchIssue({
        id: "issue-1",
        patch: { title: "Updated Title" },
      });

      expect(result.title).toBe("Updated Title");
      expect(result.id).toBe("issue-1");
    });
  });

  describe("patchIssuesBatch", () => {
    it("sends batch patch and returns updated issues", async () => {
      const result = await jiraClient.patchIssuesBatch([
        { id: "issue-1", patch: { status: "done" } },
        { id: "issue-2", patch: { order: 2000 } },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("done");
    });
  });

  describe("listBoards", () => {
    it("fetches all boards", async () => {
      const boards = await jiraClient.listBoards();

      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe("Test Board");
    });
  });

  describe("createBoard", () => {
    it("creates a new board", async () => {
      const board = await jiraClient.createBoard({ name: "My Board" });

      expect(board.name).toBe("My Board");
      expect(board.id).toBe("new-board");
    });
  });

  describe("listSprints", () => {
    it("fetches sprints for a board", async () => {
      const sprints = await jiraClient.listSprints("board-1");

      expect(sprints).toHaveLength(1);
      expect(sprints[0].name).toBe("Sprint 1");
    });
  });

  describe("createSprint", () => {
    it("creates a new sprint", async () => {
      const sprint = await jiraClient.createSprint("board-1", {
        name: "Sprint 2",
      });

      expect(sprint.name).toBe("Sprint 2");
      expect(sprint.id).toBe("new-sprint");
    });
  });

  describe("setActiveSprint", () => {
    it("sets the active sprint for a board", async () => {
      const sprint = await jiraClient.setActiveSprint("board-1", "sprint-1");

      expect(sprint.id).toBe("sprint-1");
    });
  });

  describe("moveIssue", () => {
    it("moves an issue to a different sprint", async () => {
      const issue = await jiraClient.moveIssue({
        id: "issue-1",
        sprintId: "sprint-2",
      });

      expect(issue.sprintId).toBe("sprint-2");
    });

    it("moves an issue to backlog (null sprintId)", async () => {
      const issue = await jiraClient.moveIssue({
        id: "issue-1",
        sprintId: null,
      });

      expect(issue.id).toBe("issue-1");
    });
  });

  describe("error handling", () => {
    it("throws on non-OK responses", async () => {
      server.use(
        http.get("*/boards", () => {
          return new HttpResponse("Internal Server Error", { status: 500 });
        })
      );

      await expect(jiraClient.listBoards()).rejects.toThrow("Internal Server Error");
    });
  });
});
