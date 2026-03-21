# Spec: Data Modeling Guidance

**Status:** done
**Date:** 2026-03-19

## What

Contextual guidance at key decision points in the wizard that helps users make correct data modeling choices — distinguishing types from fields, decomposing compound actions into separate requirements, and choosing how to source a lexicon. Five areas:

1. **Compound action example** — an expandable example in the Requirements "do" form showing how multi-object actions decompose into separate requirements.
2. **Parent-child tip** — a one-time dismissible tip in the Data panel card grid helping users recognize when a concept should be its own data type.
3. **Data modeling tips** — a permanent expandable reference in the Data panel card grid consolidating key data modeling concepts (parent-child, naming, entity-vs-field). Ensures dismissed tips remain accessible.
4. **Entity-vs-field checklist** — a help link in the data type detail view (next to the Fields header) that expands an inline reference for deciding whether something is a type or a field.
5. **Adopt-vs-create guidance** — an expandable note on the source choice view helping users decide whether to define a new lexicon or adopt an existing one.

## Why

Non-technical users commonly struggle with the entity-vs-field decision. This is the single most reported point of confusion in no-code/low-code app builders (Airtable, Bubble, AppSheet, etc.). The root cause is a mental model mismatch: most users think in spreadsheets (one flat table) rather than relational data (multiple linked types). Without guidance, users will:
- Create data types that should be fields (e.g., "banana" instead of "grocery item")
- Create flat types that should be decomposed (e.g., a "grocery list" with item1, item2, item3 fields instead of a separate "grocery item" type)
- Name types as specific instances rather than the general concept (e.g., "my workout playlist" instead of "playlist")

In the AT Protocol context, each RecordType maps to a Lexicon schema and a PDS collection. Getting the data model wrong means the generated app will have structural problems that are hard to fix later. Similarly, the adopt-vs-create decision has lasting consequences for data interoperability.

## Research Summary

### The core heuristic

Across database design education and no-code tool documentation, the entity-vs-field decision converges on: **"Does this thing have its own life?"**

Signals it should be a **separate data type**:
- It has its own properties beyond just a name (e.g., a grocery item has name, quantity, checked status, category)
- One parent can have many of them (e.g., a list has many items)
- It's shared/referenced by multiple other types
- The list of them grows over time as users add data
- You'd want to search, filter, or view them independently

Signals it should be a **field**:
- It's a simple label or category from a short, fixed list (e.g., status: active/inactive)
- It's a single value that describes something (name, date, count, boolean)
- It only has meaning in the context of its parent

### Compound actions

Users often describe actions involving two data types at once (e.g., "add an item to a list"). These are **compound actions** — a verb applied to a primary type in the context of a secondary type. The form currently handles this via hint text beneath the Data Type combobox. This spec adds a more detailed expandable example to reinforce the concept.

Sources consulted: Airtable blog/community, Bubble.io data docs, Google AppSheet column type docs, Adalo relational database guide, Knack database design guide, Microsoft Access database design basics, Metabase data model mistakes guide.

## Guidance Points

### Point 1: Compound action example (Requirements panel)

**Where:** Below the existing form hint beneath the Data Type combobox in the "do" requirement form.

**Element:** A `<details>` element (native HTML disclosure) with a summary that invites users to expand it.

**Markup:**
```html
<details class="guidance-details">
  <summary>Does your action involve two things?</summary>
  <div class="guidance-details-body">
    <p><em>"I need to add an item to my grocery list"</em> becomes:</p>
    <ul>
      <li>I need to <strong>add</strong> a <strong>grocery item</strong> <span class="guidance-muted">(the thing being acted on)</span></li>
      <li>I need to <strong>create</strong> a <strong>grocery list</strong> <span class="guidance-muted">(the container &mdash; a separate data type)</span></li>
    </ul>
    <p>Focus each requirement on one type of thing. You'll connect them in the Data section.</p>
  </div>
</details>
```

**Behavior:** Always rendered when the "do" form is open. No dismiss/persistence logic needed — the `<details>` element is collapsed by default and the user opens it on demand.

### Point 2: Parent-child tip (Data panel card grid)

**Where:** Between the `workspace-desc` paragraph and the `item-grid` in the Data panel card grid view.

**Trigger:** Shown when `wizardState.recordTypes.length >= 2` AND the localStorage key `guidance_parentChildTipDismissed` is not set to `'true'`.

**Markup:**
```html
<div class="guidance-tip" id="guidance-parent-child-tip">
  <button class="guidance-tip-dismiss" id="guidance-dismiss-parent-child" aria-label="Dismiss tip">&times;</button>
  <p><strong>Tip:</strong> If one of your data types is a <em>list of things</em> that each have their own details (like items in a grocery list, or tasks in a project), those things should be their own data type. You can connect them later.</p>
</div>
```

**Behavior:**
- Rendered inline (not a modal or toast). Non-blocking — does not prevent any user action.
- Clicking the dismiss button (`×`) sets `localStorage.setItem('guidance_parentChildTipDismissed', 'true')` and removes the element from the DOM.
- Once dismissed, the tip does not reappear on re-render, page reload, or future sessions.
- If the user has only 1 data type, the tip is not shown (even if not dismissed).

### Point 3: Data modeling tips (Data panel card grid)

**Where:** In the Data panel card grid view, after the `workspace-desc` paragraph, before the parent-child tip banner (if shown) and the card grid.

**Element:** A `<details>` element (native HTML disclosure), always present when the card grid is rendered (regardless of how many data types exist).

**Markup:**
```html
<details class="guidance-details">
  <summary>Data modeling tips</summary>
  <div class="guidance-details-body">
    <p><strong>Lists of things should be separate data types</strong></p>
    <p>If one of your data types is a list of things that each have
    their own details (like items in a grocery list, or tasks in a
    project), those things should be their own data type. You can
    connect them later.</p>

    <p><strong>Name types as general concepts</strong></p>
    <p>Use "grocery item" not "banana". Use "playlist" not "my
    workout playlist". The data type is the category, not a
    specific instance.</p>

    <p><strong>When adding fields to a data type, ask: "Does this have its own life?"</strong></p>
    <p>If a field has its own properties, can have many instances,
    or would be useful on its own &mdash; it should probably be a
    separate data type. Look for the "Field or data type?" link
    when editing fields.</p>
  </div>
</details>
```

**Behavior:** Always rendered when the card grid is shown (1+ data types). Collapsed by default. No persistence needed — native `<details>` element. The first tip intentionally duplicates the parent-child tip banner content so that it remains accessible after the banner is dismissed.

### Point 4: Entity-vs-field checklist (Data panel detail view)

**Where:** In the data type detail view, in the Fields section header row. A help link appears next to the "Fields" heading (or next to the "+ Add Field" button when visible). The link toggles an inline expandable section.

**Element:** A text link styled as secondary/muted, with text "Field or data type?" — clicking it toggles a `guidance-checklist` section below the header.

**Toggle mechanism:** A module-level boolean (`guidanceChecklistOpen`) controls whether the checklist is rendered. This is used instead of a `<details>` element because the detail view re-renders when fields are added/edited/deleted, and a `<details>` element's open state would be lost on re-render. The module-level boolean preserves the checklist's open/closed state across re-renders within the same detail view session.

**State lifecycle:**
- `guidanceChecklistOpen` is initialized to `false`.
- `openDetailView()` resets it to `false` (so entering any detail view starts with the checklist collapsed).
- Clicking the help link toggles it and triggers a re-render.
- Field add/edit/delete re-renders preserve the current state.

**Markup (link in the Fields section header):**
```html
<div class="fields-section-header">
  <div class="detail-section-heading">Fields</div>
  <div class="fields-header-actions">
    <a href="#" class="guidance-help-link" id="dt-field-guidance-link"
       aria-expanded="false">Field or data type?</a>
    <!-- + Add Field button here when visible -->
  </div>
</div>
```

The `aria-expanded` attribute on the link must reflect the current state: `"false"` when collapsed, `"true"` when expanded. This is updated on each render based on `guidanceChecklistOpen`.

**Markup (expandable section, rendered below the header when `guidanceChecklistOpen` is true):**
```html
<div class="guidance-checklist" id="dt-field-guidance">
  <p><strong>Should this be its own data type, or a field?</strong></p>
  <p>It should probably be its <strong>own data type</strong> if:</p>
  <ul>
    <li>It has its own properties beyond just a name</li>
    <li>One thing can have many of them (e.g., a list has many items)</li>
    <li>Multiple data types reference it</li>
    <li>The list of them grows as users add data</li>
    <li>Users would want to view or search them on their own</li>
  </ul>
  <p>It should probably be a <strong>field</strong> if:</p>
  <ul>
    <li>It's a simple label (like a status or category)</li>
    <li>It's a single value (a name, date, number, yes/no)</li>
    <li>It only makes sense attached to something else</li>
  </ul>
</div>
```

**Visibility rules:**
- Shown for new data types (source: `'new'` or not yet chosen) with identity configured.
- **Hidden for adopted data types** — the checklist's advice isn't actionable since adopted fields are read-only.
- Hidden when identity is not yet configured (no source choice made) since fields aren't actionable yet.

### Point 5: Adopt-vs-create guidance (Data panel detail view)

**Where:** The source choice view (`renderSourceChoice`) in the data type detail view. Inserted below the two source choice cards.

**Markup:**
```html
<details class="guidance-details">
  <summary>How do I choose?</summary>
  <div class="guidance-details-body">
    <p><strong>Use an existing definition when:</strong></p>
    <ul>
      <li>You want your app's data to work with other apps (e.g., posts that show up on Bluesky)</li>
      <li>Someone has already defined a schema that fits your data</li>
      <li>You're building on top of an established ecosystem</li>
    </ul>
    <p><strong>Define your own when:</strong></p>
    <ul>
      <li>Your data is unique to your app</li>
      <li>Existing definitions don't match your needs</li>
      <li>You want full control over the schema</li>
    </ul>
    <p><strong>Important:</strong> Adopting a definition means your app creates data that other apps can see and interact with. If users don't expect their data to appear elsewhere, define your own.</p>
  </div>
</details>
```

**Behavior:** Always rendered on the source choice view. Collapsed by default. No persistence needed.

## Acceptance Criteria

- [ ] Compound action example is accessible from the "do" requirement form
  - When the user opens the "do" requirement form, a collapsed `<details>` element appears below the existing Data Type hint with summary text "Does your action involve two things?"
  - When the user expands it, a worked example shows how "add an item to my grocery list" decomposes into two separate requirements.
  - When the user collapses or ignores it, it does not affect form behavior.

- [ ] Parent-child tip appears in the Data panel card grid
  - When the user views the Data panel with 2+ data types and has not previously dismissed the tip, a tip banner appears between the description and the card grid.
  - When the user clicks the dismiss button, the tip is removed and `localStorage` records the dismissal.
  - When the user returns to the Data panel (re-render or page reload), the tip does not reappear after dismissal.
  - When the user has only 1 data type, the tip is not shown regardless of dismissal state.

- [ ] Data modeling tips are permanently accessible from the card grid
  - When the user views the Data panel card grid (1+ data types), a collapsed "Data modeling tips" `<details>` element appears after the description paragraph.
  - When the user expands it, three tips are shown: parent-child pattern, naming guidance, and an entity-vs-field pointer.
  - The tips `<details>` is always present regardless of whether the parent-child tip banner has been dismissed.

- [ ] Entity-vs-field checklist is accessible from the detail view
  - When the user opens a new-lexicon data type detail view (with identity configured), a "Field or data type?" link appears in the Fields section header with `aria-expanded="false"`.
  - When the user clicks the link, an inline checklist section expands below the header listing signals for "own data type" vs "field", and `aria-expanded` updates to `"true"`.
  - When the user clicks the link again, the section collapses and `aria-expanded` returns to `"false"`.
  - When the user adds, edits, or deletes a field (triggering a re-render), the checklist remains in its current open/closed state.
  - When the user leaves the detail view (back to card grid) and re-enters any detail view, the checklist starts collapsed.
  - When viewing an adopted data type, the checklist link is not shown.
  - When identity is not yet configured (source choice view), the checklist link is not shown.

- [ ] Adopt-vs-create guidance is shown on the source choice view
  - When the user opens a data type detail view for the first time (source not yet chosen), a collapsed "How do I choose?" details element appears below the source choice cards.
  - When the user expands it, guidance explains when to use existing vs define new, including the interoperability implication.

## Scope

**In scope:**
- Compound action `<details>` example in RequirementsPanel "do" form
- Dismissible parent-child tip in the Data panel card grid (localStorage persistence)
- Permanent "Data modeling tips" `<details>` in the Data panel card grid
- Entity-vs-field checklist toggle in the detail view Fields section header (module-level state, `aria-expanded`)
- Adopt-vs-create `<details>` guidance on the source choice view
- CSS for guidance elements (`guidance-details`, `guidance-tip`, `guidance-checklist`, `guidance-help-link`)

**Out of scope:**
- AI-powered schema suggestion or automatic entity detection
- Field-level nudge when a field name looks like it should be a type (e.g., "items")
- Relationship/linking UI between data types (separate spec)
- Template-based starter schemas for common app types
- Namespace description text changes — the existing radio button descriptions are already adequate
- Schema stability / immutability warning — deferred to the generate/publish flow where it's more actionable

## Behavioral Scenarios

**Scenario: User expands compound action example while filling "do" form**
- Setup: User is on the Requirements panel. They click "+ Add Requirement" and select "Data Interaction".
- Action: User sees the "do" form with verb and Data Type fields. Below the Data Type hint, they see "Does your action involve two things?" as a collapsed disclosure. They click it.
- Expected: The example expands showing the grocery list decomposition. The user reads it, then enters verb="add" and data type="grocery item". They save. The form closes and the `<details>` element is gone with it.

**Scenario: Parent-child tip appears with 2+ data types**
- Setup: User has created one "do" requirement, seeding the "grocery item" data type. They add a second "do" requirement for "grocery list". Data sidebar shows 2 items.
- Action: User clicks on the Data section in the sidebar.
- Expected: The Data panel card grid shows two cards. Between the description paragraph and the card grid, a tip banner says "Tip: If one of your data types is a list of things..." with a dismiss button.

**Scenario: User dismisses parent-child tip**
- Setup: Parent-child tip is visible in the Data panel.
- Action: User clicks the × dismiss button.
- Expected: The tip is removed from the DOM. `localStorage.getItem('guidance_parentChildTipDismissed')` returns `'true'`. Navigating away and back to the Data panel does not show the tip. Reloading the page does not show the tip.

**Scenario: Tip not shown with only 1 data type**
- Setup: User has exactly 1 data type. The tip has not been dismissed.
- Action: User views the Data panel.
- Expected: No tip is shown. The card grid renders normally with one card.

**Scenario: User opens data modeling tips in the card grid**
- Setup: User has 2+ data types. They have previously dismissed the parent-child tip banner.
- Action: User views the Data panel card grid. The tip banner is gone, but below the description paragraph they see "Data modeling tips" as a collapsed disclosure. They click it.
- Expected: Three tips expand: "Lists of things should be separate data types" (same content as the dismissed banner), "Name types as general concepts", and "When adding fields to a data type, ask: 'Does this have its own life?'" with a pointer to the "Field or data type?" link.

**Scenario: Data modeling tips shown with 1 data type**
- Setup: User has exactly 1 data type. The parent-child tip banner is not shown (requires 2+).
- Action: User views the Data panel card grid.
- Expected: The "Data modeling tips" `<details>` is present below the description. The parent-child tip banner is not shown.

**Scenario: User toggles entity-vs-field checklist**
- Setup: User has a data type "grocery item" with identity configured (new lexicon). They click the card to enter the detail view.
- Action: In the Fields section header, user sees "Field or data type?" link. They click it.
- Expected: The checklist section expands below the header, showing bullet lists for "own data type" signals and "field" signals. The link's `aria-expanded` is `"true"`. Clicking the link again collapses the section and sets `aria-expanded` to `"false"`.

**Scenario: Checklist survives field re-render**
- Setup: User has the entity-vs-field checklist open in the detail view.
- Action: User clicks "+ Add Field", fills in the form, and saves. The detail view re-renders to show the new field.
- Expected: The checklist remains open after the re-render. The user can continue referencing it while adding more fields.

**Scenario: Checklist resets when re-entering detail view**
- Setup: User has the checklist open in the "grocery item" detail view.
- Action: User clicks "Back to Data Types" to return to the card grid, then clicks the "grocery item" card again.
- Expected: The detail view opens with the checklist collapsed.

**Scenario: Checklist hidden for adopted data types**
- Setup: User has adopted `app.bsky.feed.post`.
- Action: User views the detail view for the adopted data type.
- Expected: The Fields section header shows "Fields" but no "Field or data type?" help link. Fields are listed as read-only.

**Scenario: Checklist not shown before identity configured**
- Setup: User has a data type "grocery item" with no identity configured yet (source choice view is showing).
- Action: User views the detail view.
- Expected: The source choice cards are visible. The Fields section shows but the "Field or data type?" link is not present (identity must be configured first since fields aren't actionable yet).

**Scenario: User reads adopt-vs-create guidance**
- Setup: User clicks a data type card for a type with no identity configured.
- Action: The source choice view shows "Define new" and "Use existing" cards. Below them, a collapsed "How do I choose?" details element is visible. User expands it.
- Expected: Guidance explains when to use existing vs define new. The user reads the "Important" note about interoperability and decides to define their own. They click "Define new".

## Files Likely Affected

### Modified Files
- `src/app/views/panels/RequirementsPanel.ts` — Add compound action `<details>` below the "do" form Data Type hint
- `src/app/views/panels/DataPanel.ts` — Parent-child tip in card grid, data modeling tips `<details>` in card grid, `guidanceChecklistOpen` module state and checklist toggle in detail view Fields header, adopt-vs-create guidance on source choice view

### New Files
- `styles/workspace/guidance.css` — Styles for all guidance elements (tip, details, checklist, help link)

## How to Verify

1. Open the "do" requirement form — confirm the compound action `<details>` appears below the Data Type hint and can be expanded/collapsed
2. Create 2+ data types — confirm the parent-child tip appears in the Data panel card grid
3. Dismiss the tip — confirm it does not reappear on re-render or page reload
4. Confirm "Data modeling tips" `<details>` is present in the card grid (with 1+ data types) and contains three tips including the parent-child content
5. Dismiss the parent-child banner, then confirm the tips `<details>` still has the same content
6. Open a new-lexicon data type detail view with identity configured — confirm "Field or data type?" link appears in the Fields header
7. Click the link — confirm the entity-vs-field checklist expands/collapses
8. Open the checklist, add a field — confirm the checklist stays open after re-render
9. Leave and re-enter the detail view — confirm the checklist starts collapsed
10. Open an adopted data type detail view — confirm the checklist link is not shown
11. Open a data type detail view without identity — confirm the source choice view shows "How do I choose?" below the cards
12. `npm run build` compiles without errors
13. `npx vitest run` passes
