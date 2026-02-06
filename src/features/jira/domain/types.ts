export type IssueStatus = "backlog" | "todo" | "in_progress" | "done";

export type Board = { id: string; name: string };

export type Sprint = {
  id: string;
  boardId: string;
  name: string;
  isActive: boolean;
};

export type Issue = {
  id: string;
  key: string;
  boardId: string;
  sprintId: string | null;
  status: IssueStatus;
  order: number;

  title: string;
  description: string;

  assigneeId: string | number | null;
  watcherIds: Array<string | number>;
};

export type IssueDraft = {
  boardId: string;
  sprintId: string | null;
  status: IssueStatus;

  title: string;
  description: string;

  assigneeId: string | number | null;
  watcherIds: Array<string | number>;
};
