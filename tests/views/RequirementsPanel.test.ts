// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderRequirementsPanel,
  wireRequirementsPanel,
  updateSidebar,
  updateDataSidebar,
  getDisplayText,
  getSidebarText,
} from '../../src/app/views/panels/RequirementsPanel';
import {
  getWizardState,
  saveWizardState,
  setWizardState,
  initializeWizardState,
} from '../../src/app/state/WizardState';
import type { Requirement, RecordType, NonDataElement, View } from '../../src/types/wizard';

// ── Helpers ────────────────────────────────────────────────────────────

function makeRequirement(
  overrides: Partial<Requirement> & { type: Requirement['type'] },
): Requirement {
  return { id: `test-${Date.now()}-${Math.random()}`, ...overrides };
}

function setStateWithRequirements(reqs: Requirement[]): void {
  const state = initializeWizardState();
  state.requirements = reqs;
  setWizardState(state);
}

// ── Display text ───────────────────────────────────────────────────────

describe('getDisplayText', () => {
  it('returns text for know type', () => {
    const req = makeRequirement({ type: 'know', text: 'how this app works' });
    expect(getDisplayText(req)).toBe('how this app works');
  });

  it('returns "I need to [verb] [data]" for do type', () => {
    const req = makeRequirement({ type: 'do', verb: 'create', data: 'a bookmark' });
    expect(getDisplayText(req)).toBe('I need to create a bookmark');
  });

  it('returns "ViewA → ViewB" for direct navigate type with view IDs', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Detail', blockIds: [] },
    ];
    const req = makeRequirement({ type: 'navigate', navType: 'direct', fromView: 'v1', toView: 'v2' });
    expect(getDisplayText(req)).toBe('Home → Detail');
  });

  it('returns "[deleted view]" when a referenced view no longer exists', () => {
    const state = getWizardState();
    state.views = [{ id: 'v1', name: 'Home', blockIds: [] }];
    const req = makeRequirement({ type: 'navigate', navType: 'direct', fromView: 'v1', toView: 'gone' });
    expect(getDisplayText(req)).toBe('Home → [deleted view]');
  });

  it('returns "Navigation menu: all views" for menu with includeAllViews', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'menu', menuIncludeAllViews: true });
    expect(getDisplayText(req)).toBe('Navigation menu: all views');
  });

  it('returns "Navigation menu: ViewA, ViewB" for menu with manual items', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
    ];
    const req = makeRequirement({
      type: 'navigate', navType: 'menu',
      menuIncludeAllViews: false, menuItems: ['v1', 'v2'],
    });
    expect(getDisplayText(req)).toBe('Navigation menu: Home, Profile');
  });

  it('includes menuLabel in display text when set', () => {
    const req = makeRequirement({
      type: 'navigate', navType: 'menu',
      menuLabel: 'Main Nav', menuIncludeAllViews: true,
    });
    expect(getDisplayText(req)).toBe('Main Nav: Navigation menu: all views');
  });

  it('returns "Forward/back navigation (arrows)" for forward-back with arrows', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'forward-back', navControlType: 'arrows' });
    expect(getDisplayText(req)).toBe('Forward/back navigation (arrows)');
  });

  it('returns "Forward/back navigation (buttons)" for forward-back with buttons', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'forward-back', navControlType: 'buttons' });
    expect(getDisplayText(req)).toBe('Forward/back navigation (buttons)');
  });

  it('defaults to arrows when navControlType is missing for forward-back', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'forward-back' });
    expect(getDisplayText(req)).toBe('Forward/back navigation (arrows)');
  });

  it('handles navigate with no navType as direct link', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Detail', blockIds: [] },
    ];
    const req = makeRequirement({ type: 'navigate', fromView: 'v1', toView: 'v2' });
    expect(getDisplayText(req)).toBe('Home → Detail');
  });

  it('handles missing fields gracefully', () => {
    const req = makeRequirement({ type: 'know' });
    expect(getDisplayText(req)).toBe('');
  });

  it('returns "I need to [verb] the [element]" for do/element type', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    const req = makeRequirement({
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
    });
    expect(getDisplayText(req)).toBe('I need to set the Timer');
  });

  it('falls back to data field for do/element when element not found', () => {
    const req = makeRequirement({
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'missing-id',
    });
    expect(getDisplayText(req)).toBe('I need to set the Timer');
  });
});

describe('getSidebarText', () => {
  it('returns truncated "Know: [text]"', () => {
    const req = makeRequirement({ type: 'know', text: 'how this app works' });
    expect(getSidebarText(req)).toBe('Know: how this app works');
  });

  it('returns truncated "Do: [verb] [data]"', () => {
    const req = makeRequirement({ type: 'do', verb: 'create', data: 'a bookmark' });
    expect(getSidebarText(req)).toBe('Do: create a bookmark');
  });

  it('returns "Nav: ViewA → ViewB" for direct navigate with view IDs', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Detail', blockIds: [] },
    ];
    const req = makeRequirement({ type: 'navigate', navType: 'direct', fromView: 'v1', toView: 'v2' });
    expect(getSidebarText(req)).toBe('Nav: Home → Detail');
  });

  it('returns "Nav: menu, all views" for menu with includeAllViews', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'menu', menuIncludeAllViews: true });
    expect(getSidebarText(req)).toBe('Nav: menu, all views');
  });

  it('returns "Nav: menu, ViewA, ViewB" for menu with manual items', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
    ];
    const req = makeRequirement({
      type: 'navigate', navType: 'menu',
      menuIncludeAllViews: false, menuItems: ['v1', 'v2'],
    });
    expect(getSidebarText(req)).toBe('Nav: menu, Home, Profile');
  });

  it('includes menuLabel in sidebar text when set', () => {
    const req = makeRequirement({
      type: 'navigate', navType: 'menu',
      menuLabel: 'Main Nav', menuIncludeAllViews: true,
    });
    expect(getSidebarText(req)).toBe('Nav: Main Nav, all views');
  });

  it('returns "Nav: Fwd/Back" for forward-back navigate', () => {
    const req = makeRequirement({ type: 'navigate', navType: 'forward-back' });
    expect(getSidebarText(req)).toBe('Nav: Fwd/Back');
  });

  it('truncates long text with ellipsis', () => {
    const req = makeRequirement({
      type: 'know',
      text: 'a very long piece of text that exceeds the maximum',
    });
    const result = getSidebarText(req);
    expect(result.length).toBeLessThanOrEqual(36); // "Know: " (6) + 30
    expect(result).toContain('…');
  });

  it('returns "Do: [verb] [element]" for do/element type', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    const req = makeRequirement({
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
    });
    expect(getSidebarText(req)).toBe('Do: set Timer');
  });
});

// ── Rendering ──────────────────────────────────────────────────────────

describe('renderRequirementsPanel', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
  });

  it('renders empty state when no requirements exist', () => {
    const html = renderRequirementsPanel();
    expect(html).toContain('Build a Decentralized Web App');
    expect(html).toContain('Add Your First Requirement');
    expect(html).toContain('meditation tracker');
    expect(html).toContain('grocery list');
    expect(html).toContain('event planner');
    expect(html).not.toContain('wizard-list');
  });

  it('renders list state when requirements exist', () => {
    const state = getWizardState();
    state.requirements = [
      makeRequirement({ type: 'know', text: 'how this works' }),
      makeRequirement({ type: 'do', verb: 'track', data: 'sessions' }),
    ];
    const html = renderRequirementsPanel();
    expect(html).not.toContain('Build a Decentralized Web App');
    expect(html).toContain('Add Requirement');
    expect(html).toContain('item-grid');
    expect(html).toContain('how this works');
    expect(html).toContain('I need to track sessions');
  });

  it('renders item cards with type labels and accessible action buttons', () => {
    const req = makeRequirement({ type: 'know', text: 'something' });
    const state = getWizardState();
    state.requirements = [req];
    const html = renderRequirementsPanel();
    expect(html).toContain('item-card');
    expect(html).toContain('item-meta');
    expect(html).toContain('Information');
    expect(html).toContain('req-edit-btn');
    expect(html).toContain('req-delete-btn');
    expect(html).toContain(`data-req-id="${req.id}"`);
    expect(html).toContain('aria-label="Edit requirement"');
    expect(html).toContain('aria-label="Delete requirement"');
  });

  it('renders correct type labels for each requirement type', () => {
    const state = getWizardState();
    state.requirements = [
      makeRequirement({ type: 'know', text: 'something' }),
      makeRequirement({ type: 'do', verb: 'track', data: 'items' }),
      makeRequirement({ type: 'navigate', navType: 'direct' }),
    ];
    const html = renderRequirementsPanel();
    expect(html).toContain('Information');
    expect(html).toContain('Interaction');
    expect(html).toContain('Direct Link');
  });

  it('renders next-step card when requirements exist', () => {
    const state = getWizardState();
    state.requirements = [makeRequirement({ type: 'know', text: 'something' })];
    const html = renderRequirementsPanel();
    expect(html).toContain('next-step');
    expect(html).toContain('Define Data');
  });

  it('disables add button at 100 requirements', () => {
    const state = getWizardState();
    state.requirements = Array.from({ length: 100 }, (_, i) =>
      makeRequirement({ type: 'know', text: `item ${i}` }),
    );
    const html = renderRequirementsPanel();
    expect(html).toContain('disabled');
  });

  it('escapes HTML in requirement text', () => {
    const state = getWizardState();
    state.requirements = [
      makeRequirement({ type: 'know', text: '<script>alert("xss")</script>' }),
    ];
    const html = renderRequirementsPanel();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── DOM interaction ────────────────────────────────────────────────────

describe('wireRequirementsPanel (DOM)', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
    localStorage.clear();
  });

  function mountPanel(): void {
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
    wireRequirementsPanel();
  }

  it('clicking add button shows inline form with Type dropdown', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    expect(document.getElementById('req-form')).not.toBeNull();
    expect(document.getElementById('req-type-select')).not.toBeNull();
  });

  it('Type dropdown defaults to "know" when adding new', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('know');
    expect(document.getElementById('req-know-text')).not.toBeNull();
  });

  it('changing Type dropdown to "do" shows verb and data fields', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
    expect(document.getElementById('req-do-verb')).not.toBeNull();
    expect(document.getElementById('req-do-data')).not.toBeNull();
    expect(document.getElementById('req-know-text')).toBeNull();
  });

  // ── Navigate sub-form tests ───────────────────────────────────────

  it('changing Type to navigate shows Type of Navigation dropdown', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));
    expect(document.getElementById('req-nav-type-select')).not.toBeNull();
  });

  it('switching back from navigate to know removes nav type dropdown', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));
    expect(document.getElementById('req-nav-type-select')).not.toBeNull();

    typeSelect.value = 'know';
    typeSelect.dispatchEvent(new Event('change'));
    expect(document.getElementById('req-nav-type-select')).toBeNull();
  });

  it('navigate defaults to Direct Link with populated From/To dropdowns (Home view is seeded)', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    expect(navTypeSelect.value).toBe('direct');
    const from = document.getElementById('req-nav-from') as HTMLSelectElement;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement;
    expect(from).not.toBeNull();
    expect(from.disabled).toBe(false);
    expect(to.disabled).toBe(false);
    // placeholder + seeded Home view
    expect(from.querySelectorAll('option').length).toBe(2);
  });

  it('navigate Direct Link populates selects when views exist', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
    ];
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const from = document.getElementById('req-nav-from') as HTMLSelectElement;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement;
    expect(from.disabled).toBe(false);
    expect(to.disabled).toBe(false);
    expect(from.querySelectorAll('option').length).toBe(3); // placeholder + 2 views
    expect(from.querySelector('option[value="v1"]')!.textContent).toBe('Home');
  });

  it('changing nav type to menu shows include-all toggle and checkbox lists (Home is seeded)', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    navTypeSelect.value = 'menu';
    navTypeSelect.dispatchEvent(new Event('change'));

    const fieldsArea = document.getElementById('req-type-fields')!;
    expect(fieldsArea.innerHTML).toContain('Include all views');
    expect(document.getElementById('menu-include-all-views')).not.toBeNull();
  });

  it('changing nav type to menu shows include-all toggle and checkbox lists when views exist', () => {
    const state = getWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
    ];
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    navTypeSelect.value = 'menu';
    navTypeSelect.dispatchEvent(new Event('change'));

    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement;
    expect(toggle).not.toBeNull();
    expect(toggle.checked).toBe(true);
    // Preview should be visible, manual list hidden
    expect(document.getElementById('menu-items-preview')!.style.display).not.toBe('none');
    expect(document.getElementById('menu-items-manual')!.style.display).toBe('none');
  });

  it('changing nav type to forward-back shows page order and control type (Home is seeded)', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    navTypeSelect.value = 'forward-back';
    navTypeSelect.dispatchEvent(new Event('change'));

    const fieldsArea = document.getElementById('req-type-fields')!;
    expect(fieldsArea.innerHTML).toContain('Page Order');
    expect(fieldsArea.innerHTML).toContain('Control Type');
    expect(document.getElementById('req-nav-control-type')).not.toBeNull();
    expect((document.getElementById('req-nav-control-type') as HTMLSelectElement).disabled).toBe(false);
    // Page order should show seeded Home view
    expect(document.querySelectorAll('#req-page-order .reorder-item').length).toBe(1);
  });

  it('Navigation Menu option is not disabled when a menu already exists (multiple allowed)', () => {
    const menuReq = makeRequirement({ type: 'navigate', navType: 'menu' });
    const state = getWizardState();
    state.requirements = [menuReq];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    const menuOption = navTypeSelect.querySelector('option[value="menu"]') as HTMLOptionElement;
    expect(menuOption.disabled).toBe(false);
  });

  it('Forward/Back option is disabled when a forward-back requirement already exists', () => {
    const fbReq = makeRequirement({ type: 'navigate', navType: 'forward-back' });
    const state = getWizardState();
    state.requirements = [fbReq];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    const fbOption = navTypeSelect.querySelector('option[value="forward-back"]') as HTMLOptionElement;
    expect(fbOption.disabled).toBe(true);
  });

  it('Direct Link option is never disabled (multiple allowed)', () => {
    const directReq = makeRequirement({ type: 'navigate', navType: 'direct', fromView: 'A', toView: 'B' });
    const state = getWizardState();
    state.requirements = [directReq];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));

    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    const directOption = navTypeSelect.querySelector('option[value="direct"]') as HTMLOptionElement;
    expect(directOption.disabled).toBe(false);
  });

  // ── Standard form behavior tests ──────────────────────────────────

  it('Type dropdown is set to requirement type when editing', () => {
    const req = makeRequirement({ type: 'do', verb: 'create', data: 'a bookmark' });
    const state = getWizardState();
    state.requirements = [req];
    mountPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('do');
    expect(document.getElementById('req-do-verb')).not.toBeNull();
    expect((document.getElementById('req-do-verb') as HTMLInputElement).value).toBe('create');
    expect((document.getElementById('req-do-data') as HTMLInputElement).value).toBe('a bookmark');
  });

  it('save button is disabled initially for know form', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('save button enables when know textarea has content', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const textarea = document.getElementById('req-know-text') as HTMLTextAreaElement;
    textarea.value = 'how this works';
    textarea.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('save button stays disabled when only verb is filled for do type', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    verb.value = 'create';
    verb.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('save button enables when both verb and data are filled', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const data = document.getElementById('req-do-data') as HTMLInputElement;
    verb.value = 'create';
    verb.dispatchEvent(new Event('input'));
    data.value = 'a bookmark';
    data.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('save button disabled for direct link until both views selected, enabled for menu/fwd-back with seeded view', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    // Direct link: disabled until both from/to selected
    expect(saveBtn.disabled).toBe(true);

    // Menu: enabled (include-all default + seeded Home view in visible-on)
    const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
    navTypeSelect.value = 'menu';
    navTypeSelect.dispatchEvent(new Event('change'));
    expect(saveBtn.disabled).toBe(false);

    // Forward/back: enabled (seeded Home view in page order)
    navTypeSelect.value = 'forward-back';
    navTypeSelect.dispatchEvent(new Event('change'));
    expect(saveBtn.disabled).toBe(false);
  });

  it('saving a know requirement adds it to state and re-renders', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const textarea = document.getElementById('req-know-text') as HTMLTextAreaElement;
    textarea.value = 'how this works';
    textarea.dispatchEvent(new Event('input'));
    const contentArea = document.getElementById('req-know-content') as HTMLTextAreaElement;
    contentArea.value = 'A quick-start guide';
    contentArea.dispatchEvent(new Event('input'));
    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const state = getWizardState();
    expect(state.requirements).toHaveLength(1);
    expect(state.requirements[0].type).toBe('know');
    expect(state.requirements[0].text).toBe('how this works');
    expect(state.requirements[0].content).toBe('A quick-start guide');
    expect(document.body.innerHTML).toContain('how this works');
  });

  it('saving a do requirement adds it to state', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const data = document.getElementById('req-do-data') as HTMLInputElement;
    verb.value = 'track';
    verb.dispatchEvent(new Event('input'));
    data.value = 'meditation sessions';
    data.dispatchEvent(new Event('input'));
    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const state = getWizardState();
    expect(state.requirements).toHaveLength(1);
    expect(state.requirements[0].type).toBe('do');
    expect(state.requirements[0].verb).toBe('track');
    expect(state.requirements[0].data).toBe('meditation sessions');
  });

  it('deleting a requirement removes it from state and re-renders', () => {
    const req = makeRequirement({ type: 'know', text: 'something' });
    const state = getWizardState();
    state.requirements = [req];
    mountPanel();

    const deleteBtn = document.querySelector('.req-delete-btn') as HTMLElement;
    deleteBtn.click();

    expect(getWizardState().requirements).toHaveLength(0);
    expect(document.body.innerHTML).toContain('Build a Decentralized Web App');
  });

  it('editing a requirement pre-fills the form and updates in place', () => {
    const req1 = makeRequirement({ type: 'know', text: 'first' });
    const req2 = makeRequirement({ type: 'do', verb: 'create', data: 'a bookmark' });
    const req3 = makeRequirement({ type: 'know', text: 'third' });
    const state = getWizardState();
    state.requirements = [req1, req2, req3];
    mountPanel();

    const editBtns = document.querySelectorAll('.req-edit-btn');
    (editBtns[1] as HTMLElement).click();

    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    expect(typeSelect.value).toBe('do');

    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const data = document.getElementById('req-do-data') as HTMLInputElement;
    expect(verb.value).toBe('create');
    expect(data.value).toBe('a bookmark');

    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.textContent).toBe('Save');

    verb.value = 'save';
    verb.dispatchEvent(new Event('input'));
    saveBtn.click();

    const updated = getWizardState().requirements;
    expect(updated).toHaveLength(3);
    expect(updated[0].id).toBe(req1.id);
    expect(updated[1].id).toBe(req2.id);
    expect(updated[1].verb).toBe('save');
    expect(updated[2].id).toBe(req3.id);
  });

  it('cancel from form does not save anything', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const textarea = document.getElementById('req-know-text') as HTMLTextAreaElement;
    textarea.value = 'should not be saved';
    textarea.dispatchEvent(new Event('input'));
    (document.querySelector('.req-cancel-btn') as HTMLElement).click();

    expect(getWizardState().requirements).toHaveLength(0);
  });
});

// ── Sidebar updates ────────────────────────────────────────────────────

describe('updateSidebar', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
  });

  function mountSidebar(): void {
    document.body.innerHTML = `
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
  }

  it('shows "None yet" and badge 0 when empty', () => {
    mountSidebar();
    updateSidebar();
    expect(document.querySelector('.badge')!.textContent).toBe('0');
    expect(document.querySelector('.sidebar-item-empty')).not.toBeNull();
  });

  it('shows item count and sidebar items when requirements exist', () => {
    const state = getWizardState();
    state.requirements = [
      makeRequirement({ type: 'know', text: 'how this works' }),
      makeRequirement({ type: 'do', verb: 'track', data: 'sessions' }),
    ];
    mountSidebar();
    updateSidebar();
    expect(document.querySelector('.badge')!.textContent).toBe('2');
    expect(document.querySelector('.sidebar-item-empty')).toBeNull();
    const items = document.querySelectorAll('.sidebar-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Know:');
    expect(items[1].textContent).toContain('Do:');
  });

  it('adds has-items class when requirements exist', () => {
    const state = getWizardState();
    state.requirements = [makeRequirement({ type: 'know', text: 'x' })];
    mountSidebar();
    updateSidebar();
    expect(document.querySelector('[data-section="requirements"]')!.classList.contains('has-items')).toBe(true);
  });

  it('removes has-items class when requirements are empty', () => {
    mountSidebar();
    document.querySelector('[data-section="requirements"]')!.classList.add('has-items');
    updateSidebar();
    expect(document.querySelector('[data-section="requirements"]')!.classList.contains('has-items')).toBe(false);
  });
});

// ── Data type combobox & seeding ──────────────────────────────────────

describe('data type combobox and seeding', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
    localStorage.clear();
  });

  function mountPanel(): void {
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
    wireRequirementsPanel();
  }

  function switchToDo(): void {
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
  }

  function fillDoForm(verb: string, data: string): void {
    const verbEl = document.getElementById('req-do-verb') as HTMLInputElement;
    const dataEl = document.getElementById('req-do-data') as HTMLInputElement;
    verbEl.value = verb;
    verbEl.dispatchEvent(new Event('input'));
    dataEl.value = data;
    dataEl.dispatchEvent(new Event('input'));
  }

  function saveForm(): void {
    (document.querySelector('.req-save-btn') as HTMLElement).click();
  }

  // ── Combobox rendering ──────────────────────────────────────────────

  it('shows combobox with hint text when type is "do"', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();

    expect(document.getElementById('req-do-data-combobox')).not.toBeNull();
    expect(document.getElementById('req-do-data-dropdown')).not.toBeNull();
    const hints = document.querySelectorAll('#req-type-fields .form-hint');
    const hintTexts = Array.from(hints).map(h => h.textContent);
    expect(hintTexts.some(t => t?.includes('What kind of thing'))).toBe(true);
  });

  it('dropdown does not appear when no record types exist', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();

    const input = document.getElementById('req-do-data') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));
    const dropdown = document.getElementById('req-do-data-dropdown')!;
    expect(dropdown.style.display).toBe('none');
  });

  // ── Seeding ─────────────────────────────────────────────────────────

  it('saving a "do" requirement with new name seeds a RecordType', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    fillDoForm('create', 'book');
    saveForm();

    const state = getWizardState();
    expect(state.recordTypes).toHaveLength(1);
    expect(state.recordTypes[0].displayName).toBe('book');
    expect(state.recordTypes[0].name).toBe('');
    // Should have system createdAt field
    expect(state.recordTypes[0].fields).toHaveLength(1);
    expect(state.recordTypes[0].fields[0].name).toBe('createdAt');
    expect(state.recordTypes[0].fields[0].isSystem).toBe(true);
    expect(state.requirements[0].dataTypeId).toBe(state.recordTypes[0].id);
  });

  it('saving a second "do" requirement with new name seeds another RecordType', () => {
    mountPanel();
    // First requirement
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    fillDoForm('create', 'book');
    saveForm();

    // Second requirement
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    fillDoForm('list', 'grocery item');
    saveForm();

    const state = getWizardState();
    expect(state.recordTypes).toHaveLength(2);
    expect(state.recordTypes[0].displayName).toBe('book');
    expect(state.recordTypes[1].displayName).toBe('grocery item');
    expect(state.requirements[1].dataTypeId).toBe(state.recordTypes[1].id);
  });

  it('exact name match reuses existing RecordType (no duplicate)', () => {
    const state = getWizardState();
    state.recordTypes = [{
      id: 'existing-book',
      name: '',
      displayName: 'book',
      description: '',
      fields: [],
    }];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();
    fillDoForm('update', 'book');
    saveForm();

    const updated = getWizardState();
    expect(updated.recordTypes).toHaveLength(1);
    expect(updated.requirements[0].dataTypeId).toBe('existing-book');
  });

  it('exact name match is case-insensitive', () => {
    const state = getWizardState();
    state.recordTypes = [{
      id: 'existing-book',
      name: '',
      displayName: 'Book',
      description: '',
      fields: [],
    }];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();
    fillDoForm('update', 'book');
    saveForm();

    const updated = getWizardState();
    expect(updated.recordTypes).toHaveLength(1);
    expect(updated.requirements[0].dataTypeId).toBe('existing-book');
  });

  it('editing a "do" requirement and changing data type creates new RecordType', () => {
    const state = getWizardState();
    state.recordTypes = [{
      id: 'rt-book',
      name: '',
      displayName: 'book',
      description: '',
      fields: [],
    }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      verb: 'create',
      data: 'book',
      dataTypeId: 'rt-book',
    }];
    mountPanel();

    // Edit the requirement
    (document.querySelector('.req-edit-btn') as HTMLElement).click();
    const dataEl = document.getElementById('req-do-data') as HTMLInputElement;
    dataEl.value = 'novel';
    dataEl.dispatchEvent(new Event('input'));
    saveForm();

    const updated = getWizardState();
    // Old "book" RecordType is preserved (orphaned)
    expect(updated.recordTypes).toHaveLength(2);
    expect(updated.recordTypes[0].displayName).toBe('book');
    expect(updated.recordTypes[1].displayName).toBe('novel');
    expect(updated.requirements[0].dataTypeId).toBe(updated.recordTypes[1].id);
  });

  it('deleting a "do" requirement does not delete its RecordType', () => {
    const state = getWizardState();
    state.recordTypes = [{
      id: 'rt-book',
      name: '',
      displayName: 'book',
      description: '',
      fields: [],
    }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      verb: 'create',
      data: 'book',
      dataTypeId: 'rt-book',
    }];
    mountPanel();

    (document.querySelector('.req-delete-btn') as HTMLElement).click();

    const updated = getWizardState();
    expect(updated.requirements).toHaveLength(0);
    expect(updated.recordTypes).toHaveLength(1);
    expect(updated.recordTypes[0].displayName).toBe('book');
  });

  // ── Type dropdown locking ───────────────────────────────────────────

  it('type dropdown is disabled when editing an existing requirement', () => {
    const state = getWizardState();
    state.requirements = [makeRequirement({ type: 'do', verb: 'create', data: 'book' })];
    mountPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    expect(typeSelect.disabled).toBe(true);
  });

  it('type dropdown is enabled when adding a new requirement', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    expect(typeSelect.disabled).toBe(false);
  });

  // ── Dropdown behavior ──────────────────────────────────────────────

  it('dropdown shows existing record types on focus', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
      { id: 'rt-2', name: '', displayName: 'grocery item', description: '', fields: [] },
    ];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();

    const input = document.getElementById('req-do-data') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-data-dropdown')!;
    expect(dropdown.style.display).toBe('block');
    const items = dropdown.querySelectorAll('.combobox-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('book');
    expect(items[1].textContent).toBe('grocery item');
  });

  it('dropdown filters items as user types', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
      { id: 'rt-2', name: '', displayName: 'grocery item', description: '', fields: [] },
    ];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();

    const input = document.getElementById('req-do-data') as HTMLInputElement;
    input.value = 'boo';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-data-dropdown')!;
    const items = dropdown.querySelectorAll('.combobox-item:not(.combobox-create)');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('book');

    // "Create" option should appear since "boo" is not an exact match
    const createItem = dropdown.querySelector('.combobox-create');
    expect(createItem).not.toBeNull();
  });

  it('exact match suppresses "Create" option', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
    ];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();

    const input = document.getElementById('req-do-data') as HTMLInputElement;
    input.value = 'book';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-data-dropdown')!;
    const createItem = dropdown.querySelector('.combobox-create');
    expect(createItem).toBeNull();
  });

  it('clicking a dropdown item selects existing RecordType', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
    ];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();

    const input = document.getElementById('req-do-data') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-data-dropdown')!;
    const item = dropdown.querySelector('.combobox-item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mousedown'));

    expect(input.value).toBe('book');

    // Fill verb and save
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    verb.value = 'update';
    verb.dispatchEvent(new Event('input'));
    saveForm();

    const updated = getWizardState();
    expect(updated.recordTypes).toHaveLength(1);
    expect(updated.requirements[0].dataTypeId).toBe('rt-1');
  });
});

// ── Data sidebar updates ──────────────────────────────────────────────

describe('updateDataSidebar', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
  });

  function mountDataSidebar(): void {
    document.body.innerHTML = `
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
  }

  it('shows badge count matching recordTypes length', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
      { id: 'rt-2', name: '', displayName: 'grocery item', description: '', fields: [] },
    ];
    mountDataSidebar();
    updateDataSidebar();

    expect(document.querySelector('.badge')!.textContent).toBe('2');
  });

  it('shows displayName for each RecordType in sidebar items', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
    ];
    mountDataSidebar();
    updateDataSidebar();

    const items = document.querySelectorAll('.sidebar-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('book');
  });

  it('adds has-items class when recordTypes exist', () => {
    const state = getWizardState();
    state.recordTypes = [
      { id: 'rt-1', name: '', displayName: 'book', description: '', fields: [] },
    ];
    mountDataSidebar();
    updateDataSidebar();

    expect(document.querySelector('[data-section="data"]')!.classList.contains('has-items')).toBe(true);
  });

  it('shows "None yet" when no recordTypes exist', () => {
    mountDataSidebar();
    updateDataSidebar();

    expect(document.querySelector('.badge')!.textContent).toBe('0');
    expect(document.querySelector('.sidebar-item-empty')).not.toBeNull();
  });
});

// ── Non-data element interactions ──────────────────────────────────────

describe('non-data element interactions', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
    localStorage.clear();
  });

  function mountPanel(): void {
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
    wireRequirementsPanel();
  }

  function switchToDo(): void {
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'do';
    typeSelect.dispatchEvent(new Event('change'));
  }

  function switchToElement(): void {
    const targetSelect = document.getElementById('req-do-target-select') as HTMLSelectElement;
    targetSelect.value = 'element';
    targetSelect.dispatchEvent(new Event('change'));
  }

  function switchToDataTarget(): void {
    const targetSelect = document.getElementById('req-do-target-select') as HTMLSelectElement;
    targetSelect.value = 'data';
    targetSelect.dispatchEvent(new Event('change'));
  }

  function saveForm(): void {
    (document.querySelector('.req-save-btn') as HTMLElement).click();
  }

  // ── Target selector rendering ───────────────────────────────────────

  it('shows Target dropdown when type is "do"', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    expect(document.getElementById('req-do-target-select')).not.toBeNull();
  });

  it('Target dropdown defaults to "Data Type"', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    const targetSelect = document.getElementById('req-do-target-select') as HTMLSelectElement;
    expect(targetSelect.value).toBe('data');
  });

  it('does not show Target dropdown for "know" type', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    expect(document.getElementById('req-do-target-select')).toBeNull();
  });

  // ── Switching targets ───────────────────────────────────────────────

  it('switching to "Non-data Element" shows element form fields', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    expect(document.getElementById('req-do-element')).not.toBeNull();
    expect(document.getElementById('req-uses-data')).not.toBeNull();
    expect(document.getElementById('req-do-data')).toBeNull();
  });

  it('switching back to "Data Type" shows data form fields', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    switchToDataTarget();
    expect(document.getElementById('req-do-data')).not.toBeNull();
    expect(document.getElementById('req-do-element')).toBeNull();
    expect(document.getElementById('req-uses-data')).toBeNull();
  });

  it('verb is preserved when switching targets', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    verb.value = 'configure';
    verb.dispatchEvent(new Event('input'));
    switchToElement();
    const newVerb = document.getElementById('req-do-verb') as HTMLInputElement;
    expect(newVerb.value).toBe('configure');
  });

  // ── Element form validation ─────────────────────────────────────────

  it('save button is disabled when element name is empty', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    verb.value = 'set';
    verb.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('save button enables when both verb and element name are filled', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    verb.value = 'set';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('"uses data from" being empty does not block saving', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    verb.value = 'start';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  // ── Saving element requirements ─────────────────────────────────────

  it('saving creates a NonDataElement and links the requirement', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    verb.value = 'set';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    saveForm();

    const state = getWizardState();
    expect(state.nonDataElements).toHaveLength(1);
    expect(state.nonDataElements[0].name).toBe('Timer');
    expect(state.requirements).toHaveLength(1);
    expect(state.requirements[0].interactionTarget).toBe('element');
    expect(state.requirements[0].elementId).toBe(state.nonDataElements[0].id);
    expect(state.requirements[0].verb).toBe('set');
    // No RecordType should be created
    expect(state.recordTypes).toHaveLength(0);
  });

  it('saving does not create a RecordType for element interactions', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    verb.value = 'start';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    saveForm();

    expect(getWizardState().recordTypes).toHaveLength(0);
  });

  it('reuses existing NonDataElement on second requirement', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-timer', name: 'Timer' }];

    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    verb.value = 'start';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    saveForm();

    const updated = getWizardState();
    expect(updated.nonDataElements).toHaveLength(1);
    expect(updated.requirements[0].elementId).toBe('el-timer');
  });

  it('"uses data from" seeds a RecordType when new name entered', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    const usesData = document.getElementById('req-uses-data') as HTMLInputElement;
    verb.value = 'set';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    usesData.value = 'Preferences';
    usesData.dispatchEvent(new Event('input'));
    saveForm();

    const state = getWizardState();
    expect(state.nonDataElements).toHaveLength(1);
    expect(state.recordTypes).toHaveLength(1);
    expect(state.recordTypes[0].displayName).toBe('Preferences');
    expect(state.requirements[0].usesDataTypeId).toBe(state.recordTypes[0].id);
  });

  it('"uses data from" reuses existing RecordType', () => {
    const state = getWizardState();
    state.recordTypes = [{
      id: 'rt-settings',
      name: '',
      displayName: 'Settings',
      description: '',
      fields: [],
      source: 'new',
    }];

    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    const element = document.getElementById('req-do-element') as HTMLInputElement;
    const usesData = document.getElementById('req-uses-data') as HTMLInputElement;
    verb.value = 'configure';
    verb.dispatchEvent(new Event('input'));
    element.value = 'Timer';
    element.dispatchEvent(new Event('input'));
    usesData.value = 'Settings';
    usesData.dispatchEvent(new Event('input'));
    saveForm();

    const updated = getWizardState();
    expect(updated.recordTypes).toHaveLength(1);
    expect(updated.requirements[0].usesDataTypeId).toBe('rt-settings');
  });

  // ── Editing element requirements ────────────────────────────────────

  it('target select is disabled when editing an element requirement', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
    }];
    mountPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();
    const targetSelect = document.getElementById('req-do-target-select') as HTMLSelectElement;
    expect(targetSelect.disabled).toBe(true);
    expect(targetSelect.value).toBe('element');
  });

  it('editing pre-fills element form fields', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    state.recordTypes = [{
      id: 'rt-1',
      name: '',
      displayName: 'Settings',
      description: '',
      fields: [],
      source: 'new',
    }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
      usesDataTypeId: 'rt-1',
    }];
    mountPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();
    expect((document.getElementById('req-do-verb') as HTMLInputElement).value).toBe('set');
    expect((document.getElementById('req-do-element') as HTMLInputElement).value).toBe('Timer');
    expect((document.getElementById('req-uses-data') as HTMLInputElement).value).toBe('Settings');
  });

  // ── Deleting element requirements ───────────────────────────────────

  it('deleting an element requirement preserves the NonDataElement', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
    }];
    mountPanel();

    (document.querySelector('.req-delete-btn') as HTMLElement).click();
    const updated = getWizardState();
    expect(updated.requirements).toHaveLength(0);
    expect(updated.nonDataElements).toHaveLength(1);
    expect(updated.nonDataElements[0].name).toBe('Timer');
  });

  // ── Element combobox dropdown ───────────────────────────────────────

  it('element dropdown shows existing elements on focus', () => {
    const state = getWizardState();
    state.nonDataElements = [
      { id: 'el-1', name: 'Timer' },
      { id: 'el-2', name: 'Canvas' },
    ];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();

    const input = document.getElementById('req-do-element') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-element-dropdown')!;
    expect(dropdown.style.display).toBe('block');
    const items = dropdown.querySelectorAll('.combobox-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe('Timer');
    expect(items[1].textContent).toBe('Canvas');
  });

  it('element dropdown does not appear when no elements exist', () => {
    mountPanel();
    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();

    const input = document.getElementById('req-do-element') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));
    const dropdown = document.getElementById('req-do-element-dropdown')!;
    expect(dropdown.style.display).toBe('none');
  });

  it('exact element name match suppresses "Create" option', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();

    const input = document.getElementById('req-do-element') as HTMLInputElement;
    input.value = 'timer';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-element-dropdown')!;
    const createItem = dropdown.querySelector('.combobox-create');
    expect(createItem).toBeNull();
  });

  it('clicking an element dropdown item selects it', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    mountPanel();

    document.getElementById('req-add-btn')!.click();
    switchToDo();
    switchToElement();

    const input = document.getElementById('req-do-element') as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));

    const dropdown = document.getElementById('req-do-element-dropdown')!;
    const item = dropdown.querySelector('.combobox-item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mousedown'));

    expect(input.value).toBe('Timer');

    // Fill verb and save
    const verb = document.getElementById('req-do-verb') as HTMLInputElement;
    verb.value = 'start';
    verb.dispatchEvent(new Event('input'));
    saveForm();

    const updated = getWizardState();
    expect(updated.nonDataElements).toHaveLength(1);
    expect(updated.requirements[0].elementId).toBe('el-1');
  });

  // ── Display ─────────────────────────────────────────────────────────

  it('renders element requirement with correct display text and type label', () => {
    const state = getWizardState();
    state.nonDataElements = [{ id: 'el-1', name: 'Timer' }];
    state.requirements = [{
      id: 'req-1',
      type: 'do',
      interactionTarget: 'element',
      verb: 'set',
      data: 'Timer',
      elementId: 'el-1',
    }];
    const html = renderRequirementsPanel();
    expect(html).toContain('I need to set the Timer');
    expect(html).toContain('Interaction');
  });
});

// ── Navigate wiring (with views) ─────────────────────────────────────

describe('navigate requirements with views', () => {
  function makeViews(): View[] {
    return [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
      { id: 'v3', name: 'Settings', blockIds: [] },
    ];
  }

  function mountPanelWithViews(): void {
    const state = initializeWizardState();
    state.views = makeViews();
    setWizardState(state);
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"><div class="sidebar-item-empty">None yet</div></div>
      </div>
    `;
    wireRequirementsPanel();
  }

  function openNavForm(navType: string): void {
    document.getElementById('req-add-btn')!.click();
    const typeSelect = document.getElementById('req-type-select') as HTMLSelectElement;
    typeSelect.value = 'navigate';
    typeSelect.dispatchEvent(new Event('change'));
    if (navType !== 'direct') {
      const navTypeSelect = document.getElementById('req-nav-type-select') as HTMLSelectElement;
      navTypeSelect.value = navType;
      navTypeSelect.dispatchEvent(new Event('change'));
    }
  }

  beforeEach(() => {
    localStorage.clear();
  });

  // ── Direct Link ──

  it('Direct Link: save enables when both views selected', () => {
    mountPanelWithViews();
    openNavForm('direct');

    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    const from = document.getElementById('req-nav-from') as HTMLSelectElement;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement;
    from.value = 'v1';
    from.dispatchEvent(new Event('change'));
    expect(saveBtn.disabled).toBe(true); // still need "to"

    to.value = 'v2';
    to.dispatchEvent(new Event('change'));
    expect(saveBtn.disabled).toBe(false);
  });

  it('Direct Link: saves with view IDs', () => {
    mountPanelWithViews();
    openNavForm('direct');

    const from = document.getElementById('req-nav-from') as HTMLSelectElement;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement;
    from.value = 'v1';
    from.dispatchEvent(new Event('change'));
    to.value = 'v2';
    to.dispatchEvent(new Event('change'));
    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const req = getWizardState().requirements[0];
    expect(req.type).toBe('navigate');
    expect(req.navType).toBe('direct');
    expect(req.fromView).toBe('v1');
    expect(req.toView).toBe('v2');
  });

  // ── Navigation Menu ──

  it('Menu: save enables with include-all (default) and at least one visible-on', () => {
    mountPanelWithViews();
    openNavForm('menu');

    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    // Include all is checked, all visible-on are checked by default
    expect(saveBtn.disabled).toBe(false);
  });

  it('Menu: unchecking include-all shows manual checkbox list', () => {
    mountPanelWithViews();
    openNavForm('menu');

    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(document.getElementById('menu-items-preview')!.style.display).toBe('none');
    expect(document.getElementById('menu-items-manual')!.style.display).not.toBe('none');
  });

  it('Menu: save disabled when include-all unchecked and no items selected', () => {
    mountPanelWithViews();
    openNavForm('menu');

    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    // Uncheck all menu items
    document.querySelectorAll('.menu-item-cb').forEach((cb) => {
      (cb as HTMLInputElement).checked = false;
      cb.dispatchEvent(new Event('change'));
    });

    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('Menu: saves with menuIncludeAllViews', () => {
    mountPanelWithViews();
    openNavForm('menu');

    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const req = getWizardState().requirements[0];
    expect(req.navType).toBe('menu');
    expect(req.menuIncludeAllViews).toBe(true);
    expect(req.menuItems).toBeUndefined();
  });

  it('Menu: saves manual items when include-all unchecked', () => {
    mountPanelWithViews();
    openNavForm('menu');

    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    // Uncheck the first menu item (Home)
    const cbs = document.querySelectorAll('.menu-item-cb') as NodeListOf<HTMLInputElement>;
    cbs[0].checked = false;
    cbs[0].dispatchEvent(new Event('change'));

    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const req = getWizardState().requirements[0];
    expect(req.menuIncludeAllViews).toBe(false);
    expect(req.menuItems).toEqual(['v2', 'v3']);
  });

  // ── Forward/Back ──

  it('Forward/Back: save enables when views exist', () => {
    mountPanelWithViews();
    openNavForm('forward-back');

    const saveBtn = document.querySelector('.req-save-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('Forward/Back: saves page order and control type', () => {
    mountPanelWithViews();
    openNavForm('forward-back');

    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const req = getWizardState().requirements[0];
    expect(req.navType).toBe('forward-back');
    expect(req.pageOrder).toEqual(['v1', 'v2', 'v3']);
    expect(req.navControlType).toBe('arrows');
  });

  it('Forward/Back: reorder buttons swap items', () => {
    mountPanelWithViews();
    openNavForm('forward-back');

    // Move second item (Profile) up
    const downBtns = document.querySelectorAll('.page-order-up');
    (downBtns[1] as HTMLElement).click(); // index 1 up button

    const items = document.querySelectorAll('#req-page-order .reorder-item');
    expect((items[0] as HTMLElement).dataset.viewId).toBe('v2');
    expect((items[1] as HTMLElement).dataset.viewId).toBe('v1');
    expect((items[2] as HTMLElement).dataset.viewId).toBe('v3');
  });

  it('Forward/Back: control type toggle shows/hides button text fields', () => {
    mountPanelWithViews();
    openNavForm('forward-back');

    const controlType = document.getElementById('req-nav-control-type') as HTMLSelectElement;
    const textRow = document.getElementById('req-nav-button-text-row')!;

    expect(textRow.style.display).toBe('none');

    controlType.value = 'buttons';
    controlType.dispatchEvent(new Event('change'));
    expect(textRow.style.display).toBe('grid');
  });

  it('Forward/Back: saves button text when control type is buttons', () => {
    mountPanelWithViews();
    openNavForm('forward-back');

    const controlType = document.getElementById('req-nav-control-type') as HTMLSelectElement;
    controlType.value = 'buttons';
    controlType.dispatchEvent(new Event('change'));

    (document.getElementById('req-nav-forward-text') as HTMLInputElement).value = 'Next';
    (document.getElementById('req-nav-back-text') as HTMLInputElement).value = 'Previous';

    (document.querySelector('.req-save-btn') as HTMLElement).click();

    const req = getWizardState().requirements[0];
    expect(req.navControlType).toBe('buttons');
    expect(req.buttonForwardText).toBe('Next');
    expect(req.buttonBackText).toBe('Previous');
  });

  // ── Edit round-trip ──

  it('editing a Direct Link pre-fills from/to views', () => {
    const state = initializeWizardState();
    state.views = makeViews();
    state.requirements = [
      { id: 'req-dl', type: 'navigate', navType: 'direct', fromView: 'v1', toView: 'v3' },
    ];
    setWizardState(state);
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">1</span>
        <div class="sidebar-items"></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"></div>
      </div>
    `;
    wireRequirementsPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();

    const from = document.getElementById('req-nav-from') as HTMLSelectElement;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement;
    expect(from.value).toBe('v1');
    expect(to.value).toBe('v3');
  });

  it('editing a Menu pre-fills include-all toggle and visible-on', () => {
    const state = initializeWizardState();
    state.views = makeViews();
    state.requirements = [
      {
        id: 'req-menu',
        type: 'navigate',
        navType: 'menu',
        menuIncludeAllViews: false,
        menuItems: ['v1', 'v2'],
      },
    ];
    setWizardState(state);
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderRequirementsPanel()}</div>
      <div class="sidebar-section" data-section="requirements">
        <span class="badge">1</span>
        <div class="sidebar-items"></div>
      </div>
      <div class="sidebar-section" data-section="data">
        <span class="badge">0</span>
        <div class="sidebar-items"></div>
      </div>
    `;
    wireRequirementsPanel();

    (document.querySelector('.req-edit-btn') as HTMLElement).click();

    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement;
    expect(toggle.checked).toBe(false);

    // Manual list should be visible
    expect(document.getElementById('menu-items-manual')!.style.display).not.toBe('none');

    const menuCbs = document.querySelectorAll('.menu-item-cb') as NodeListOf<HTMLInputElement>;
    expect(menuCbs[0].checked).toBe(true);  // v1
    expect(menuCbs[1].checked).toBe(true);  // v2
    expect(menuCbs[2].checked).toBe(false); // v3
  });

  // ── Include-all menu reflects current views ──

  it('menu with includeAllViews reflects views at render time', () => {
    const state = initializeWizardState();
    state.views = [
      { id: 'v1', name: 'Home', blockIds: [] },
      { id: 'v2', name: 'Profile', blockIds: [] },
    ];
    state.requirements = [
      { id: 'req-menu', type: 'navigate', navType: 'menu', menuIncludeAllViews: true },
    ];
    setWizardState(state);

    // Add a new view
    state.views.push({ id: 'v3', name: 'Settings', blockIds: [] });

    // Display text should show "all views" (derived, not stored)
    expect(getDisplayText(state.requirements[0])).toBe('Navigation menu: all views');
  });
});
