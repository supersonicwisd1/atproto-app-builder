/**
 * Data collection from wizard forms
 */

import { getWizardState } from './WizardState';

export function collectCurrentStepData(): void {
  const wizardState = getWizardState();

  switch (wizardState.currentStep) {
    case 6:
      collectStep6Data();
      break;
    case 7:
      collectStep7Data();
      break;
    // Steps 2-5 collect data through dialogs/events
  }
}

function collectStep6Data(): void {
  const wizardState = getWizardState();
  const primaryRecord = document.getElementById('primary-record') as HTMLSelectElement;
  const checkboxes = document.querySelectorAll('input[name="list-field"]:checked');

  if (primaryRecord) {
    wizardState.appConfig.primaryRecordType = primaryRecord.value;
  }
  wizardState.appConfig.listDisplayFields = Array.from(checkboxes).map(
    (cb) => (cb as HTMLInputElement).value
  );
}

function collectStep7Data(): void {
  const wizardState = getWizardState();
  const outputMethod = document.querySelector('input[name="output-method"]:checked') as HTMLInputElement;

  wizardState.appConfig.outputMethod = outputMethod
    ? (outputMethod.value as 'zip' | 'github')
    : 'zip';
}
