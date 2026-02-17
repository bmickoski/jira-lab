import type { Issue, IssueStatus } from "./types";

export type IssueFilters = {
  search: string;
  status: IssueStatus | null;
  assigneeId: string | number | null;
};

export const emptyFilters: IssueFilters = {
  search: "",
  status: null,
  assigneeId: null,
};

export function hasActiveFilters(filters: IssueFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== null ||
    filters.assigneeId !== null
  );
}

export function filterIssues(issues: Issue[], filters: IssueFilters): Issue[] {
  const q = filters.search.trim().toLowerCase();

  return issues.filter((issue) => {
    if (q && !matchesSearch(issue, q)) return false;
    if (filters.status && issue.status !== filters.status) return false;
    if (
      filters.assigneeId !== null &&
      issue.assigneeId !== filters.assigneeId
    )
      return false;
    return true;
  });
}

function matchesSearch(issue: Issue, query: string): boolean {
  return (
    issue.title.toLowerCase().includes(query) ||
    issue.key.toLowerCase().includes(query) ||
    issue.description.toLowerCase().includes(query)
  );
}
