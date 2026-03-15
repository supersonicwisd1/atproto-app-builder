# Spec: AI Implementation Specs Output

**Status:** draft
**Date:** 2026-03-14

## What
An additional output artifact from the wizard: a detailed spec or set of specs that an AI coding assistant can use to take the wizard's scaffolded output and build it into a fully-functioning MVP. The specs would be generated from the wizard's current state and possibly supplemented by additional user input describing behavior, business logic, and edge cases that are beyond what the wizard can automate.

## Why
The wizard produces app scaffolding — file structure, components, data types, views — but not the implementation details that make an app actually work (API call logic, error handling, state management, complex UI interactions, etc.). In most non-trivial cases, there's a significant gap between the wizard's output and a working MVP. A well-structured spec bridges that gap by giving an AI (e.g., Claude Code, Cursor, etc.) the context it needs to implement the remaining functionality accurately and coherently.

## Acceptance Criteria
- [ ] Wizard can generate implementation spec(s) alongside the existing code output
- [ ] Specs capture information from wizard state (requirements, data types, components, views, navigation)
- [ ] Specs include sections that the wizard can fully auto-generate from state
- [ ] Specs include sections for additional user input (behavior descriptions, business rules, edge cases)
- [ ] Output format is optimized for AI consumption (clear, structured, unambiguous)
- [ ] Specs reference the generated scaffolding files so the AI knows what already exists

## Scope
**In scope:**
- Spec generation from wizard state
- UI for users to add supplemental context (business logic, behavioral descriptions)
- Structured output format designed for AI coding assistants
- Inclusion in the wizard's output/download flow

**Out of scope (for initial version):**
- Direct integration with any specific AI tool (Claude Code, Cursor, etc.)
- Automated execution of the specs
- Feedback loop from AI implementation back into the wizard

## Open Questions
- What spec format works best for AI consumption? (Markdown with frontmatter? A CLAUDE.md-style file? Multiple files per feature?)
- Should the wizard produce one monolithic spec or break it into per-feature/per-view specs?
- How much additional user input is needed vs. what can be inferred from wizard state?
- Should the spec include suggested implementation order or dependency graph?
- How to handle the boundary between "what the wizard built" and "what the AI should build" — explicit markers? A checklist?

## Files Likely Affected
- TBD — likely involves the generator output pipeline

## Edge Cases
- User has very simple app where scaffolding is already near-complete — spec should reflect minimal remaining work
- User has complex app with many views — specs could become very large
- Requirements that are ambiguous or underspecified in the wizard — spec should flag these for the user or AI

## How to Verify
TBD
