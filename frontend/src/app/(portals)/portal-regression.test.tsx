import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({
  pathname: "/learner",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routeState.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(async () => {
    throw new Error("backend unavailable in regression test");
  }),
}));

import CorporateDashboard from "./corporate/page";
import CorporateLayout from "./corporate/layout";
import InstructorDashboard from "./instructor/page";
import InstructorLayout from "./instructor/layout";
import LearnerLayout from "./learner/layout";

afterEach(() => {
  cleanup();
  routeState.pathname = "/learner";
});

function withQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe("portal dashboard regression coverage", () => {
  it("loads the instructor dashboard with existing fallback data", async () => {
    render(withQueryClient(<InstructorDashboard />));

    await waitFor(() => {
      expect(screen.getByText("Instructor Dashboard")).toBeInTheDocument();
    });
    expect(screen.getByText("Assigned Cohorts")).toBeInTheDocument();
    expect(screen.getByText("Learner Risk Flags")).toBeInTheDocument();
  });

  it("loads the corporate dashboard with current cohort summary content", () => {
    render(<CorporateDashboard />);

    expect(screen.getByText("Corporate Dashboard")).toBeInTheDocument();
    expect(screen.getAllByText("Sponsored Learners").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });
});

describe("current portal route boundary behavior", () => {
  it("keeps learner auth routes outside the portal navigation shell", () => {
    routeState.pathname = "/learner/register";

    render(
      <LearnerLayout>
        <div>Create account form</div>
      </LearnerLayout>,
    );

    expect(screen.getByText("Create account form")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Sidebar navigation" })).not.toBeInTheDocument();
  });

  it("keeps learner portal routes inside the learner navigation shell", () => {
    routeState.pathname = "/learner/progress";

    render(
      <LearnerLayout>
        <div>Progress content</div>
      </LearnerLayout>,
    );

    expect(screen.getByText("Learner Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeInTheDocument();
  });

  it("keeps instructor and corporate dashboards inside their portal shells", () => {
    routeState.pathname = "/instructor";
    const { unmount } = render(
      <InstructorLayout>
        <div>Instructor content</div>
      </InstructorLayout>,
    );
    expect(screen.getByText("Instructor Portal")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeInTheDocument();
    unmount();

    routeState.pathname = "/corporate";
    render(
      <CorporateLayout>
        <div>Corporate content</div>
      </CorporateLayout>,
    );
    expect(screen.getByText("Corporate Portal")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeInTheDocument();
  });
});
