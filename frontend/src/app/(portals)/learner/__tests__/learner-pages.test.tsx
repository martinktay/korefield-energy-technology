import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFeatureFlags } from "@/lib/feature-flags";

const navigationState = vi.hoisted(() => ({
  lessonId: "LSN-aie-101",
  routerPush: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  generateDiagnosticOnboarding: vi.fn(),
}));

// Mock next/navigation for all pages that use useParams/usePathname/useRouter
vi.mock("next/navigation", () => ({
  usePathname: () => "/learner",
  useParams: () => ({ trackId: "TRK-ai-eng-001", lessonId: navigationState.lessonId, podId: "POD-001" }),
  useRouter: () => ({ push: navigationState.routerPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: apiMocks.apiFetch,
}));

vi.mock("@/lib/agent-api", () => ({
  generateDiagnosticOnboarding: apiMocks.generateDiagnosticOnboarding,
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
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  localStorage.clear();
  apiMocks.apiFetch.mockReset();
  apiMocks.generateDiagnosticOnboarding.mockReset();
  navigationState.lessonId = "LSN-aie-101";
  navigationState.routerPush.mockReset();
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

  it("keeps the current rule-based onboarding path when AI flags are off", async () => {
    expect(getFeatureFlags({}).ai_diagnostic_onboarding).toBe(false);

    render(<OnboardingPage />);

    await userEvent.click(screen.getByLabelText("Nigeria"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Student"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Build AI applications"));
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));

    expect(screen.getByText("You're all set!")).toBeInTheDocument();
    expect(screen.getByText(/recommend starting with the AI Foundation School/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start AI Foundation School" }));
    expect(navigationState.routerPush).toHaveBeenCalledWith("/learner/foundation");
  });

  it("shows diagnostic onboarding when the AI diagnostic flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING", "true");
    apiMocks.generateDiagnosticOnboarding.mockResolvedValue({
      learner_id: "LRN-local-onboarding",
      starting_level: "beginner",
      recommended_track: "AI Engineering and Intelligent Systems",
      recommended_path: "AI Foundation School",
      weak_area_tags: ["prompting_basics", "python_foundations"],
      rationale: "Your project goal fits AI Engineering, and Foundation School will build the basics first.",
      focus_areas: ["AI vocabulary", "Python basics"],
      confidence: "medium",
      source: "ai",
      created_at: "2026-05-10T00:00:00Z",
      telemetry: { workflow: "diagnostic_onboarding", status: "completed" },
    });
    apiMocks.apiFetch.mockResolvedValue({});

    render(<OnboardingPage />);

    expect(screen.getByText(/Diagnostic step/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Nigeria"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Student"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Build AI applications"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Beginner"));
    await userEvent.click(screen.getByLabelText("New to AI"));
    await userEvent.click(screen.getByLabelText("Steady"));
    await userEvent.type(screen.getByLabelText(/What do you want to build/i), "A farm advisory assistant");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText(/Clear instructions that guide an AI response/i));
    await userEvent.click(screen.getByLabelText(/Use data to check whether the answer is reliable/i));
    await userEvent.click(screen.getByLabelText(/A reusable set of instructions and tools/i));
    await userEvent.click(screen.getByRole("button", { name: "Complete diagnostic" }));

    expect(await screen.findByText("Your recommended starting point")).toBeInTheDocument();
    expect(screen.getByText("AI Foundation School")).toBeInTheDocument();
    expect(screen.getByText(/Why this path fits you/i)).toBeInTheDocument();
    expect(apiMocks.generateDiagnosticOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "Nigeria",
        learner_role: "Student",
        project_interest: "A farm advisory assistant",
      }),
      "learner",
      "LRN-local-onboarding",
      expect.any(Object),
    );
    expect(apiMocks.apiFetch).toHaveBeenCalledWith(
      "/enrollment/diagnostic-results",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("falls back to a rule-based diagnostic result when AI diagnostic fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING", "true");
    apiMocks.generateDiagnosticOnboarding.mockRejectedValue(new Error("AI timeout"));
    apiMocks.apiFetch.mockResolvedValue({});

    render(<OnboardingPage />);

    await userEvent.click(screen.getByLabelText("Ghana"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Software Developer"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Transition into data science"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Intermediate"));
    await userEvent.click(screen.getByLabelText("Some AI basics"));
    await userEvent.click(screen.getByLabelText("Fast"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText(/Clear instructions that guide an AI response/i));
    await userEvent.click(screen.getByLabelText(/Use data to check whether the answer is reliable/i));
    await userEvent.click(screen.getByLabelText(/A reusable set of instructions and tools/i));
    await userEvent.click(screen.getByRole("button", { name: "Complete diagnostic" }));

    expect(await screen.findByText("Your recommended starting point")).toBeInTheDocument();
    expect(screen.getByText(/Based on your answers, Foundation School is the safest starting point/i)).toBeInTheDocument();
    expect(apiMocks.apiFetch).toHaveBeenCalledWith(
      "/enrollment/diagnostic-results",
      expect.objectContaining({
        body: expect.stringContaining('"source":"fallback"'),
      }),
    );
  });

  it("preserves diagnostic onboarding draft answers locally", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING", "true");

    render(<OnboardingPage />);

    await userEvent.click(screen.getByLabelText("Kenya"));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByLabelText("Educator"));

    expect(localStorage.getItem("kf_ai_diagnostic_onboarding_v1")).toContain("Kenya");
    expect(localStorage.getItem("kf_ai_diagnostic_onboarding_v1")).toContain("Educator");
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

  it("shows the existing static next recommended lesson while adaptive recommendations are off", () => {
    expect(getFeatureFlags({}).ai_adaptive_recommendations).toBe(false);

    render(<ProgressPage />);

    expect(screen.getByText("Next Recommended Lesson")).toBeInTheDocument();
    expect(screen.getByText("REST API Authentication Patterns")).toBeInTheDocument();
  });
});

describe("LessonPage", () => {
  it("renders lesson view", () => {
    render(<LessonPage />);
    expect(screen.getByText("Variables, Types, and Data Structures")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Learn/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Practice/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply/i })).toBeInTheDocument();
  });

  it("keeps lesson submissions working without AI submission feedback", async () => {
    expect(getFeatureFlags({}).ai_submission_feedback).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("AI service unavailable");
    }));

    render(<LessonPage />);

    await userEvent.click(screen.getByRole("button", { name: /Apply/i }));
    await userEvent.type(screen.getByPlaceholderText("Paste or type your deliverable here..."), "My deliverable draft");
    await userEvent.click(screen.getByRole("button", { name: /Submit Deliverable/i }));

    expect(screen.getByText("Deliverable Submitted")).toBeInTheDocument();
    expect(screen.queryByText(/AI feedback/i)).not.toBeInTheDocument();
  });

  it("keeps the coding lab path visible while the AI tutor flag is off", async () => {
    expect(getFeatureFlags({}).ai_lesson_tutor).toBe(false);
    navigationState.lessonId = "LSN-aie-102";

    render(<LessonPage />);

    await userEvent.click(screen.getByRole("button", { name: /Practice/i }));

    expect(screen.getByText("Code Editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run/i })).toBeInTheDocument();
    expect(screen.queryByText(/AI Tutor/i)).not.toBeInTheDocument();
  });

  it("keeps the quiz path intact while adaptive AI is off", async () => {
    expect(getFeatureFlags({}).ai_adaptive_recommendations).toBe(false);
    navigationState.lessonId = "LSN-aie-103";

    render(<LessonPage />);

    await userEvent.click(screen.getByRole("button", { name: /Practice/i }));

    expect(screen.getByRole("heading", { name: /Python for AI .* Module Assessment/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^A\b/i }).length).toBeGreaterThan(0);
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
