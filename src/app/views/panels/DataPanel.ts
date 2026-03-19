/**
 * Data panel — workspace content for the Data section.
 *
 * Displays RecordTypes (seeded from "do" requirements) as read-only cards in a grid.
 * When no data types exist, shows an empty state with a "Go to Requirements" button.
 *
 * Panel states:
 *   A — Empty (no RecordTypes): guidance + "Go to Requirements" button
 *   B — Has RecordTypes: description + card grid
 */

import { getWizardState } from '../../state/WizardState';
import type { RecordType } from '../../../types/wizard';

// ── Rendering ──────────────────────────────────────────────────────────

export function renderDataPanel(): string {
  const { recordTypes } = getWizardState();

  if (recordTypes.length === 0) {
    return renderEmptyState();
  }
  return renderCardGrid(recordTypes);
}

function renderEmptyState(): string {
  return `
    <div class="empty-workspace">
      <div class="empty-icon">&#9634;</div>
      <p>Define the data your app works with.</p>
      <p>Data types are created automatically when you add "Data Interaction"
      requirements. Go to the Requirements section to get started.</p>
      <button class="add-btn" id="data-go-to-req-btn">Go to Requirements</button>
    </div>
  `;
}

function renderCardGrid(recordTypes: RecordType[]): string {
  return `
    <p class="workspace-desc">
      Each data type will become a Lexicon record type in your app.
      Details and fields can be added in a future step.
    </p>

    <div class="item-grid" id="data-list">
      ${recordTypes.map(renderDataTypeCard).join('')}
    </div>
  `;
}

function renderDataTypeCard(rt: RecordType): string {
  return `
    <div class="item-card" data-record-id="${rt.id}">
      <div>
        <div class="item-name">${escapeHtml(rt.displayName)}</div>
        <div class="item-meta">${getCompletionStatus(rt)}</div>
      </div>
    </div>
  `;
}

// ── Completion status ──────────────────────────────────────────────────

export function getCompletionStatus(rt: RecordType): string {
  const hasName = rt.name.length > 0;
  const hasFields = rt.fields.length > 0;

  if (!hasName && !hasFields) return 'Name and fields needed';
  if (!hasName) return 'Lexicon name needed';
  if (!hasFields) return 'Fields needed';
  return `${rt.fields.length} field${rt.fields.length === 1 ? '' : 's'}`;
}

// ── HTML helpers ───────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Event wiring ───────────────────────────────────────────────────────

export function wireDataPanel(): void {
  const goToReqBtn = document.getElementById('data-go-to-req-btn');
  if (goToReqBtn) {
    goToReqBtn.addEventListener('click', () => {
      const reqHeader = document.querySelector(
        '.sidebar-header[data-target="requirements"]',
      ) as HTMLElement | null;
      if (reqHeader) reqHeader.click();
    });
  }
}
