import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("updates after the specified delay", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: "hello", delay: 300 },
    });

    rerender({ value: "world", delay: 300 });

    // Before delay: still old value
    expect(result.current).toBe("hello");

    // After delay: updated
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("world");
  });

  it("resets the timer on rapid changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // "b" should have been cancelled, still "a"
    expect(result.current).toBe("a");

    // After full delay from last change, should be "c"
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("c");
  });

  it("works with number values", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 100), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });
});
