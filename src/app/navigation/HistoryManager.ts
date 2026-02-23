/**
 * Browser history management for wizard step navigation
 * Enables back/forward button support and URL-based step navigation
 */

import { getWizardState, saveWizardState } from '../state/WizardState';
import { collectCurrentStepData } from '../state/DataCollector';
import { renderCurrentStep } from '../views/StepRenderer';
import { updateProgressBar } from './StepNavigation';

const STEP_PARAM = 'step';

interface HistoryState {
  step: number;
}

/**
 * Get the step number from the current URL
 * Returns null if no step is specified in the URL
 */
export function getStepFromURL(): number | null {
  const params = new URLSearchParams(window.location.search);
  const stepParam = params.get(STEP_PARAM);

  if (stepParam !== null) {
    const step = parseInt(stepParam, 10);
    if (!isNaN(step) && step >= 0 && step <= 7) {
      return step;
    }
  }

  return null;
}

/**
 * Update the URL to reflect the current step
 * Uses replaceState for initial load, pushState for navigation
 */
export function updateURLForStep(step: number, replace: boolean = false): void {
  const url = new URL(window.location.href);
  url.searchParams.set(STEP_PARAM, step.toString());

  const historyState: HistoryState = { step };

  if (replace) {
    window.history.replaceState(historyState, '', url.toString());
  } else {
    window.history.pushState(historyState, '', url.toString());
  }
}

/**
 * Navigate to a specific step (used by popstate handler)
 * This bypasses validation since we're going back to a previously visited step
 */
function navigateToStep(step: number): void {
  const wizardState = getWizardState();

  // Collect data from current step before navigating away
  collectCurrentStepData();

  // Update wizard state
  wizardState.currentStep = step;
  saveWizardState(wizardState);

  // Render the new step
  renderCurrentStep();
  updateProgressBar();
  window.scrollTo(0, 0);
}

/**
 * Handle browser back/forward navigation
 */
function handlePopState(event: PopStateEvent): void {
  const state = event.state as HistoryState | null;

  if (state && typeof state.step === 'number') {
    navigateToStep(state.step);
  } else {
    // No state - try to get step from URL
    const urlStep = getStepFromURL();
    if (urlStep !== null) {
      navigateToStep(urlStep);
    } else {
      // Default to step 0
      navigateToStep(0);
    }
  }
}

/**
 * Initialize history management
 * Should be called once during app initialization
 */
export function initializeHistoryManager(): void {
  // Listen for browser back/forward navigation
  window.addEventListener('popstate', handlePopState);

  // Check if URL contains a step parameter and sync state
  const urlStep = getStepFromURL();
  const wizardState = getWizardState();

  if (urlStep !== null && urlStep !== wizardState.currentStep) {
    // URL has a step that differs from saved state - use URL step
    wizardState.currentStep = urlStep;
    saveWizardState(wizardState);
  }

  // Set initial history state (replace current state, don't push)
  updateURLForStep(wizardState.currentStep, true);
}

/**
 * Push a new step to browser history
 * Called when navigating via Next/Back buttons
 */
export function pushStepToHistory(step: number): void {
  updateURLForStep(step, false);
}
