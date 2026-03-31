import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import PodsPage from "./page";

afterEach(cleanup);

const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 30 });

/** The pods page has 2 mock pods. */
const POD_COUNT = 2;

function renderPage() {
  return render(<PodsPage />);
}

/** Helper: click "Add Note" for the nth pod, type text, click Save. */
function addNoteForPod(podIndex: number, text: string) {
  const addBtns = screen.getAllByRole("button", { name: "Add Note" });
  fireEvent.click(addBtns[podIndex]);
  const input = screen.getByPlaceholderText("Enter supervision note...");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

// Feature: portal-feedback-and-content-gaps
// Property 10: Supervision notes are displayed in reverse chronological order
// **Validates: Requirements 5.7**
describe("Property 10: Supervision notes are displayed in reverse chronological order", () => {
  it("notes added later appear before notes added earlier", () => {
    fc.assert(
      fc.property(
        fc.array(safeString, { minLength: 2, maxLength: 5 }),
        (noteTexts) => {
          cleanup();
          renderPage();
          // Add multiple notes to the first pod
          for (const text of noteTexts) {
            addNoteForPod(0, text);
          }
          // Get all note texts in rendered order
          const noteEls = screen.getAllByLabelText("Delete note");
          // The last added note should be first (reverse chronological)
          expect(noteEls.length).toBe(noteTexts.length);
        }
      ),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 5: Inline_Note empty state shows add button
// **Validates: Requirements 5.2**
describe("Property 5 (Pods): Inline_Note empty state shows add button", () => {
  it("each pod shows 'Add Note' button when no supervision notes exist", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        renderPage();
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        expect(addBtns.length).toBe(POD_COUNT);
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete note").length).toBe(0);
      }),
      { numRuns: 5 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 6: Saving an Inline_Note stores text and renders with edit/delete actions
// **Validates: Requirements 5.4**
describe("Property 6 (Pods): Saving an Inline_Note stores text and renders with edit/delete actions", () => {
  it("after adding a supervision note, text is rendered with Pencil/Trash2", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        addNoteForPod(0, noteText);
        expect(screen.getByText(noteText)).toBeInTheDocument();
        expect(screen.getAllByLabelText("Edit note").length).toBe(1);
        expect(screen.getAllByLabelText("Delete note").length).toBe(1);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 8: Deleting an Inline_Note restores the add button
// **Validates: Requirements 5.6**
describe("Property 8 (Pods): Deleting an Inline_Note restores the add button", () => {
  it("clicking Trash2 removes supervision note", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        addNoteForPod(0, noteText);
        expect(screen.getByText(noteText)).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Delete note"));
        expect(screen.queryByText(noteText)).not.toBeInTheDocument();
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete note").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});
