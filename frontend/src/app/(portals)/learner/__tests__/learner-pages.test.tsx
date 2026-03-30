import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation for all pages that use useParams/usePathname/useRouter
vi.mock("next/navigation", () => ({
  usePathname: () => "/learner",
  useParams: () => ({ trackId: "TRK-ai-eng-001", lessonId: "LSN-001", podId: "POD-001" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import LearnerDashboard from "../page";
import RegisterPage from "../register/page";
import OnboardingPage from "../onboarding/page";
import FoundationPage from "../foundation/page";
import TrackCatalogPage from "../tracks/page";
import TrackDetailPage from "../tracks/[trackId]/page";
import ProgressPage from "../progress/page";
import LessonPage from "../lessons/[lessonId]/page";
import PodWorkspacePage from "../pods/[podId]/page";
import PaymentsPage from "../payments/page";
import CertificatesPage from "../certificates/page";

afterEach(() => {
  cleanup();
});

/** Wraps a component in QueryClientProvider for tests */
function withQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe("LearnerDashboard (home)", () => {
  it("renders without crashing and shows loading state", () => {
    const { container } = render(withQueryClient(<LearnerDashboard />));
    // Dashboard renders a loading skeleton while useQuery fetches data
    expect(container.querySelector(".skeleton")).toBeTruthy();
  });
});

describe("RegisterPage", () => {
  it("renders registration form with email, password, and confirm fields", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("shows validation errors for empty submission", async () => {
    render(<RegisterPage />);
    // Step 1 button is "Continue" in the multi-step form
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Valid email required")).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "SecurePass1");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "DifferentPass");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
  });
});

describe("OnboardingPage", () => {
  it("renders onboarding form", () => {
    render(<OnboardingPage />);
    expect(screen.getByText("Welcome to KoreField")).toBeInTheDocument();
  });
});

describe("FoundationPage", () => {
  it("renders AI Foundation School modules", () => {
    render(<FoundationPage />);
    expect(screen.getByText("AI Foundation School")).toBeInTheDocument();
  });
});

describe("TrackCatalogPage", () => {
  it("renders track catalog", () => {
    render(<TrackCatalogPage />);
    expect(screen.getByText(/track/i)).toBeInTheDocument();
  });
});

describe("TrackDetailPage", () => {
  it("renders track detail", () => {
    render(<TrackDetailPage />);
    expect(screen.getByText(/curriculum/i)).toBeInTheDocument();
  });
});

describe("ProgressPage", () => {
  it("renders progress dashboard", () => {
    render(<ProgressPage />);
    expect(screen.getByText(/progress/i)).toBeInTheDocument();
  });
});

describe("LessonPage", () => {
  it("renders lesson view", () => {
    render(<LessonPage />);
    expect(screen.getByText("Lesson Not Found")).toBeInTheDocument();
  });
});

describe("PodWorkspacePage", () => {
  it("renders pod workspace", () => {
    render(<PodWorkspacePage />);
    expect(screen.getByText("Pod Workspace")).toBeInTheDocument();
  });
});

describe("PaymentsPage", () => {
  it("renders payments page without crashing", () => {
    const { container } = render(withQueryClient(<PaymentsPage />));
    // Shows loading skeleton while useQuery fetches data
    expect(container.querySelector(".skeleton")).toBeTruthy();
  });
});

describe("CertificatesPage", () => {
  it("renders certificates page without crashing", () => {
    const { container } = render(withQueryClient(<CertificatesPage />));
    // Shows loading skeleton while useQuery fetches data
    expect(container.querySelector(".skeleton")).toBeTruthy();
  });
});
