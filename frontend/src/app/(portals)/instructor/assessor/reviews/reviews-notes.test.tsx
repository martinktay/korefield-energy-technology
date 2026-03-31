import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import ReviewsPage from "./page";

afterEach(cleanup);

const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 30 });

/** The reviews page has 4 mock reviews. */
const REVIEW_COUNT = 4;

function renderPage() {
  return render(<ReviewsPage />);
}

function addNoteToRow(index: number, text: string) {
  const addBtns = screen.getAllByRole("button", { name: "Add Note" });
  fireEvent.click(addBtns[index]);
  const input = screen.getByPlaceholderText("Enter note...");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

// Feature: portal-feedback-and-content-gaps
// Property 5: Inline_Note empty state shows add button
// **Validates: Requirements 3.2**
describe("Property 5 (Reviews): Inline_Note empty state shows add button", () => {
  it("all rows show 'Add Note' when no notes exist", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        renderPage();
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        expect(addBtns.length).toBe(REVIEW_COUNT);
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete note").length).toBe(0);
      }),
      { numRuns: 5 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 6: Saving an Inline_Note stores text and renders with edit/delete actions
// **Validates: Requirements 3.4**
describe("Property 6 (Reviews): Saving an Inline_Note stores text and renders with edit/delete actions", () => {
  it("after adding a note, text is rendered and Pencil/Trash2 are available", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        addNoteToRow(0, noteText);
        expect(screen.getByText(noteText)).toBeInTheDocument();
        expect(screen.getAllByLabelText("Edit note").length).toBe(1);
        expect(screen.getAllByLabelText("Delete note").length).toBe(1);
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(REVIEW_COUNT - 1);
      }),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 7: Editing an Inline_Note pre-fills the input with current text
// **Validates: Requirements 3.5**
describe("Property 7 (Reviews): Editing an Inline_Note pre-fills the input with current text", () => {
  it("clicking Pencil shows input pre-filled with current note", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        addNoteToRow(0, noteText);
        fireEvent.click(screen.getByLabelText("Edit note"));
        expect(screen.getByDisplayValue(noteText)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 8: Deleting an Inline_Note restores the add button
// **Validates: Requirements 3.6**
describe("Property 8 (Reviews): Deleting an Inline_Note restores the add button", () => {
  it("clicking Trash2 removes note and restores 'Add Note' button", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        addNoteToRow(0, noteText);
        expect(screen.getByText(noteText)).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Delete note"));
        expect(screen.queryByText(noteText)).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(REVIEW_COUNT);
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete note").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});
