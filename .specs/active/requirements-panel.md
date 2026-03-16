# Requirements Workspace Panel

## System Overview

The Requirements panel is the first section in the ATProto App Builder's sidebar+workspace layout (mockup 3b). It replaces the deprecated "Define Record Types" step with a requirements-first approach. It allows users — indie ATProto developers and newcomers learning through building — to define their app's requirements using three categories: information (what do users of the app need to know), data interaction design (what do users need to do with their data), and navigation between views. The output is a persisted list of structured requirements that subsequent wizard sections will use to derive components, data models, and views.

## Scope

**In scope:**
- Requirements panel UI within the sidebar+workspace layout
- Empty state with intro content (absorbed from the deleted Step 1 page)
- CRUD operations for three requirement types
- Verify Step 1 files are already deleted (handled by `landing-page-header-redesign.md`)

**Out of scope:**
- Sidebar+workspace layout shell (covered by layout migration spec, Phases 0–1)
- Other workspace panels (Data, Components, Views)
- Generating downstream artifacts from requirements

## Behavioral Contract

### Primary Flows

- When the user selects the Requirements section in the sidebar, the workspace displays a view titled "Define Requirements" with a description of the section, an "Add Requirement" button, and a list of any previously saved requirements.

- When the user selects the Requirements section and no requirements exist, the workspace displays:
  - A brief intro: you're building a decentralized web app where you login with an identity you own and your app uses data from a source you own
  - Example app ideas as inspiration (meditation tracker with sessions stored in your PDS, grocery list shared with family via PDS, event planner tracking RSVPs and tasks in your PDS)
  - A CTA: "+ Add Your First Requirement"

  Once the user adds their first requirement, this intro content is replaced by the requirements list.

- When the user clicks "Add Requirement", the system displays three buttons: "I need to know something", "I need to do something (view data, interact with it, etc.)", and "I need to navigate to another view".

- When the user clicks "I need to know something", the system displays a form containing: a large text area with the label "I need to know..." and placeholder text "how this app works, what my options are, etc.", and "Save" and "Cancel" buttons.

- When the user clicks "I need to do something (view data, interact with it, etc.)", the system displays a form containing: the text "I need to", a text input labelled "verb" with placeholder "search, list, create, update, etc.", a text input labelled "data" with placeholder "a list of books, an appointment, a friend", and "Save" and "Cancel" buttons.

- When the user clicks "I need to navigate to another view", the system displays a form containing: the text "I need to go from", a dropdown menu listing existing views (or a single disabled option reading "Create some pages or components first" if no views exist), the text "to", a second dropdown menu with the same options, and "Save" and "Cancel" buttons.

- When the user fills in required fields and clicks "Save", the system adds the requirement to the list, the form closes, and the new entry appears in the requirements list.

- When the user clicks "Cancel", the system closes the form without saving.

- When a requirement is displayed in the list, it includes a human-readable summary of the requirement and buttons to edit and delete it.

- When the user clicks "Edit" on a requirement, the system reopens the appropriate form for that requirement type with the previously saved values pre-filled in the input fields.

- When the user edits a requirement and clicks "Save", the system updates the existing requirement in place (same position in the list) rather than creating a new one.

- When the user clicks "Delete" on a requirement, the system removes the requirement from both the displayed list and the persisted state.

- When requirements exist in the list, each requirement's display text reflects its type:
  - "Know" type: "I need to know [user's text]"
  - "Do" type: "I need to [verb] [data]"
  - "Navigate" type: "I need to go from [view A] to [view B]"

### Error Flows

- When the user attempts to save a "know" requirement with an empty or whitespace-only text area, the Save button is disabled and the requirement cannot be saved.

- When the user attempts to save a "do" requirement with either the verb or data field empty or whitespace-only, the Save button is disabled and the requirement cannot be saved.

- When the user attempts to save a "navigate" requirement without selecting both a "from" and "to" view from the dropdowns, the Save button is disabled and the requirement cannot be saved.

### Boundary Conditions

- When the user has saved 100 requirements, the "Add Requirement" button is disabled or hidden, and the user cannot add more requirements.

- When the user switches to another section via the sidebar and returns to Requirements, all previously saved requirements are present and displayed in their original order.

- When no views exist for the navigation dropdowns, both dropdowns display only a disabled option reading "Create some pages or components first", making the Save button impossible to activate for navigation requirements.

- When the user closes the browser and reopens the wizard, requirements are restored from localStorage as part of the wizard state resume flow.

## Explicit Non-Behaviors

- The system must not use AI or natural language processing to interpret, suggest, validate, or transform user input, because the wizard is designed as a structured, manual requirements-gathering tool.

- The system must not generate components, data models, lexicons, or any downstream artifacts from the requirements in this section, because component generation belongs to subsequent wizard sections.

- The system must not persist requirements to a PDS or any remote service, because PDS persistence is out of scope for this phase; localStorage is the only storage mechanism.

- The system must not populate the navigation dropdowns with real view data, because the views that fill those dropdowns are defined in later wizard sections that do not yet exist. For now, the dropdowns should always show the disabled placeholder option.

- The system must not allow reordering of requirements in the list, because reordering is not part of the current design.

## Integration Boundaries

### localStorage (WizardState)

- **Data flowing in:** When the Requirements panel renders, the system reads the existing `WizardState` from localStorage (key: `atproto-wizard-state`) to retrieve any previously saved requirements.
- **Data flowing out:** On every add, edit, or delete operation, the system writes the updated requirements array back to `WizardState` in localStorage, following the same auto-save pattern used by existing wizard sections.
- **Expected contract:** Requirements are stored as a new field on the `WizardState` object (e.g., `requirements`). Each requirement is an object containing at minimum: a unique ID, a type identifier (`know`, `do`, or `navigate`), and the type-specific data fields.
- **Unavailability:** localStorage is a synchronous browser API and will not be unavailable during normal operation. If localStorage is full, the browser will throw a `QuotaExceededError`; the system should not crash but no special handling is required beyond not losing the in-memory state.
- **Development:** Use the real browser localStorage; no simulated twin needed.

### Sidebar Navigation

- **Data flowing in:** The Requirements panel renders when selected via the sidebar section switcher.
- **Data flowing out:** The panel updates the sidebar's Requirements badge count when requirements are added or removed.
- **Expected contract:** The panel follows the workspace panel rendering contract established in the layout migration (see `layout-migration-sidebar-workspace.md`, Phases 0–1).
- **Unavailability:** N/A — this is internal to the application.
- **Development:** Use the sidebar navigation infrastructure from the layout migration.

## Behavioral Scenarios

### Happy Path Scenarios

**Scenario 1: First visit with no requirements**

- Setup: User enters the wizard for the first time with no saved requirements.
- Action: User selects the Requirements section in the sidebar.
- Expected outcome: The workspace displays the intro content (what a decentralized web app is, example app ideas) and an "Add Your First Requirement" button. No requirements list is shown. User clicks "Add Your First Requirement", adds a "do" requirement with verb "track" and data "meditation sessions", and clicks Save. The intro content is replaced by the requirements list showing the new entry.

**Scenario 2: Add a "do" requirement**

- Setup: User is on the Requirements panel with an empty requirements list.
- Action: User clicks "Add Requirement". User clicks "I need to do something (view data, interact with it, etc.)". User types "create" in the verb field and "a bookmark" in the data field. User clicks "Save".
- Expected outcome: The form closes. The requirements list now shows one entry with text matching "I need to create a bookmark". The entry has edit and delete controls.

**Scenario 3: Add a "know" requirement**

- Setup: User is on the Requirements panel (may have existing requirements or not).
- Action: User clicks "Add Requirement". User clicks "I need to know something". User types "how to get started adding bookmarks" in the text area. User clicks "Save".
- Expected outcome: The form closes. The requirements list includes an entry with text matching "I need to know how to get started adding bookmarks".

**Scenario 4: Add all three requirement types, then navigate away and back**

- Setup: User is on the Requirements panel with an empty requirements list.
- Action: User adds a "know" requirement with text "what my saved bookmarks are". User adds a "do" requirement with verb "search" and data "my bookmarks". User adds a "navigate" requirement (if views exist) or cancels the navigate form (if no views exist). User switches to another section via the sidebar, then returns to Requirements.
- Expected outcome: All previously saved requirements are displayed in the order they were added, with correct type-specific display text. No entries are missing or duplicated.

### Error Scenarios

**Scenario 5: Attempt to save with empty fields**

- Setup: User is on the Requirements panel and clicks "Add Requirement", then clicks "I need to do something (view data, interact with it, etc.)".
- Action: User leaves both the verb and data fields empty. User observes the Save button.
- Expected outcome: The Save button is disabled and cannot be clicked. User types "create" in the verb field but leaves data empty. Save button remains disabled. User types "a bookmark" in the data field. Save button becomes enabled.

**Scenario 6: Navigate requirement with no existing views**

- Setup: User is on the Requirements panel and no views have been defined in the wizard.
- Action: User clicks "Add Requirement", then clicks "I need to navigate to another view".
- Expected outcome: Both dropdown menus show only a single disabled option reading "Create some pages or components first". The Save button is disabled. The user can only click "Cancel" to exit the form.

### Edge Case Scenarios

**Scenario 7: Edit a requirement preserves its position and type**

- Setup: User has three requirements saved: a "know" requirement, a "do" requirement with verb "create" and data "a bookmark", and another "know" requirement. They appear in this order.
- Action: User clicks "Edit" on the second requirement (the "do" requirement). The form reopens showing "I need to do something" with "create" pre-filled in the verb field and "a bookmark" pre-filled in the data field. User changes the verb to "save" and clicks "Save".
- Expected outcome: The requirements list still has three entries in the same order. The second entry now reads "I need to save a bookmark". No duplicate entries were created. The first and third entries are unchanged.

**Scenario 8: Delete removes from both view and persisted state**

- Setup: User has two requirements saved.
- Action: User clicks "Delete" on the first requirement. User switches to another section via the sidebar and returns to Requirements.
- Expected outcome: Only one requirement remains in the list — the one that was not deleted. The deleted requirement does not reappear after navigation.

## Ambiguity Warnings

1. **WizardState schema for requirements.**
   The existing `WizardState` interface has fields like `recordTypes`, `queryMethods`, `procedureMethods`. The new requirements need a new field. Should the agent add a `requirements` array to `WizardState` and remove or leave the deprecated fields (`recordTypes`, `queryMethods`, `procedureMethods`, `appConfig`)?
   - _Likely agent assumption:_ Add `requirements` field, leave deprecated fields in place to avoid breaking other code.
   - _Please confirm or clarify._

2. **Requirement ID generation.**
   Each requirement needs a unique ID for edit/delete operations. Should IDs be generated using the existing `generateId()` utility in `src/utils/`, or is there a preferred approach?
   - _Likely agent assumption:_ Use the existing `generateId()` utility.
   - _Please confirm or clarify._

3. **Edit form: pre-filled as values or placeholders?**
   You said "previous entries displayed as placeholders in the appropriate areas." Did you mean the values should populate the input fields as _values_ (editable content in the field), or literally as _placeholder attributes_ (gray hint text that disappears on focus)? Using placeholder attributes would mean the fields appear "empty" and the user would have to retype everything.
   - _Likely agent assumption:_ Pre-fill as actual input values, not placeholder attributes.
   - _Please confirm or clarify._

4. **Delete confirmation.**
   Should deleting a requirement require a confirmation dialog ("Are you sure?"), or should it delete immediately on click?
   - _Likely agent assumption:_ Delete immediately without confirmation.
   - _Please confirm or clarify._

## Files Likely Affected

- `src/app/views/panels/RequirementsPanel.ts` — new, main panel renderer
- `src/app/views/StepRenderer.ts` — verify Step 1 routing already removed (by `landing-page-header-redesign.md`)
- `src/types/wizard.ts` — add `requirements` field to `WizardState`
- `tests/views/RequirementsPanel.test.ts` — new

## Implementation Constraints

- **Language/framework:** TypeScript, vanilla DOM manipulation — consistent with the existing codebase. No UI frameworks.
- **Build system:** Vite (existing).
- **Testing:** Vitest (existing). Unit tests should be added for the requirements state management logic (add, edit, delete, validation).
- **File location:** New code should follow the workspace panel pattern established in the layout migration (`src/app/views/panels/RequirementsPanel.ts`).
- **State management:** Follow the existing `WizardState` pattern with localStorage auto-save via `saveWizardState()`.
- **Existing code reuse:** Logic from deprecated step files (particularly dialog/form patterns and list rendering) may be referenced or adapted, but the new panel should be its own clean implementation.
