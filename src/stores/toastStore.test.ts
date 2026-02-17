import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useToastStore, toast } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  describe("addToast", () => {
    it("adds a toast with a unique ID", () => {
      useToastStore.getState().addToast({
        type: "error",
        message: "Something failed",
        duration: 0,
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe("error");
      expect(toasts[0].message).toBe("Something failed");
      expect(toasts[0].id).toMatch(/^toast_/);
    });

    it("returns the toast ID", () => {
      const id = useToastStore.getState().addToast({
        type: "info",
        message: "Hello",
        duration: 0,
      });

      expect(id).toMatch(/^toast_/);
    });

    it("supports multiple concurrent toasts", () => {
      const { addToast } = useToastStore.getState();
      const id1 = addToast({ type: "error", message: "Error 1", duration: 0 });
      const id2 = addToast({ type: "success", message: "Done", duration: 0 });
      const id3 = addToast({ type: "info", message: "Info", duration: 0 });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(3);
      expect(new Set([id1, id2, id3]).size).toBe(3);
    });
  });

  describe("dismissToast", () => {
    it("removes the specified toast", () => {
      const { addToast } = useToastStore.getState();
      const id1 = addToast({ type: "error", message: "A", duration: 0 });
      const id2 = addToast({ type: "info", message: "B", duration: 0 });

      useToastStore.getState().dismissToast(id1);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });

    it("does nothing for unknown ID", () => {
      useToastStore.getState().addToast({
        type: "error",
        message: "A",
        duration: 0,
      });

      useToastStore.getState().dismissToast("nonexistent");

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe("auto-dismiss", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("removes toast after specified duration", () => {
      useToastStore.getState().addToast({
        type: "error",
        message: "Temporary",
        duration: 3000,
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("does not auto-dismiss when duration is 0", () => {
      useToastStore.getState().addToast({
        type: "error",
        message: "Persistent",
        duration: 0,
      });

      vi.advanceTimersByTime(10000);

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe("toast helper", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("creates error toast with 5000ms default duration", () => {
      toast("error", "Oops");

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe("error");
      expect(toasts[0].duration).toBe(5000);

      vi.advanceTimersByTime(5000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("creates success toast with 3000ms default duration", () => {
      toast("success", "Done!");

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe("success");
      expect(toasts[0].duration).toBe(3000);
    });

    it("creates info toast with 4000ms default duration", () => {
      toast("info", "FYI");

      expect(useToastStore.getState().toasts[0].duration).toBe(4000);
    });

    it("allows custom duration override", () => {
      toast("error", "Custom", 1000);

      expect(useToastStore.getState().toasts[0].duration).toBe(1000);

      vi.advanceTimersByTime(1000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
