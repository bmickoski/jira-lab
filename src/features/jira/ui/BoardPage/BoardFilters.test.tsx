import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardFilters } from "./BoardFilters";
import { emptyFilters } from "../../domain/issueFilters";

describe("BoardFilters", () => {
  it("renders search input and status select", () => {
    render(
      <BoardFilters
        filters={emptyFilters}
        onChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );

    expect(screen.getByLabelText("Search issues")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
  });

  it("does not show clear button or count when filters are empty", () => {
    render(
      <BoardFilters
        filters={emptyFilters}
        onChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
    expect(screen.queryByText(/of.*issues/)).not.toBeInTheDocument();
  });

  it("shows clear button and count when filters are active", () => {
    render(
      <BoardFilters
        filters={{ ...emptyFilters, search: "bug" }}
        onChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );

    expect(screen.getByText("Clear filters")).toBeInTheDocument();
    expect(screen.getByText("3 of 10 issues")).toBeInTheDocument();
  });

  it("calls onChange when typing in search", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BoardFilters
        filters={emptyFilters}
        onChange={onChange}
        totalCount={10}
        filteredCount={10}
      />,
    );

    await user.type(screen.getByLabelText("Search issues"), "b");

    expect(onChange).toHaveBeenCalledWith({
      ...emptyFilters,
      search: "b",
    });
  });

  it("calls onChange when selecting a status", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BoardFilters
        filters={emptyFilters}
        onChange={onChange}
        totalCount={10}
        filteredCount={10}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Filter by status"), "todo");

    expect(onChange).toHaveBeenCalledWith({
      ...emptyFilters,
      status: "todo",
    });
  });

  it("clears all filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BoardFilters
        filters={{ search: "bug", status: "todo", assigneeId: "u1" }}
        onChange={onChange}
        totalCount={10}
        filteredCount={2}
      />,
    );

    await user.click(screen.getByText("Clear filters"));

    expect(onChange).toHaveBeenCalledWith({
      search: "",
      status: null,
      assigneeId: null,
    });
  });
});
