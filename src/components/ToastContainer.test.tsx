import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastContainer } from "./ToastContainer";
import { useToastStore } from "@/stores/toastStore";

describe("ToastContainer", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when no toasts exist", () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe("");
  });

  it("renders toast messages from the store", () => {
    useToastStore.getState().addToast({
      type: "error",
      message: "Something went wrong",
      duration: 0,
    });

    render(<ToastContainer />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    const { addToast } = useToastStore.getState();
    addToast({ type: "error", message: "Error happened", duration: 0 });
    addToast({ type: "success", message: "All good", duration: 0 });

    render(<ToastContainer />);

    expect(screen.getByText("Error happened")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("dismisses toast when close button is clicked", async () => {
    const user = userEvent.setup();

    useToastStore.getState().addToast({
      type: "error",
      message: "Dismiss me",
      duration: 0,
    });

    render(<ToastContainer />);

    expect(screen.getByText("Dismiss me")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Dismiss notification"));

    await waitFor(() => {
      expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
    });
  });

  it("applies error styling for error toasts", () => {
    useToastStore.getState().addToast({
      type: "error",
      message: "Error toast",
      duration: 0,
    });

    render(<ToastContainer />);

    const toastEl = screen.getByText("Error toast").closest("div.flex");
    expect(toastEl?.className).toContain("border-red-500/20");
  });

  it("applies success styling for success toasts", () => {
    useToastStore.getState().addToast({
      type: "success",
      message: "Success toast",
      duration: 0,
    });

    render(<ToastContainer />);

    const toastEl = screen.getByText("Success toast").closest("div.flex");
    expect(toastEl?.className).toContain("border-emerald-500/20");
  });

  it("has proper ARIA attributes for accessibility", () => {
    useToastStore.getState().addToast({
      type: "info",
      message: "Info toast",
      duration: 0,
    });

    render(<ToastContainer />);

    const container = screen.getByRole("status");
    expect(container).toHaveAttribute("aria-live", "polite");
  });
});
