import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import * as fc from "fast-check";
import { PodChat } from "./pod-chat";

// jsdom does not implement scrollIntoView — stub it globally
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const MEMBERS = [
  { id: "m1", name: "Amara Okafor", role: "Product Manager", online: true },
  { id: "m2", name: "Kwame Asante", role: "AI Engineer", online: true },
  { id: "m3", name: "Fatima Bello", role: "Data Scientist", online: false },
  { id: "m4", name: "Chidi Nwosu", role: "Cybersecurity Specialist", online: true },
  { id: "m5", name: "Zara Mwangi", role: "Industry Specialist", online: false },
];

const KNOWN_SENDERS = MEMBERS.map((m) => m.name);

/** General channel hardcoded senders (in order) */
const GENERAL_SENDERS = ["Amara Okafor", "Kwame Asante", "Fatima Bello", "Chidi Nwosu"];

/**
 * Generator for non-empty strings that won't collide with reaction counts or
 * other short numeric text in the DOM. Starts with a letter, no leading/trailing spaces.
 * The component trims input, so we must generate already-trimmed strings.
 */
const safeString = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/, { minLength: 3, maxLength: 20 });

/**
 * Helper: renders PodChat and returns the container.
 */
function renderChat(currentUser: string) {
  const result = render(
    <PodChat podName="Pod Alpha" members={MEMBERS} currentUser={currentUser} />
  );
  return result;
}

/**
 * Helper: sends a message using fireEvent (much faster than userEvent for PBT).
 * Sets the textarea value then submits the form directly.
 */
function sendMsg(text: string) {
  const textarea = screen.getByRole("textbox");
  fireEvent.change(textarea, { target: { value: text } });
  // Submit the form directly — the component's onSubmit handler reads from state
  const form = textarea.closest("form")!;
  fireEvent.submit(form);
}


// Feature: portal-feedback-and-content-gaps
// Property 1: Message action visibility is determined by authorship
// **Validates: Requirements 1.1, 1.6**
describe("Property 1: Message action visibility is determined by authorship", () => {
  it("Pencil/Trash2 buttons appear only on messages authored by currentUser", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_SENDERS),
        (currentUser) => {
          cleanup();
          renderChat(currentUser);

          const allEditBtns = screen.queryAllByLabelText("Edit message");
          const allDeleteBtns = screen.queryAllByLabelText("Delete message");

          const ownMessageCount = GENERAL_SENDERS.filter((s) => s === currentUser).length;

          expect(allEditBtns.length).toBe(ownMessageCount);
          expect(allDeleteBtns.length).toBe(ownMessageCount);
        }
      ),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 2: Editing a message updates text and shows edited indicator
// **Validates: Requirements 1.3, 1.7**
describe("Property 2: Editing a message updates text and shows edited indicator", () => {
  it("after edit→save, message shows new text and (edited) indicator", () => {
    fc.assert(
      fc.property(
        safeString,
        safeString,
        (originalText, replacementText) => {
          cleanup();
          const currentUser = "Amara Okafor";
          renderChat(currentUser);

          // Send a message so we have a known own message
          sendMsg(originalText);

          // Find edit buttons — Amara has 1 hardcoded + 1 just sent
          const editBtns = screen.getAllByLabelText("Edit message");
          const lastEditBtn = editBtns[editBtns.length - 1];

          // Click edit on the last (just-sent) message
          fireEvent.click(lastEditBtn);

          // The edit input should appear pre-filled with the original text
          const editInput = screen.getByDisplayValue(originalText);
          expect(editInput).toBeInTheDocument();

          // Change to replacement text
          fireEvent.change(editInput, { target: { value: replacementText } });

          // Click Save
          const saveBtn = screen.getByRole("button", { name: "Save" });
          fireEvent.click(saveBtn);

          // The replacement text should be visible in a message bubble
          const matches = screen.getAllByText(replacementText);
          const inBubble = matches.some((el) =>
            el.classList.contains("whitespace-pre-wrap") ||
            el.closest(".whitespace-pre-wrap") !== null
          );
          expect(inBubble).toBe(true);

          // The "(edited)" indicator should be visible
          const editedIndicators = screen.getAllByText("(edited)");
          expect(editedIndicators.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 3: Canceling a message edit is a no-op
// **Validates: Requirements 1.4**
describe("Property 3: Canceling a message edit is a no-op", () => {
  it("after edit→cancel, message text is unchanged and no (edited) indicator added", () => {
    fc.assert(
      fc.property(
        safeString,
        safeString,
        (originalText, typedText) => {
          cleanup();
          const currentUser = "Amara Okafor";
          renderChat(currentUser);

          // Send a message
          sendMsg(originalText);

          // Count (edited) indicators before edit attempt
          const editedBefore = screen.queryAllByText("(edited)").length;

          // Click edit on the last own message
          const editBtns = screen.getAllByLabelText("Edit message");
          const lastEditBtn = editBtns[editBtns.length - 1];
          fireEvent.click(lastEditBtn);

          // Type something different in the edit input
          const editInput = screen.getByDisplayValue(originalText);
          fireEvent.change(editInput, { target: { value: typedText } });

          // Click Cancel
          const cancelBtn = screen.getByRole("button", { name: "Cancel" });
          fireEvent.click(cancelBtn);

          // Original text should still be displayed in a message bubble
          const matches = screen.getAllByText(originalText);
          const inBubble = matches.some((el) =>
            el.classList.contains("whitespace-pre-wrap") ||
            el.closest(".whitespace-pre-wrap") !== null
          );
          expect(inBubble).toBe(true);

          // No new (edited) indicator should have appeared
          const editedAfter = screen.queryAllByText("(edited)").length;
          expect(editedAfter).toBe(editedBefore);
        }
      ),
      { numRuns: 20 }
    );
  });
});


// Feature: portal-feedback-and-content-gaps
// Property 4: Deleting a message removes it from the channel list
// **Validates: Requirements 1.5**
describe("Property 4: Deleting a message removes it from the channel list", () => {
  it("after deleting an own message, delete button count decreases by 1", () => {
    fc.assert(
      fc.property(
        fc.array(safeString, { minLength: 1, maxLength: 5 }),
        fc.nat(),
        (messageTexts, deleteIndexRaw) => {
          cleanup();
          const currentUser = "Amara Okafor";
          renderChat(currentUser);

          // Send multiple messages
          for (const text of messageTexts) {
            sendMsg(text);
          }

          // Count delete buttons before (= own messages: 1 hardcoded Amara + sent)
          const deleteBtnsBefore = screen.getAllByLabelText("Delete message");
          const countBefore = deleteBtnsBefore.length;

          // Pick a random delete button to click
          const deleteIndex = deleteIndexRaw % countBefore;
          const targetBtn = deleteBtnsBefore[deleteIndex];

          // Click delete
          fireEvent.click(targetBtn);

          // Count should decrease by 1
          const deleteBtnsAfter = screen.queryAllByLabelText("Delete message");
          expect(deleteBtnsAfter.length).toBe(countBefore - 1);
        }
      ),
      { numRuns: 20 }
    );
  });
});
