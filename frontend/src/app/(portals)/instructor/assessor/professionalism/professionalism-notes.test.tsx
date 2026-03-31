import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import ProfessionalismPage from "./page";

afterEach(cleanup);

const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 30 });

const LEARNER_COUNT = 4;
const DIMENSIONS = ["Communication", "Accountability", "Collaboration", "Documentation", "Learning Discipline"];

function renderPage() {
  return render(<ProfessionalismPage />);
}

// Feature: portal-feedback-and-content-gaps
// Property 9: Expanded professionalism row shows exactly five dimension slots
// **Validates: Requirements 4.2**
describe("Property 9: Expanded professionalism row shows exactly five dimension slots", () => {
  it("expanding a learner row reveals 5 coaching note dimension labels", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: LEARNER_COUNT - 1 }), (learnerIdx) => {
        cleanup();
        renderPage();

        // Click the expand button for the chosen learner
        const expandBtns = screen.getAllByLabelText("Expand coaching notes");
        fireEvent.click(expandBtns[learnerIdx]);

        // Should see 5 "Add Note" buttons (one per dimension, none have notes yet)
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        expect(addBtns.length).toBe(DIMENSIONS.length);
      }),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 5: Inline_Note empty state shows add button
// **Validates: Requirements 4.3**
describe("Property 5 (Professionalism): Inline_Note empty state shows add button", () => {
  it("each dimension slot shows 'Add Note' when no coaching note exists", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: LEARNER_COUNT - 1 }), (learnerIdx) => {
        cleanup();
        renderPage();
        const expandBtns = screen.getAllByLabelText("Expand coaching notes");
        fireEvent.click(expandBtns[learnerIdx]);
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        expect(addBtns.length).toBe(DIMENSIONS.length);
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete note").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 6: Saving an Inline_Note stores text and renders with edit/delete actions
// **Validates: Requirements 4.5**
describe("Property 6 (Professionalism): Saving an Inline_Note stores text and renders with edit/delete actions", () => {
  it("after adding a coaching note, text is rendered with Pencil/Trash2", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        // Expand first learner
        const expandBtns = screen.getAllByLabelText("Expand coaching notes");
        fireEvent.click(expandBtns[0]);
        // Click first "Add Note"
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        fireEvent.click(addBtns[0]);
        const input = screen.getByPlaceholderText("Enter coaching note...");
        fireEvent.change(input, { target: { value: noteText } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        // Note text should be visible
        expect(screen.getByText(noteText)).toBeInTheDocument();
        // Edit/delete should exist for that note
        expect(screen.getAllByLabelText("Edit note").length).toBe(1);
        expect(screen.getAllByLabelText("Delete note").length).toBe(1);
        // Remaining dimensions still show "Add Note"
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(DIMENSIONS.length - 1);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 8: Deleting an Inline_Note restores the add button
// **Validates: Requirements 4.7**
describe("Property 8 (Professionalism): Deleting an Inline_Note restores the add button", () => {
  it("clicking Trash2 removes coaching note and restores 'Add Note' button", () => {
    fc.assert(
      fc.property(safeString, (noteText) => {
        cleanup();
        renderPage();
        const expandBtns = screen.getAllByLabelText("Expand coaching notes");
        fireEvent.click(expandBtns[0]);
        const addBtns = screen.getAllByRole("button", { name: "Add Note" });
        fireEvent.click(addBtns[0]);
        const input = screen.getByPlaceholderText("Enter coaching note...");
        fireEvent.change(input, { target: { value: noteText } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.getByText(noteText)).toBeInTheDocument();
        // Delete the note
        fireEvent.click(screen.getByLabelText("Delete note"));
        expect(screen.queryByText(noteText)).not.toBeInTheDocument();
        // All 5 "Add Note" buttons should be restored
        expect(screen.getAllByRole("button", { name: "Add Note" }).length).toBe(DIMENSIONS.length);
        expect(screen.queryAllByLabelText("Edit note").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});
