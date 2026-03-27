import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";
import { NavigationShell } from "./navigation-shell";
import { useUIStore } from "@/stores/ui-store";

// Mock next/navigation for Sidebar's usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/learner",
}));

afterEach(() => {
  cleanup();
  // Reset zustand store between tests
  useUIStore.setState({ sidebarOpen: false, sidebarCollapsed: false });
});

const sampleNav = [
  { label: "Dashboard", href: "/learner" },
  { label: "Tracks", href: "/learner/tracks" },
];

describe("TopBar", () => {
  it("renders portal name and logo", () => {
    render(<TopBar portalName="Learner Dashboard" />);
    expect(screen.getByText("KoreField")).toBeInTheDocument();
    expect(screen.getByText("Learner Dashboard")).toBeInTheDocument();
  });

  it("renders hamburger button for mobile with accessible label", () => {
    render(<TopBar portalName="Test" />);
    expect(
      screen.getByRole("button", { name: "Toggle navigation menu" })
    ).toBeInTheDocument();
  });
});

describe("NavigationShell", () => {
  it("renders top bar, sidebar nav items, and children", () => {
    render(
      <NavigationShell portalName="Learner Dashboard" navItems={sampleNav}>
        <div>Page content</div>
      </NavigationShell>
    );
    expect(screen.getByText("Learner Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();

    const sidebar = screen.getByRole("navigation", {
      name: "Sidebar navigation",
    });
    expect(within(sidebar).getByText("Dashboard")).toBeInTheDocument();
    expect(within(sidebar).getByText("Tracks")).toBeInTheDocument();
  });

  it("highlights active nav item with aria-current", () => {
    render(
      <NavigationShell portalName="Test" navItems={sampleNav}>
        <div />
      </NavigationShell>
    );
    const sidebar = screen.getByRole("navigation", {
      name: "Sidebar navigation",
    });
    const dashboardLink = within(sidebar).getByRole("link", {
      name: "Dashboard",
    });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");

    const tracksLink = within(sidebar).getByRole("link", { name: "Tracks" });
    expect(tracksLink).not.toHaveAttribute("aria-current");
  });

  it("toggles sidebar visibility on hamburger click", async () => {
    render(
      <NavigationShell portalName="Test" navItems={sampleNav}>
        <div />
      </NavigationShell>
    );
    // Use the top-bar hamburger (inside the header)
    const header = screen.getByRole("banner");
    const hamburger = within(header).getByRole("button", {
      name: "Toggle navigation menu",
    });
    const sidebar = screen.getByRole("navigation", {
      name: "Sidebar navigation",
    });

    // Initially hidden on mobile (has -translate-x-full)
    expect(sidebar.className).toContain("-translate-x-full");

    // Click hamburger to open
    await userEvent.click(hamburger);
    expect(sidebar.className).toContain("translate-x-0");
    expect(sidebar.className).not.toContain("-translate-x-full");
  });
});
