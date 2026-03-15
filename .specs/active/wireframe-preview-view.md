# Spec: Wireframe / Mockup Preview View

**Status:** draft
**Date:** 2026-03-14

## What
An alternative view mode for the wizard that shows the app being designed as a set of visual wireframes/mockups — one per page/view. Each wireframe displays a layout of components, which are themselves compositions of requirement elements. Users can toggle between the default wizard layout and this preview view.

## Why
The wizard's default layout is structured around defining requirements, data, components, and views as lists. But users also need to see what their app will actually look like — how components are arranged on pages, how pages relate to each other. A visual preview helps users validate their design decisions and spot gaps (e.g., a view missing a needed component).

## Acceptance Criteria
- [ ] Toggle/switch to move between wizard layout and wireframe preview
- [ ] Each defined view renders as a visual wireframe/mockup
- [ ] Wireframes show component placement within each view
- [ ] Components display their constituent requirement elements
- [ ] Preview updates as the user modifies wizard state
- [ ] Works at desktop and mobile breakpoints

## Scope
**In scope:**
- View toggle mechanism in the wizard UI
- Wireframe rendering for each defined view
- Component representation within wireframes
- Visual indication of which requirements map to which components

**Out of scope:**
- Drag-and-drop layout editing within wireframes (possible future enhancement)
- Pixel-accurate rendering of the final app
- Export/download of wireframes

## Files Likely Affected
- TBD — depends on chosen wizard layout

## Edge Cases
- Views with no components assigned
- Components with no data source
- Very large number of views or components
- How to represent navigation flows between wireframes

## How to Verify
TBD
