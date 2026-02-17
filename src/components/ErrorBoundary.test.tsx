import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";
import { useState } from "react";

// Suppress React error boundary console.error noise in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Boom!");
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders default fallback when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Boom!")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div>
            <span>Custom: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <Bomb shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom: Boom!")).toBeInTheDocument();
  });

  it("resets and re-renders children when retry is clicked", async () => {
    const user = userEvent.setup();

    function TestApp() {
      const [fail, setFail] = useState(true);

      return (
        <ErrorBoundary
          fallback={({ error, reset }) => (
            <div>
              <span>Error: {error.message}</span>
              <button
                onClick={() => {
                  setFail(false);
                  reset();
                }}
              >
                Fix and retry
              </button>
            </div>
          )}
        >
          <Bomb shouldThrow={fail} />
        </ErrorBoundary>
      );
    }

    render(<TestApp />);

    // First: error state
    expect(screen.getByText("Error: Boom!")).toBeInTheDocument();

    // Click retry after fixing the issue
    await user.click(screen.getByText("Fix and retry"));

    // Now children render successfully
    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});
