# Spec: Data Type Identity — Lexicon Configuration & Discovery

**Status:** draft
**Date:** 2026-03-19
**Depends on:** `.specs/done/data-panel-cards.md`

## What

Clicking a data type card opens a detail view where the user configures the lexicon identity — either by adopting an existing lexicon from the network or by creating a new one. For new lexicons, users select a namespace option (theLexFiles.com, theLexFiles.com with `.temp.`, or a domain they own), set a record name, and see a live NSID preview. For adopted lexicons, the identity is imported from the upstream schema. The detail view replaces the card grid; a "Back" link returns to it.

## Why

Data types seeded from requirements are currently empty shells — displayName only, no lexicon name, no NSID, no fields. Before users can add fields (see `data-type-fields.md`), they need to establish the lexicon identity. This identity determines:
- Whether the data type uses a new or existing schema
- The NSID under which records will be stored in the user's ATProto repository
- Whether the schema is experimental (`.temp.`) or stable
- Who controls the namespace (the user, or theLexFiles.com)

The identity also determines field editability: adopted lexicons have read-only fields (their schema is defined upstream), while new lexicons have user-defined fields.

## Card Interaction Model

The current data panel shows a grid of read-only cards. This spec adds a detail view that opens when a card is clicked.

**Card grid → Detail view:** Clicking a card replaces the card grid with a full-width detail view for that data type. The card grid is not visible while the detail view is open.

**Detail view → Card grid:** A "← Back to Data Types" link at the top of the detail view returns to the card grid. The card grid re-renders with fresh state (reflecting any changes made in the detail view). If the create-new form has unsaved changes (dirty state), a confirmation is shown: "You have unsaved changes. Discard?" If the form has no unsaved changes, navigation is immediate.

**Detail view layout (top-level structure):**

```
← Back to Data Types

[displayName]                           [Status Badge]

─── Lexicon Source ─────────────────────────────────
[Create-new form (default) OR browse UI OR adopted state]
[Or browse existing lexicons →]

─── Fields ─────────────────────────────────────────
[Field list — see data-type-fields.md]
```

The detail view has two sections: **Lexicon Source** (this spec) and **Fields** (see `data-type-fields.md`). Each section is independently editable — changes in the identity section save via their own Save button; field changes save per-operation (add/edit/delete).

## Source Selection

The create-new form is the default and primary path for new data types. Below the create-new form, a secondary link — **"Or browse existing lexicons →"** — lets the user explore existing lexicons for potential adoption.

Clicking the browse link swaps the create-new form for the search/browse UI within the Lexicon Source section. A **"← Back to creating new"** link at the top of the browse UI returns to the create-new form with all data preserved. No data is lost or cleared by browsing — the destructive action is explicitly clicking "Adopt this lexicon" (see Adopt Action below).

For data types that already have an adopted lexicon, the Lexicon Source section shows the adopted state (see Adopted State Display below) instead of the create-new form.

## Create New Lexicon Path

The create-new form shows:

### Record Name

- **Label:** "Record name"
- **Input:** Text field, auto-suggested from displayName on first open
- **Auto-suggestion:** Convert displayName to lowerCamelCase. "grocery item" → "groceryItem", "My Task List" → "myTaskList". Strip non-alphanumeric characters, split on spaces/punctuation, camelCase join.
- **Validation:** 1–63 characters, letters (a–z, A–Z) and digits (0–9) only, cannot start with a digit. Convention is lowerCamelCase. Show inline error if invalid.
- **Hint text:** "This becomes the last segment of your lexicon's NSID. Use lowerCamelCase (e.g., groceryItem, userProfile)."
- **Maps to:** `RecordType.name`

### Description

- **Label:** "Description"
- **Input:** Textarea, 1–3 sentences
- **Hint text:** "Briefly describe what this record type stores. This appears in the lexicon schema and helps other developers understand your data."
- **Maps to:** `RecordType.description`

### Namespace

- **Label:** "Where will this lexicon live?"
- **Presentation:** Radio group with descriptions

**Option A — theLexFiles.com (recommended, default):**
- Radio label: "theLexFiles.com"
- Description: "Published under your username at theLexFiles.com. This is a stable lexicon — other apps can build against it. You won't be able to make breaking changes after publishing."
- Shows username field (see below)
- Badge: "Recommended"

**Option B — theLexFiles.com, experimental:**
- Radio label: "theLexFiles.com — experimental"
- Description: "Uses the .temp. namespace to signal that this schema is experimental and may change. Choose this if you're prototyping or aren't ready to commit to a stable schema. You can publish a stable version later."
- Shows username field (see below)

**Option C — My own domain:**
- Radio label: "My own domain"
- Description: "Use a domain you control. You'll need to configure DNS records and handle publishing yourself."
- Shows domain field (see below)
- Warning banner: "Only choose this if you're comfortable managing DNS TXT records and AT Protocol lexicon publishing. If you're not sure, use theLexFiles.com."

### Username (shown for Options A and B)

- **Label:** "Username"
- **Input:** Text field
- **Auto-fill:** If user is logged in via ATProto OAuth, auto-fill with the first segment of their handle (e.g., `alice.bsky.social` → `alice`). User can change it.
- **Validation:** 1–63 characters, lowercase letters, digits, and hyphens. Cannot start or end with a hyphen. This becomes a subdomain, so standard subdomain rules apply.
- **Hint text:** "This is your namespace on theLexFiles.com. All your lexicons will be published under this name."
- **Persistence:** Once set, the username is saved at the app level and auto-filled for subsequent data types. The user can override per data type, but the default is the previously used value.
- **Maps to:** `RecordType.lexUsername` (and cached in `AppInfo.lexUsername` for auto-fill)

### Custom Domain (shown for Option C only)

- **Label:** "Domain"
- **Input:** Text field
- **Placeholder:** "example.com"
- **Validation:** Must look like a valid domain (contains at least one dot, no spaces, no protocol prefix). We do not verify DNS ownership in the wizard — that's the user's responsibility.
- **Hint text:** "Enter the domain you control. You'll need to create a _lexicon.[domain] DNS TXT record pointing to your DID before publishing."
- **Maps to:** `RecordType.customDomain`

### NSID Preview

Below the namespace selection, a live-updating NSID preview shows the computed NSID:

- **Option A:** `com.thelexfiles.[username].[recordName]`
- **Option B:** `com.thelexfiles.[username].temp.[recordName]`
- **Option C:** `[reversed-domain].[recordName]`

The preview updates as the user types in the name, username, or domain fields. If any required field is empty, show the NSID with placeholder brackets: `com.thelexfiles.___.[recordName]`

**Presentation:** Styled as a read-only code block or monospace text with a label "Your lexicon NSID:".

### Advanced Section (collapsed by default)

A "▸ Advanced" toggle that expands to show:

**Record Key Type:**
- **Label:** "Record key type"
- **Input:** Select dropdown
- **Options:**
  - "Auto-generated ID (tid)" — default, recommended. "Each record gets a unique timestamp-based ID. This is the standard for most record types."
  - "Custom key (any)" — "Record keys are user-defined strings. Use this when you need meaningful keys (e.g., a settings record keyed by setting name)."
- **Maps to:** `RecordType.recordKeyType`

### Save / Cancel

- **Save button:** Validates all required fields (name, namespace fields), saves to state, updates card in grid. Disabled until the form is valid.
- **Cancel button:** Discards unsaved changes, returns form to last-saved state. Does NOT navigate back to the card grid — the user stays in the detail view.

## Adopt Existing Lexicon Path

When the user clicks "Or browse existing lexicons →", the create-new form is replaced by the browse UI:

### Search

- **Label:** "Search for a lexicon"
- **Input:** Text field with search icon
- **Placeholder:** "Search by name or NSID (e.g., 'feed post' or 'app.bsky.feed')"
- **Behavior:** As the user types (debounced, ~300ms), query Lexicon Garden's autocomplete endpoint (`/api/autocomplete-nsid?q=[query]`). Display results in a dropdown below the input.

### Search Results

- **Presentation:** Dropdown list below the search input, max 10 results visible (scrollable if more)
- **Each result shows:**
  - NSID (e.g., `app.bsky.feed.post`) — primary text
  - Source label (e.g., "via Lexicon Garden") — secondary text
- **Empty state:** "No lexicons found matching '[query]'"
- **Error state:** If the API request fails, show "Search unavailable. You can enter an NSID directly below." and reveal a manual NSID input field.

### Manual NSID Entry (fallback)

- **Label:** "Or enter an NSID directly"
- **Input:** Text field
- **Placeholder:** "app.bsky.feed.post"
- **Shown:** Always visible below the search results, OR shown as primary input if search fails
- **Behavior:** When the user enters a valid-looking NSID and clicks "Look up", fetch the full schema via Lexicon Garden's XRPC resolve endpoint (`/xrpc/com.atproto.lexicon.resolveLexicon?nsid=[nsid]`). If not found there, try Lexicon Store's PDS (`com.atproto.repo.getRecord` on `pds.lexicon.store`).

### Schema Preview

When the user selects a search result or looks up a manual NSID, the full schema is fetched and displayed:

- **NSID:** The full identifier
- **Description:** From the schema
- **Type:** "record", "query", "procedure", etc.
- **Record key type:** e.g., "tid"
- **Fields:** List of field names, types, and whether they're required
- **Raw JSON:** Expandable section showing the full lexicon JSON

**Non-record type warning:** If the fetched schema's primary definition type is not `record`, show: "This lexicon is a [type], not a record type. Only record-type lexicons can be adopted as data types." The "Adopt" button is disabled.

### Adopt Action

- **Button:** "Adopt this lexicon" — shown below the schema preview, enabled only for record-type schemas
- **Confirmation:** If the data type has existing identity data (name, namespace fields) or user-defined fields from the create-new path, show a confirmation: "Adopting this lexicon will replace your current name, namespace, and fields. Continue?" If the data type is still a blank draft, no confirmation is needed.
- **On click (after confirmation if needed):**
  - Sets `RecordType.source = 'adopted'`
  - Sets `RecordType.adoptedNsid` to the NSID
  - Sets `RecordType.adoptedSchema` to the full schema JSON
  - Sets `RecordType.name` from the NSID's name segment
  - Sets `RecordType.description` from the schema's description
  - Sets `RecordType.recordKeyType` from the schema's key type
  - Populates `RecordType.fields` from the schema's properties (see `data-type-fields.md` for field import mapping)
  - Saves to state
  - Re-renders the detail view in adopted/read-only mode

### Adopted State Display

After adoption, the Lexicon Source section shows:
- The adopted NSID prominently
- The schema description
- A "Change" link that returns to the source selection (with confirmation: "Stop using this lexicon? Your fields will be cleared.")
- All identity fields (name, namespace, NSID) are hidden — they're determined by the adopted schema
- The Fields section (Spec 2) shows imported fields as read-only

## Status Badge

The detail view header shows a status badge next to the displayName:

- **"Draft"** — source not yet configured (no name set, not adopted). Gray badge.
- **"Ready"** — identity complete (name + namespace set for new, or schema adopted). Green badge.
- **"Adopted"** — using an existing lexicon. Blue badge.

The card in the grid also shows this status. This replaces the current "Name and fields needed" / "Lexicon name needed" completion text for the identity portion. (The fields portion of completion status is handled by `data-type-fields.md`.)

## Data Model Changes

### RecordType (updated)

```typescript
interface RecordType {
  id: string;
  name: string;              // lexicon name segment (lowerCamelCase)
  displayName: string;       // human-readable label from requirements
  description: string;
  fields: Field[];

  // New: lexicon source
  source: 'new' | 'adopted';          // default 'new'

  // New: for adopted lexicons
  adoptedNsid?: string;               // full NSID of adopted schema
  adoptedSchema?: LexiconSchema;      // full schema JSON for reference

  // New: for new lexicons — namespace
  namespaceOption?: 'thelexfiles' | 'thelexfiles-temp' | 'byo-domain';
  lexUsername?: string;                // theLexFiles.com username
  customDomain?: string;              // BYO domain

  // New: record key type
  recordKeyType?: 'tid' | 'any';      // default 'tid'
}
```

### AppInfo (updated)

```typescript
interface AppInfo {
  appName: string;
  domain: string;
  description: string;
  authorName: string;

  // New: cached namespace defaults
  lexUsername?: string;                // last-used theLexFiles.com username
  lastNamespaceOption?: 'thelexfiles' | 'thelexfiles-temp' | 'byo-domain';
}
```

### State Migration

Existing RecordTypes (from prior sessions) should be migrated:
- `source` defaults to `'new'`
- `recordKeyType` defaults to `'tid'`
- All other new fields default to `undefined`

## Acceptance Criteria

- [ ] Clicking a data type card opens a detail view
  - When the user clicks a card in the data panel grid, the card grid is replaced by a full-width detail view for that data type.
  - The detail view shows the displayName as a heading, a status badge, a "← Back to Data Types" link, and the Lexicon Source section.
  - When the user clicks "← Back to Data Types", the card grid re-renders with fresh state.

- [ ] Browse link allows exploring existing lexicons without losing create-new data
  - When the detail view opens for a data type with `source: 'new'` (or no source set), the create-new form is shown by default with an "Or browse existing lexicons →" link below.
  - When the user clicks the browse link, the create-new form is replaced by the search/browse UI. A "← Back to creating new" link returns to the create-new form with all data preserved.
  - When the user clicks "Adopt this lexicon" and the data type has existing identity data or user-defined fields, a confirmation prompt appears: "Adopting this lexicon will replace your current name, namespace, and fields. Continue?"

- [ ] Create-new form captures name, description, namespace, and shows NSID preview
  - When the user opens the create-new form, the record name is auto-suggested from the displayName (lowerCamelCase conversion).
  - When the user types in the record name field, inline validation shows errors for invalid characters or format.
  - When the user selects a namespace option, the appropriate sub-fields appear (username for theLexFiles.com options, domain for BYO).
  - When namespace option is theLexFiles.com and the user is logged in, the username field auto-fills from their ATProto handle's first segment.
  - When any input changes, the NSID preview updates in real time.
  - When the user clicks Save with valid inputs, the RecordType is updated in state and the status badge changes to "Ready".
  - When the user clicks Save with invalid or incomplete inputs, the Save button is disabled and inline errors are shown.

- [ ] Adopt-existing form searches Lexicon Garden and displays schema previews
  - When the user types in the search field, autocomplete results from Lexicon Garden appear after a 300ms debounce.
  - When search results appear, each shows the NSID and source attribution.
  - When the user selects a result, the full schema is fetched and displayed as a preview (description, type, fields, record key type).
  - When the fetched schema is not a record type, a warning is shown and the Adopt button is disabled.
  - When the search API is unavailable, a fallback manual NSID entry field is shown.

- [ ] Adopting a lexicon imports the schema and locks identity fields
  - When the user clicks "Adopt this lexicon", the RecordType is populated with the adopted schema's data (NSID, name, description, key type, fields).
  - When viewing an adopted data type, the identity section shows the adopted NSID and a "Change" link — no editable identity fields.
  - When the user clicks "Change" on an adopted lexicon, a confirmation prompt warns that fields will be cleared.

- [ ] Namespace username persists across data types
  - When the user sets a username for the first data type, subsequent data types auto-fill the same username.
  - When the user changes the username on one data type, the change does not retroactively update other data types.

- [ ] Status badge reflects identity completeness
  - When a data type has no name and is not adopted, the badge shows "Draft".
  - When a data type has a complete identity (name + namespace for new, or adopted schema), the badge shows "Ready" or "Adopted".

- [ ] Back navigation warns on unsaved changes
  - When the user clicks "← Back to Data Types" with unsaved changes in the create-new form, a confirmation prompt appears: "You have unsaved changes. Discard?"
  - When the user clicks "← Back to Data Types" with no unsaved changes, navigation is immediate.

- [ ] BYO domain option shows appropriate warnings
  - When the user selects "My own domain", a warning banner explains the DNS and publishing requirements.
  - The warning is non-blocking — the user can proceed.

## Behavioral Scenarios

**Scenario: First-time card click — create new lexicon**
- Setup: User has a "grocery item" data type (seeded from requirements, source not yet set). User is logged in as `alice.bsky.social`.
- Action: User clicks the "grocery item" card.
- Expected: Detail view opens with the create-new form shown by default. Record name is pre-filled with "groceryItem". Username is pre-filled with "alice". Namespace defaults to theLexFiles.com (recommended). NSID preview shows `com.thelexfiles.alice.groceryItem`. "Or browse existing lexicons →" link is visible below the form. Status badge shows "Draft".

**Scenario: Save create-new identity**
- Setup: User is in the detail view with record name "groceryItem", description "A single item on a grocery list", namespace theLexFiles.com, username "alice".
- Action: User clicks Save.
- Expected: RecordType updated in state. Status badge changes to "Ready". Save button briefly shows success state. Card grid (when returned to) shows updated completion status.

**Scenario: Choose experimental namespace**
- Setup: User is creating a new data type.
- Action: User selects "theLexFiles.com — experimental" namespace option.
- Expected: Username field shown (same as stable option). NSID preview updates to `com.thelexfiles.alice.temp.groceryItem`. Description below the option explains the experimental nature.

**Scenario: Browse existing lexicons without losing create-new data**
- Setup: User has partially filled in the create-new form (record name "groceryItem", username "alice"). Has not saved yet.
- Action: User clicks "Or browse existing lexicons →".
- Expected: Create-new form is replaced by the search/browse UI. "← Back to creating new" link is shown at the top. No confirmation prompt — no data is lost yet.
- Action: User clicks "← Back to creating new".
- Expected: Create-new form reappears with "groceryItem" and "alice" still filled in.

**Scenario: Search and adopt an existing lexicon**
- Setup: User clicks "Or browse existing lexicons →".
- Action: User types "feed post" in the search field.
- Expected: After 300ms, autocomplete results appear. User sees `app.bsky.feed.post` in results. User clicks it. Full schema preview loads showing description, record key type (tid), and fields (text, facets, embed, langs, labels, tags, createdAt). "Adopt this lexicon" button is enabled.

**Scenario: Adopt a non-record lexicon (error path)**
- Setup: User searches and selects a query-type lexicon (e.g., `app.bsky.feed.getTimeline`).
- Action: Schema preview loads.
- Expected: Preview shows the schema type is "query". Warning: "This lexicon is a query, not a record type. Only record-type lexicons can be adopted as data types." Adopt button is disabled.

**Scenario: Search unavailable (error path)**
- Setup: Lexicon Garden API is down.
- Action: User types in the search field.
- Expected: After the request fails, message: "Search unavailable. You can enter an NSID directly below." Manual NSID input becomes the primary interface.

**Scenario: Adopt with existing create-new data (confirmation)**
- Setup: User has saved a create-new identity (name: "groceryItem", namespace: theLexFiles.com, username: "alice") and added two custom fields.
- Action: User clicks "Or browse existing lexicons →", searches for "feed post", selects `app.bsky.feed.post`, and clicks "Adopt this lexicon".
- Expected: Confirmation prompt: "Adopting this lexicon will replace your current name, namespace, and fields. Continue?" If confirmed, adopted schema replaces all create-new data. If cancelled, user stays in the browse UI.

**Scenario: Adopt from blank draft (no confirmation)**
- Setup: User has a fresh data type with no saved identity data and no custom fields.
- Action: User clicks "Or browse existing lexicons →", searches for "feed post", selects `app.bsky.feed.post`, and clicks "Adopt this lexicon".
- Expected: No confirmation prompt — nothing to lose. Schema is adopted immediately.

**Scenario: Switch from adopted to create-new**
- Setup: Data type has an adopted lexicon (e.g., `app.bsky.feed.post`).
- Action: User clicks "Change".
- Expected: Confirmation prompt: "Stop using this lexicon? Your imported fields will be cleared." If confirmed, adopted data is cleared, create-new form appears with fields reset. If cancelled, nothing changes.

**Scenario: Return to card grid after saving**
- Setup: User has saved identity for "grocery item" (name: groceryItem, status: Ready).
- Action: User clicks "← Back to Data Types".
- Expected: No confirmation (no unsaved changes). Card grid re-renders. The "grocery item" card now shows updated completion status reflecting the identity is set.

**Scenario: Return to card grid with unsaved changes**
- Setup: User has modified the record name field but has not clicked Save.
- Action: User clicks "← Back to Data Types".
- Expected: Confirmation prompt: "You have unsaved changes. Discard?" If confirmed, changes are discarded and card grid re-renders. If cancelled, user stays in the detail view.

**Scenario: BYO domain with warning**
- Setup: User is creating a new data type.
- Action: User selects "My own domain".
- Expected: Domain input appears. Warning banner: "Only choose this if you're comfortable managing DNS TXT records and AT Protocol lexicon publishing. If you're not sure, use theLexFiles.com." Username field is hidden. NSID preview updates based on entered domain.

**Scenario: Invalid record name (validation)**
- Setup: User is filling in the create-new form.
- Action: User types "123invalid" in the record name field.
- Expected: Inline error: "Record name cannot start with a digit." Save button remains disabled.

**Scenario: Multiple data types with same username**
- Setup: User has already saved "grocery item" with username "alice" on theLexFiles.com.
- Action: User opens a second data type ("recipe") for the first time.
- Expected: Username auto-fills with "alice" (cached from previous). Namespace defaults to theLexFiles.com. User only needs to set the record name and description.

## Scope

**In scope:**
- Card click → detail view transition (and back)
- Source selection (adopt vs create)
- Create-new form: record name, description, namespace (3 options), NSID preview, record key type
- Adopt-existing form: search via Lexicon Garden, manual NSID entry, schema preview, adopt action
- Data model additions to RecordType and AppInfo
- State migration for existing RecordTypes
- Status badge on detail view and card grid
- Username auto-fill from ATProto handle and caching across data types

**Out of scope:**
- Field editing (add, edit, delete fields) — see `data-type-fields.md`
- Lexicon publishing (writing to `com.atproto.lexicon.schema` collection) — future Generate Flow spec
- DNS management for theLexFiles.com — server-side infrastructure concern
- Username uniqueness validation — verified at publish time, not in the wizard
- Data type deletion — future spec
- Editing displayName from the detail view — future spec
- Lexicon Store as a search source — start with Lexicon Garden only; Lexicon Store can be added as a fallback later

## Resolved Ambiguities

1. **NSID structure for `.temp.` with user subdomains**
   The NSID `com.thelexfiles.[username].temp.[name]` maps to domain authority `temp.[username].thelexfiles.com`, requiring DNS entries at `_lexicon.temp.[username].thelexfiles.com`. Per the AT Protocol NSID spec, the authority is all segments except the last (the name), and DNS resolution is not hierarchical.
   - **Decision:** This is a server-side DNS concern, not a wizard UI concern. The wizard generates the NSID; the publishing infrastructure (using programmatic DNS via Cloudflare/Route 53/etc.) handles DNS record creation. Proceed with this NSID pattern.

2. **Adopted lexicon field import — unsupported types**
   Adopted schemas may contain field types not supported by the wizard's field editor (e.g., `union`, nested `object`, `ref` to external definitions).
   - **Decision:** Import all fields. Display unsupported types as read-only with a descriptive label (e.g., "union (complex type)", "ref → app.bsky.richtext.facet"). They appear in the field list for reference but cannot be edited. The generator passes them through as-is from the adopted schema JSON.

3. **Schema preview depth for adopted lexicons**
   The schema preview could show just top-level fields or recursively resolve `ref` types (requiring additional API calls).
   - **Decision:** Show top-level fields only. For `ref` fields, show the reference target (e.g., "ref → app.bsky.richtext.facet") without resolving it. The raw JSON section is expandable for users who want full detail.

4. **Switching from create-new to adopted: what happens to manually added fields?**
   Adopting a lexicon replaces any user-defined fields with the adopted schema's fields.
   - **Decision:** Users can freely browse existing lexicons without losing create-new data (the browse link is non-destructive). Confirmation is shown only when the user clicks "Adopt this lexicon" and has existing identity data or user-defined fields: "Adopting this lexicon will replace your current name, namespace, and fields. Continue?" No merge is offered — that's too complex and semantically wrong.

5. **Back navigation with unsaved changes**
   The user may click "← Back to Data Types" without saving changes in the create-new form.
   - **Decision:** Unsaved changes are discarded. If the form is dirty (has changes from last-saved state), show a confirmation: "You have unsaved changes. Discard?" If the form is clean, navigate immediately. This matches the Cancel button behavior.

## Integration Boundaries

### Lexicon Garden API
- **Data flowing in:** Autocomplete results (`/api/autocomplete-nsid?q=`), full schema resolution (`/xrpc/com.atproto.lexicon.resolveLexicon?nsid=`)
- **Expected contract:** Autocomplete returns JSON with `suggestions` array containing `type`, `label`, `did`, `url`. Schema resolution returns JSON with `cid`, `uri`, `schema`.
- **Unavailability:** If the API is unreachable, show an error message and fall back to manual NSID entry. The adopt flow should still work if the user knows the exact NSID — resolution can be attempted via Lexicon Store's PDS as a secondary source.

### ATProto Auth (existing)
- **Data flowing in:** User's handle (for username auto-fill)
- **Expected contract:** `AuthService` provides the current user's handle when logged in
- **Unavailability:** Username auto-fill is skipped; user enters manually

### WizardState (existing)
- **Data flowing out:** Updated RecordType (source, name, description, namespace fields, adopted schema)
- **Data flowing out:** Updated AppInfo (cached lexUsername, lastNamespaceOption)
- **Expected contract:** `getWizardState()` / `saveWizardState()` as today

## Files Likely Affected

### Modified Files
- `src/app/views/panels/DataPanel.ts` — Add detail view rendering and card click handling
- `src/types/wizard.ts` — Add new fields to RecordType and AppInfo interfaces
- `src/types/generation.ts` — May need updates if LexiconSchema interface changes
- `src/app/state/WizardState.ts` — State migration for new fields
- `src/app/views/WorkspaceLayout.ts` — May need updates for detail view wiring
- `styles.css` — Detail view styling, namespace selector, NSID preview, status badges

### New Files
- `src/app/services/LexiconDiscovery.ts` — API client for Lexicon Garden search and schema resolution
- `tests/views/DataPanel.test.ts` — Updated tests for detail view behavior (or new test file)

## How to Verify

1. Click a data type card — confirm detail view opens with displayName, status badge, and source selection
2. Verify record name auto-suggests from displayName in lowerCamelCase
3. Select each namespace option — confirm appropriate fields appear and NSID preview updates
4. If logged in, confirm username auto-fills from ATProto handle
5. Save a create-new identity — confirm state persists and status badge updates
6. Open a second data type — confirm username auto-fills from the first
7. Click "Or browse existing lexicons →" — confirm search UI appears with "← Back to creating new" link
7a. Click "← Back to creating new" — confirm create-new form reappears with data preserved
8. Search for a known lexicon (e.g., "feed post") — confirm autocomplete results appear
9. Select a result — confirm schema preview loads with fields, description, type
10. Adopt a record-type lexicon — confirm identity fields lock and status shows "Adopted"
11. Try to adopt a non-record lexicon — confirm warning and disabled Adopt button
12. Click "← Back to Data Types" — confirm card grid re-renders with updated status
13. Select BYO domain — confirm warning banner appears
14. Enter an invalid record name — confirm inline validation error
15. `npm run build` compiles without errors
16. `npx vitest run` passes
