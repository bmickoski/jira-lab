import type { Issue, IssueStatus } from "./types";

export function parseDropStatus(id: string | null): IssueStatus | null {
  if (!id) return null;
  return id.startsWith("status:") ? (id.replace("status:", "") as IssueStatus) : null;
}

export function normalizeOrders(list: Issue[]) {
  return list.slice().map((it, idx) => ({ ...it, order: (idx + 1) * 1000 }));
}

export function canShowStatus(view: "backlog" | "sprint", s: IssueStatus) {
  return view === "backlog" ? s === "backlog" : s !== "backlog";
}
export function nextOrderForStatus(issues: Issue[], status: IssueStatus) {
  const max = issues
    .filter((i) => i.status === status)
    .reduce((m, it) => Math.max(m, it.order ?? 0), 0);

  return max + 1000;
}
