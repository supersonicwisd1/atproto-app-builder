# Spec: Lexicon Publishing (temp namespace)

**Status:** draft
**Date:** 2026-03-24
**Depends on:** Generate Panel (Phase 6, done)

## What

Add lexicon publishing to the wizard's generate flow. When the user generates their app, a confirmation dialog explains that their lexicon schemas will be published as experimental (`.temp`) versions at thelexfiles.com, alongside the ZIP download. The Cloudflare Worker that serves the wizard app is extended with API endpoints to store and serve lexicon JSON. The namespace UI in the data type identity panel is restricted to the `.temp` option only, since the wizard is in an early alpha state.

## Why

Generated AT Protocol apps need their lexicon schemas to be discoverable. Without published lexicons, the app's record types exist only as code in the generated project — other apps can't find or interoperate with them. Publishing to thelexfiles.com makes lexicons resolvable by NSID, which is how the AT Protocol ecosystem works.

Restricting to `.temp` signals that schemas are experimental and may change. This matches the wizard's alpha state — users shouldn't be committing to stable schemas when the tool that generates them is still evolving.

## Design Decisions

1. **Confirmation dialog before generate** — The user clicks the existing "Download ZIP" button and sees a dialog explaining both actions (publish + download) before anything happens. This is transparent about the publish side-effect and includes a privacy warning about AT Protocol PDS data.

2. **Publish then download** — Lexicons are published first, then the ZIP is generated and downloaded. If publishing fails, the user is offered the option to download anyway (publishing failure shouldn't block code generation).

3. **`.temp` only** — The stable `thelexfiles` and `byo-domain` namespace options are hidden in the UI. All new record types default to `thelexfiles-temp`. Existing record types with other namespace options are left unchanged in state but won't be published.

4. **Open publishing, no auth** — Anyone can publish a `.temp` lexicon. No account or token required. This is intentional for the alpha phase — the `.temp` namespace signals impermanence, and the barrier to entry should be zero.

5. **Worker + KV in the same repo** — The Cloudflare Worker that serves the wizard app is extended with API routes. A `worker/` directory holds the Worker source. Cloudflare KV stores published lexicons keyed by NSID.

6. **Only `source: 'new'` record types are published** — Adopted lexicons already exist elsewhere; re-publishing them would be incorrect. The publish flow skips any record type with `source: 'adopted'`.

## Worker API Contract

The wizard app and lexicon API are served by the same Cloudflare Worker. API routes live under `/api/`. All other routes fall through to the static app assets.

### `POST /api/lexicons`

Publishes one or more lexicon schemas.

**Request:**
```json
{
  "lexicons": [
    {
      "nsid": "com.thelexfiles.alice.temp.groceryItem",
      "schema": { "lexicon": 1, "id": "com.thelexfiles.alice.temp.groceryItem", "defs": { ... } }
    }
  ]
}
```

**Response (200):**
```json
{
  "published": [
    { "nsid": "com.thelexfiles.alice.temp.groceryItem", "status": "created" }
  ],
  "failed": []
}
```

**Response (partial failure):**
```json
{
  "published": [
    { "nsid": "com.thelexfiles.alice.temp.groceryItem", "status": "created" }
  ],
  "failed": [
    { "nsid": "com.thelexfiles.alice.temp.recipe", "error": "KV write failed" }
  ]
}
```

**Validation rules:**
- Each `nsid` must match the pattern `com.thelexfiles.*.temp.*` (only `.temp` namespace accepted for now)
- Each `schema` must be a valid object with `lexicon: 1` and an `id` field matching the `nsid`
- Request body must be JSON with a `lexicons` array containing at least one entry
- Maximum 50 lexicons per request

**Error responses:**
- `400` — invalid request body, NSID validation failure, or schema validation failure. Body: `{ "error": "description" }`
- `413` — request body exceeds 1MB
- `500` — internal error (KV failure, etc.)

### `GET /api/lexicons/:nsid`

Retrieves a published lexicon by NSID.

**Response (200):**
```json
{
  "nsid": "com.thelexfiles.alice.temp.groceryItem",
  "schema": { "lexicon": 1, "id": "...", "defs": { ... } },
  "publishedAt": "2026-03-24T12:00:00Z"
}
```

**Error responses:**
- `404` — `{ "error": "Lexicon not found" }`

### `GET /api/lexicons?prefix=com.thelexfiles.alice`

Lists published lexicons, optionally filtered by NSID prefix.

**Response (200):**
```json
{
  "lexicons": [
    { "nsid": "com.thelexfiles.alice.temp.groceryItem", "publishedAt": "2026-03-24T12:00:00Z" },
    { "nsid": "com.thelexfiles.alice.temp.recipe", "publishedAt": "2026-03-24T12:05:00Z" }
  ]
}
```

**Query parameters:**
- `prefix` (optional) — filter NSIDs by prefix. When omitted, returns all (paginated).
- `limit` (optional) — max results, default 100, max 1000.
- `cursor` (optional) — pagination cursor from previous response.

### KV Storage

- **Namespace binding:** `LEXICONS`
- **Key format:** NSID string (e.g., `com.thelexfiles.alice.temp.groceryItem`)
- **Value:** JSON string: `{ "nsid": "...", "schema": { ... }, "publishedAt": "..." }`

## Wizard UI Changes

### Namespace restriction (Data Panel)

In the data type identity detail view, the namespace radio group is modified:

- **Only show "theLexFiles.com — experimental"** as the available option
- Hide the "theLexFiles.com" (stable) and "My own domain" (BYO) radio buttons
- Default new record types to `namespaceOption: 'thelexfiles-temp'`
- Record types that already have `namespaceOption: 'thelexfiles'` or `'byo-domain'` from prior sessions: their existing namespace is preserved in state and the NSID still computes correctly, but the UI only shows the `.temp` option for editing. A small note explains: "Only experimental (.temp) namespaces are available during the alpha."

### Confirmation dialog

When the user clicks "Download ZIP", instead of immediately generating, a confirmation dialog appears.

**Dialog structure:**
```
┌─────────────────────────────────────────────────┐
│  ×                                              │
│                                                 │
│  Generate & Publish                             │
│                                                 │
│  This will:                                     │
│                                                 │
│  • Download a scaffolded version of your app,   │
│    with placeholders for content that cannot     │
│    be generated                                  │
│                                                 │
│  [If publishable lexicons exist:]               │
│  • Publish your lexicons as experimental         │
│    (.temp) versions at thelexfiles.com:          │
│                                                 │
│    com.thelexfiles.alice.temp.groceryItem        │
│    com.thelexfiles.alice.temp.recipe             │
│                                                 │
│  ⚠ Data stored in AT Protocol Personal Data     │
│  Servers is not yet private. Use these apps      │
│  for experimentation, not for storing            │
│  private data.                                   │
│                                                 │
│         [ Generate & Publish ]  [ Cancel ]      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**When no publishable lexicons exist** (all adopted, or no record types):
- The "Publish your lexicons..." bullet and NSID list are omitted
- The confirm button text is "Download ZIP" (no publish action)
- The dialog still appears for the privacy warning and scaffolding explanation

**Publishable lexicons** are record types where `source === 'new'` AND `namespaceOption === 'thelexfiles-temp'` AND `lexUsername` is non-empty AND `name` is non-empty.

### Generate + publish flow

After the user clicks "Generate & Publish" in the dialog:

1. Dialog stays open. Confirm button disables. Text changes to "Publishing..."
2. If publishable lexicons exist: call `POST /api/lexicons` with all publishable record type schemas
3. On publish success: button text changes to "Generating..."
4. Generate the ZIP via existing `generateApp()` flow. ZIP downloads via browser.
5. On complete success: dialog shows a success state:
   - "Your app has been downloaded and N lexicons published."
   - "OK" button to dismiss
   - Sets `wizardState.hasGenerated = true`
6. On publish failure (partial or full):
   - Dialog shows which lexicons failed
   - Offers "Download ZIP Anyway" button (proceeds with ZIP generation despite publish failure) and "Cancel" button
   - If user chooses "Download ZIP Anyway", generate and download ZIP normally
7. On ZIP generation failure: show error message in dialog, "OK" to dismiss

### Vite dev proxy

Add a proxy rule in `vite.config.ts` for development:
```typescript
'/api': {
  target: 'https://thelexfiles.com',
  changeOrigin: true,
}
```

This lets the wizard call `/api/lexicons` in development without CORS issues, proxied to the production Worker.

## Infrastructure Setup (manual steps)

These steps are performed by the project owner, not implemented in code:

### 1. Create KV namespace
```bash
npx wrangler kv namespace create LEXICONS
```
This outputs a namespace ID. Add it to `wrangler.jsonc`.

### 2. Update wrangler.jsonc
```jsonc
{
  "name": "atproto-app-builder",
  "main": "worker/index.ts",
  "compatibility_date": "2025-09-27",
  "observability": { "enabled": true },
  "assets": {
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [
    { "binding": "LEXICONS", "id": "<namespace-id-from-step-1>" }
  ]
}
```

Key changes from current config:
- Added `"main": "worker/index.ts"` — Worker entry point
- Added `"binding": "ASSETS"` to assets — allows Worker to serve static files
- Added `kv_namespaces` — lexicon storage

### 3. Install Worker types
```bash
npm install --save-dev @cloudflare/workers-types
```

### 4. Deploy
Cloudflare's GitHub integration will deploy on push. Verify that the build command in Cloudflare dashboard runs `npm run build` (for the Vite app) and that wrangler picks up the Worker entry point.

## Acceptance Criteria

- [ ] The Cloudflare Worker serves both the wizard app and the lexicon API
  - When a request hits `/api/lexicons`, the Worker handles it (publish, retrieve, or list).
  - When a request hits any other path, the Worker serves the static wizard app (existing SPA behavior).

- [ ] Lexicons can be published via `POST /api/lexicons`
  - When a valid request is sent with `.temp` namespace lexicons, they are stored in KV and a 200 response is returned with the published NSIDs.
  - When a request contains an NSID not matching `com.thelexfiles.*.temp.*`, a 400 error is returned.
  - When a request contains a schema where `id` doesn't match the provided `nsid`, a 400 error is returned.
  - When KV write fails for some lexicons, a 200 response is returned with partial results (published + failed arrays).

- [ ] Published lexicons can be retrieved via `GET /api/lexicons/:nsid`
  - When a published NSID is requested, the full schema and metadata are returned.
  - When a non-existent NSID is requested, a 404 is returned.

- [ ] Published lexicons can be listed via `GET /api/lexicons`
  - When called without a prefix, all published lexicons are returned (paginated).
  - When called with a `prefix` query parameter, only matching lexicons are returned.

- [ ] The namespace UI only offers the `.temp` option
  - When creating a new record type, only "theLexFiles.com — experimental" appears in the namespace radio group.
  - When editing a record type that previously had a different namespace option, the UI shows only `.temp` with a note about alpha restrictions. The existing namespace is preserved in state.

- [ ] The "Download ZIP" button triggers a confirmation dialog
  - When the user clicks "Download ZIP", a dialog appears explaining that the app will be downloaded and lexicons will be published.
  - When publishable lexicons exist, the dialog lists the specific NSIDs that will be published.
  - When no publishable lexicons exist (all adopted or no record types), the publish section is omitted and the button says "Download ZIP".
  - The dialog includes a privacy warning about PDS data.

- [ ] Lexicons are published before the ZIP is downloaded
  - When the user confirms the dialog and publishable lexicons exist, lexicons are published via `POST /api/lexicons` before ZIP generation begins.
  - When publishing succeeds, the ZIP is generated and downloaded, and a success message is shown.
  - When publishing fails (partially or fully), the user is offered "Download ZIP Anyway" to proceed without successful publishing.

- [ ] The Worker code lives in `worker/` and deploys with the existing Cloudflare GitHub integration
  - The `wrangler.jsonc` references `worker/index.ts` as the Worker entry point.
  - The Worker is TypeScript and handles routing between API and static assets.

## Scope

**In scope:**
- Worker API endpoints: publish, retrieve, list lexicons
- Worker routing: API routes + static asset fallback
- KV storage for lexicon schemas
- Confirmation dialog in Generate panel
- Publish flow integrated into generate action
- Namespace UI restricted to `.temp` only
- Vite dev proxy for `/api`
- `wrangler.jsonc` updates
- `worker/index.ts` — Worker entry point and API handlers
- `src/app/services/LexiconPublisher.ts` — client-side publish function
- Updates to `GeneratePanel.ts` — dialog and publish flow
- Updates to `DataPanel.ts` — namespace restriction
- Tests for Worker API handlers and publish service

**Out of scope:**
- Stable (`thelexfiles`) namespace publishing — future spec when wizard exits alpha
- BYO domain publishing — requires DNS management, future spec
- AT Protocol DID-based lexicon resolution (`_lexicon` DNS TXT records) — future infrastructure work
- User accounts, authentication, or rate limiting — future spec
- Lexicon versioning or update/delete via API — v1 is append-only (re-publishing overwrites)
- Landing page or browse UI at thelexfiles.com — future spec
- Publishing adopted lexicons — they already exist elsewhere

## Files Likely Affected

### New Files
- `worker/index.ts` — Worker entry point: routing, API handlers, KV operations
- `src/app/services/LexiconPublisher.ts` — client-side function to call `POST /api/lexicons`
- `tests/services/LexiconPublisher.test.ts` — tests for the publish service
- `tests/worker/index.test.ts` — tests for Worker API handlers

### Modified Files
- `wrangler.jsonc` — add `main`, `assets.binding`, `kv_namespaces`
- `vite.config.ts` — add `/api` proxy rule
- `src/app/views/panels/GeneratePanel.ts` — confirmation dialog, publish-then-download flow
- `src/app/views/panels/DataPanel.ts` — restrict namespace radio to `.temp` only
- `package.json` — add `@cloudflare/workers-types` dev dependency
- `.gitignore` — add `.wrangler/`
- `tsconfig.json` — may need adjustment for worker types (or worker gets its own tsconfig)

## Integration Boundaries

### Cloudflare KV (LEXICONS namespace)
- **Data flowing in:** Lexicon JSON schemas keyed by NSID
- **Data flowing out:** Lexicon JSON schemas, key listings
- **Expected contract:** KV `put(key, value)`, `get(key)`, `list({ prefix })`. Values are JSON strings. Keys are NSID strings.
- **Unavailability:** KV operations fail → Worker returns 500 for that lexicon, includes it in `failed` array. Other lexicons in the same request still attempt to publish.

### GeneratePanel → LexiconPublisher
- **Data flowing out:** Array of `{ nsid, schema }` objects for publishable record types
- **Expected contract:** `publishLexicons()` returns a result with `published` and `failed` arrays
- **Unavailability:** Network failure → all lexicons fail → user offered "Download ZIP Anyway"

### GeneratePanel → OutputGenerator (existing)
- **No changes** to the existing `generateApp()` flow. The publish step is added before `generateApp()` is called, not inside it.

## Behavioral Scenarios

**Scenario 1: Happy path — generate with publishable lexicons**
- Setup: User has 2 new record types (groceryItem, recipe) with `thelexfiles-temp` namespace, username "alice". App name and domain filled in.
- Action: User clicks "Download ZIP".
- Expected: Confirmation dialog appears showing both NSIDs (`com.thelexfiles.alice.temp.groceryItem`, `com.thelexfiles.alice.temp.recipe`), privacy warning, and "Generate & Publish" / "Cancel" buttons. User clicks "Generate & Publish". Button disables, shows "Publishing...". Lexicons are published. Button shows "Generating...". ZIP downloads. Dialog shows success: "Your app has been downloaded and 2 lexicons published."

**Scenario 2: Generate with no publishable lexicons (all adopted)**
- Setup: User has 1 adopted record type (`app.bsky.feed.post`). No new record types.
- Action: User clicks "Download ZIP".
- Expected: Confirmation dialog appears WITHOUT the publish section. Button says "Download ZIP" (not "Generate & Publish"). Privacy warning still shown. On confirm, ZIP downloads normally (no publish API call).

**Scenario 3: Publish failure — user downloads anyway**
- Setup: User has 1 new record type. API is unreachable or returns error.
- Action: User clicks "Download ZIP", confirms dialog.
- Expected: Publishing attempted, fails. Dialog shows error: "Failed to publish 1 lexicon: com.thelexfiles.alice.temp.groceryItem". Two buttons: "Download ZIP Anyway" and "Cancel". User clicks "Download ZIP Anyway". ZIP generates and downloads. `hasGenerated` is set to true.

**Scenario 4: Partial publish failure**
- Setup: User has 3 new record types. KV write fails for 1.
- Action: User confirms the dialog.
- Expected: API returns 200 with 2 published, 1 failed. Dialog shows: "2 lexicons published. 1 failed: [NSID]." "Download ZIP Anyway" and "Cancel" buttons.

**Scenario 5: Cancel the dialog**
- Setup: User has record types and filled in app info.
- Action: User clicks "Download ZIP", sees the dialog, clicks "Cancel".
- Expected: Dialog closes. Nothing is published. No ZIP is generated. State unchanged.

**Scenario 6: Namespace restriction in Data Panel**
- Setup: User opens a new record type's detail view.
- Action: User looks at the namespace options.
- Expected: Only "theLexFiles.com — experimental" is available. The NSID preview shows `com.thelexfiles.[username].temp.[name]`. No stable or BYO options visible. A note says: "Only experimental (.temp) namespaces are available during the alpha."

**Scenario 7: Existing record type with non-temp namespace**
- Setup: User has a record type from a prior session with `namespaceOption: 'thelexfiles'` (stable).
- Action: User opens that record type's detail view.
- Expected: The namespace shows only `.temp` option. The existing stable namespace is preserved in state (code generation still uses it correctly). A note explains the alpha restriction. The NSID preview reflects the actual stored namespace option.

**Scenario 8: Re-publishing overwrites**
- Setup: User previously generated and published `com.thelexfiles.alice.temp.groceryItem`. User has since added a field to groceryItem.
- Action: User clicks "Download ZIP" and confirms.
- Expected: The updated lexicon is published, overwriting the previous version in KV. Status shows "created" (or "updated" — no distinction needed in v1).

**Scenario 9: Record type missing username or name**
- Setup: User has a record type with `namespaceOption: 'thelexfiles-temp'` but no `lexUsername` set (incomplete identity).
- Action: User clicks "Download ZIP".
- Expected: That record type is excluded from the publishable list (it doesn't meet the publishable criteria). If it's the only record type, the dialog omits the publish section.

**Scenario 10: No record types at all**
- Setup: User has no record types. App name and domain filled in.
- Action: User clicks "Download ZIP".
- Expected: Confirmation dialog with no publish section. Privacy warning shown. "Download ZIP" button. On confirm, ZIP downloads (empty app scaffold).

## Ambiguity Warnings

1. **Cloudflare build pipeline**
   The repo is connected to Cloudflare via GitHub. It's unclear whether the current build command in Cloudflare dashboard needs to change to accommodate the Worker entry point, or if wrangler handles it automatically.
   - _Likely assumption:_ Cloudflare's Worker deployment reads `wrangler.jsonc` and handles both the Worker and assets. The build command (`npm run build`) produces the `dist/` directory, and wrangler serves it via the `assets` config.
   - _Please confirm after deploying the first Worker version._

2. **Worker TypeScript compilation**
   Wrangler uses esbuild internally to bundle the Worker entry point, separate from the project's Vite/tsc build. The Worker code in `worker/` may need its own `tsconfig.json` (different runtime — no DOM types, needs `@cloudflare/workers-types`), or the types can be added to the root tsconfig.
   - _Likely assumption:_ Add a minimal `worker/tsconfig.json` for IDE support. Wrangler handles actual compilation.
   - _Decide during implementation._

## How to Verify

1. Deploy Worker — verify thelexfiles.com still serves the wizard app
2. `curl -X POST https://thelexfiles.com/api/lexicons -H 'Content-Type: application/json' -d '{"lexicons":[{"nsid":"com.thelexfiles.test.temp.hello","schema":{"lexicon":1,"id":"com.thelexfiles.test.temp.hello","defs":{"main":{"type":"record","key":"tid","record":{"type":"object","properties":{"text":{"type":"string"}}}}}}}]}'` — verify 200 with published result
3. `curl https://thelexfiles.com/api/lexicons/com.thelexfiles.test.temp.hello` — verify schema returned
4. `curl https://thelexfiles.com/api/lexicons?prefix=com.thelexfiles.test` — verify listing works
5. Open wizard, create a new record type — verify only `.temp` namespace option shown
6. Fill in app info and record type identity, click "Download ZIP" — verify confirmation dialog appears with NSID list and privacy warning
7. Click "Generate & Publish" — verify lexicons are published and ZIP downloads
8. Retrieve the published lexicon via curl — verify it matches the generated schema
9. Disconnect network, attempt generate — verify publish failure is handled gracefully with "Download ZIP Anyway" option
10. `npm run build` compiles without errors
11. `npx vitest run` passes
