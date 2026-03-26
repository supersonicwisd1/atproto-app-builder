/**
 * PDS save controller — manages the save button UI and auto-save logic.
 *
 * Wires both the sidebar and accordion save buttons. Provides a debounced
 * triggerAutoSave() for use by panels and layout switching.
 */

import { saveProject } from './ProjectService';
import {
  getWizardState,
  getActiveProjectRkey,
  setActiveProjectRkey,
  setLastPdsSaveTimestamp,
  isLoggedIn,
  hasMeaningfulState,
} from '../state/WizardState';

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DEBOUNCE_MS = 1500;

/**
 * Show or hide the save buttons based on login state.
 * Call after login/logout and after workspace renders.
 */
export function updateSaveButtonVisibility(): void {
  const loggedIn = isLoggedIn();
  const sidebarSave = document.getElementById('sidebar-save');
  const accordionSave = document.getElementById('accordion-save');

  if (sidebarSave) sidebarSave.hidden = !loggedIn;
  if (accordionSave) accordionSave.hidden = !loggedIn;
}

/**
 * Wire click handlers on the save buttons. Call after workspace HTML is in DOM.
 */
export function wireSaveButtons(): void {
  document.getElementById('sidebar-save-btn')?.addEventListener('click', handleManualSave);
  document.getElementById('accordion-save-btn')?.addEventListener('click', handleManualSave);
}

/**
 * Trigger a debounced auto-save to PDS. Safe to call frequently —
 * only one save will fire after the debounce settles.
 */
export function triggerAutoSave(): void {
  if (!isLoggedIn()) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    executeSave(true);
  }, AUTO_SAVE_DEBOUNCE_MS);
}

async function handleManualSave(): Promise<void> {
  await executeSave(false);
}

async function executeSave(silent: boolean): Promise<void> {
  if (!isLoggedIn()) return;

  const state = getWizardState();
  if (!hasMeaningfulState(state)) return;

  setSaveState('saving');

  try {
    const rkey = await saveProject(state, getActiveProjectRkey());
    setActiveProjectRkey(rkey);
    setLastPdsSaveTimestamp(new Date().toISOString());
    setSaveState('success');

    // Revert to default after 2 seconds
    setTimeout(() => setSaveState('default'), 2000);
  } catch (err: any) {
    const message = err?.message || 'Save failed';
    setSaveState('error', message);

    if (!silent) {
      // Keep error visible longer for manual saves
      setTimeout(() => setSaveState('default'), 5000);
    } else {
      setTimeout(() => setSaveState('default'), 3000);
    }
  }
}

type SaveState = 'default' | 'saving' | 'success' | 'error';

function setSaveState(state: SaveState, message?: string): void {
  const buttons = [
    document.getElementById('sidebar-save-btn'),
    document.getElementById('accordion-save-btn'),
  ];
  const statuses = [
    document.getElementById('sidebar-save-status'),
    document.getElementById('accordion-save-status'),
  ];

  for (const btn of buttons) {
    if (!btn) continue;
    btn.classList.remove('sidebar-save-btn--saving', 'sidebar-save-btn--success', 'sidebar-save-btn--error');

    switch (state) {
      case 'default':
        btn.innerHTML = '<span class="save-icon">&#9729;</span> Save to PDS';
        break;
      case 'saving':
        btn.classList.add('sidebar-save-btn--saving');
        btn.innerHTML = 'Saving\u2026';
        break;
      case 'success':
        btn.classList.add('sidebar-save-btn--success');
        btn.innerHTML = 'Saved!';
        break;
      case 'error':
        btn.classList.add('sidebar-save-btn--error');
        btn.innerHTML = 'Save failed';
        break;
    }
  }

  for (const status of statuses) {
    if (!status) continue;
    switch (state) {
      case 'default':
        status.textContent = '';
        status.style.color = '';
        break;
      case 'saving':
        status.textContent = '';
        break;
      case 'success':
        status.textContent = 'Just now';
        status.style.color = '';
        break;
      case 'error':
        status.textContent = message || 'Check connection';
        status.style.color = 'var(--accent-red)';
        break;
    }
  }
}
