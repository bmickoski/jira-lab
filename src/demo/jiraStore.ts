import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IssueStatus = "backlog" | "todo" | "in_progress" | "done";

export type Board = {
  id: string; // B-1
  name: string;
};

export type Sprint = {
  id: string; // S-1
  boardId: string;
  name: string;
  isActive: boolean;
};

export type Issue = {
  id: string; // internal uuid
  key: string; // ISSUE-101
  boardId: string;
  sprintId: string | null; // null = backlog
  status: IssueStatus;

  // ✅ Phase 2: stable ordering inside each column
  order: number;

  title: string;
  description: string;

  assigneeId: string | number | null;
  watcherIds: Array<string | number>;
};

export type IssueDraft = Omit<Issue, "id" | "key">;

export type JiraState = {
  // --- entities ---
  boards: Board[];
  sprints: Sprint[];
  issues: Issue[];

  // --- ui state ---
  selectedIssueId: string | null;
  draftIssue: IssueDraft | null;

  // --- counters ---
  nextBoardNumber: number;
  nextSprintNumber: number;
  nextIssueNumber: number;

  // --- board actions ---
  createBoard: (name: string) => Board;
  resetDemoData: () => void;

  // --- sprint actions ---
  createSprint: (boardId: string, name: string, isActive?: boolean) => Sprint;
  setActiveSprint: (boardId: string, sprintId: string) => void;

  // --- issue actions ---
  openIssue: (issueId: string) => void;
  closeIssue: () => void;

  openNewIssue: (seed: {
    boardId: string;
    sprintId: string | null;
    status: IssueStatus;
  }) => void;

  updateDraft: (patch: Partial<IssueDraft>) => void;
  discardDraft: () => void;
  saveDraft: () => void;

  updateIssue: (id: string, patch: Partial<Issue>) => void;

  // ✅ Phase 2 helper: batch patch (avoids multiple set() during DnD)
  applyIssueChanges: (
    changes: Array<{ id: string; patch: Partial<Issue> }>,
  ) => void;
};

function newId() {
  return crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random()}`;
}

function boardKey(n: number) {
  return `B-${n}`;
}

function sprintKey(n: number) {
  return `S-${n}`;
}

function issueKey(n: number) {
  return `ISSUE-${n}`;
}

function makeDemoState() {
  const b1: Board = { id: "B-1", name: "Core UI" };
  const b2: Board = { id: "B-2", name: "Picker Lab" };

  const s1: Sprint = {
    id: "S-1",
    boardId: b1.id,
    name: "Sprint 1 (active)",
    isActive: true,
  };
  const s2: Sprint = {
    id: "S-2",
    boardId: b1.id,
    name: "Sprint 2",
    isActive: false,
  };
  const s3: Sprint = {
    id: "S-3",
    boardId: b2.id,
    name: "Sprint 1 (active)",
    isActive: true,
  };

  const issues: Issue[] = [
    {
      id: newId(),
      key: "ISSUE-101",
      boardId: b1.id,
      sprintId: s1.id,
      status: "in_progress",
      order: 1000,
      title: "Fix multi picker selection lag",
      description: "Improve focus handling + mousedown selection on big lists.",
      assigneeId: null,
      watcherIds: [],
    },
    {
      id: newId(),
      key: "ISSUE-102",
      boardId: b1.id,
      sprintId: s1.id,
      status: "todo",
      order: 1000,
      title: "Draft flow for New Issue",
      description: "Create issue only on Save; allow Cancel.",
      assigneeId: null,
      watcherIds: [],
    },
    {
      id: newId(),
      key: "ISSUE-103",
      boardId: b2.id,
      sprintId: null,
      status: "backlog",
      order: 1000,
      title: "Virtualize dropdown rows",
      description: "Use react-virtual for huge results (10k+).",
      assigneeId: null,
      watcherIds: [],
    },
  ];

  return {
    boards: [b1, b2],
    sprints: [s1, s2, s3],
    issues,
    nextBoardNumber: 3,
    nextSprintNumber: 4,
    nextIssueNumber: 104,
  };
}

export const useJiraStore = create<JiraState>()(
  persist(
    (set, get) => {
      const demo = makeDemoState();

      function getNextOrder(args: {
        boardId: string;
        sprintId: string | null;
        status: IssueStatus;
      }) {
        const all = get().issues;
        const inSameColumn = all
          .filter(
            (i) =>
              i.boardId === args.boardId &&
              i.sprintId === args.sprintId &&
              i.status === args.status,
          )
          .sort((a, b) => a.order - b.order);

        const last = inSameColumn[inSameColumn.length - 1];
        return last ? last.order + 1000 : 1000;
      }

      return {
        // --- entities ---
        boards: demo.boards,
        sprints: demo.sprints,
        issues: demo.issues,

        // --- ui ---
        selectedIssueId: null,
        draftIssue: null,

        // --- counters ---
        nextBoardNumber: demo.nextBoardNumber,
        nextSprintNumber: demo.nextSprintNumber,
        nextIssueNumber: demo.nextIssueNumber,

        // --- board actions ---
        createBoard: (name: string) => {
          const n = name.trim() || "Untitled board";
          const id = boardKey(get().nextBoardNumber);

          const board: Board = { id, name: n };

          const sprintId = sprintKey(get().nextSprintNumber);
          const sprint: Sprint = {
            id: sprintId,
            boardId: id,
            name: "Sprint 1 (active)",
            isActive: true,
          };

          set((s) => ({
            boards: [board, ...s.boards],
            sprints: [sprint, ...s.sprints],
            nextBoardNumber: s.nextBoardNumber + 1,
            nextSprintNumber: s.nextSprintNumber + 1,
          }));

          return board;
        },

        resetDemoData: () => {
          const d = makeDemoState();
          set({
            boards: d.boards,
            sprints: d.sprints,
            issues: d.issues,
            selectedIssueId: null,
            draftIssue: null,
            nextBoardNumber: d.nextBoardNumber,
            nextSprintNumber: d.nextSprintNumber,
            nextIssueNumber: d.nextIssueNumber,
          });
        },

        // --- sprint actions ---
        createSprint: (boardId: string, name: string, isActive = false) => {
          const sprint: Sprint = {
            id: sprintKey(get().nextSprintNumber),
            boardId,
            name: name.trim() || "New sprint",
            isActive,
          };

          set((s) => ({
            sprints: isActive
              ? [
                  sprint,
                  ...s.sprints.map((sp) =>
                    sp.boardId === boardId ? { ...sp, isActive: false } : sp,
                  ),
                ]
              : [sprint, ...s.sprints],
            nextSprintNumber: s.nextSprintNumber + 1,
          }));

          return sprint;
        },

        setActiveSprint: (boardId: string, sprintId: string) => {
          set((s) => ({
            sprints: s.sprints.map((sp) => {
              if (sp.boardId !== boardId) return sp;
              return { ...sp, isActive: sp.id === sprintId };
            }),
          }));
        },

        // --- issue actions ---
        openIssue: (issueId: string) =>
          set({
            selectedIssueId: issueId,
            draftIssue: null,
          }),

        closeIssue: () => set({ selectedIssueId: null }),

        openNewIssue: ({ boardId, sprintId, status }) =>
          set({
            selectedIssueId: null,
            draftIssue: {
              boardId,
              sprintId,
              status,
              // ✅ seed order so draft already "knows" where it would land
              order: getNextOrder({ boardId, sprintId, status }),
              title: "",
              description: "",
              assigneeId: null,
              watcherIds: [],
            },
          }),

        updateDraft: (patch) =>
          set((s) =>
            s.draftIssue ? { draftIssue: { ...s.draftIssue, ...patch } } : s,
          ),

        discardDraft: () => set({ draftIssue: null }),

        saveDraft: () => {
          const { draftIssue, nextIssueNumber, issues } = get();
          if (!draftIssue) return;

          const title = draftIssue.title.trim();
          if (!title) return;

          // ✅ ensure order exists (safe if draft was created before this change)
          const order =
            typeof draftIssue.order === "number"
              ? draftIssue.order
              : getNextOrder({
                  boardId: draftIssue.boardId,
                  sprintId: draftIssue.sprintId,
                  status: draftIssue.status,
                });

          const issue: Issue = {
            id: newId(),
            key: issueKey(nextIssueNumber),
            ...draftIssue,
            order,
            title,
            description: draftIssue.description?.trim?.() ?? "",
          };

          set({
            issues: [issue, ...issues],
            draftIssue: null,
            selectedIssueId: issue.id,
            nextIssueNumber: nextIssueNumber + 1,
          });
        },

        updateIssue: (id, patch) =>
          set((s) => ({
            issues: s.issues.map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          })),

        applyIssueChanges: (changes) =>
          set((s) => {
            if (changes.length === 0) return s;

            const byId = new Map(changes.map((c) => [c.id, c.patch]));
            return {
              issues: s.issues.map((it) => {
                const patch = byId.get(it.id);
                return patch ? { ...it, ...patch } : it;
              }),
            };
          }),
      };
    },
    {
      name: "jira-lab:store",
      partialize: (s) => ({
        boards: s.boards,
        sprints: s.sprints,
        issues: s.issues,
        nextBoardNumber: s.nextBoardNumber,
        nextSprintNumber: s.nextSprintNumber,
        nextIssueNumber: s.nextIssueNumber,
      }),
    },
  ),
);
