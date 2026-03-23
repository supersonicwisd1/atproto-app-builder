# Spec: PDS State Persistence

**Status:** draft
**Date:** 2026-03-23

## What

Save the wizard's app state (WizardState) to the user's PDS as an AT Protocol record. This includes creating lexicons for the wizard state data types so the saved state is a proper AT Protocol record. Loading a saved state from PDS would allow users to resume work across devices/sessions without relying on localStorage.

## Why

Currently wizard state is only persisted in localStorage, which is device-specific and fragile. Saving to a PDS makes the state portable, recoverable, and consistent with the AT Protocol ecosystem the wizard is designed to serve. It also demonstrates dogfooding — using AT Protocol for the tool that builds AT Protocol apps.

## Acceptance Criteria

- [ ] TBD — define lexicon schema for wizard state
- [ ] TBD — save wizard state to authenticated user's PDS
- [ ] TBD — load wizard state from PDS
- [ ] TBD — handle conflicts between local and remote state

## Scope

**In scope:**
- TBD

**Out of scope:**
- TBD

## Files Likely Affected

- TBD

## How to Verify

- TBD
