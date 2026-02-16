import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchPeople } from "./searchPeople";

describe("searchPeople", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns results matching by name", async () => {
    const promise = searchPeople("James");
    vi.advanceTimersByTime(250);
    const results = await promise;

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((p) => p.fullName.toLowerCase().includes("james")),
    ).toBe(true);
  });

  it("returns results matching by email", async () => {
    const promise = searchPeople("susan@example");
    vi.advanceTimersByTime(250);
    const results = await promise;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fullName).toBe("Susan");
  });

  it("returns empty array for blank query", async () => {
    const promise = searchPeople("");
    vi.advanceTimersByTime(250);
    const results = await promise;

    expect(results).toEqual([]);
  });

  it("returns empty array for whitespace-only query", async () => {
    const promise = searchPeople("   ");
    vi.advanceTimersByTime(250);
    const results = await promise;

    expect(results).toEqual([]);
  });

  it("is case-insensitive", async () => {
    const promiseLower = searchPeople("james");
    vi.advanceTimersByTime(250);
    const lower = await promiseLower;

    vi.useFakeTimers();
    const promiseUpper = searchPeople("JAMES");
    vi.advanceTimersByTime(250);
    const upper = await promiseUpper;

    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it("throws AbortError when signal is aborted", async () => {
    const controller = new AbortController();
    const promise = searchPeople("test", controller.signal);

    controller.abort();
    vi.advanceTimersByTime(250);

    await expect(promise).rejects.toThrow("Aborted");
  });

  it("caps results at 500", async () => {
    // Use the big dataset and a broad query
    const promise = searchPeople("a", undefined, true);
    vi.advanceTimersByTime(250);
    const results = await promise;

    expect(results.length).toBeLessThanOrEqual(500);
  });
});
