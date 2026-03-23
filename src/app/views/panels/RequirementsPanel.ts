/**
 * Requirements panel — workspace content for the Requirements section.
 *
 * Renders an inline CRUD interface for three requirement types:
 * "know" (information), "do" (data interactions), and "navigate" (view navigation).
 *
 * Navigation has three subtypes selectable via a "Type of Navigation" dropdown:
 *   - Direct Link: from/to view dropdowns
 *   - Navigation Menu: checkbox lists for menu items and visibility
 *   - Forward/Back: page order list with up/down buttons + control type
 *
 * Panel states:
 *   A — Empty (no requirements): intro content + "Add Your First Requirement"
 *   B — Has requirements: description + add button + list + next-step card
 *   C — Form: inline form with Type dropdown + type-specific fields
 */

import { getWizardState, saveWizardState } from '../../state/WizardState';
import { generateId, makeSystemCreatedAtField } from '../../../utils/id';
import { updateAccordionSummaries } from '../WorkspaceLayout';
import type {
  Requirement,
  RequirementType,
  RecordType,
  NonDataElement,
  InteractionTarget,
  NavType,
  NavControlType,
  View,
} from '../../../types/wizard';

const MAX_REQUIREMENTS = 100;

// ── Rendering ──────────────────────────────────────────────────────────

export function renderRequirementsPanel(): string {
  const { requirements } = getWizardState();

  if (requirements.length === 0) {
    return renderEmptyState();
  }
  return renderListState(requirements);
}

function renderEmptyState(): string {
  return `
    <div class="empty-workspace">
      <div class="empty-icon">&#9634;</div>
      <h3>Build a Decentralized Web App</h3>
      <p>You're building an app where users log in with an identity they own
      and store data in a personal data server (PDS) they control.</p>
      <p><strong>Need inspiration?</strong></p>
      <ul style="list-style: none; padding: 0; text-align: left; display: inline-block;">
        <li style="margin-bottom: 0.5rem;">&#8226; A meditation tracker with sessions stored in your PDS</li>
        <li style="margin-bottom: 0.5rem;">&#8226; A grocery list shared with family members via PDS</li>
        <li style="margin-bottom: 0.5rem;">&#8226; An event planner tracking RSVPs and tasks in your PDS</li>
      </ul>
      <p>Start by defining what your app needs to do.</p>
      <button class="add-btn" id="req-add-btn">+ Add Your First Requirement</button>
    </div>
    <div id="req-form-area"></div>
  `;
}

function renderListState(requirements: Requirement[]): string {
  const atLimit = requirements.length >= MAX_REQUIREMENTS;
  const addBtnDisabled = atLimit ? ' disabled' : '';

  return `
    <p class="workspace-desc">Define what your app needs to do. Think about what users
    need to know, what data they interact with, and how they navigate between views.</p>
    <button class="add-btn" id="req-add-btn"${addBtnDisabled}>+ Add Requirement</button>
    <div id="req-form-area"></div>
    <div class="item-grid" id="req-list">
      ${requirements.map(renderRequirementItem).join('')}
    </div>
    <div class="next-step">
      <div class="next-step-card" id="req-next-step">
        <div>
          <div class="next-step-label">Next step</div>
          <div class="next-step-title">Define Data</div>
          <div class="next-step-desc">Create the record types and fields your app will use.</div>
        </div>
        <button class="next-step-btn">Continue <span class="next-step-arrow">&rarr;</span></button>
      </div>
    </div>
  `;
}

function renderRequirementItem(req: Requirement): string {
  return `
    <div class="item-card" data-req-id="${req.id}">
      <div>
        <div class="item-name">${escapeHtml(getDisplayText(req))}</div>
        <div class="item-meta">${getTypeLabel(req)}</div>
      </div>
      <div class="item-actions">
        <button class="req-edit-btn" data-req-id="${req.id}" aria-label="Edit requirement" title="Edit">&#9998;</button>
        <button class="req-delete-btn" data-req-id="${req.id}" aria-label="Delete requirement" title="Delete">&#10005;</button>
      </div>
    </div>
  `;
}

function getTypeLabel(req: Requirement): string {
  switch (req.type) {
    case 'know':
      return 'Information';
    case 'do':
      return 'Interaction';
    case 'navigate':
      switch (req.navType) {
        case 'menu':
          return 'Navigation Menu';
        case 'forward-back':
          return 'Forward/Back Navigation';
        default:
          return 'Direct Link';
      }
  }
}

// ── Inline form rendering ─────────────────────────────────────────────

function renderInlineForm(
  type: RequirementType,
  existing?: Requirement,
): string {
  const saveLabel = existing ? 'Save' : 'Add Requirement';
  const knowSelected = type === 'know' ? ' selected' : '';
  const doSelected = type === 'do' ? ' selected' : '';
  const navSelected = type === 'navigate' ? ' selected' : '';
  const typeDisabled = existing ? ' disabled' : '';

  return `
    <div class="inline-form open" id="req-form">
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <select id="req-type-select"${typeDisabled}>
            <option value="know"${knowSelected}>Information</option>
            <option value="do"${doSelected}>Interaction</option>
            <option value="navigate"${navSelected}>Navigation</option>
          </select>
        </div>
        <div class="form-group" id="req-header-right">
          ${renderHeaderRight(type, existing)}
        </div>
      </div>
      <div id="req-type-fields">
        ${renderTypeFields(type, existing)}
      </div>
      <div class="form-actions">
        <button class="btn-primary req-save-btn" disabled>${saveLabel}</button>
        <button class="btn-ghost req-cancel-btn">Cancel</button>
      </div>
    </div>
  `;
}

function renderHeaderRight(
  type: RequirementType,
  existing?: Requirement,
): string {
  if (type === 'navigate') {
    return renderNavTypeDropdown(existing);
  }
  if (type === 'do') {
    return renderDoTargetDropdown(existing);
  }
  return '';
}

function renderDoTargetDropdown(existing?: Requirement): string {
  const target = existing?.interactionTarget ?? 'data';
  const disabled = existing ? ' disabled' : '';
  return `
    <label>Target</label>
    <select id="req-do-target-select"${disabled}>
      <option value="data"${target === 'data' ? ' selected' : ''}>Data Type</option>
      <option value="element"${target === 'element' ? ' selected' : ''}>Widget</option>
    </select>
    <div class="form-hint"><strong>Data Type</strong> &mdash; stored info like posts, settings, or lists.
    <strong>Widget</strong> &mdash; interactive UI like a timer, calculator, or drawing canvas.</div>
  `;
}

function renderNavTypeDropdown(existing?: Requirement): string {
  const { requirements } = getWizardState();
  const hasForwardBack = requirements.some(
    (r) =>
      r.type === 'navigate' &&
      r.navType === 'forward-back' &&
      r.id !== editingId,
  );

  const navType = existing?.navType ?? 'direct';

  return `
    <label>Type of Navigation</label>
    <select id="req-nav-type-select">
      <option value="direct"${navType === 'direct' ? ' selected' : ''}>Direct Link</option>
      <option value="menu"${navType === 'menu' ? ' selected' : ''}>Navigation Menu</option>
      <option value="forward-back"${navType === 'forward-back' ? ' selected' : ''}${hasForwardBack ? ' disabled' : ''}>Forward/Back Buttons/Arrows</option>
    </select>
  `;
}

// ── Type-specific fields ──────────────────────────────────────────────

function renderTypeFields(
  type: RequirementType,
  existing?: Requirement,
): string {
  if (type === 'know') {
    const val = existing?.text ?? '';
    const content = existing?.content ?? '';
    return `
      <div class="form-group">
        <label>Description</label>
        <textarea id="req-know-text" placeholder="e.g. I need to know how this app works">${escapeHtml(val)}</textarea>
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea id="req-know-content" placeholder="e.g. An overview of features and how to get started">${escapeHtml(content)}</textarea>
      </div>
    `;
  }

  if (type === 'do') {
    const target = existing?.interactionTarget ?? 'data';
    return target === 'element'
      ? renderDoElementFields(existing)
      : renderDoDataFields(existing);
  }

  // navigate — render based on navType
  const navType = existing?.navType ?? 'direct';
  return renderNavSubtypeFields(navType, existing);
}

function renderDoDataFields(existing?: Requirement): string {
  const verb = existing?.verb ?? '';
  let dataValue = existing?.data ?? '';
  if (existing?.dataTypeId) {
    const { recordTypes } = getWizardState();
    const linked = recordTypes.find((r) => r.id === existing.dataTypeId);
    if (linked) dataValue = linked.displayName;
  }
  return `
    <div class="form-hint">As a user of the app, I need to&hellip;</div>
    <div class="form-row">
      <div class="form-group">
        <label>Verb</label>
        <input id="req-do-verb" placeholder="search, list, create, update, etc." value="${escapeAttr(verb)}">
      </div>
      <div class="form-group">
        <label>Data Type</label>
        <div class="combobox" id="req-do-data-combobox">
          <input id="req-do-data" placeholder="e.g., grocery item, book, appointment"
                 autocomplete="off" value="${escapeAttr(dataValue)}">
          <div class="combobox-dropdown" id="req-do-data-dropdown">
          </div>
        </div>
        <div class="form-hint">What kind of thing does this action work with? Select an
        existing type or enter a new one. Focus on the thing being acted on &mdash; if your
        action involves two things (like &ldquo;add an item to a list&rdquo;), the item is the
        data type. The list is a separate type you&rsquo;ll connect later.</div>
        <details class="guidance-details">
          <summary>Does your action involve two things?</summary>
          <div class="guidance-details-body">
            <p><em>&ldquo;I need to add an item to my grocery list&rdquo;</em> becomes:</p>
            <ul>
              <li>I need to <strong>add</strong> a <strong>grocery item</strong> <span class="guidance-muted">(the thing being acted on)</span></li>
              <li>I need to <strong>create</strong> a <strong>grocery list</strong> <span class="guidance-muted">(the container &mdash; a separate data type)</span></li>
            </ul>
            <p>Focus each requirement on one type of thing. You&rsquo;ll connect them in the Data section.</p>
          </div>
        </details>
      </div>
    </div>
  `;
}

function renderDoElementFields(existing?: Requirement): string {
  const verb = existing?.verb ?? '';
  let elementValue = '';
  if (existing?.elementId) {
    const { nonDataElements } = getWizardState();
    const linked = nonDataElements.find((e) => e.id === existing.elementId);
    if (linked) elementValue = linked.name;
  }
  let usesDataValue = '';
  if (existing?.usesDataTypeId) {
    const { recordTypes } = getWizardState();
    const linked = recordTypes.find((r) => r.id === existing.usesDataTypeId);
    if (linked) usesDataValue = linked.displayName;
  }
  return `
    <div class="form-hint">As a user of the app, I need to&hellip;</div>
    <div class="form-row">
      <div class="form-group">
        <label>Verb</label>
        <input id="req-do-verb" placeholder="set, start, stop, draw, etc." value="${escapeAttr(verb)}">
      </div>
      <div class="form-group">
        <label>Element</label>
        <div class="combobox" id="req-do-element-combobox">
          <input id="req-do-element" placeholder="e.g., timer, calculator, canvas"
                 autocomplete="off" value="${escapeAttr(elementValue)}">
          <div class="combobox-dropdown" id="req-do-element-dropdown">
          </div>
        </div>
        <div class="form-hint">Name the interactive element. Select an existing
        element or enter a new one.</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Uses data from <span class="label-optional">(optional)</span></label>
        <div class="combobox" id="req-uses-data-combobox">
          <input id="req-uses-data" placeholder="e.g., settings, preferences"
                 autocomplete="off" value="${escapeAttr(usesDataValue)}">
          <div class="combobox-dropdown" id="req-uses-data-dropdown">
          </div>
        </div>
        <div class="form-hint">Some elements need stored data to work. For example,
        a timer might use saved preferences to auto-configure.</div>
      </div>
    </div>
  `;
}

function renderNavSubtypeFields(
  navType: NavType,
  existing?: Requirement,
): string {
  const { views } = getWizardState();
  const hasViews = views.length > 0;

  if (navType === 'direct') {
    return renderDirectLinkFields(views, hasViews, existing);
  }
  if (navType === 'menu') {
    return renderMenuFields(views, hasViews, existing);
  }
  // forward-back
  return renderForwardBackFields(views, hasViews, existing);
}

function renderDirectLinkFields(
  views: View[],
  hasViews: boolean,
  existing?: Requirement,
): string {
  if (!hasViews) {
    return `
      <div class="form-hint nav-no-views-hint">Create some views first to set up direct links.</div>
      <div class="form-row">
        <div class="form-group">
          <label>From View</label>
          <select id="req-nav-from" disabled>
            <option disabled selected>No views yet</option>
          </select>
        </div>
        <div class="form-group">
          <label>To View</label>
          <select id="req-nav-to" disabled>
            <option disabled selected>No views yet</option>
          </select>
        </div>
      </div>
    `;
  }

  const fromView = existing?.fromView ?? '';
  const toView = existing?.toView ?? '';
  const viewOptions = (selected: string) =>
    views
      .map(
        (v) =>
          `<option value="${v.id}"${v.id === selected ? ' selected' : ''}>${escapeHtml(v.name)}</option>`,
      )
      .join('');

  return `
    <div class="form-row">
      <div class="form-group">
        <label>From View</label>
        <select id="req-nav-from">
          <option value=""${!fromView ? ' selected' : ''}>Select a view</option>
          ${viewOptions(fromView)}
        </select>
      </div>
      <div class="form-group">
        <label>To View</label>
        <select id="req-nav-to">
          <option value=""${!toView ? ' selected' : ''}>Select a view</option>
          ${viewOptions(toView)}
        </select>
      </div>
    </div>
  `;
}

function renderMenuFields(
  views: View[],
  hasViews: boolean,
  existing?: Requirement,
): string {
  if (!hasViews) {
    return `
      <div class="form-hint nav-no-views-hint">Create some views first to set up a navigation menu.</div>
      <div class="form-group">
        <label>Menu Items</label>
        <div class="checkbox-list-placeholder">No views yet</div>
      </div>
    `;
  }

  const label = existing?.menuLabel ?? '';
  const includeAll = existing?.menuIncludeAllViews !== false; // default true
  const checkedAttr = includeAll ? ' checked' : '';

  // Menu items: when manual, which views are checked
  const manualItems = new Set(existing?.menuItems ?? []);
  // When switching from "include all" to manual, all views start checked
  const allCheckedForManual = includeAll || manualItems.size === 0;

  const menuItemsCheckboxes = views
    .map((v) => {
      const checked = allCheckedForManual || manualItems.has(v.id) ? ' checked' : '';
      return `<label class="checkbox-item"><input type="checkbox" value="${v.id}" class="menu-item-cb"${checked}> ${escapeHtml(v.name)}</label>`;
    })
    .join('');

  // Preview of current views for "include all" mode
  const previewText = views.map((v) => v.name).join(', ');

  return `
    <div class="form-group">
      <label>Menu Name</label>
      <input id="req-menu-label" placeholder="e.g., Main Nav, Footer Links" value="${escapeAttr(label)}">
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" id="menu-include-all-views"${checkedAttr}>
        Include all views
      </label>
      <div class="form-hint">
        Menu items will automatically update when views are added, removed, or renamed.
      </div>
    </div>
    <div class="form-group" id="menu-items-preview"${!includeAll ? ' style="display:none"' : ''}>
      <label>Menu Items</label>
      <div class="nav-view-preview">Currently: ${escapeHtml(previewText)}</div>
    </div>
    <div class="form-group" id="menu-items-manual"${includeAll ? ' style="display:none"' : ''}>
      <label>Menu Items</label>
      <div class="checkbox-list">
        ${menuItemsCheckboxes}
      </div>
    </div>
  `;
}

function renderForwardBackFields(
  views: View[],
  hasViews: boolean,
  existing?: Requirement,
): string {
  const controlType = existing?.navControlType ?? 'arrows';
  const fwdText = existing?.buttonForwardText ?? '';
  const backText = existing?.buttonBackText ?? '';

  if (!hasViews) {
    return `
      <div class="form-hint nav-no-views-hint">Create some views first to set up forward/back navigation.</div>
      <div class="form-group">
        <label>Page Order</label>
        <div class="checkbox-list-placeholder">No views yet</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Control Type</label>
          <select id="req-nav-control-type" disabled>
            <option value="arrows">Arrows</option>
            <option value="buttons">Buttons</option>
          </select>
        </div>
      </div>
    `;
  }

  // Build ordered view list: preserve existing order, filter deleted, append new
  const orderedViews = buildPageOrder(views, existing?.pageOrder);

  const pageOrderItems = orderedViews
    .map(
      (v, i) => `
      <div class="reorder-item" data-view-id="${v.id}">
        <span class="reorder-item-name">${escapeHtml(v.name)}</span>
        <span class="reorder-btns">
          <button class="page-order-up" data-index="${i}"${i === 0 ? ' disabled' : ''} aria-label="Move up" title="Move up">&#9650;</button>
          <button class="page-order-down" data-index="${i}"${i === orderedViews.length - 1 ? ' disabled' : ''} aria-label="Move down" title="Move down">&#9660;</button>
        </span>
      </div>`,
    )
    .join('');

  return `
    <div class="form-group">
      <label>Page Order</label>
      <div class="reorder-list" id="req-page-order">
        ${pageOrderItems}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Control Type</label>
        <select id="req-nav-control-type">
          <option value="arrows"${controlType === 'arrows' ? ' selected' : ''}>Arrows</option>
          <option value="buttons"${controlType === 'buttons' ? ' selected' : ''}>Buttons</option>
        </select>
      </div>
    </div>
    <div class="form-row" id="req-nav-button-text-row" style="display:${controlType === 'buttons' ? 'grid' : 'none'}">
      <div class="form-group">
        <label>Forward Button Text</label>
        <input id="req-nav-forward-text" placeholder="Next" value="${escapeAttr(fwdText)}">
      </div>
      <div class="form-group">
        <label>Back Button Text</label>
        <input id="req-nav-back-text" placeholder="Previous" value="${escapeAttr(backText)}">
      </div>
    </div>
  `;
}

/** Build the page order: preserve existing order, filter deleted views, append new ones. */
function buildPageOrder(views: View[], storedOrder?: string[]): View[] {
  if (!storedOrder || storedOrder.length === 0) return views;
  const viewMap = new Map(views.map((v) => [v.id, v]));
  // Keep stored order for views that still exist
  const ordered: View[] = [];
  for (const id of storedOrder) {
    const v = viewMap.get(id);
    if (v) {
      ordered.push(v);
      viewMap.delete(id);
    }
  }
  // Append any new views not in the stored order
  for (const v of viewMap.values()) {
    ordered.push(v);
  }
  return ordered;
}

// ── Display text ───────────────────────────────────────────────────────

function viewName(id: string | undefined): string {
  if (!id) return '?';
  const { views } = getWizardState();
  const v = views.find((view) => view.id === id);
  return v ? v.name : '[deleted view]';
}

function menuItemsLabel(req: Requirement): string {
  if (req.menuIncludeAllViews !== false) return 'all views';
  const { views } = getWizardState();
  const names = (req.menuItems ?? [])
    .map((id) => views.find((v) => v.id === id)?.name)
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : '?';
}

export function getDisplayText(req: Requirement): string {
  switch (req.type) {
    case 'know':
      return `${req.text ?? ''}`;
    case 'do':
      if (req.interactionTarget === 'element') {
        const { nonDataElements } = getWizardState();
        const el = req.elementId
          ? nonDataElements.find((e) => e.id === req.elementId)
          : undefined;
        return `I need to ${req.verb ?? ''} the ${el?.name ?? req.data ?? ''}`;
      }
      return `I need to ${req.verb ?? ''} ${req.data ?? ''}`;
    case 'navigate':
      switch (req.navType) {
        case 'menu': {
          const name = req.menuLabel ? `${req.menuLabel}: ` : '';
          return `${name}Navigation menu: ${menuItemsLabel(req)}`;
        }
        case 'forward-back':
          return `Forward/back navigation (${req.navControlType === 'buttons' ? 'buttons' : 'arrows'})`;
        default:
          return `${viewName(req.fromView)} → ${viewName(req.toView)}`;
      }
  }
}

export function getSidebarText(req: Requirement): string {
  switch (req.type) {
    case 'know':
      return `Know: ${truncate(req.text ?? '', 30)}`;
    case 'do': {
      if (req.interactionTarget === 'element') {
        const { nonDataElements } = getWizardState();
        const el = req.elementId
          ? nonDataElements.find((e) => e.id === req.elementId)
          : undefined;
        return `Do: ${truncate((req.verb ?? '') + ' ' + (el?.name ?? req.data ?? ''), 30)}`;
      }
      return `Do: ${truncate((req.verb ?? '') + ' ' + (req.data ?? ''), 30)}`;
    }
    case 'navigate':
      switch (req.navType) {
        case 'menu':
          return `Nav: ${truncate(req.menuLabel || 'menu', 15)}, ${truncate(menuItemsLabel(req), 15)}`;
        case 'forward-back':
          return 'Nav: Fwd/Back';
        default:
          return `Nav: ${truncate(viewName(req.fromView), 12)} → ${truncate(viewName(req.toView), 12)}`;
      }
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ── HTML helpers ───────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Event wiring ───────────────────────────────────────────────────────

/** The ID of the requirement being edited, or null if adding new. */
let editingId: string | null = null;

/** Tracks the selected RecordType ID in the current combobox, or null for new type. */
let selectedDataTypeId: string | null = null;

/** Tracks the selected NonDataElement ID in the element combobox, or null for new element. */
let selectedElementId: string | null = null;

/** Tracks the selected RecordType ID in the "uses data from" combobox, or null for new/none. */
let selectedUsesDataTypeId: string | null = null;

export function wireRequirementsPanel(): void {
  editingId = null;

  wireAddButton();
  wireListButtons();
  wireNextStepButton();
}

function wireAddButton(): void {
  const addBtn = document.getElementById('req-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showForm());
  }
}

function wireListButtons(): void {
  document.querySelectorAll('.req-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.reqId!;
      startEdit(id);
    });
  });
  document.querySelectorAll('.req-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.reqId!;
      deleteRequirement(id);
    });
  });
}

function wireNextStepButton(): void {
  const nextStep = document.getElementById('req-next-step');
  if (nextStep) {
    nextStep.addEventListener('click', () => {
      const dataHeader = document.querySelector(
        '.sidebar-header[data-target="data"]',
      ) as HTMLElement | null;
      if (dataHeader) dataHeader.click();
    });
  }
}

// ── Form lifecycle ─────────────────────────────────────────────────────

function showForm(type?: RequirementType, existing?: Requirement): void {
  if (!existing) {
    editingId = null;
    selectedDataTypeId = null;
    selectedElementId = null;
    selectedUsesDataTypeId = null;
  } else {
    selectedDataTypeId = existing.dataTypeId ?? null;
    selectedElementId = existing.elementId ?? null;
    selectedUsesDataTypeId = existing.usesDataTypeId ?? null;
  }
  const formType = type ?? existing?.type ?? 'know';
  const area = document.getElementById('req-form-area');
  if (!area) return;
  area.innerHTML = renderInlineForm(formType, existing);

  wireTypeDropdown(existing);
  if (formType === 'navigate') {
    wireNavTypeDropdown(existing);
    wireNavSubtypeControls(existing?.navType ?? 'direct');
  }
  if (formType === 'do') {
    const target = existing?.interactionTarget ?? 'data';
    wireDoTargetDropdown(existing);
    if (target === 'element') {
      wireElementCombobox();
      wireUsesDataCombobox();
    } else {
      wireCombobox();
    }
  }
  wireFormValidation(formType);
  wireFormButtons();

  if (existing) {
    validateForm(formType);
  }

  const form = document.getElementById('req-form');
  if (form?.scrollIntoView) {
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function wireTypeDropdown(existing?: Requirement): void {
  const typeSelect = document.getElementById(
    'req-type-select',
  ) as HTMLSelectElement | null;
  if (!typeSelect) return;

  typeSelect.addEventListener('change', () => {
    const newType = typeSelect.value as RequirementType;

    // Re-render header right (Related View, Target, or Type of Navigation)
    const headerRight = document.getElementById('req-header-right');
    if (headerRight) {
      const prefill = existing?.type === newType ? existing : undefined;
      headerRight.innerHTML = renderHeaderRight(newType, prefill);
      if (newType === 'navigate') {
        wireNavTypeDropdown(prefill);
      }
      if (newType === 'do') {
        wireDoTargetDropdown(prefill);
      }
    }

    // Re-render type fields
    const fieldsArea = document.getElementById('req-type-fields');
    if (fieldsArea) {
      const prefill = existing?.type === newType ? existing : undefined;
      fieldsArea.innerHTML = renderTypeFields(newType, prefill);
      if (newType === 'navigate') {
        wireNavSubtypeControls(prefill?.navType ?? 'direct');
      }
      if (newType === 'do') {
        const target = prefill?.interactionTarget ?? 'data';
        if (target === 'element') {
          selectedElementId = prefill?.elementId ?? null;
          selectedUsesDataTypeId = prefill?.usesDataTypeId ?? null;
          wireElementCombobox();
          wireUsesDataCombobox();
        } else {
          selectedDataTypeId = prefill?.dataTypeId ?? null;
          wireCombobox();
        }
      }
    }

    wireFormValidation(newType);
    validateForm(newType);

    // Update save button text
    const saveBtn = document.querySelector('.req-save-btn');
    if (saveBtn && !editingId) {
      saveBtn.textContent = 'Add Requirement';
    }
  });
}

function wireNavTypeDropdown(existing?: Requirement): void {
  const navTypeSelect = document.getElementById(
    'req-nav-type-select',
  ) as HTMLSelectElement | null;
  if (!navTypeSelect) return;

  navTypeSelect.addEventListener('change', () => {
    const navType = navTypeSelect.value as NavType;
    const fieldsArea = document.getElementById('req-type-fields');
    if (!fieldsArea) return;

    const prefill = existing?.navType === navType ? existing : undefined;
    fieldsArea.innerHTML = renderNavSubtypeFields(navType, prefill);
    wireNavSubtypeControls(navType);

    wireFormValidation('navigate');
    validateForm('navigate');
  });
}

function wireNavSubtypeControls(navType: NavType): void {
  if (navType === 'direct') {
    wireDirectLinkSelects();
  } else if (navType === 'menu') {
    wireMenuControls();
  } else if (navType === 'forward-back') {
    wireForwardBackControls();
  }
}

function wireDirectLinkSelects(): void {
  const from = document.getElementById('req-nav-from') as HTMLSelectElement | null;
  const to = document.getElementById('req-nav-to') as HTMLSelectElement | null;
  if (from) from.addEventListener('change', () => validateForm('navigate'));
  if (to) to.addEventListener('change', () => validateForm('navigate'));
}

function wireMenuControls(): void {
  const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement | null;
  const preview = document.getElementById('menu-items-preview');
  const manual = document.getElementById('menu-items-manual');

  if (toggle) {
    toggle.addEventListener('change', () => {
      if (preview) preview.style.display = toggle.checked ? '' : 'none';
      if (manual) manual.style.display = toggle.checked ? 'none' : '';
      validateForm('navigate');
    });
  }

  // Checkbox list triggers validation
  document.querySelectorAll('.menu-item-cb').forEach((cb) => {
    cb.addEventListener('change', () => validateForm('navigate'));
  });
}

function wireForwardBackControls(): void {
  // Page order reorder buttons
  wirePageOrderButtons();

  // Control type toggles button text visibility
  const controlType = document.getElementById('req-nav-control-type') as HTMLSelectElement | null;
  const textRow = document.getElementById('req-nav-button-text-row');
  if (controlType) {
    controlType.addEventListener('change', () => {
      if (textRow) textRow.style.display = controlType.value === 'buttons' ? 'grid' : 'none';
      validateForm('navigate');
    });
  }
}

function wirePageOrderButtons(): void {
  const container = document.getElementById('req-page-order');
  if (!container) return;

  container.querySelectorAll('.page-order-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = parseInt((btn as HTMLElement).dataset.index ?? '0', 10);
      swapPageOrderItems(container, index, index - 1);
    });
  });
  container.querySelectorAll('.page-order-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = parseInt((btn as HTMLElement).dataset.index ?? '0', 10);
      swapPageOrderItems(container, index, index + 1);
    });
  });
}

function swapPageOrderItems(container: HTMLElement, fromIdx: number, toIdx: number): void {
  const items = container.querySelectorAll('.reorder-item');
  if (toIdx < 0 || toIdx >= items.length) return;

  const fromEl = items[fromIdx] as HTMLElement;
  const toEl = items[toIdx] as HTMLElement;

  // Swap DOM positions
  if (fromIdx < toIdx) {
    container.insertBefore(toEl, fromEl);
  } else {
    container.insertBefore(fromEl, toEl);
  }

  // Re-index and re-wire
  reindexPageOrder(container);
}

function reindexPageOrder(container: HTMLElement): void {
  const items = container.querySelectorAll('.reorder-item');
  items.forEach((item, i) => {
    const up = item.querySelector('.page-order-up') as HTMLButtonElement | null;
    const down = item.querySelector('.page-order-down') as HTMLButtonElement | null;
    if (up) {
      up.dataset.index = String(i);
      up.disabled = i === 0;
    }
    if (down) {
      down.dataset.index = String(i);
      down.disabled = i === items.length - 1;
    }
  });
  // Re-wire click handlers
  wirePageOrderButtons();
}

function wireDoTargetDropdown(existing?: Requirement): void {
  const targetSelect = document.getElementById(
    'req-do-target-select',
  ) as HTMLSelectElement | null;
  if (!targetSelect) return;

  targetSelect.addEventListener('change', () => {
    const target = targetSelect.value as InteractionTarget;
    const fieldsArea = document.getElementById('req-type-fields');
    if (!fieldsArea) return;

    // Preserve verb across target switch
    const verbEl = document.getElementById(
      'req-do-verb',
    ) as HTMLInputElement | null;
    const currentVerb = verbEl?.value ?? '';

    if (target === 'element') {
      selectedDataTypeId = null;
      selectedElementId = null;
      selectedUsesDataTypeId = null;
      fieldsArea.innerHTML = renderDoElementFields();
      wireElementCombobox();
      wireUsesDataCombobox();
    } else {
      selectedElementId = null;
      selectedUsesDataTypeId = null;
      selectedDataTypeId = null;
      fieldsArea.innerHTML = renderDoDataFields();
      wireCombobox();
    }

    // Restore verb
    const newVerbEl = document.getElementById(
      'req-do-verb',
    ) as HTMLInputElement | null;
    if (newVerbEl && currentVerb) {
      newVerbEl.value = currentVerb;
    }

    wireFormValidation('do');
    validateForm('do');
  });
}

// ── Combobox ────────────────────────────────────────────────────────────

function wireCombobox(): void {
  const input = document.getElementById(
    'req-do-data',
  ) as HTMLInputElement | null;
  const dropdown = document.getElementById('req-do-data-dropdown');
  if (!input || !dropdown) return;

  function updateDropdown(): void {
    const { recordTypes } = getWizardState();
    if (recordTypes.length === 0) {
      dropdown!.style.display = 'none';
      return;
    }

    const query = input!.value.trim().toLowerCase();
    const filtered = query
      ? recordTypes.filter((rt) => rt.displayName.toLowerCase().includes(query))
      : recordTypes;

    const exactMatch =
      query && recordTypes.some((rt) => rt.displayName.toLowerCase() === query);

    let html = filtered
      .map(
        (rt) =>
          `<div class="combobox-item" data-record-id="${rt.id}">${escapeHtml(rt.displayName)}</div>`,
      )
      .join('');

    if (query && !exactMatch) {
      html += `<div class="combobox-item combobox-create">Create &ldquo;${escapeHtml(input!.value.trim())}&rdquo;</div>`;
    }

    if (!html) {
      dropdown!.style.display = 'none';
      return;
    }

    dropdown!.innerHTML = html;
    dropdown!.style.display = 'block';

    // Wire click handlers on items
    dropdown!.querySelectorAll('.combobox-item').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent blur before click registers
        const el = item as HTMLElement;
        const recordId = el.dataset.recordId;
        if (recordId) {
          selectedDataTypeId = recordId;
          const rt = getWizardState().recordTypes.find(
            (r) => r.id === recordId,
          );
          if (rt) input!.value = rt.displayName;
        } else {
          // "Create" option — keep typed text, clear selection
          selectedDataTypeId = null;
        }
        dropdown!.style.display = 'none';
        validateForm('do');
      });
    });
  }

  input.addEventListener('focus', () => updateDropdown());
  input.addEventListener('input', () => {
    selectedDataTypeId = null;
    updateDropdown();
    validateForm('do');
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 150);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });
}

function wireElementCombobox(): void {
  const input = document.getElementById(
    'req-do-element',
  ) as HTMLInputElement | null;
  const dropdown = document.getElementById('req-do-element-dropdown');
  if (!input || !dropdown) return;

  function updateDropdown(): void {
    const { nonDataElements } = getWizardState();
    if (nonDataElements.length === 0) {
      dropdown!.style.display = 'none';
      return;
    }

    const query = input!.value.trim().toLowerCase();
    const filtered = query
      ? nonDataElements.filter((el) => el.name.toLowerCase().includes(query))
      : nonDataElements;

    const exactMatch =
      query && nonDataElements.some((el) => el.name.toLowerCase() === query);

    let html = filtered
      .map(
        (el) =>
          `<div class="combobox-item" data-element-id="${el.id}">${escapeHtml(el.name)}</div>`,
      )
      .join('');

    if (query && !exactMatch) {
      html += `<div class="combobox-item combobox-create">Create &ldquo;${escapeHtml(input!.value.trim())}&rdquo;</div>`;
    }

    if (!html) {
      dropdown!.style.display = 'none';
      return;
    }

    dropdown!.innerHTML = html;
    dropdown!.style.display = 'block';

    dropdown!.querySelectorAll('.combobox-item').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const el = item as HTMLElement;
        const elementId = el.dataset.elementId;
        if (elementId) {
          selectedElementId = elementId;
          const nde = getWizardState().nonDataElements.find(
            (n) => n.id === elementId,
          );
          if (nde) input!.value = nde.name;
        } else {
          selectedElementId = null;
        }
        dropdown!.style.display = 'none';
        validateForm('do');
      });
    });
  }

  input.addEventListener('focus', () => updateDropdown());
  input.addEventListener('input', () => {
    selectedElementId = null;
    updateDropdown();
    validateForm('do');
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 150);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });
}

function wireUsesDataCombobox(): void {
  const input = document.getElementById(
    'req-uses-data',
  ) as HTMLInputElement | null;
  const dropdown = document.getElementById('req-uses-data-dropdown');
  if (!input || !dropdown) return;

  function updateDropdown(): void {
    const { recordTypes } = getWizardState();
    if (recordTypes.length === 0) {
      dropdown!.style.display = 'none';
      return;
    }

    const query = input!.value.trim().toLowerCase();
    const filtered = query
      ? recordTypes.filter((rt) => rt.displayName.toLowerCase().includes(query))
      : recordTypes;

    const exactMatch =
      query && recordTypes.some((rt) => rt.displayName.toLowerCase() === query);

    let html = filtered
      .map(
        (rt) =>
          `<div class="combobox-item" data-record-id="${rt.id}">${escapeHtml(rt.displayName)}</div>`,
      )
      .join('');

    if (query && !exactMatch) {
      html += `<div class="combobox-item combobox-create">Create &ldquo;${escapeHtml(input!.value.trim())}&rdquo;</div>`;
    }

    if (!html) {
      dropdown!.style.display = 'none';
      return;
    }

    dropdown!.innerHTML = html;
    dropdown!.style.display = 'block';

    dropdown!.querySelectorAll('.combobox-item').forEach((item) => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const el = item as HTMLElement;
        const recordId = el.dataset.recordId;
        if (recordId) {
          selectedUsesDataTypeId = recordId;
          const rt = getWizardState().recordTypes.find(
            (r) => r.id === recordId,
          );
          if (rt) input!.value = rt.displayName;
        } else {
          selectedUsesDataTypeId = null;
        }
        dropdown!.style.display = 'none';
      });
    });
  }

  input.addEventListener('focus', () => updateDropdown());
  input.addEventListener('input', () => {
    selectedUsesDataTypeId = null;
    updateDropdown();
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 150);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });
}

function wireFormButtons(): void {
  const area = document.getElementById('req-form-area');
  if (!area) return;

  area.querySelectorAll('.req-cancel-btn').forEach((btn) => {
    btn.addEventListener('click', () => closeForm());
  });
  area.querySelectorAll('.req-save-btn').forEach((btn) => {
    btn.addEventListener('click', () => saveRequirement());
  });
}

function closeForm(): void {
  editingId = null;
  selectedDataTypeId = null;
  selectedElementId = null;
  selectedUsesDataTypeId = null;
  const area = document.getElementById('req-form-area');
  if (area) area.innerHTML = '';
}

function startEdit(id: string): void {
  const { requirements } = getWizardState();
  const req = requirements.find((r) => r.id === id);
  if (!req) return;
  editingId = id;
  showForm(req.type, req);
}

// ── Validation ─────────────────────────────────────────────────────────

function wireFormValidation(type: RequirementType): void {
  if (type === 'know') {
    const textarea = document.getElementById(
      'req-know-text',
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.addEventListener('input', () => validateForm(type));
    }
  } else if (type === 'do') {
    const verb = document.getElementById(
      'req-do-verb',
    ) as HTMLInputElement | null;
    // Data target
    const data = document.getElementById(
      'req-do-data',
    ) as HTMLInputElement | null;
    // Element target
    const element = document.getElementById(
      'req-do-element',
    ) as HTMLInputElement | null;
    if (verb) verb.addEventListener('input', () => validateForm(type));
    if (data) data.addEventListener('input', () => validateForm(type));
    if (element) element.addEventListener('input', () => validateForm(type));
  }
  // navigate: validation is wired in wireNavSubtypeControls
}

function validateForm(type: RequirementType): void {
  const saveBtn = document.querySelector(
    '.req-save-btn',
  ) as HTMLButtonElement | null;
  if (!saveBtn) return;

  let valid = false;
  if (type === 'know') {
    const textarea = document.getElementById(
      'req-know-text',
    ) as HTMLTextAreaElement | null;
    valid = (textarea?.value.trim().length ?? 0) > 0;
  } else if (type === 'do') {
    const verb = document.getElementById(
      'req-do-verb',
    ) as HTMLInputElement | null;
    const hasVerb = (verb?.value.trim().length ?? 0) > 0;
    // Check whichever target field exists
    const data = document.getElementById(
      'req-do-data',
    ) as HTMLInputElement | null;
    const element = document.getElementById(
      'req-do-element',
    ) as HTMLInputElement | null;
    const hasTarget = data
      ? (data.value.trim().length ?? 0) > 0
      : (element?.value.trim().length ?? 0) > 0;
    valid = hasVerb && hasTarget;
  } else if (type === 'navigate') {
    valid = validateNavigateForm();
  }

  saveBtn.disabled = !valid;
}

function validateNavigateForm(): boolean {
  const navTypeSelect = document.getElementById(
    'req-nav-type-select',
  ) as HTMLSelectElement | null;
  const navType = (navTypeSelect?.value ?? 'direct') as NavType;

  if (navType === 'direct') {
    const from = document.getElementById('req-nav-from') as HTMLSelectElement | null;
    const to = document.getElementById('req-nav-to') as HTMLSelectElement | null;
    return !!from?.value && !!to?.value;
  }

  if (navType === 'menu') {
    const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement | null;
    const includeAll = toggle?.checked ?? true;

    // Menu items: either include-all or at least one manual item checked
    if (includeAll) return true;
    const checked = document.querySelectorAll('.menu-item-cb:checked');
    return checked.length > 0;
  }

  // forward-back: valid when views exist (page order is always all views)
  const pageOrder = document.getElementById('req-page-order');
  const hasViews = pageOrder ? pageOrder.querySelectorAll('.reorder-item').length > 0 : false;
  const controlType = document.getElementById('req-nav-control-type') as HTMLSelectElement | null;
  return hasViews && !!controlType?.value;
}

// ── State mutations ────────────────────────────────────────────────────

function saveRequirement(): void {
  const typeSelect = document.getElementById(
    'req-type-select',
  ) as HTMLSelectElement | null;
  if (!typeSelect) return;
  const type = typeSelect.value as RequirementType;

  const wizardState = getWizardState();
  const req = buildRequirementFromForm(type, wizardState);
  if (!req) return;

  if (editingId) {
    const idx = wizardState.requirements.findIndex((r) => r.id === editingId);
    if (idx !== -1) {
      req.id = editingId;
      wizardState.requirements[idx] = req;
    }
  } else {
    wizardState.requirements.push(req);
  }

  saveWizardState(wizardState);
  closeForm();
  rerenderPanel();
}

function deleteRequirement(id: string): void {
  const wizardState = getWizardState();
  wizardState.requirements = wizardState.requirements.filter(
    (r) => r.id !== id,
  );
  saveWizardState(wizardState);
  rerenderPanel();
}

function buildRequirementFromForm(
  type: RequirementType,
  wizardState: import('../../../types/wizard').WizardState,
): Requirement | null {
  const base: Requirement = { id: generateId(), type };

  if (type === 'know') {
    const textarea = document.getElementById(
      'req-know-text',
    ) as HTMLTextAreaElement | null;
    const contentEl = document.getElementById(
      'req-know-content',
    ) as HTMLTextAreaElement | null;
    const text = textarea?.value.trim() ?? '';
    const content = contentEl?.value.trim() ?? '';
    if (!text) return null;
    base.text = text;
    if (content) base.content = content;
  } else if (type === 'do') {
    // Determine interaction target
    const targetSelect = document.getElementById(
      'req-do-target-select',
    ) as HTMLSelectElement | null;
    const target = (targetSelect?.value ?? 'data') as InteractionTarget;

    const verbEl = document.getElementById(
      'req-do-verb',
    ) as HTMLInputElement | null;
    const verb = verbEl?.value.trim() ?? '';
    if (!verb) return null;
    base.verb = verb;

    if (target === 'element') {
      base.interactionTarget = 'element';

      const elementEl = document.getElementById(
        'req-do-element',
      ) as HTMLInputElement | null;
      const elementName = elementEl?.value.trim() ?? '';
      if (!elementName) return null;
      base.data = elementName;

      // Resolve or create a NonDataElement
      const elementId = resolveOrCreateElement(elementName, wizardState);
      base.elementId = elementId;

      // Optional: "uses data from"
      const usesDataEl = document.getElementById(
        'req-uses-data',
      ) as HTMLInputElement | null;
      const usesDataName = usesDataEl?.value.trim() ?? '';
      if (usesDataName) {
        const usesDataTypeId = resolveOrCreateDataType(
          usesDataName,
          wizardState,
          selectedUsesDataTypeId,
        );
        base.usesDataTypeId = usesDataTypeId;
      }
    } else {
      base.interactionTarget = 'data';

      const dataEl = document.getElementById(
        'req-do-data',
      ) as HTMLInputElement | null;
      const data = dataEl?.value.trim() ?? '';
      if (!data) return null;
      base.data = data;

      // Resolve or create a RecordType for this data type
      const dataTypeId = resolveOrCreateDataType(data, wizardState);
      base.dataTypeId = dataTypeId;
    }
  } else {
    // navigate
    const navTypeSelect = document.getElementById(
      'req-nav-type-select',
    ) as HTMLSelectElement | null;
    const navType = (navTypeSelect?.value as NavType) ?? 'direct';
    base.navType = navType;

    if (navType === 'direct') {
      const from = document.getElementById('req-nav-from') as HTMLSelectElement | null;
      const to = document.getElementById('req-nav-to') as HTMLSelectElement | null;
      if (!from?.value || !to?.value) return null;
      base.fromView = from.value;
      base.toView = to.value;
    } else if (navType === 'menu') {
      const labelEl = document.getElementById('req-menu-label') as HTMLInputElement | null;
      const label = labelEl?.value.trim() ?? '';
      if (label) base.menuLabel = label;

      const toggle = document.getElementById('menu-include-all-views') as HTMLInputElement | null;
      const includeAll = toggle?.checked ?? true;
      base.menuIncludeAllViews = includeAll;

      if (!includeAll) {
        const checked = document.querySelectorAll('.menu-item-cb:checked');
        base.menuItems = Array.from(checked).map((cb) => (cb as HTMLInputElement).value);
        if (base.menuItems.length === 0) return null;
      }
    } else {
      // forward-back — read page order from DOM
      const items = document.querySelectorAll('#req-page-order .reorder-item');
      base.pageOrder = Array.from(items).map((el) => (el as HTMLElement).dataset.viewId!);
      if (base.pageOrder.length === 0) return null;

      const controlType = document.getElementById('req-nav-control-type') as HTMLSelectElement | null;
      base.navControlType = (controlType?.value as NavControlType) ?? 'arrows';

      if (base.navControlType === 'buttons') {
        const fwd = document.getElementById('req-nav-forward-text') as HTMLInputElement | null;
        const back = document.getElementById('req-nav-back-text') as HTMLInputElement | null;
        if (fwd?.value.trim()) base.buttonForwardText = fwd.value.trim();
        if (back?.value.trim()) base.buttonBackText = back.value.trim();
      }
    }
  }

  return base;
}

/**
 * Resolve the data type to an existing RecordType or create a new one.
 * Returns the RecordType ID.
 * When preselectedId is provided, it takes priority (used by "uses data from" combobox).
 */
function resolveOrCreateDataType(
  displayName: string,
  wizardState: import('../../../types/wizard').WizardState,
  preselectedId?: string | null,
): string {
  // 1. If user selected an existing type via the combobox, use it
  const selId =
    preselectedId !== undefined ? preselectedId : selectedDataTypeId;
  if (selId) {
    const existing = wizardState.recordTypes.find((r) => r.id === selId);
    if (existing) return existing.id;
  }

  // 2. Check for exact match by displayName (case-insensitive)
  const exactMatch = wizardState.recordTypes.find(
    (r) => r.displayName.toLowerCase() === displayName.toLowerCase(),
  );
  if (exactMatch) return exactMatch.id;

  // 3. Create a new RecordType
  const newType: RecordType = {
    id: generateId(),
    name: '',
    displayName: displayName.trim(),
    description: '',
    fields: [makeSystemCreatedAtField()],
    source: 'new',
  };
  wizardState.recordTypes.push(newType);
  return newType.id;
}

/**
 * Resolve the element to an existing NonDataElement or create a new one.
 * Returns the NonDataElement ID.
 */
function resolveOrCreateElement(
  name: string,
  wizardState: import('../../../types/wizard').WizardState,
): string {
  // 1. If user selected an existing element via the combobox, use it
  if (selectedElementId) {
    const existing = wizardState.nonDataElements.find(
      (e) => e.id === selectedElementId,
    );
    if (existing) return existing.id;
  }

  // 2. Check for exact match by name (case-insensitive)
  const exactMatch = wizardState.nonDataElements.find(
    (e) => e.name.toLowerCase() === name.toLowerCase(),
  );
  if (exactMatch) return exactMatch.id;

  // 3. Create a new NonDataElement
  const newElement: NonDataElement = {
    id: generateId(),
    name: name.trim(),
  };
  wizardState.nonDataElements.push(newElement);
  return newElement.id;
}

// ── Re-render ──────────────────────────────────────────────────────────

function rerenderPanel(): void {
  // Re-render into whichever container is visible (avoid duplicate IDs)
  const narrow =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 767px)').matches;

  if (narrow) {
    const accBody = document.querySelector(
      '.accordion-section[data-section="requirements"] .accordion-body',
    );
    if (accBody) accBody.innerHTML = renderRequirementsPanel();
  } else {
    const bodyEl = document.getElementById('workspace-panel-body');
    if (bodyEl) bodyEl.innerHTML = renderRequirementsPanel();
  }

  wireRequirementsPanel();
  updateSidebar();
  updateDataSidebar();
  updateAccordionSummaries();
}

export function updateSidebar(): void {
  const { requirements } = getWizardState();
  const section = document.querySelector(
    '.sidebar-section[data-section="requirements"]',
  );
  if (!section) return;

  // Update badge
  const badge = section.querySelector('.badge');
  if (badge) badge.textContent = String(requirements.length);

  // Update has-items class
  if (requirements.length > 0) {
    section.classList.add('has-items');
  } else {
    section.classList.remove('has-items');
  }

  // Update sidebar items
  const itemsContainer = section.querySelector('.sidebar-items');
  if (!itemsContainer) return;

  if (requirements.length === 0) {
    itemsContainer.innerHTML = '<div class="sidebar-item-empty">None yet</div>';
  } else {
    itemsContainer.innerHTML = requirements
      .map(
        (r) =>
          `<div class="sidebar-item">${escapeHtml(getSidebarText(r))}</div>`,
      )
      .join('');
  }
}

export function updateDataSidebar(): void {
  const { recordTypes } = getWizardState();
  const section = document.querySelector(
    '.sidebar-section[data-section="data"]',
  );
  if (!section) return;

  // Update badge
  const badge = section.querySelector('.badge');
  if (badge) badge.textContent = String(recordTypes.length);

  // Update has-items class
  if (recordTypes.length > 0) {
    section.classList.add('has-items');
  } else {
    section.classList.remove('has-items');
  }

  // Update sidebar items
  const itemsContainer = section.querySelector('.sidebar-items');
  if (!itemsContainer) return;

  if (recordTypes.length === 0) {
    itemsContainer.innerHTML = '<div class="sidebar-item-empty">None yet</div>';
  } else {
    itemsContainer.innerHTML = recordTypes
      .map(
        (rt) =>
          `<div class="sidebar-item">${escapeHtml(rt.displayName || rt.name)}</div>`,
      )
      .join('');
  }
}
