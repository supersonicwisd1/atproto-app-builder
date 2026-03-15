# Spec: [Feature/Task Name]

**Status:** draft | ready | in-progress | done
**Date:** YYYY-MM-DD

<!-- GUIDANCE FOR USING THIS TEMPLATE

Status meanings:
- draft: Incomplete, still being shaped. Acceptance criteria may lack behavioral
  detail. Ambiguities may be unresolved. This is fine — specs are iterative.
- ready: Detailed enough for an AI or developer to implement without guessing.
  All acceptance criteria have behavioral sub-items for user-facing work.
  Ambiguities are resolved or explicitly called out.
- in-progress: Implementation has started.
- done: Implemented and verified.

Level of detail:
- For tasks with user interaction (UI panels, forms, flows): write full
  behavioral sub-items under each acceptance criterion. The goal is that an AI
  can implement the work without ambiguity.
- For tasks without user interaction (cleanup, tests, refactoring): acceptance
  criteria alone may be sufficient. Behavioral sub-items can be omitted.
- When in doubt, add more detail. Ambiguity causes implementation churn.

Sections marked OPTIONAL can be omitted when they don't apply, but consider
whether they might surface useful information before skipping them.
-->

## What
One paragraph describing what this change does.

## Why
Why is this needed? What problem does it solve or what capability does it add?

## Acceptance Criteria

<!-- Each criterion is a high-level, testable statement of what "done" looks like.
For user-facing work, add behavioral sub-items that describe the specific
interaction sequences — what the user does, what the system displays, and how
state changes. These sub-items should be detailed enough that an AI can
implement the behavior without guessing.

For lightweight specs (cleanup, config, tests), criteria without sub-items
are fine. -->

- [ ] Criterion 1 — a specific, testable statement
  - When [trigger], the system [behavior]. (optional behavioral detail)
  - When [trigger], the system [behavior].
- [ ] Criterion 2
- [ ] Criterion 3

## Scope
**In scope:**
- List of specific things to build/change

**Out of scope:**
- Things explicitly NOT being done in this task

## Files Likely Affected
- `src/path/to/file.ts` — brief note on what changes

## Ambiguity Warnings (OPTIONAL)

<!-- List anything that is unclear, under-specified, or where the implementer
would have to make a judgment call. Each warning should state the ambiguity,
a likely assumption, and a request to confirm or clarify. Resolved ambiguities
should be removed and their answers incorporated into the spec.

This section is especially important in draft specs — it flags what needs to be
decided before the spec is ready for implementation. -->

1. **[Topic]**
   [Description of the ambiguity]
   - _Likely assumption:_ [what an implementer would probably do]
   - _Please confirm or clarify._

## Integration Boundaries (OPTIONAL)

<!-- For work that reads from or writes to external systems, shared state, or
other modules. Describe what data flows in and out, the expected contract,
and how to handle unavailability. Skip this section for self-contained work. -->

### [System/Module Name]
- **Data flowing in:** What this feature reads from the system
- **Data flowing out:** What this feature writes to the system
- **Expected contract:** The interface or data shape expected
- **Unavailability:** What happens if the system is unavailable

## Behavioral Scenarios (OPTIONAL)

<!-- Concrete user journeys that verify the acceptance criteria in context.
Each scenario has a setup (preconditions), action (what the user does), and
expected outcome (what the system does). Include happy paths, error paths,
and edge cases.

Before finalizing scenarios, consider: What inputs are unusual or invalid?
What happens at boundary values (empty lists, max limits, first/last items)?
What if the user does things in an unexpected order? Edge cases that are
well-understood should be written as scenarios. Edge cases where the correct
behavior is unclear should go in Ambiguity Warnings.

These serve as both documentation and a test plan. They belong in the spec
rather than in a separate file so they stay connected to the work they verify.

For specs without user interaction, this section can be omitted. -->

**Scenario: [Name]**
- Setup: [preconditions]
- Action: [what the user does]
- Expected outcome: [what the system does]

## How to Verify
Steps to manually test this works, or which automated tests cover it.
