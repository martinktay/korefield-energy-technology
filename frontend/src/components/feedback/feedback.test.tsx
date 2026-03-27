import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

afterEach(() => {
  cleanup();
});

describe("LoadingState", () => {
  it("renders skeleton rows with accessible status role", () => {
    render(<LoadingState rows={2} label="Loading tracks" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading tracks")).toBeInTheDocument();
  });

  it("defaults to 3 rows and generic label", () => {
    const { container } = render(<LoadingState />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading content"
    );
    // 1 title skeleton + 3 row groups × 2 lines each = 7 skeleton divs with bg-surface-200
    const skeletons = container.querySelectorAll(".bg-surface-200");
    expect(skeletons.length).toBe(7);
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No tracks" description="Enroll in a track to begin" />
    );
    expect(screen.getByText("No tracks")).toBeInTheDocument();
    expect(screen.getByText("Enroll in a track to begin")).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(
      <EmptyState
        title="No tracks"
        action={<button>Browse catalog</button>}
      />
    );
    expect(
      screen.getByRole("button", { name: "Browse catalog" })
    ).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(0);
  });
});

describe("ErrorState", () => {
  it("renders default title and message with alert role", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(<ErrorState title="Network error" message="Check connection" />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByText("Check connection")).toBeInTheDocument();
  });

  it("renders retry button that calls onRetry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const btn = screen.getByRole("button", { name: "Try again" });
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not render retry button when onRetry is omitted", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
