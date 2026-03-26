/**
 * App name dialog — prompts the user to name their project before starting.
 *
 * Used when entering the wizard for the first time ("Get Started") and
 * when starting a new project from the project picker.
 */

/**
 * Show a dialog asking for the app name.
 * Returns the entered name, or null if cancelled.
 */
export function promptForAppName(): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'wizard-dialog';
    dialog.style.maxWidth = '420px';
    dialog.innerHTML = `<div class="dialog-content">
  <h2>Name your app</h2>
  <p>What are you building?</p>
  <input type="text" id="app-name-input" class="delete-confirm-input"
    style="border-color: var(--border-accent); margin-bottom: 1rem;"
    placeholder="e.g., My Recipe App">
  <div class="dialog-buttons">
    <button type="button" class="dialog-button" id="app-name-ok" disabled>Let\u2019s go</button>
  </div>
  <button type="button" class="dialog-cancel" id="app-name-cancel">Cancel</button>
</div>`;

    document.body.appendChild(dialog);

    const input = dialog.querySelector('#app-name-input') as HTMLInputElement;
    const okBtn = dialog.querySelector('#app-name-ok') as HTMLButtonElement;
    const cancelBtn = dialog.querySelector('#app-name-cancel') as HTMLButtonElement;

    input.addEventListener('input', () => {
      okBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        dialog.close();
        dialog.remove();
        resolve(input.value.trim());
      }
    });

    okBtn.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      resolve(input.value.trim());
    });

    cancelBtn.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    });

    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
    });

    dialog.showModal();
    input.focus();
  });
}
