# Spec: Landing Page & Header Redesign

**Status:** ready
**Date:** 2026-03-15

## What

Redesign the global header and landing page (Step 0) to use a smaller, more app-like header and update the landing page's visual style so it flows naturally into the upcoming sidebar+workspace wizard layout. Delete Step 1 (the "Getting Started" intro page) so the landing page transitions directly into the wizard. Remove the "App Wizard" nav link and version info from the header. Restyle the Login link as a ghost button (desktop) / plain text link (mobile) that remains visible in all app states.

## Why

The current header is very large (8rem logo, 10rem h1 on desktop) and designed as a splash/hero element. When the sidebar+workspace layout is implemented (see `layout-migration-sidebar-workspace.md`), the header needs to shrink dramatically to give the workspace room, which creates a jarring transition. A smaller header from the start makes the landing-to-wizard transition feel like a natural progression within the same app rather than two different pages stitched together. Removing Step 1 eliminates a passthrough page — its educational content will move into the Requirements panel's empty state (see `requirements-panel.md`).

## Reference Mockup

`mockups/4-landing-to-wizard-transition.html` — This is the visual reference for all header and landing page styling in this spec. It also demonstrates the landing-to-wizard transition animation (sidebar slide-in, overlay flash, header shrink), which is **out of scope** for this spec but should be implemented during layout migration Phase 1 (see Cross-References below).

## Acceptance Criteria

- [ ] **Header is globally resized to match mockup 4**
  - The header uses a fixed height of 72px (`--header-height: 72px`).
  - On mobile (width <= 480px): logo height is 2rem, h1 font-size is 1.8rem with `white-space: nowrap`.
  - On desktop (width > 480px): logo height is 3rem, h1 font-size is 3rem.
  - The header retains: fixed positioning, blurred translucent background (`rgba(8, 8, 15, 0.88)`, `backdrop-filter: blur(14px)`), and the gradient accent line at the bottom.
  - `main` padding-top is updated to account for the smaller header height (72px) instead of the current large values (5rem mobile / 13rem desktop).

- [ ] **Header shrinks further when `wizard-active` class is on body**
  - h1 font-size becomes 2.25rem, logo height becomes 2.5rem.
  - The hero-glitch animation stops (`animation: none`).
  - These changes use CSS transitions (`0.5s cubic-bezier(0.4, 0, 0.2, 1)`) for smooth resizing when the class is toggled.

- [ ] **Glitch animation only plays on the landing page**
  - When `wizard-active` is NOT on body: h1 has `animation: hero-glitch 10s infinite 3s`.
  - When `wizard-active` IS on body: `animation: none`.
  - The `@keyframes hero-glitch` rule itself is unchanged.

- [ ] **Version info is removed from the header**
  - The `.header-version` HTML block is removed from `index.html` (the `div` containing version number, separator, and season).
  - The `.header-version`, `.header-version__info`, `.header-version__number`, `.header-version__season`, `.header-version__separator` CSS rules are removed from `styles.css`.

- [ ] **"App Wizard" nav link is removed**
  - The `#menu-app-wizard` link is removed from `index.html`.
  - The click handler for `#menu-app-wizard` in `Initialization.ts` is removed.

- [ ] **Login link is restyled as a ghost button (desktop) / plain text (mobile)**
  - The Login link (`#menu-login`) gets a new class `login-btn`.
  - On mobile (width <= 480px): plain text link — no border, no padding, no background. Font: dirty-ego, 1.2rem, `line-height: 0.8`, `color: var(--text-secondary)`. This places its baseline flush with the h1.
  - On desktop (width > 480px): ghost button — `border: 1px solid var(--border-subtle)`, `padding: 0.3rem 1.1rem`, `border-radius: 5px`. Font: dirty-ego, 1.6rem.
  - Hover state (both): `color: var(--accent)`, `border-color: var(--border-accent)`, `background-color: var(--accent-glow)`.
  - The Login link is always visible — the `.wizard-active .header-content .menu-nav { display: none; }` CSS rule is removed.

- [ ] **Clicking the logo or title in the header navigates back to the landing page**
  - When the user is in the wizard (`wizard-active` is on body) and clicks the header logo SVG or h1, the app navigates back to Step 0 (landing page).
  - This replaces the deleted "App Wizard" link as the way to navigate between landing and wizard.
  - The logo/title should have `cursor: pointer` when in wizard state.

- [ ] **Landing page content is preserved**
  - The landing page (IntroBlock.html / Step 0) retains all existing content: hero section (lead text, body text, AT Protocol highlight), versus panels (centralized vs decentralized with SVG diagrams and bullet lists), CTA text, and the "Start Building" / Next button.
  - No content is added or removed from the landing page itself.

- [ ] **Landing page CSS is updated to match mockup 4 sizing**
  - The landing page CSS is adjusted to work with the smaller header and reduced top padding. Specific values should match `mockups/4-landing-to-wizard-transition.html` for font sizes, padding, and max-widths of the hero, versus, and CTA sections.
  - The existing fade-up entrance animations are preserved.

- [ ] **"Start Building" button styling matches mockup 4**
  - The existing Next button on the landing page (styled via `body:not(.wizard-active) #wizard-next`) uses the "Start Building" gradient style: `background: linear-gradient(135deg, #00c8dd, var(--accent))`, `font-weight: 700`, `font-size: 1.15rem`, `padding: 1rem 2.5rem`, `box-shadow: 0 0 20px var(--accent-glow)`.
  - Hover: `background: linear-gradient(135deg, var(--accent), var(--accent-hover))`, `transform: translateY(-2px)`, `box-shadow: 0 0 35px rgba(0, 229, 255, 0.35)`.
  - The button text reads "Start Building" followed by a right arrow.

- [ ] **Step 1 is deleted**
  - `src/app/views/Step1.ts` is deleted.
  - `src/app/views/AboutAppBuilder.html` is deleted.
  - `StepRenderer.ts` is updated: the `renderStep1` import and `case 1:` branch are removed.
  - The step numbering is updated so that clicking "Start Building" / Next on the landing page advances directly to Step 2 (the current record types step), skipping the deleted Step 1.
  - `Initialization.ts`: the `wizard-step-intro` class toggle (which was conditional on `currentStep === 1`) is removed.
  - The `wizard-active` class toggle condition changes from `currentStep >= 1` to `currentStep >= 2` (since Step 1 no longer exists, wizard mode starts at Step 2).

- [ ] **Unused CSS is cleaned up**
  - The `.wizard-active .header-content .menu-nav { display: none; }` rule is removed.
  - The `.header-version` and related CSS rules are removed (as noted above).
  - The `wizard-step-intro`-related CSS is removed if any exists.

- [ ] **Build and tests pass**
  - `npm run build` compiles without errors.
  - `npx vitest run` passes.

## Scope

**In scope:**
- Global header resize (affects all app states)
- Version info removal from header HTML and CSS
- "App Wizard" link removal from header HTML and JS
- Login link restyle (ghost button on desktop, plain text on mobile)
- Login link always visible (remove wizard-active hide rule)
- Logo/title click navigates to landing page from wizard state
- Landing page CSS adjustments for the smaller header
- "Start Building" button styling
- Step 1 file deletion and StepRenderer/Initialization updates
- Removing unused CSS rules related to the above changes

**Out of scope:**
- Sidebar+workspace layout (covered by `layout-migration-sidebar-workspace.md`)
- Landing-to-wizard transition animation (sidebar slide-in, overlay flash) — demonstrated in `mockups/4-landing-to-wizard-transition.html`, to be implemented in layout migration Phase 1
- Mobile sidebar behavior (accordion layout, deferred to a separate spec)
- Requirements panel content or behavior (covered by `requirements-panel.md`)
- Login functionality (the button exists but login behavior is not part of this spec)

## Cross-References

- **`layout-migration-sidebar-workspace.md`**: This spec should be implemented **before** the layout migration. Once this spec is done, the layout migration spec's note "Step 0 (landing page) remains as-is" becomes true of the redesigned landing page. The layout migration Phase 1 should implement the landing-to-wizard transition animation from `mockups/4-landing-to-wizard-transition.html` (sidebar slide-in, content area margin shift, overlay flash, header shrink from 3rem to 2.25rem).
- **`requirements-panel.md`**: That spec references deleting Step 1 files (`AboutAppBuilder.html`, `Step1.ts`). If this spec is implemented first, those deletions will already be done. The requirements panel spec's references to "delete Step 1" can be treated as "verify Step 1 is deleted."

## Files Likely Affected

### Deleted Files
- `src/app/views/Step1.ts` — Step 1 renderer (imports AboutAppBuilder.html)
- `src/app/views/AboutAppBuilder.html` — Step 1 HTML template

### Modified Files
- `index.html` — Remove `.header-version` block, remove `#menu-app-wizard` link, add `login-btn` class to Login link, add click handler wiring for logo/title
- `styles.css` — Resize header styles, remove version info CSS, remove `.wizard-active .menu-nav` hide rule, add `.login-btn` styles, update `main` padding-top, adjust landing page section sizing, update "Start Building" button styles, remove `wizard-step-intro` CSS if present
- `src/app/views/StepRenderer.ts` — Remove `renderStep1` import and `case 1:` branch, update `wizard-active` toggle condition from `>= 1` to `>= 2`, remove `wizard-step-intro` toggle
- `src/app/bootstrap/Initialization.ts` — Remove `#menu-app-wizard` click handler, add logo/title click handler for navigating back to Step 0

## Behavioral Scenarios

**Scenario: First visit — landing page renders with new header**
- Setup: User visits the app for the first time.
- Action: The app loads.
- Expected outcome: The header shows the logo (2rem on mobile, 3rem on desktop), h1 with glitch animation, and a Login link (plain text on mobile, ghost button on desktop). No version info or "App Wizard" link is visible. The landing page content (hero, versus panels, CTA, Start Building button) renders below the header with appropriate spacing for the 72px header height.

**Scenario: Click "Start Building" — skips Step 1, enters wizard**
- Setup: User is on the landing page.
- Action: User clicks the "Start Building" / Next button.
- Expected outcome: The app advances directly to Step 2 (record types). Step 1 is never shown. The `wizard-active` class is added to body. The header shrinks (h1 to 2.25rem, logo to 2.5rem). The glitch animation stops. The Login link remains visible.

**Scenario: Click logo/title in wizard — returns to landing page**
- Setup: User is in the wizard (any step >= 2).
- Action: User clicks the header logo or h1 text.
- Expected outcome: The app navigates back to Step 0 (landing page). The `wizard-active` class is removed from body. The header returns to landing-page size. The glitch animation resumes.

**Scenario: Login link visibility across states**
- Setup: User is on the landing page.
- Action: User clicks "Start Building" to enter the wizard, then observes the header.
- Expected outcome: The Login link is visible in both states — on the landing page and in the wizard. Its styling (ghost button or plain text depending on viewport) is consistent across both states.

**Scenario: Mobile header baseline alignment**
- Setup: User is on a mobile device (width <= 480px).
- Action: The app loads the landing page.
- Expected outcome: The logo (2rem), h1 (1.8rem), and Login text (1.2rem) all sit on the same visual baseline. The Login link has no border or padding. No version info is shown.

## How to Verify
1. `npm run build` passes.
2. `npx vitest run` passes.
3. Open the app in a browser — landing page renders with the smaller header, all content visible, no version info, no "App Wizard" link.
4. Click "Start Building" — app goes directly to Step 2 (no Step 1 intermediate page). Header shrinks, glitch stops, Login stays visible.
5. Click the logo or title in the header — returns to the landing page.
6. Resize browser to mobile width — logo and h1 shrink, Login becomes plain text, all elements share a baseline.
7. Verify `Step1.ts` and `AboutAppBuilder.html` no longer exist in the codebase.
