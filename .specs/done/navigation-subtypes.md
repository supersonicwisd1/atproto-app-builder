# Spec: Navigation Subtypes

**Status:** in-progress
**Date:** 2026-03-17

## What
Replace the single "navigate" form with three navigation subtypes: Direct Link, Navigation Menu, and Forward/Back Buttons/Arrows. When the user selects "Navigation" as the requirement type, the second header dropdown changes from "Related View" to "Type of Navigation" with these three options. Each subtype renders a distinct sub-form. All navigate sub-forms are disabled/placeholder until views exist in the wizard state.

## Why
Navigation requirements are more nuanced than a single from/to link. Users need to express menu-based navigation, page ordering with forward/back controls, and direct links — each with different configuration options.

## Acceptance Criteria

- [ ] Navigate type shows "Type of Navigation" dropdown instead of "Related View"
  - When user selects "Navigation" in the Type dropdown, the second header column re-renders as "Type of Navigation" with options: Direct Link, Navigation Menu, Forward/Back Buttons/Arrows.
  - When user switches back to "Information" or "Data Interaction", the second column reverts to "Related View".
- [ ] Direct Link subtype renders From View / To View dropdowns (disabled until views exist)
- [ ] Navigation Menu subtype renders explanatory text + "Menu Items" and "Show Menu On" checkbox lists (placeholder until views exist)
  - Text: "By default, every view gets a navigation menu linking to all other views. You can customize it or delete it below."
- [ ] Forward/Back subtype renders Page Order reorder list (placeholder until views exist), Control Type dropdown (arrows/buttons), and conditional button text fields
- [ ] Max 1 menu requirement enforced: "Navigation Menu" option disabled in dropdown when one already exists (except when editing that menu)
- [ ] Max 1 forward-back requirement enforced: same pattern
- [ ] Multiple Direct Link requirements allowed
- [ ] Data model includes: navType, menuItems, menuVisibleOn, pageOrder, navControlType, buttonForwardText, buttonBackText
- [ ] Display text and sidebar text updated for all three nav subtypes

## Scope
**In scope:**
- Data model changes (Requirement interface, new types)
- Navigate form UI (all three subtypes, disabled placeholders)
- Constraint enforcement in the Type of Navigation dropdown
- Display text / sidebar text for nav subtypes
- CSS for placeholder elements
- Tests

**Out of scope:**
- Populating checkbox lists / dropdowns with actual view data (views don't exist yet)
- Saving navigate requirements (still returns null — all forms disabled)
- Drag-and-drop reordering (using up/down buttons instead)

## Files Likely Affected
- `src/types/wizard.ts` — new types and fields on Requirement
- `src/app/views/panels/RequirementsPanel.ts` — dynamic header, nav subtype forms, constraint checks
- `styles.css` — `.form-note`, `.checkbox-list-placeholder`
- `tests/views/RequirementsPanel.test.ts` — new nav subtype tests, updated display text tests
