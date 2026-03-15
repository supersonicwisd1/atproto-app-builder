# Spec: Wizard Walkthrough / Guided Tour

**Status:** draft
**Date:** 2026-03-14

## What
An interactive walk-through that introduces first-time users to the wizard interface — explaining each section, how to add items, and the iterative workflow. The walk-through should also be re-accessible at any time via a persistent button in the wizard UI.

## Why
The wizard has multiple sections (Requirements, Data, Components, Views) and a non-linear, iterative workflow. First-time users need orientation to understand how the pieces fit together and how to move between sections effectively. Returning users may also want a refresher.

## Acceptance Criteria
- [ ] Walk-through launches automatically on first visit to the wizard
- [ ] Walk-through is re-launchable via a persistent UI element (button, icon, etc.)
- [ ] Walk-through covers each major section of the wizard
- [ ] Walk-through explains the iterative nature of the workflow
- [ ] User can exit/skip the walk-through at any point
- [ ] Walk-through state (seen/not seen) is persisted

## Scope
**In scope:**
- Walk-through UI and step sequence
- First-time detection and auto-launch
- Persistent re-launch button
- Content for each walk-through step

**Out of scope:**
- Video tutorials or external documentation
- Per-field tooltips (separate feature)

## Files Likely Affected
- TBD — depends on chosen wizard layout

## Edge Cases
- User resizes window during walk-through
- Walk-through content needs to adapt if wizard layout changes
- Mobile vs desktop walk-through experience

## How to Verify
TBD
