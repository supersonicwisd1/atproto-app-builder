# Requirements Workspace Panel

## System Overview

The Requirements panel is the first section in the ATProto App Builder's sidebar+workspace layout (mockup 3b). It replaces the deprecated "Define Record Types" step with a requirements-first approach. It allows users — indie ATProto developers and newcomers learning through building — to define their app's requirements using three categories: information (what do users of the app need to know), data interaction design (what do users need to do with their data), and navigation between views. The output is a persisted list of structured requirements that subsequent wizard sections will use to derive components, data models, and views.

## Scope

**In scope:**
- Requirements panel UI within the sidebar+workspace layout
- Empty state with intro content (absorbed from the deleted Step 1 page)
- CRUD operations for three requirement types
- Sidebar badge and item list updates
- State persistence via WizardState + localStorage

**Out of scope:**
- Sidebar+workspace layout shell (covered by layout migration spec, Phases 0–1)
- Other workspace panels (Data, Components, Views)
- Generating downstream artifacts from requirements

## Resolved Design Decisions

1. **WizardState schema:** Add a `requirements: Requirement[]` field to `WizardState`, initialized as `[]`. Leave deprecated fields (`recordTypes`, `queryMethods`, `procedureMethods`, `appConfig`) in place — they are still used by the generator and will be needed by the Data panel.

2. **Requirement ID generation:** Use the existing `generateId()` utility from `src/utils/id.ts`.

3. **Edit form pre-fill:** Pre-fill as actual input values (editable content), not placeholder attributes.

4. **Delete confirmation:** Delete immediately on click, no confirmation dialog. Requirements are lightweight text entries and easy to re-add.

5. **Inline forms, not dialogs:** All add/edit forms render inline within the workspace body. The workspace has ample room and this avoids dialog overhead for simple text entries.

## Data Model

Add the following types to `src/types/wizard.ts`:

```typescript
export type RequirementType = 'know' | 'do' | 'navigate';

export interface Requirement {
  id: string;
  type: RequirementType;
  // 'know' type:
  text?: string;
  // 'do' type:
  verb?: string;
  data?: string;
  // 'navigate' type:
  fromView?: string;
  toView?: string;
}
```

Add to `WizardState`:
```typescript
requirements: Requirement[];
```

Initialize as `[]` in `initializeWizardState()`.

## UI Layout

The panel renders into `#workspace-panel-body`. The workspace shell provides `<h2>Define Requirements</h2>` in `#workspace-panel-header` — the panel must not render its own title.

### Panel States

The panel has four visual states. Only one is active at a time.

**State A: Empty (no requirements exist)**

Uses the `.empty-workspace` CSS class for centered layout and muted styling.

```
[empty-icon: ☐]

Build a Decentralized Web App

You're building an app where users log in with an identity they own
and store data in a personal data server (PDS) they control.

Need inspiration?
• A meditation tracker with sessions stored in your PDS
• A grocery list shared with family members via PDS
• An event planner tracking RSVPs and tasks in your PDS

Start by defining what your app needs to do.

[ + Add Your First Requirement ]          (.add-btn)
```

**State B: Has requirements (list view)**

Uses `.workspace-desc` for the description, `.add-btn` for the add button, `.wizard-list` + `.wizard-list-item` for the list, and `.next-step-card` at the bottom.

```
<p class="workspace-desc">
  Define what your app needs to do. Think about what users need to know,
  what data they interact with, and how they navigate between views.
</p>

[ + Add Requirement ]                     (.add-btn)

<div class="wizard-list">
  <div class="wizard-list-item">
    <div class="wizard-list-item-header">
      <h3>I need to know how this app works</h3>
      <div class="wizard-list-item-actions">
        [Edit] [Delete]                   (.wizard-button-icon)
      </div>
    </div>
  </div>
  ...more items...
</div>

<div class="next-step">                   (.next-step-card)
  Next: Define Data →
</div>
```

**State C: Type picker (choosing requirement type)**

Appears inline, replacing the add button area. The existing requirements list (if any) remains visible below.

```
<div class="wizard-form">
  <p>What kind of requirement?</p>
  [ I need to know something           ]  (.wizard-button-secondary, full-width)
  [ I need to do something with data   ]  (.wizard-button-secondary, full-width)
  [ I need to navigate between views   ]  (.wizard-button-secondary, full-width)
                               [Cancel]   (.wizard-button-secondary)
</div>
```

**State D: Requirement form (filling in fields)**

Inline form replaces the type picker. Form fields vary by type.

For "know" type:
```
<div class="wizard-form">
  <label>I need to know...</label>
  <textarea class="wizard-textarea"
    placeholder="how this app works, what my options are, etc."></textarea>
  [Cancel] [Save]                         (.wizard-button-secondary, .wizard-button-primary)
</div>
```

For "do" type:
```
<div class="wizard-form">
  <p>I need to</p>
  <div class="wizard-field">
    <label>verb</label>
    <input class="wizard-input" placeholder="search, list, create, update, etc.">
  </div>
  <div class="wizard-field">
    <label>data</label>
    <input class="wizard-input" placeholder="a list of books, an appointment, a friend">
  </div>
  [Cancel] [Save]                         (.wizard-button-secondary, .wizard-button-primary)
</div>
```

For "navigate" type:
```
<div class="wizard-form">
  <p>I need to go from</p>
  <select class="wizard-select" disabled>
    <option disabled selected>Create some pages or components first</option>
  </select>
  <p>to</p>
  <select class="wizard-select" disabled>
    <option disabled selected>Create some pages or components first</option>
  </select>
  [Cancel] [Save]                         (.wizard-button-secondary, .wizard-button-primary)
</div>
```

### Sidebar Updates

When requirements are added or removed, the panel must update:
1. The badge count: `.sidebar-section[data-section="requirements"] .badge`
2. The item list: replace `.sidebar-item-empty` with `.sidebar-item` entries, or restore `.sidebar-item-empty` when the list becomes empty
3. The `.has-items` class on `.sidebar-section[data-section="requirements"]`

Sidebar item display text (truncated to fit 260px sidebar):
- Know: "Know: [truncated text]"
- Do: "Do: [verb] [data]"
- Nav: "Nav: [view A] → [view B]"

## Behavioral Contract

### Primary Flows

- When the user selects the Requirements section in the sidebar, the workspace renders the panel. If no requirements exist, State A (empty) is shown. If requirements exist, State B (list) is shown.

- When the user clicks "+ Add Your First Requirement" (State A) or "+ Add Requirement" (State B), the panel transitions to State C (type picker), shown inline above the requirements list (if any).

- When the user clicks a type button in State C, the panel transitions to State D (form) for that type. The type picker is replaced by the form.

- When the user fills in required fields and clicks "Save", the requirement is added to the list, the form closes, State B is shown, and the sidebar is updated.

- When the user clicks "Cancel" in State C or State D, the form/picker closes. The panel returns to State A (if no requirements) or State B (if requirements exist).

- When the user clicks "Edit" on a requirement in State B, the panel transitions to State D with the form pre-filled with the requirement's existing values. On save, the requirement is updated in place (same position in the list).

- When the user clicks "Delete" on a requirement in State B, the requirement is immediately removed from both the displayed list and persisted state. The sidebar is updated. If the list becomes empty, the panel transitions to State A.

- Requirement display text in the list:
  - Know: "I need to know [text]"
  - Do: "I need to [verb] [data]"
  - Navigate: "I need to go from [view A] to [view B]"

### Error Flows

- When the user attempts to save a "know" requirement with an empty or whitespace-only text area, the Save button is disabled.

- When the user attempts to save a "do" requirement with either the verb or data field empty or whitespace-only, the Save button is disabled.

- When the user attempts to save a "navigate" requirement without selecting both a "from" and "to" view, the Save button is disabled.

- Save button validation is real-time: it enables/disables as the user types, based on whether all required fields have non-whitespace content.

### Boundary Conditions

- When the user has saved 100 requirements, the "Add Requirement" button is disabled and the user cannot add more.

- When the user switches to another section via the sidebar and returns to Requirements, all previously saved requirements are present in their original order.

- When no views exist for the navigation dropdowns, both dropdowns display only a single disabled option reading "Create some pages or components first", making the Save button impossible to activate.

- When the user closes the browser and reopens the wizard, requirements are restored from localStorage as part of the wizard state resume flow.

## Explicit Non-Behaviors

- The system must not use AI or natural language processing to interpret, suggest, validate, or transform user input, because the wizard is designed as a structured, manual requirements-gathering tool.

- The system must not generate components, data models, lexicons, or any downstream artifacts from the requirements in this section, because component generation belongs to subsequent wizard sections.

- The system must not persist requirements to a PDS or any remote service, because PDS persistence is out of scope for this phase; localStorage is the only storage mechanism.

- The system must not populate the navigation dropdowns with real view data, because the views that fill those dropdowns are defined in later wizard sections that do not yet exist. For now, the dropdowns should always show the disabled placeholder option.

- The system must not allow reordering of requirements in the list, because reordering is not part of the current design.

## Integration Boundaries

### localStorage (WizardState)

- **Data flowing in:** When the Requirements panel renders, the system reads `requirements` from `getWizardState()`.
- **Data flowing out:** On every add, edit, or delete, the system calls `saveWizardState(wizardState)` with the updated `requirements` array.
- **Expected contract:** `WizardState.requirements` is a `Requirement[]`, initialized as `[]`. Each requirement has a unique `id` (from `generateId()`), a `type` (`'know' | 'do' | 'navigate'`), and type-specific fields.
- **Unavailability:** localStorage is synchronous and always available. If full, `QuotaExceededError` is thrown; no special handling beyond not losing in-memory state.

### Sidebar Navigation

- **Data flowing in:** The panel renders when `switchSection('requirements')` is called by `WorkspaceLayout.ts`.
- **Data flowing out:** The panel updates the sidebar badge count and item list after each add/edit/delete.
- **Expected contract:** `renderRequirementsPanel()` returns an HTML string. Event wiring happens after the HTML is inserted into the DOM, either within the panel's own wiring function or via `switchSection()`.

## Behavioral Scenarios

### Happy Path Scenarios

**Scenario 1: First visit — empty state with intro content**

- Setup: User enters the wizard for the first time with no saved requirements.
- Action: User is on the Requirements section (default active section).
- Expected outcome: The workspace displays State A — centered intro content explaining decentralized apps, three example app ideas, and an "+ Add Your First Requirement" button. No requirements list or description text is shown.

**Scenario 2: First requirement transitions from empty to list state**

- Setup: User is on the Requirements panel in State A (empty).
- Action: User clicks "+ Add Your First Requirement". Type picker appears (State C). User clicks "I need to do something with data". Form appears (State D) with verb and data fields. User types "track" in verb, "meditation sessions" in data, clicks Save.
- Expected outcome: State A intro content is replaced by State B (list view). The list shows one entry: "I need to track meditation sessions" with edit and delete controls. The sidebar badge shows "1" and the sidebar items list shows "Do: track meditation sessions". The description text and "+ Add Requirement" button are now visible.

**Scenario 3: Add a "know" requirement**

- Setup: User is on the Requirements panel with one or more existing requirements (State B).
- Action: User clicks "+ Add Requirement". Type picker appears. User clicks "I need to know something". Form appears with a textarea. User types "how to get started adding bookmarks". User clicks Save.
- Expected outcome: The form closes. The requirements list includes a new entry: "I need to know how to get started adding bookmarks". Sidebar badge count increments.

**Scenario 4: Navigate away and back preserves state**

- Setup: User has added two requirements (a "know" and a "do").
- Action: User clicks the "Data" section in the sidebar, then clicks "Requirements" again.
- Expected outcome: State B is shown with both requirements in their original order, with correct display text. No entries are missing or duplicated.

### Error Scenarios

**Scenario 5: Save button disabled for empty fields**

- Setup: User is on State D (form) for a "do" requirement.
- Action: User leaves verb and data fields empty.
- Expected outcome: Save button is disabled. User types "create" in verb — Save remains disabled. User types "a bookmark" in data — Save becomes enabled. User clears verb — Save becomes disabled again.

**Scenario 6: Navigate requirement with no views**

- Setup: No views have been defined in the wizard.
- Action: User clicks "+ Add Requirement", then "I need to navigate between views".
- Expected outcome: Both dropdowns show only "Create some pages or components first" (disabled). Save button is disabled. User can only click Cancel.

### Edge Case Scenarios

**Scenario 7: Edit preserves position and type**

- Setup: User has three requirements: (1) know "how this works", (2) do "create" "a bookmark", (3) know "what my options are".
- Action: User clicks Edit on requirement 2. Form appears with "create" in verb field and "a bookmark" in data field (as values, not placeholders). User changes verb to "save", clicks Save.
- Expected outcome: List still has three entries in the same order. Entry 2 now reads "I need to save a bookmark". Entries 1 and 3 are unchanged. No duplicates created. Sidebar item for entry 2 updates to "Do: save a bookmark".

**Scenario 8: Delete removes from view and state, last delete returns to empty state**

- Setup: User has two requirements.
- Action: User clicks Delete on the first requirement.
- Expected outcome: List shows only the second requirement. Sidebar badge shows "1". User clicks Delete on the remaining requirement. Panel transitions to State A (empty state with intro content). Sidebar badge shows "0", sidebar items show "None yet".

**Scenario 9: Cancel from type picker returns to previous state**

- Setup: User has one requirement (State B).
- Action: User clicks "+ Add Requirement" (State C appears). User clicks Cancel.
- Expected outcome: Type picker disappears. State B is shown with the existing requirement. No changes to state.

**Scenario 10: Cancel from form returns to previous state**

- Setup: User has one requirement (State B).
- Action: User clicks "+ Add Requirement", picks "I need to know something" (State D form appears). User types some text. User clicks Cancel.
- Expected outcome: Form disappears without saving. State B is shown with only the original requirement. No new requirement was added.

**Scenario 11: 100 requirement limit**

- Setup: User has 100 requirements saved.
- Action: User views the Requirements panel.
- Expected outcome: The "+ Add Requirement" button is disabled. User cannot add more requirements. All 100 requirements are visible in the list.

## Acceptance Criteria

These are the conditions that must be true for the implementation to be considered complete. Each maps to one or more behavioral scenarios above.

1. **Empty state renders correctly** — When no requirements exist, the panel shows centered intro content with a decentralized app explanation, three example app ideas, and an "+ Add Your First Requirement" button. (Scenario 1)

2. **Add requirement flow works end-to-end** — User can click Add → pick a type → fill fields → Save, and the requirement appears in the list with correct display text. (Scenarios 2, 3)

3. **All three types render correct forms** — "know" shows a textarea, "do" shows verb + data inputs, "navigate" shows two disabled dropdowns. (Scenarios 2, 3, 6)

4. **Edit pre-fills values and updates in place** — Clicking Edit opens the correct form with existing values as input values (not placeholders). Saving updates the requirement at its original position. (Scenario 7)

5. **Delete removes immediately** — Clicking Delete removes the requirement from the list and persisted state. Deleting the last requirement transitions to the empty state. (Scenario 8)

6. **Cancel discards without saving** — Cancel from type picker or form returns to the previous panel state with no side effects. (Scenarios 9, 10)

7. **Save button validation** — Save is disabled when required fields are empty/whitespace. It enables in real-time as the user types. (Scenario 5)

8. **Sidebar updates on every mutation** — Badge count, item list text, and `.has-items` class update after every add, edit, and delete. (Scenarios 2, 7, 8)

9. **State persists across navigation** — Switching sidebar sections and returning preserves all requirements in order. (Scenario 4)

10. **State persists across browser sessions** — Requirements survive page reload via localStorage. (Integration boundary contract)

11. **100 requirement limit** — Add button is disabled at 100 requirements. (Scenario 11)

12. **Build and tests pass** — `npm run build` compiles without errors. `npx vitest run` passes. New tests cover: add/edit/delete for each type, validation logic, empty state transitions, sidebar update calls.

## Files Likely Affected

### New Files
- `src/app/views/panels/RequirementsPanel.ts` — panel renderer (replaces current stub)
- `tests/views/RequirementsPanel.test.ts` — unit tests

### Modified Files
- `src/types/wizard.ts` — add `RequirementType`, `Requirement` interface, `requirements` field on `WizardState`
- `src/app/state/WizardState.ts` — add `requirements: []` to `initializeWizardState()`

## Implementation Constraints

- **Language/framework:** TypeScript, vanilla DOM manipulation — consistent with the existing codebase. No UI frameworks.
- **Build system:** Vite (existing).
- **Testing:** Vitest (existing). Unit tests for requirements state management logic (add, edit, delete, validation) and rendering output.
- **File location:** `src/app/views/panels/RequirementsPanel.ts`, following the workspace panel pattern.
- **State management:** Follow the existing `WizardState` pattern: read from `getWizardState()`, mutate, write back via `saveWizardState()`.
- **CSS:** Use existing CSS classes (`.wizard-form`, `.wizard-field`, `.wizard-input`, `.wizard-textarea`, `.wizard-list`, `.wizard-list-item`, `.wizard-button`, `.add-btn`, `.empty-workspace`, `.workspace-desc`, `.next-step-card`). Add new CSS only if the existing classes are insufficient.
- **Panel contract:** `renderRequirementsPanel()` returns an HTML string. A separate `wireRequirementsPanel()` function handles event binding after the HTML is in the DOM. This function should be called from `switchSection()` in `WorkspaceLayout.ts`.
