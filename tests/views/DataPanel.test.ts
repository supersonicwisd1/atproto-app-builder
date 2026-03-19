// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderDataPanel,
  wireDataPanel,
  getCompletionStatus,
} from '../../src/app/views/panels/DataPanel';
import {
  getWizardState,
  setWizardState,
  initializeWizardState,
} from '../../src/app/state/WizardState';
import type { RecordType } from '../../src/types/wizard';

// ── Helpers ────────────────────────────────────────────────────────────

function makeRecordType(overrides: Partial<RecordType> = {}): RecordType {
  return {
    id: `rt-${Date.now()}-${Math.random()}`,
    name: '',
    displayName: 'test type',
    description: '',
    fields: [],
    ...overrides,
  };
}

// ── Completion status ──────────────────────────────────────────────────

describe('getCompletionStatus', () => {
  it('returns "Name and fields needed" when both empty', () => {
    const rt = makeRecordType({ name: '', fields: [] });
    expect(getCompletionStatus(rt)).toBe('Name and fields needed');
  });

  it('returns "Lexicon name needed" when name empty but has fields', () => {
    const rt = makeRecordType({
      name: '',
      fields: [{ id: 'f1', name: 'title', type: 'string', required: true }],
    });
    expect(getCompletionStatus(rt)).toBe('Lexicon name needed');
  });

  it('returns "Fields needed" when name set but fields empty', () => {
    const rt = makeRecordType({ name: 'app.bsky.book', fields: [] });
    expect(getCompletionStatus(rt)).toBe('Fields needed');
  });

  it('returns "1 field" for singular', () => {
    const rt = makeRecordType({
      name: 'app.bsky.book',
      fields: [{ id: 'f1', name: 'title', type: 'string', required: true }],
    });
    expect(getCompletionStatus(rt)).toBe('1 field');
  });

  it('returns "3 fields" for plural', () => {
    const rt = makeRecordType({
      name: 'app.bsky.book',
      fields: [
        { id: 'f1', name: 'title', type: 'string', required: true },
        { id: 'f2', name: 'author', type: 'string', required: true },
        { id: 'f3', name: 'pages', type: 'string', required: false },
      ],
    });
    expect(getCompletionStatus(rt)).toBe('3 fields');
  });
});

// ── Rendering ──────────────────────────────────────────────────────────

describe('renderDataPanel', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
  });

  it('renders empty state when no record types exist', () => {
    const html = renderDataPanel();
    expect(html).toContain('empty-workspace');
    expect(html).toContain('Define the data your app works with.');
    expect(html).toContain('Data Interaction');
    expect(html).toContain('data-go-to-req-btn');
    expect(html).toContain('Go to Requirements');
    expect(html).not.toContain('item-grid');
  });

  it('renders card grid when record types exist', () => {
    const state = getWizardState();
    state.recordTypes = [
      makeRecordType({ id: 'rt-1', displayName: 'book' }),
      makeRecordType({ id: 'rt-2', displayName: 'grocery item' }),
    ];
    const html = renderDataPanel();
    expect(html).not.toContain('empty-workspace');
    expect(html).toContain('item-grid');
    expect(html).toContain('data-list');
    expect(html).toContain('book');
    expect(html).toContain('grocery item');
    expect(html).toContain('Lexicon record type');
  });

  it('renders cards with data-record-id attributes', () => {
    const state = getWizardState();
    state.recordTypes = [makeRecordType({ id: 'rt-abc' })];
    const html = renderDataPanel();
    expect(html).toContain('data-record-id="rt-abc"');
  });

  it('renders completion status on each card', () => {
    const state = getWizardState();
    state.recordTypes = [
      makeRecordType({ displayName: 'book', name: '', fields: [] }),
    ];
    const html = renderDataPanel();
    expect(html).toContain('Name and fields needed');
  });

  it('cards have no action buttons', () => {
    const state = getWizardState();
    state.recordTypes = [makeRecordType({ displayName: 'book' })];
    const html = renderDataPanel();
    expect(html).not.toContain('item-actions');
    expect(html).not.toContain('edit');
    expect(html).not.toContain('delete');
  });

  it('renders cards in creation order', () => {
    const state = getWizardState();
    state.recordTypes = [
      makeRecordType({ id: 'rt-1', displayName: 'alpha' }),
      makeRecordType({ id: 'rt-2', displayName: 'beta' }),
      makeRecordType({ id: 'rt-3', displayName: 'gamma' }),
    ];
    const html = renderDataPanel();
    const alphaIdx = html.indexOf('alpha');
    const betaIdx = html.indexOf('beta');
    const gammaIdx = html.indexOf('gamma');
    expect(alphaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(gammaIdx);
  });

  it('escapes HTML in displayName', () => {
    const state = getWizardState();
    state.recordTypes = [
      makeRecordType({ displayName: '<script>alert("xss")</script>' }),
    ];
    const html = renderDataPanel();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── DOM interaction ────────────────────────────────────────────────────

describe('wireDataPanel (DOM)', () => {
  beforeEach(() => {
    setWizardState(initializeWizardState());
  });

  function mountEmptyPanel(): void {
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderDataPanel()}</div>
      <div class="sidebar-header" data-target="requirements"></div>
    `;
    wireDataPanel();
  }

  function mountPanelWithCards(): void {
    const state = getWizardState();
    state.recordTypes = [
      makeRecordType({ id: 'rt-1', displayName: 'book' }),
      makeRecordType({ id: 'rt-2', displayName: 'grocery item' }),
    ];
    document.body.innerHTML = `
      <div id="workspace-panel-body">${renderDataPanel()}</div>
      <div class="sidebar-header" data-target="requirements"></div>
    `;
    wireDataPanel();
  }

  it('"Go to Requirements" button clicks the requirements sidebar header', () => {
    mountEmptyPanel();
    let clicked = false;
    const reqHeader = document.querySelector(
      '.sidebar-header[data-target="requirements"]',
    ) as HTMLElement;
    reqHeader.addEventListener('click', () => { clicked = true; });

    document.getElementById('data-go-to-req-btn')!.click();
    expect(clicked).toBe(true);
  });

  it('card grid renders two cards when two record types exist', () => {
    mountPanelWithCards();
    const cards = document.querySelectorAll('.item-card');
    expect(cards).toHaveLength(2);
  });

  it('cards display correct displayName and status', () => {
    mountPanelWithCards();
    const cards = document.querySelectorAll('.item-card');
    expect(cards[0].querySelector('.item-name')!.textContent).toBe('book');
    expect(cards[0].querySelector('.item-meta')!.textContent).toBe('Name and fields needed');
    expect(cards[1].querySelector('.item-name')!.textContent).toBe('grocery item');
  });

  it('re-rendering picks up fresh state', () => {
    mountEmptyPanel();
    expect(document.querySelector('.empty-workspace')).not.toBeNull();

    // Add a record type and re-render
    const state = getWizardState();
    state.recordTypes = [makeRecordType({ displayName: 'book' })];
    const body = document.getElementById('workspace-panel-body')!;
    body.innerHTML = renderDataPanel();
    wireDataPanel();

    expect(document.querySelector('.empty-workspace')).toBeNull();
    expect(document.querySelectorAll('.item-card')).toHaveLength(1);
  });
});
