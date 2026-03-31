import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import ContentPage from "./page";

// Mock the content store
vi.mock("@/stores/content-store", () => ({
  useContentStore: () => ({
    getTrackNames: () => ["AI Engineering"],
    getAllModules: () => [{
      id: "MOD-1", name: "Test Module", trackName: "AI Engineering", levelTier: "Beginner",
      lessonCount: 1,
      lessons: [{ id: "LSN-1", title: "Existing Lesson", lessonType: "text", sequence: 1 }],
    }],
    getModulesForTrack: () => [{
      id: "MOD-1", name: "Test Module", trackName: "AI Engineering", levelTier: "Beginner",
      lessonCount: 1,
      lessons: [{ id: "LSN-1", title: "Existing Lesson", lessonType: "text", sequence: 1 }],
    }],
    getLessonById: () => null,
    addLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    addModule: vi.fn(),
    getTracks: () => [],
  }),
}));

// Mock the api module
vi.mock("@/lib/api", () => ({
  uploadFile: vi.fn(),
  NetworkError: class extends Error {},
  TimeoutError: class extends Error {},
}));

// Mock AssessmentBuilder
vi.mock("@/components/content", () => ({
  AssessmentBuilder: () => null,
}));

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CONTENT_TYPE_LABELS = ["Text", "Video", "Video / Text", "Code Exercise", "Quiz", "Downloadable"];

function renderPage() {
  return render(<ContentPage />);
}

function openLessonDialog() {
  const moduleBtn = screen.getByText("Test Module");
  fireEvent.click(moduleBtn);
  const addBtn = screen.getByText("Add Lesson");
  fireEvent.click(addBtn);
}

function selectContentType(label: string) {
  const btn = screen.getByRole("button", { name: label });
  fireEvent.click(btn);
}

// Feature: portal-feedback-and-content-gaps
// Property 11: Selecting video_text content type shows both URL and text fields
// **Validates: Requirements 7.2**
describe("Property 11: Selecting video_text shows both URL and text fields", () => {
  it("video_text shows Cloudflare Stream URL input and text content textarea", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CONTENT_TYPE_LABELS), (label) => {
        cleanup();
        Element.prototype.scrollIntoView = vi.fn();
        renderPage();
        openLessonDialog();
        selectContentType(label);

        const hasUrlInput = screen.queryByPlaceholderText("https://stream.cloudflare.com/...") !== null;
        const hasTextarea = screen.queryByPlaceholderText("Write accompanying text content in markdown...") !== null;

        if (label === "Video / Text") {
          expect(hasUrlInput).toBe(true);
          expect(hasTextarea).toBe(true);
        } else if (label === "Video") {
          expect(hasUrlInput).toBe(true);
          expect(hasTextarea).toBe(false);
        } else {
          expect(hasUrlInput).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 12: Video_text lesson requires non-empty Cloudflare Stream URL
// **Validates: Requirements 7.3**
describe("Property 12: Video_text requires non-empty Cloudflare Stream URL", () => {
  it("submitting video_text with empty URL shows validation error", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        Element.prototype.scrollIntoView = vi.fn();
        renderPage();
        openLessonDialog();

        const titleInput = screen.getByPlaceholderText("e.g. Introduction to Variables");
        fireEvent.change(titleInput, { target: { value: "Test Lesson" } });

        selectContentType("Video / Text");

        const form = screen.getAllByRole("button", { name: /Add Lesson/i }).find(b => b.getAttribute("type") === "submit")!;
        fireEvent.click(form);

        expect(screen.getByText("Video URL is required")).toBeInTheDocument();
      }),
      { numRuns: 5 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 14: Video_text option exists in content type selector
// **Validates: Requirements 7.5**
describe("Property 14: Video_text option exists in content type selector", () => {
  it("Video / Text option is present in the content type selector", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        Element.prototype.scrollIntoView = vi.fn();
        renderPage();
        openLessonDialog();

        for (const label of CONTENT_TYPE_LABELS) {
          expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
        }
      }),
      { numRuns: 5 }
    );
  });
});
