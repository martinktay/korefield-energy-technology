import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation for all pages that use useParams/usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/learner",
  useParams: () => ({ trackId: "TRK-ai-eng-001", lessonId: "LSN-001", podId: "POD-001" }),
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

describe("LearnerDashboard (home)", () => {
  it("renders page title and track progress cards", () => {
    render(<LearnerDashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Tracks")).toBeInTheDocument();
    expect(screen.getByText("AI Engineering and Intelligent Systems")).toBeInTheDocument();
  });

  it("renders upcoming activities section", () => {
    render(<LearnerDashboard />);
    expect(screen.getByText("Upcoming Activities")).toBeInTheDocument();
    expect(screen.getByText("Lab Session: REST API Design")).toBeInTheDocument();
  });

  it("renders progress bars with correct aria attributes", () => {
    render(<LearnerDashboard />);
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "33");
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
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    render(<RegisterPage />);
    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "SecurePass1");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "DifferentPass");
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });
});

describe("OnboardingPage", () => {
  it("renders onboarding form", () => {
    render(<OnboardingPage />);
    expect(screen.getByText(/onboarding/i)).toBeInTheDocument();
  });
});

describe("FoundationPage", () => {
  it("renders AI Foundation School modules", () => {
    render(<FoundationPage />);
    expect(screen.getByText(/foundation/i)).toBeInTheDocument();
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
    expect(screen.getByText(/lesson/i)).toBeInTheDocument();
  });
});

describe("PodWorkspacePage", () => {
  it("renders pod workspace", () => {
    render(<PodWorkspacePage />);
    expect(screen.getByText(/pod/i)).toBeInTheDocument();
  });
});

describe("PaymentsPage", () => {
  it("renders payments page", () => {
    render(<PaymentsPage />);
    expect(screen.getByText(/payment/i)).toBeInTheDocument();
  });
});

describe("CertificatesPage", () => {
  it("renders certificates page", () => {
    render(<CertificatesPage />);
    expect(screen.getByText(/certificate/i)).toBeInTheDocument();
  });
});