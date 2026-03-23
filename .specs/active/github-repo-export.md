# Spec: GitHub Repository Export

**Status:** draft
**Date:** 2026-03-23
**Depends on:** Generate Panel (Phase 6)

## What

Add a GitHub export option to the Generate panel so users can create a GitHub repository directly from the wizard instead of (or in addition to) downloading a ZIP. The user provides a GitHub Personal Access Token and repository name; the wizard creates the repo and pushes all generated files via the GitHub API.

## Why

The old Step 7 had a GitHub export option (ZIP vs. GitHub radio toggle) that was removed during the layout migration. Some users prefer pushing directly to GitHub over downloading and manually uploading a ZIP. This restores that capability in the new Generate panel.

## Acceptance Criteria

- [ ] TBD — output method toggle (ZIP / GitHub) in Generate panel
- [ ] TBD — GitHub token and repository name inputs (shown when GitHub is selected)
- [ ] TBD — create repo and push files via GitHub API
- [ ] TBD — error handling (invalid token, repo name conflict, API failures)
- [ ] TBD — success feedback (link to created repo)

## Scope

**In scope:**
- TBD

**Out of scope:**
- TBD

## Files Likely Affected

- `src/app/views/panels/GeneratePanel.ts` — add output method toggle and GitHub config fields
- `src/app/export/GitHubExporter.ts` — existing, may need refactoring to accept parameters instead of reading DOM
- `src/app/export/OutputGenerator.ts` — route to GitHub exporter based on selection

## How to Verify

- TBD
