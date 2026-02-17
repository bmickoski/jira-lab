import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryState } from "./QueryState";

describe("QueryState", () => {
  it("renders loading state", () => {
    render(
      <QueryState isLoading isError={false}>
        <div>Content</div>
      </QueryState>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders children when loaded successfully", () => {
    render(
      <QueryState isLoading={false} isError={false}>
        <div>Content</div>
      </QueryState>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(
      <QueryState isLoading={false} isError error={new Error("Network error")}>
        <div>Content</div>
      </QueryState>
    );

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    render(
      <QueryState isLoading={false} isError error={new Error("fail")} onRetry={() => {}}>
        <div>Content</div>
      </QueryState>
    );

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(
      <QueryState isLoading={false} isError error={new Error("fail")}>
        <div>Content</div>
      </QueryState>
    );

    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <QueryState isLoading={false} isError error={new Error("fail")} onRetry={onRetry}>
        <div>Content</div>
      </QueryState>
    );

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
