// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

import {
  setLoggedIn,
  isLoggedIn,
  getActiveProjectRkey,
  setActiveProjectRkey,
  getLastPdsSaveTimestamp,
  setLastPdsSaveTimestamp,
  hasUnsavedPdsChanges,
  setWizardState,
  initializeWizardState,
  getWizardState,
  saveWizardState,
} from '../../src/app/state/WizardState';

describe('WizardState PDS tracking', () => {
  beforeEach(() => {
    setLoggedIn(false);
    setActiveProjectRkey(null);
    setLastPdsSaveTimestamp(null);
    setWizardState(initializeWizardState());
    localStorage.clear();
  });

  describe('login state', () => {
    it('defaults to not logged in', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('can be set to logged in', () => {
      setLoggedIn(true);
      expect(isLoggedIn()).toBe(true);
    });
  });

  describe('activeProjectRkey', () => {
    it('defaults to null', () => {
      expect(getActiveProjectRkey()).toBeNull();
    });

    it('can be set and retrieved', () => {
      setActiveProjectRkey('abc123');
      expect(getActiveProjectRkey()).toBe('abc123');
    });

    it('can be cleared back to null', () => {
      setActiveProjectRkey('abc123');
      setActiveProjectRkey(null);
      expect(getActiveProjectRkey()).toBeNull();
    });
  });

  describe('lastPdsSaveTimestamp', () => {
    it('defaults to null', () => {
      expect(getLastPdsSaveTimestamp()).toBeNull();
    });

    it('can be set and retrieved', () => {
      setLastPdsSaveTimestamp('2026-03-25T12:00:00.000Z');
      expect(getLastPdsSaveTimestamp()).toBe('2026-03-25T12:00:00.000Z');
    });
  });

  describe('hasUnsavedPdsChanges', () => {
    it('returns false when not logged in', () => {
      setLoggedIn(false);
      const state = getWizardState();
      state.appInfo.appName = 'Something meaningful';
      expect(hasUnsavedPdsChanges()).toBe(false);
    });

    it('returns false when logged in but state is empty (no meaningful data)', () => {
      setLoggedIn(true);
      // Fresh state has no meaningful data
      expect(hasUnsavedPdsChanges()).toBe(false);
    });

    it('returns true when logged in with meaningful state and never saved to PDS', () => {
      setLoggedIn(true);
      setLastPdsSaveTimestamp(null);
      const state = getWizardState();
      state.appInfo.appName = 'My App';
      expect(hasUnsavedPdsChanges()).toBe(true);
    });

    it('returns false when logged in and lastSaved equals PDS timestamp', () => {
      setLoggedIn(true);
      const state = getWizardState();
      state.appInfo.appName = 'My App';
      const ts = '2026-03-25T12:00:00.000Z';
      state.lastSaved = ts;
      setLastPdsSaveTimestamp(ts);
      expect(hasUnsavedPdsChanges()).toBe(false);
    });

    it('returns true when localStorage is newer than PDS save', () => {
      setLoggedIn(true);
      const state = getWizardState();
      state.appInfo.appName = 'My App';
      setLastPdsSaveTimestamp('2026-03-25T10:00:00.000Z');
      state.lastSaved = '2026-03-25T12:00:00.000Z';
      expect(hasUnsavedPdsChanges()).toBe(true);
    });

    it('returns false when PDS save is newer than localStorage', () => {
      setLoggedIn(true);
      const state = getWizardState();
      state.appInfo.appName = 'My App';
      setLastPdsSaveTimestamp('2026-03-25T14:00:00.000Z');
      state.lastSaved = '2026-03-25T12:00:00.000Z';
      expect(hasUnsavedPdsChanges()).toBe(false);
    });
  });

  describe('saveWizardState save feedback', () => {
    it('shows "Progress saved!" when logged out', () => {
      document.body.innerHTML = '<p id="wizard-progress-text">Step 1</p>';
      setLoggedIn(false);
      const state = getWizardState();
      saveWizardState(state);
      expect(document.getElementById('wizard-progress-text')!.textContent).toBe('Progress saved!');
    });

    it('does NOT show "Progress saved!" when logged in', () => {
      document.body.innerHTML = '<p id="wizard-progress-text">Step 1</p>';
      setLoggedIn(true);
      const state = getWizardState();
      saveWizardState(state);
      expect(document.getElementById('wizard-progress-text')!.textContent).toBe('Step 1');
    });
  });
});
