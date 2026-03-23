# Spec: Generate Panel

**Status:** draft
**Date:** 2026-03-23
**Depends on:** Views Panel (Phase 5)

## What

Add a "Generate" panel as the 5th sidebar section (Phase 6 of the layout migration). This panel collects the app identity fields (name, domain, description, author) that the code generator requires, shows a review summary of the user's work, and provides a "Download ZIP" button that generates and downloads the AT Protocol app. A next-step card is added to the Views panel pointing to Generate.

## Why

The old Step 7 generate flow was deprecated during the layout migration. Users can define requirements, data, blocks, and views but have no way to produce output. The generate panel completes the wizard by giving users a clear final step: name the app, review what they've built, and download it. Collecting app identity at generate time (rather than upfront) matches the iterative design flow — users shouldn't have to name their app before defining what it does.

## Design Decisions

1. **5th sidebar section** — consistent with the 4-section pattern, clear visual progression, natural target for the Views panel's next-step card.
2. **App Info collected here** — `appInfo.appName` and `appInfo.domain` are required by the generator but had no UI since Step 1 was deleted. The generate panel is their natural home.
3. **App Config auto-derived** — `primaryRecordType` defaults to first record type, `listDisplayFields` defaults to first 3 fields (the generator already handles both fallbacks). No override UI in this phase.
4. **ZIP-only** — GitHub export adds significant UI complexity (token, repo name, async API flow). Deferred to a follow-up. The `outputMethod` is hardcoded to `'zip'`.
5. **Domain field always shown** — some generator code paths use `appInfo.domain` via `generateNSID()` (e.g., `Api.ts`, `Types.ts`). Required for correct output regardless of per-record namespace settings.

## Data Model Changes

### SectionName (modified)

In `src/types/wizard.ts`, add `'generate'` to the union:

```typescript
export type SectionName = 'requirements' | 'data' | 'components' | 'views' | 'generate';
```

No new types or WizardState fields needed — the panel writes to existing `appInfo` fields.

## UI Structure

### Panel layout

The Generate panel follows the same `render*Panel()` / `wire*Panel()` / `update*Sidebar()` pattern as existing panels. It does NOT use the inline-form CRUD pattern (no item list to manage). Instead it's a static form with three visual sections.

**Workspace body contains (in order):**
1. Description paragraph (`.workspace-desc`)
2. Section A: App Info — editable form fields
3. Section B: Review — read-only summary of what will be generated
4. Section C: Export — Download ZIP button

**Description text:**
> Configure your app's identity and download the generated AT Protocol application.

### Section A: App Info

Form fields that persist to `wizardState.appInfo` on every `input` event:

```html
<div class="generate-section">
  <h3 class="generate-section-title">App Identity</h3>
  <div class="form-group">
    <label for="gen-app-name">App Name <span class="required">*</span></label>
    <input type="text" id="gen-app-name" placeholder="e.g., My Cool App">
    <div class="form-hint">Used in package.json, page title, and ZIP filename.</div>
  </div>
  <div class="form-group">
    <label for="gen-domain">Domain <span class="required">*</span></label>
    <input type="text" id="gen-domain" placeholder="e.g., example.com">
    <div class="form-hint">
      Used for lexicon NSID generation (e.g., com.example.myRecord).
    </div>
  </div>
  <div class="form-group">
    <label for="gen-description">Description</label>
    <textarea id="gen-description" rows="2"
      placeholder="A short description of your app"></textarea>
    <div class="form-hint">Appears in package.json and README.</div>
  </div>
  <div class="form-group">
    <label for="gen-author">Author</label>
    <input type="text" id="gen-author" placeholder="Your name">
    <div class="form-hint">Appears in package.json and README.</div>
  </div>
</div>
```

Fields are pre-populated from `wizardState.appInfo` if the user previously filled them in and navigated away.

### Section B: Review

Read-only summary showing what will be generated. Uses a definition-list style layout.

```html
<div class="generate-section">
  <h3 class="generate-section-title">Review</h3>
  <div class="generate-review">
    <div class="generate-review-item">
      <div class="generate-review-label">Record Types</div>
      <div class="generate-review-value">[count] — [names with NSIDs]</div>
    </div>
    <div class="generate-review-item">
      <div class="generate-review-label">Views</div>
      <div class="generate-review-value">[count] — [names]</div>
    </div>
    <div class="generate-review-item">
      <div class="generate-review-label">Blocks</div>
      <div class="generate-review-value">[count]</div>
    </div>
    <div class="generate-review-item">
      <div class="generate-review-label">Requirements</div>
      <div class="generate-review-value">[count]</div>
    </div>
  </div>
</div>
```

**When zero record types exist:** Show a warning hint below the review:
```html
<div class="generate-warning">
  No data types defined — your generated app will have no AT Protocol records.
  You can still generate, but the app won't do much.
</div>
```

**Lexicon preview:** Each record type in the review section has a collapsible `<details>` that shows the generated lexicon JSON:
```html
<details>
  <summary>[NSID]</summary>
  <pre class="wizard-code">[lexicon JSON]</pre>
</details>
```

The NSID is computed using `computeRecordTypeNsid(record, domain)` from `src/generator/Lexicon.ts`. The domain value comes from the domain input field's current value (read from state).

### Section C: Export

```html
<div class="generate-section">
  <h3 class="generate-section-title">Export</h3>
  <div class="generate-btn-wrapper">
    <button class="generate-btn" id="gen-download-btn" disabled>
      Download ZIP
    </button>
    <div class="form-hint">
      Generates a complete AT Protocol app ready to run with npm install && npm run dev.
    </div>
  </div>
</div>
```

**Button state:**
- Disabled when `appName` is empty (after trimming) OR `domain` is empty (after trimming).
- Enabled when both required fields have values.
- Updates in real-time as the user types.

**Button click behavior:**
1. Hardcodes `wizardState.appConfig.outputMethod = 'zip'`.
2. Calls the existing `generateApp()` from `src/app/export/OutputGenerator.ts`.
3. The ZIP downloads via the browser (existing `ZipExporter.ts` flow).

### Sidebar integration

The sidebar Generate section shows readiness status:

```html
<!-- When appName is empty -->
<div class="sidebar-item-empty">Configure & generate</div>

<!-- When appName is filled in -->
<div class="sidebar-item"><span class="dot"></span> [App Name]</div>
```

Badge: shows nothing meaningful (could show "1" when ready, or omit). Use empty string or "—" when not configured.

`has-items` class: set when `appInfo.appName.trim()` is non-empty (indicates the user has engaged with this section).

### Accordion integration

The accordion section for Generate follows the same pattern as other sections:
- Summary text: shows app name if configured, "Configure & generate" otherwise.
- Badge: same as sidebar.

### Next-step card in Views panel

Add a next-step card at the bottom of `renderViewsPanel()`:

```html
<div class="next-step">
  <div class="next-step-card" id="views-next-step" data-section="generate">
    <div>
      <div class="next-step-label">Final step</div>
      <div class="next-step-title">Generate your app</div>
    </div>
    <div class="next-step-arrow">&rarr;</div>
  </div>
</div>
```

Clicking it calls `switchSection('generate')` (already imported in ViewsPanel).

## Acceptance Criteria

- [ ] The Generate section appears as Step 5 in the sidebar and accordion
  - When the workspace layout renders, a 5th sidebar section labeled "Generate" appears below Views with a progress dot and badge.
  - The accordion layout includes a matching Generate section.
  - Clicking the sidebar or accordion header switches to the Generate panel.

- [ ] The Generate panel renders app identity form fields
  - When the user switches to Generate, the panel shows App Name (required), Domain (required), Description (optional), and Author (optional) inputs.
  - Fields are pre-populated from `wizardState.appInfo` if values exist.
  - Typing in any field persists the value to `wizardState.appInfo` via `saveWizardState()` on each `input` event.
  - Navigating away and back preserves the entered values.

- [ ] The Generate panel shows a review summary
  - The review section shows counts and names for Record Types, Views, Blocks, and Requirements based on current wizard state.
  - Each record type shows a collapsible lexicon JSON preview using `computeRecordTypeNsid()` and `generateRecordLexicon()`.
  - When zero record types exist, a warning message appears: "No data types defined — your generated app will have no AT Protocol records."

- [ ] The Download ZIP button generates and downloads the app
  - The button is disabled when App Name or Domain is empty.
  - The button enables in real-time as the user fills in both required fields.
  - Clicking the enabled button calls `generateApp()` which produces a ZIP download via the existing `ZipExporter.ts` flow.
  - The `outputMethod` is hardcoded to `'zip'` (no GitHub option in this phase).

- [ ] The sidebar updates to reflect generate readiness
  - When `appInfo.appName` is empty, the sidebar items area shows "Configure & generate".
  - When `appInfo.appName` is non-empty, the sidebar shows the app name as an item.
  - The `has-items` class (filled progress dot) is set when `appInfo.appName` is non-empty.

- [ ] The Views panel includes a next-step card pointing to Generate
  - A "Final step: Generate your app" card appears at the bottom of the Views panel.
  - Clicking it switches to the Generate section.

- [ ] The panel is responsive
  - At viewports >= 768px, the Generate panel renders in the workspace.
  - At viewports < 768px, the same content renders inside the Generate accordion section.

- [ ] The review section updates when state changes
  - When the user re-renders the Generate panel (e.g., navigates away and back), the review reflects the current state (updated record types, views, blocks, requirements).

## Scope

**In scope:**
- `GeneratePanel.ts` with render, wire, sidebar update, rerender functions
- Adding `'generate'` to `SectionName` type
- 5th sidebar + accordion section in `workspace.html`
- `SECTION_CONFIG` and `switchSection()` updates in `WorkspaceLayout.ts`
- Accordion summary for Generate in `updateAccordionSummaries()`
- CSS for the generate panel
- Next-step card in ViewsPanel
- Tests for GeneratePanel

**Out of scope:**
- GitHub export (deferred — no token/repo UI, no output method toggle)
- App Config overrides (primaryRecordType, listDisplayFields) — generator auto-derives
- Changes to `OutputGenerator.ts` or `ZipExporter.ts` beyond hardcoding outputMethod
- Changes to `GitHubExporter.ts`
- Drag-and-drop or reordering in the review section
- Lexicon editing from this panel

## Files Likely Affected

### New Files
- `src/app/views/panels/GeneratePanel.ts` — render, wire, sidebar, rerender
- `styles/workspace/generate-panel.css` — section separators, review layout, download button
- `tests/views/GeneratePanel.test.ts` — unit tests

### Modified Files
- `src/types/wizard.ts` — add `'generate'` to `SectionName`
- `src/app/views/workspace.html` — add 5th sidebar section + accordion section
- `src/app/views/WorkspaceLayout.ts` — import GeneratePanel, add to SECTION_CONFIG, wire in switchSection, add accordion summary
- `src/app/views/panels/ViewsPanel.ts` — add next-step card + click handler
- `styles.css` — add `@import` for generate-panel.css
- `tests/views/ViewsPanel.test.ts` — add test for next-step card

## Integration Boundaries

### GeneratePanel → WizardState
- **Data flowing in:** Reads `wizardState.appInfo`, `wizardState.recordTypes`, `wizardState.views`, `wizardState.blocks`, `wizardState.requirements` to populate form and review.
- **Data flowing out:** Writes to `wizardState.appInfo.appName`, `wizardState.appInfo.domain`, `wizardState.appInfo.description`, `wizardState.appInfo.authorName` via `saveWizardState()`.
- **Expected contract:** All `appInfo` fields are strings, possibly empty.

### GeneratePanel → OutputGenerator
- **Data flowing out:** Calls `generateApp()` which reads the full wizard state and produces a ZIP download.
- **Expected contract:** `generateApp()` handles missing/default values for `appConfig.primaryRecordType` and `appConfig.listDisplayFields`.

### GeneratePanel → Lexicon (for review preview)
- **Data flowing in:** Calls `computeRecordTypeNsid(record, domain)` and `generateRecordLexicon(record, domain, recordTypes)` to show lexicon previews.
- **Expected contract:** These are pure functions that tolerate empty domain (falls back to bare record name).

## Behavioral Scenarios

**Scenario 1: First visit to Generate panel — empty state**
- Setup: Fresh wizard state. No appInfo values set. 1 record type "post" exists.
- Action: User clicks Generate in the sidebar.
- Expected outcome: Panel shows empty App Name and Domain fields (both required), empty Description and Author fields. Review shows "1" record type with name. Download button is disabled. Sidebar shows "Configure & generate".

**Scenario 2: Filling in required fields enables download**
- Setup: User is on the Generate panel. Both App Name and Domain are empty.
- Action: User types "My App" in App Name. Button still disabled (domain empty). User types "example.com" in Domain.
- Expected outcome: Download button enables. Sidebar updates to show "My App" as an item. Progress dot fills.

**Scenario 3: Generating and downloading**
- Setup: App Name is "My App", Domain is "example.com". 1 record type with fields exists.
- Action: User clicks "Download ZIP".
- Expected outcome: `generateApp()` is called. Browser downloads "my-app.zip" containing the full generated AT Protocol app. Success alert with setup instructions appears (from existing ZipExporter flow).

**Scenario 4: Review section with multiple record types**
- Setup: 2 record types ("post", "profile"), 3 blocks, 2 views ("Home", "Profile"), 5 requirements. Domain is "example.com".
- Action: User views the Generate panel.
- Expected outcome: Review shows "2 — post (com.example.post), profile (com.example.profile)". Each has a collapsible lexicon preview. Views shows "2 — Home, Profile". Blocks shows "3". Requirements shows "5".

**Scenario 5: No record types — warning shown**
- Setup: No record types defined. App Name and Domain are filled in.
- Action: User views the Generate panel.
- Expected outcome: Review shows "0" record types. Warning text appears: "No data types defined — your generated app will have no AT Protocol records." Download button is still enabled (generating an empty app is valid).

**Scenario 6: Navigating away and back preserves form values**
- Setup: User has typed "My App" in App Name and "example.com" in Domain.
- Action: User clicks Data in the sidebar, then clicks Generate again.
- Expected outcome: App Name shows "My App", Domain shows "example.com" (persisted to state and re-read on render).

**Scenario 7: Review updates after adding data**
- Setup: User visits Generate — review shows 0 record types. User navigates to Data, adds a record type.
- Action: User navigates back to Generate.
- Expected outcome: Review now shows 1 record type with its name and NSID.

**Scenario 8: Next-step card in Views panel**
- Setup: User is on the Views panel.
- Action: User scrolls to bottom and clicks "Final step: Generate your app" card.
- Expected outcome: Workspace switches to the Generate panel. Sidebar highlights Generate section.

**Scenario 9: Accordion layout (narrow viewport)**
- Setup: Viewport < 768px.
- Action: User taps the Generate accordion header.
- Expected outcome: Accordion opens showing the same form fields, review, and download button. Form inputs are full-width.

**Scenario 10: Clearing a required field disables download**
- Setup: Both App Name and Domain are filled. Download button is enabled.
- Action: User clears the App Name field.
- Expected outcome: Download button disables immediately. Sidebar reverts to "Configure & generate". Progress dot unfills.

## How to Verify

1. Navigate to Generate in sidebar — verify panel renders with form fields, review, and download button
2. Verify App Name and Domain are required (button disabled when empty)
3. Fill in App Name and Domain — verify button enables, sidebar updates
4. Click Download ZIP — verify ZIP downloads with correct filename and contents
5. Navigate away and back — verify form values persist
6. Add/remove record types in Data panel, return to Generate — verify review updates
7. Verify lexicon preview shows correct NSID and JSON for each record type
8. Verify no-record-types warning appears when appropriate
9. Verify next-step card in Views panel switches to Generate
10. Resize below 768px — verify accordion layout works
11. `npm run build` compiles without errors
12. `npx vitest run` passes
