export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;

  assigneeId: string | number | null;
  watcherIds: Array<string | number>;

  sprintId: string | null;
};
