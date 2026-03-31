import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import GradingPage from "./page";

afterEach(cleanup);

/** Non-empty trimmed string generator for feedback text — no consecutive spaces. */
const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 30 });

/** The grading page has 4 mock submissions. */
const SUBMISSION_COUNT = 4;

function renderPage() {
  return render(<GradingPage />);
}

/** Helper: click "Add Feedback" for the nth row, type text, click Save. */
function addFeedbackToRow(index: number, text: string) {
  const addBtns = screen.getAllByRole("button", { name: "Add Feedback" });
  fireEvent.click(addBtns[index]);
  const input = screen.getByPlaceholderText("Enter feedback...");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

// Feature: portal-feedback-and-content-gaps
// Property 5: Inline_Note empty state shows add button
// **Validates: Requirements 2.2**
describe("Property 5 (Grading): Inline_Note empty state shows add button", () => {
  it("all rows show 'Add Feedback' when no feedback exists", () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();
        renderPage();
        const addBtns = screen.getAllByRole("button", { name: "Add Feedback" });
        expect(addBtns.length).toBe(SUBMISSION_COUNT);
        expect(screen.queryAllByLabelText("Edit feedback").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete feedback").length).toBe(0);
      }),
      { numRuns: 5 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 6: Saving an Inline_Note stores text and renders with edit/delete actions
// **Validates: Requirements 2.4**
describe("Property 6 (Grading): Saving an Inline_Note stores text and renders with edit/delete actions", () => {
  it("after adding feedback, text is rendered and Pencil/Trash2 are available", () => {
    fc.assert(
      fc.property(safeString, (feedbackText) => {
        cleanup();
        renderPage();
        addFeedbackToRow(0, feedbackText);

        // Feedback text should be visible
        expect(screen.getByText(feedbackText)).toBeInTheDocument();

        // Edit and delete buttons should exist for that row
        expect(screen.getAllByLabelText("Edit feedback").length).toBe(1);
        expect(screen.getAllByLabelText("Delete feedback").length).toBe(1);

        // Remaining rows still show "Add Feedback"
        expect(screen.getAllByRole("button", { name: "Add Feedback" }).length).toBe(SUBMISSION_COUNT - 1);
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 7: Editing an Inline_Note pre-fills the input with current text
// **Validates: Requirements 2.5**
describe("Property 7 (Grading): Editing an Inline_Note pre-fills the input with current text", () => {
  it("clicking Pencil shows input pre-filled with current feedback", () => {
    fc.assert(
      fc.property(safeString, (feedbackText) => {
        cleanup();
        renderPage();
        addFeedbackToRow(0, feedbackText);

        // Click edit
        fireEvent.click(screen.getByLabelText("Edit feedback"));

        // Input should be pre-filled with the current text
        const input = screen.getByDisplayValue(feedbackText);
        expect(input).toBeInTheDocument();

        // Save and Cancel buttons should be visible
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      }),
      { numRuns: 20 }
    );
  });
});

// Feature: portal-feedback-and-content-gaps
// Property 8: Deleting an Inline_Note restores the add button
// **Validates: Requirements 2.6**
describe("Property 8 (Grading): Deleting an Inline_Note restores the add button", () => {
  it("clicking Trash2 removes feedback and restores 'Add Feedback' button", () => {
    fc.assert(
      fc.property(safeString, (feedbackText) => {
        cleanup();
        renderPage();
        addFeedbackToRow(0, feedbackText);

        // Verify feedback exists
        expect(screen.getByText(feedbackText)).toBeInTheDocument();

        // Delete it
        fireEvent.click(screen.getByLabelText("Delete feedback"));

        // Feedback text should be gone
        expect(screen.queryByText(feedbackText)).not.toBeInTheDocument();

        // All rows should show "Add Feedback" again
        expect(screen.getAllByRole("button", { name: "Add Feedback" }).length).toBe(SUBMISSION_COUNT);
        expect(screen.queryAllByLabelText("Edit feedback").length).toBe(0);
        expect(screen.queryAllByLabelText("Delete feedback").length).toBe(0);
      }),
      { numRuns: 20 }
    );
  });
});
