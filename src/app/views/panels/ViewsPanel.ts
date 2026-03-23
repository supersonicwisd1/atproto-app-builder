/**
 * Views panel — workspace content for the Views section.
 *
 * Views are the pages of the generated app. Each view holds an ordered list
 * of block ids. A block can belong to multiple views (multi-assignment).
 *
 * Panel states:
 *   A — Normal: view grid + unassigned blocks section
 *   B — Form open: inline form with chip-based block selector
 */

import { getWizardState, saveWizardState } from '../../state/WizardState';
import { generateId } from '../../../utils/id';
import { updateAccordionSummaries, isNarrowViewport, switchSection } from '../WorkspaceLayout';
import type { View, Block } from '../../../types/wizard';

// ── Module-level state ────────────────────────────────────────────────

let editingViewId: string | null = null;
let selectedBlockIds: string[] = [];

// ── Helpers ───────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function getUnassignedBlocks(): Block[] {
  const { views, blocks } = getWizardState();
  const assignedIds = new Set<string>();
  for (const view of views) {
    for (const bid of view.blockIds) {
      assignedIds.add(bid);
    }
  }
  return blocks.filter((b) => !assignedIds.has(b.id));
}

// ── Render ────────────────────────────────────────────────────────────

export function renderViewsPanel(): string {
  const { views, blocks } = getWizardState();

  const desc = `<div class="workspace-desc">
    Views are the pages of your app. Assign blocks to each view to define
    what content appears on each screen.
  </div>`;

  const addBtn = `<button class="add-btn" id="views-add-btn">+ New View</button>`;

  const formHtml = `<div class="inline-form" id="views-form" style="display:none;"></div>`;

  const gridHtml = views.length > 0
    ? `<div class="view-grid" id="views-grid">${views.map((v) => renderViewCard(v, views.length)).join('')}</div>`
    : '';

  const unassigned = getUnassignedBlocks();
  const unassignedHtml = unassigned.length > 0
    ? renderUnassignedSection(unassigned)
    : '';

  const nextStepHtml = `<div class="next-step">
  <div class="next-step-card" id="views-next-step" data-section="generate">
    <div>
      <div class="next-step-label">Final step</div>
      <div class="next-step-title">Generate your app</div>
    </div>
    <div class="next-step-arrow">&rarr;</div>
  </div>
</div>`;

  return desc + addBtn + formHtml + gridHtml + unassignedHtml + nextStepHtml;
}

function renderViewCard(view: View, totalViews: number): string {
  const { blocks } = getWizardState();
  const validBlocks = view.blockIds
    .map((id) => blocks.find((b) => b.id === id))
    .filter((b): b is Block => b !== undefined);

  const showReorder = validBlocks.length > 1;
  const showDelete = totalViews > 1;

  const blockItems = validBlocks.length > 0
    ? `<ul class="view-card-blocks">${validBlocks
        .map((block, i) => {
          const reorderHtml = showReorder
            ? `<span class="reorder-btns">
                <button class="view-reorder-up" data-view-id="${view.id}" data-block-index="${i}"
                  title="Move up"${i === 0 ? ' disabled' : ''}>&#9650;</button>
                <button class="view-reorder-down" data-view-id="${view.id}" data-block-index="${i}"
                  title="Move down"${i === validBlocks.length - 1 ? ' disabled' : ''}>&#9660;</button>
              </span>`
            : '';

          return `<li class="view-card-block">
            <span class="block-order">${i + 1}</span>
            <span>${escapeHtml(block.name)}</span>
            ${reorderHtml}
          </li>`;
        })
        .join('')}</ul>`
    : `<div class="view-card-empty">No blocks assigned</div>`;

  const deleteBtn = showDelete
    ? `<button class="view-delete-btn" data-view-id="${view.id}" title="Delete">&#10005;</button>`
    : '';

  return `<div class="view-card" data-view-id="${view.id}">
    <div class="view-card-header">
      <div class="view-card-name">${escapeHtml(view.name)}</div>
      <div class="view-card-actions">
        <button class="view-edit-btn" data-view-id="${view.id}" title="Edit">&#9998;</button>
        ${deleteBtn}
      </div>
    </div>
    ${blockItems}
  </div>`;
}

function renderUnassignedSection(unassigned: Block[]): string {
  const items = unassigned
    .map(
      (block) => `<li class="available-item">
        <span class="avail-text">${escapeHtml(block.name)}</span>
      </li>`,
    )
    .join('');

  return `<div class="unassigned-section" id="views-unassigned">
    <div class="available-list-label">
      Unassigned Blocks
      <span class="unassigned-count">&nbsp;&mdash; ${unassigned.length} remaining</span>
    </div>
    <div class="form-hint">
      These blocks haven&rsquo;t been placed on any view yet.
      Use &ldquo;+ New View&rdquo; above or edit an existing view to assign them.
    </div>
    <ul class="available-list">${items}</ul>
  </div>`;
}

function renderInlineForm(): string {
  const { blocks } = getWizardState();
  const view = editingViewId
    ? getWizardState().views.find((v) => v.id === editingViewId)
    : null;

  const nameValue = view ? escapeHtml(view.name) : '';

  // Build chips
  const chipsHtml = selectedBlockIds
    .map((bid, i) => {
      const block = blocks.find((b) => b.id === bid);
      if (!block) return '';
      return `<span class="chip" data-block-id="${bid}">
        <span class="chip-order">${i + 1}</span>
        ${escapeHtml(block.name)}
        <button class="chip-remove" data-block-id="${bid}">&#10005;</button>
      </span>`;
    })
    .join('');

  // Build available list — all blocks, mark selected
  let availItems: string;
  if (blocks.length === 0) {
    availItems = `<li class="available-item available-item-empty">
      <span class="avail-text">No blocks created yet. You can assign blocks to this view later.</span>
    </li>`;
  } else {
    availItems = blocks
      .map((block) => {
        const isSelected = selectedBlockIds.includes(block.id);
        return `<li class="available-item${isSelected ? ' selected' : ''}" data-block-id="${block.id}">
          <span class="avail-check"></span>
          <span class="avail-text">${escapeHtml(block.name)}</span>
        </li>`;
      })
      .join('');
  }

  return `
    <div class="form-group">
      <label for="view-name-input">View Name</label>
      <input type="text" id="view-name-input"
        placeholder="e.g., Home, Profile, Settings"
        value="${nameValue}">
      <div class="form-validation-msg" id="view-name-validation" style="display:none;"></div>
    </div>
    <div class="form-group">
      <label>Blocks</label>
      <div class="selected-chips" id="view-selected-chips">
        ${chipsHtml || '<span class="chips-placeholder">Click blocks below to add them</span>'}
      </div>
      <div class="form-hint">
        Selected blocks will appear on the view in the order shown. Click &#10005; to remove.
      </div>
      <div class="available-list-label">Available Blocks</div>
      <ul class="available-list" id="view-available-list">${availItems}</ul>
    </div>
    <div class="form-footer">
      <button class="btn-primary" id="view-save-btn" disabled>
        ${editingViewId ? 'Update View' : 'Save View'}
      </button>
      <button class="btn-ghost" id="view-cancel-btn">Cancel</button>
    </div>`;
}

// ── Wire ──────────────────────────────────────────────────────────────

export function wireViewsPanel(): void {
  // Add button
  const addBtn = document.getElementById('views-add-btn');
  addBtn?.addEventListener('click', openNewForm);

  // View card actions (delegation on grid)
  const grid = document.getElementById('views-grid');
  grid?.addEventListener('click', handleGridClick);

  // Next-step card → Generate
  const nextStep = document.getElementById('views-next-step');
  nextStep?.addEventListener('click', () => {
    switchSection('generate');
  });
}

function handleGridClick(e: Event): void {
  const target = e.target as HTMLElement;

  // Edit button
  const editBtn = target.closest('.view-edit-btn') as HTMLElement | null;
  if (editBtn) {
    openEditForm(editBtn.dataset.viewId!);
    return;
  }

  // Delete button
  const deleteBtn = target.closest('.view-delete-btn') as HTMLElement | null;
  if (deleteBtn) {
    deleteView(deleteBtn.dataset.viewId!);
    return;
  }

  // Reorder up
  const upBtn = target.closest('.view-reorder-up') as HTMLElement | null;
  if (upBtn && !(upBtn as HTMLButtonElement).disabled) {
    reorderBlock(upBtn.dataset.viewId!, parseInt(upBtn.dataset.blockIndex!, 10), -1);
    return;
  }

  // Reorder down
  const downBtn = target.closest('.view-reorder-down') as HTMLElement | null;
  if (downBtn && !(downBtn as HTMLButtonElement).disabled) {
    reorderBlock(downBtn.dataset.viewId!, parseInt(downBtn.dataset.blockIndex!, 10), 1);
    return;
  }
}

// ── Form operations ──────────────────────────────────────────────────

function openNewForm(): void {
  editingViewId = null;
  selectedBlockIds = [];
  showForm();
}

function openEditForm(viewId: string): void {
  const view = getWizardState().views.find((v) => v.id === viewId);
  if (!view) return;

  editingViewId = viewId;
  // Filter out deleted block ids
  const { blocks } = getWizardState();
  const validIds = new Set(blocks.map((b) => b.id));
  selectedBlockIds = view.blockIds.filter((id) => validIds.has(id));
  showForm();
}

function showForm(): void {
  const form = document.getElementById('views-form');
  if (!form) return;

  form.innerHTML = renderInlineForm();
  form.style.display = 'block';

  // Hide add button while form is open
  const addBtn = document.getElementById('views-add-btn');
  if (addBtn) addBtn.style.display = 'none';

  wireForm();
  updateSaveButtonState();

  // Focus the name input
  const nameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  nameInput?.focus();

  // Scroll form into view
  form.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
}

function hideForm(): void {
  const form = document.getElementById('views-form');
  if (form) {
    form.innerHTML = '';
    form.style.display = 'none';
  }

  // Show add button again
  const addBtn = document.getElementById('views-add-btn');
  if (addBtn) addBtn.style.display = '';

  editingViewId = null;
  selectedBlockIds = [];
}

function wireForm(): void {
  // Name input — update save button state
  const nameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  nameInput?.addEventListener('input', updateSaveButtonState);

  // Available list — click to toggle selection
  const availList = document.getElementById('view-available-list');
  availList?.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.available-item') as HTMLElement | null;
    if (!item || item.classList.contains('available-item-empty')) return;
    const blockId = item.dataset.blockId!;
    toggleBlockSelection(blockId);
  });

  // Chip remove buttons (delegation on chips container)
  const chipsContainer = document.getElementById('view-selected-chips');
  chipsContainer?.addEventListener('click', (e) => {
    const removeBtn = (e.target as HTMLElement).closest('.chip-remove') as HTMLElement | null;
    if (!removeBtn) return;
    const blockId = removeBtn.dataset.blockId!;
    toggleBlockSelection(blockId);
  });

  // Save button
  const saveBtn = document.getElementById('view-save-btn');
  saveBtn?.addEventListener('click', saveView);

  // Cancel button
  const cancelBtn = document.getElementById('view-cancel-btn');
  cancelBtn?.addEventListener('click', () => {
    hideForm();
  });
}

function toggleBlockSelection(blockId: string): void {
  const idx = selectedBlockIds.indexOf(blockId);
  if (idx >= 0) {
    selectedBlockIds.splice(idx, 1);
  } else {
    selectedBlockIds.push(blockId);
  }
  refreshFormContents();
}

function refreshFormContents(): void {
  const form = document.getElementById('views-form');
  if (!form) return;

  // Preserve name input value
  const nameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  const currentName = nameInput?.value ?? '';

  form.innerHTML = renderInlineForm();

  // Restore name
  const newNameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  if (newNameInput && currentName) {
    newNameInput.value = currentName;
  }

  wireForm();
  updateSaveButtonState();
}

function updateSaveButtonState(): void {
  const nameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  const saveBtn = document.getElementById('view-save-btn') as HTMLButtonElement | null;
  const validationMsg = document.getElementById('view-name-validation') as HTMLElement | null;
  if (!nameInput || !saveBtn) return;

  const name = nameInput.value.trim();
  const hasName = name.length > 0;

  // Check for duplicate name
  const { views } = getWizardState();
  const isDuplicate = hasName && views.some(
    (v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== editingViewId,
  );

  if (validationMsg) {
    if (isDuplicate) {
      validationMsg.textContent = 'A view with this name already exists. Each view needs a unique name.';
      validationMsg.style.display = 'block';
    } else {
      validationMsg.textContent = '';
      validationMsg.style.display = 'none';
    }
  }

  saveBtn.disabled = !hasName || isDuplicate;
}

// ── CRUD operations ──────────────────────────────────────────────────

function saveView(): void {
  const nameInput = document.getElementById('view-name-input') as HTMLInputElement | null;
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) return;

  // Check duplicate
  const state = getWizardState();
  const isDuplicate = state.views.some(
    (v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== editingViewId,
  );
  if (isDuplicate) return;

  if (editingViewId) {
    // Update existing view
    const view = state.views.find((v) => v.id === editingViewId);
    if (view) {
      view.name = name;
      view.blockIds = [...selectedBlockIds];
    }
  } else {
    // Create new view
    const view: View = {
      id: generateId(),
      name,
      blockIds: [...selectedBlockIds],
    };
    state.views.push(view);
  }

  saveWizardState(state);
  hideForm();
  rerender();
}

function deleteView(viewId: string): void {
  const state = getWizardState();
  if (state.views.length <= 1) return; // enforce minimum-1-view
  state.views = state.views.filter((v) => v.id !== viewId);
  saveWizardState(state);
  rerender();
}

function reorderBlock(viewId: string, index: number, direction: -1 | 1): void {
  const state = getWizardState();
  const view = state.views.find((v) => v.id === viewId);
  if (!view) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= view.blockIds.length) return;

  // Swap
  const temp = view.blockIds[index];
  view.blockIds[index] = view.blockIds[newIndex];
  view.blockIds[newIndex] = temp;

  saveWizardState(state);
  rerender();
}

// ── Sidebar ──────────────────────────────────────────────────────────

export function updateViewsSidebar(): void {
  const { views } = getWizardState();
  const section = document.querySelector(
    '.sidebar-section[data-section="views"]',
  );
  if (!section) return;

  // Update badge
  const badge = section.querySelector('.badge');
  if (badge) badge.textContent = String(views.length);

  // Update has-items state: filled when user has meaningfully engaged
  // (more than 1 view OR any view has blocks assigned)
  const hasEngaged =
    views.length > 1 || views.some((v) => v.blockIds.length > 0);
  if (hasEngaged) {
    section.classList.add('has-items');
  } else {
    section.classList.remove('has-items');
  }

  // Update sidebar items
  const itemsContainer = section.querySelector('.sidebar-items');
  if (!itemsContainer) return;

  if (views.length === 0) {
    itemsContainer.innerHTML =
      '<div class="sidebar-item-empty">None yet</div>';
  } else {
    itemsContainer.innerHTML = views
      .map(
        (v) =>
          `<div class="sidebar-item"><span class="dot"></span> ${escapeHtml(truncate(v.name, 25))}</div>`,
      )
      .join('');
  }
}

// ── Re-render ────────────────────────────────────────────────────────

function rerender(): void {
  const body = isNarrowViewport()
    ? document.querySelector('.accordion-section[data-section="views"] .accordion-body')
    : document.getElementById('workspace-panel-body');

  if (body) {
    body.innerHTML = renderViewsPanel();
    wireViewsPanel();
  }

  updateViewsSidebar();
  updateAccordionSummaries();
}
