import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import CurriculumPage from "./page";

// Mock the content store to avoid loading real data files
vi.mock("@/stores/content-store", () => ({
  useContentStore: () => ({
    getTracks: () => [
      { id: "TRK-aie", name: "AI Engineering", modules: 5, lessons: 20, available: true, gateThreshold: 70 },
      { id: "TRK-ds", name: "Data Science", modules: 4, lessons: 16, available: true, gateThreshold: 70 },
      { id: "TRK-cs", name: "Cybersecurity", modules: 3, lessons: 12, available: false, gateThreshold: 75 },
    ],
    getTrackNames: () => ["AI Engineering", "Data Science", "Cybersecurity"],
    addModule: vi.fn(),
  }),
}));

afterEach(cleanup);

const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 30 });
const TRACK_COUNT = 3;

function renderPage() {
  return render(<CurriculumPage />);
}

function addAnnotationToRow(index: number, text: string) {
  const addBtns = screen.getAllByRole("button", { name: "Add Note" });
  fireEvent.click(addBtns[index]);
  const input = screen.getByPlaceholderText("Enter annotation...");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

// Feature: portal-feedback-and-content-gaps
// Property 5: Inline_Note empty state shows add button
// **Validates: Requirements 6.2**
describe("Property 5 (Curriculum): Inline_Note empty state shows add button", () => {
  it("all rows show 'Add Note' when no annotations exist", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        renderPage();
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        expect(addBtns.length).toBe(TRACK_COUNT);
        expect(screen.queryAllByLabelText("Edit annotation").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete annotation").length).toBe(0);
      }),
      { numRuns: 5 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 6: Saving an Inline_Note stores text and renders with edit/delete actions
// **Validates: Requirements 6.4**
describe("Property 6 (Curriculum): Saving an Inline_Note stores text and renders with edit/delete actions", () => {
  it("after adding an annotation, text is rendered with Pencil/Trash2", () => {
    fc.assert(
      fc.property(safeString, (annotationText) => {
        cleanup();
        renderPage();
        addAnnotationToRow(0, annotationText);
        expect(screen.getByText(annotationText)).toBeInTheDocument();
        expect(screen.getAllByLabelText("Edit annotation").length).toBe(1);
        expect(screen.getAllByLabelText("Delete annotation").length).toBe(1);
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(TRACK_COUNT - 1);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 7: Editing an Inline_Note pre-fills the input with current text
// **Validates: Requirements 6.5**
describe("Property 7 (Curriculum): Editing an Inline_Note pre-fills the input with current text", () => {
  it("clicking Pencil shows input pre-filled with current annotation", () => {
    fc.assert(
      fc.property(safeString, (annotationText) => {
        cleanup();
        renderPage();
        addAnnotationToRow(0, annotationText);
        fireEvent.click(screen.getByLabelText("Edit annotation"));
        expect(screen.getByDisplayValue(annotationText)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 8: Deleting an Inline_Note restores the add button
// **Validates: Requirements 6.6**
describe("Property 8 (Curriculum): Deleting an Inline_Note restores the add button", () => {
  it("clicking Trash2 removes annotation and restores 'Add Note' button", () => {
    fc.assert(
      fc.property(safeString, (annotationText) => {
        cleanup();
        renderPage();
        addAnnotationToRow(0, annotationText);
        expect(screen.getByText(annotationText)).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Delete annotation"));
        expect(screen.queryByText(annotationText)).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(TRACK_COUNT);
        expect(screen.queryAllByLabelText("Edit annotation").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});
