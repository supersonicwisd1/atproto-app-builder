# Spec: Early App Name Prompt + Sidebar Display

**Status:** draft
**Date:** 2026-03-25

## What

Prompt users to name their app before they start building (in a dialog when starting a new project), and display the name in an editable field at the top of the sidebar throughout the wizard. The Generate panel keeps its existing app name field as a pre-populated confirmation/last-chance edit.

## Why

Currently `appInfo.appName` is only set in the Generate panel (the final step). With PDS persistence, projects are saved much earlier — so they all land as "Untitled Project" until the user reaches Generate. Asking for the name upfront ensures every save has a real name, and displaying it in the sidebar gives the project a sense of identity throughout the workflow.

## Acceptance Criteria

- [ ] TBD — dialog on "Get Started" / "Start New Project" asks for app name
- [ ] TBD — app name shown in an editable field at the top of the sidebar (above the section nav)
- [ ] TBD — changes to the sidebar field update `appInfo.appName` in real time and trigger save
- [ ] TBD — narrow/accordion layout: determine where the name field goes
- [ ] TBD — Generate panel app name field stays, pre-populated from `appInfo.appName`
- [ ] TBD — if user clears the name in the sidebar field, saves use "Untitled Project"

## Scope

**In scope:**
- TBD

**Out of scope:**
- TBD

## Files Likely Affected

- TBD

## How to Verify

- TBD
