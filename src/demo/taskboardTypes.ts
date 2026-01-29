export type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId: string | number | null;
  watcherIds: Array<string | number>;
};
