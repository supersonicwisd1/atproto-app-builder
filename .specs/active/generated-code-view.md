# Spec: Generated Code View

**Status:** draft
**Date:** 2026-03-14

## What
A view mode that shows the generated source code for the app being designed. Initially may be read-only, but editing capability would significantly increase its value. This would be a third view mode alongside the wizard layout and wireframe preview.

## Why
Developers using the wizard will want to see the actual code being produced — both to understand what the tool generates and to evaluate whether it meets their needs. A code view bridges the gap between the visual wizard and the real output. Editing support would let advanced users fine-tune generated code without leaving the tool.

## Acceptance Criteria
- [ ] Code view is accessible as a view mode toggle alongside wizard and wireframe views
- [ ] Shows generated code organized by file
- [ ] Syntax highlighting for generated code
- [ ] Code updates as wizard state changes
- [ ] File tree or tab navigation between generated files

## Scope
**In scope:**
- Read-only code view with syntax highlighting
- File navigation within generated output
- Live updates from wizard state

**Out of scope (for initial version):**
- Code editing with bi-directional sync back to wizard state
- Code diffing between versions
- Export/download (handled by existing generate flow)

## Open Questions
- Should edits in the code view sync back to wizard state, or be treated as overrides?
- What editor component to use for syntax highlighting (and eventual editing)?
- How to handle conflicts if a user edits code, then changes wizard state?

## Files Likely Affected
- TBD — depends on chosen wizard layout and existing generator architecture

## Edge Cases
- Generated code exceeds what's reasonable to display at once
- User expects to edit but feature is read-only initially
- Stale code view if generator is slow

## How to Verify
TBD
