import React from "react";
import type { IssueStatus } from "../../domain/types";
import type { IssueFilters } from "../../domain/issueFilters";
import { hasActiveFilters } from "../../domain/issueFilters";

const STATUS_OPTIONS: Array<{ value: IssueStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const BoardFilters = React.memo(function BoardFilters(props: {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  totalCount: number;
  filteredCount: number;
}) {
  const { filters, onChange, totalCount, filteredCount } = props;
  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search issues..."
        aria-label="Search issues"
        className="w-48 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
      />

      <select
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            status: (e.target.value as IssueStatus) || null,
          })
        }
        aria-label="Filter by status"
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {active && (
        <>
          <button
            type="button"
            onClick={() => onChange({ search: "", status: null, assigneeId: null })}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Clear filters
          </button>

          <span className="text-xs text-white/50">
            {filteredCount} of {totalCount} issues
          </span>
        </>
      )}
    </div>
  );
});
