/**
 * Generate panel — workspace content for the Generate section.
 *
 * Collects app identity (name, domain, description, author), shows a review
 * summary of the user's work, and provides a Download ZIP button that
 * generates and downloads the AT Protocol app.
 */

import { getWizardState, saveWizardState } from '../../state/WizardState';
import { updateAccordionSummaries, isNarrowViewport } from '../WorkspaceLayout';
import { generateApp } from '../../export/OutputGenerator';
import { computeRecordTypeNsid, generateRecordLexicon } from '../../../generator/Lexicon';

// ── Helpers ───────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns true when at least one record type needs `appInfo.domain` for NSID
 * generation — i.e., it would fall through to the domain-based fallback in
 * `computeRecordTypeNsid`. When all record types have self-contained namespaces
 * (thelexfiles, byo-domain, or adopted), the domain field is unnecessary.
 */
export function isDomainNeeded(): boolean {
  const { recordTypes } = getWizardState();
  if (recordTypes.length === 0) return false;
  return recordTypes.some((rt) => {
    if (rt.source === 'adopted' && rt.adoptedNsid) return false;
    if (rt.namespaceOption === 'byo-domain' && rt.customDomain) return false;
    if (rt.namespaceOption === 'thelexfiles' && rt.lexUsername) return false;
    if (rt.namespaceOption === 'thelexfiles-temp' && rt.lexUsername) return false;
    return true;
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedUpdate(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateReviewSection();
    updateGenerateSidebar();
    updateAccordionSummaries();
    updateDownloadButtonState();
  }, 300);
}

// ── Render ────────────────────────────────────────────────────────────

export function renderGeneratePanel(): string {
  const { appInfo } = getWizardState();

  const desc = `<div class="workspace-desc">
    Configure your app's identity and download the generated AT Protocol application.
  </div>`;

  const appInfoSection = renderAppInfoSection(appInfo);
  const reviewSection = `<div id="generate-review-container">${renderReviewSection()}</div>`;
  const exportSection = renderExportSection();

  return desc + appInfoSection + reviewSection + exportSection;
}

function renderAppInfoSection(appInfo: { appName: string; domain: string; description: string; authorName: string }): string {
  const domainField = isDomainNeeded()
    ? `<div class="form-group">
    <label for="gen-domain">Domain <span class="required">*</span></label>
    <input type="text" id="gen-domain" placeholder="e.g., example.com"
      value="${escapeHtml(appInfo.domain)}">
    <div class="form-hint">
      Used for lexicon NSID generation (e.g., com.example.myRecord).
    </div>
  </div>`
    : '';

  return `<div class="generate-section">
  <h3 class="generate-section-title">App Identity</h3>
  <div class="form-group">
    <label for="gen-app-name">App Name <span class="required">*</span></label>
    <input type="text" id="gen-app-name" placeholder="e.g., My Cool App"
      value="${escapeHtml(appInfo.appName)}">
    <div class="form-hint">Used in package.json, page title, and ZIP filename.</div>
  </div>
  ${domainField}
  <div class="form-group">
    <label for="gen-description">Description</label>
    <textarea id="gen-description" rows="2"
      placeholder="A short description of your app">${escapeHtml(appInfo.description)}</textarea>
    <div class="form-hint">Appears in package.json and README.</div>
  </div>
  <div class="form-group">
    <label for="gen-author">Author</label>
    <input type="text" id="gen-author" placeholder="Your name"
      value="${escapeHtml(appInfo.authorName)}">
    <div class="form-hint">Appears in package.json and README.</div>
  </div>
</div>`;
}

function renderReviewSection(): string {
  const { recordTypes, views, blocks, requirements, appInfo } = getWizardState();
  const domain = appInfo.domain;

  // Record types with NSIDs
  let recordTypesValue: string;
  if (recordTypes.length === 0) {
    recordTypesValue = '0';
  } else {
    const items = recordTypes.map((rt) => {
      const nsid = domain
        ? computeRecordTypeNsid(rt, domain)
        : (rt.namespaceOption ? computeRecordTypeNsid(rt) : `[domain].${rt.name}`);
      return `${escapeHtml(rt.displayName || rt.name)} (${escapeHtml(nsid)})`;
    });
    recordTypesValue = `${recordTypes.length} &mdash; ${items.join(', ')}`;
  }

  // Lexicon previews
  let lexiconPreviews = '';
  if (recordTypes.length > 0) {
    lexiconPreviews = recordTypes.map((rt) => {
      const nsid = domain
        ? computeRecordTypeNsid(rt, domain)
        : (rt.namespaceOption ? computeRecordTypeNsid(rt) : `[domain].${rt.name}`);
      const lexicon = generateRecordLexicon(rt, domain || '', recordTypes);
      return `<details>
  <summary>${escapeHtml(nsid)}</summary>
  <pre class="wizard-code">${escapeHtml(JSON.stringify(lexicon, null, 2))}</pre>
</details>`;
    }).join('');
  }

  // Views
  const viewsValue = views.length === 0
    ? '0'
    : `${views.length} &mdash; ${views.map((v) => escapeHtml(v.name)).join(', ')}`;

  // Warning for no record types
  const warning = recordTypes.length === 0
    ? `<div class="generate-warning">
  No data types defined &mdash; your generated app will have no AT Protocol records.
  You can still generate, but the app won&rsquo;t do much.
</div>`
    : '';

  return `<div class="generate-section">
  <h3 class="generate-section-title">Review</h3>
  <div class="generate-review">
    <div class="generate-review-item">
      <div class="generate-review-label">Record Types</div>
      <div class="generate-review-value">${recordTypesValue}</div>
    </div>
    ${lexiconPreviews}
    <div class="generate-review-item">
      <div class="generate-review-label">Views</div>
      <div class="generate-review-value">${viewsValue}</div>
    </div>
    <div class="generate-review-item">
      <div class="generate-review-label">Blocks</div>
      <div class="generate-review-value">${blocks.length}</div>
    </div>
    <div class="generate-review-item">
      <div class="generate-review-label">Requirements</div>
      <div class="generate-review-value">${requirements.length}</div>
    </div>
  </div>
  ${warning}
</div>`;
}

function renderExportSection(): string {
  const { appInfo } = getWizardState();
  const needsDomain = isDomainNeeded();
  const disabled = !appInfo.appName.trim() || (needsDomain && !appInfo.domain.trim());

  return `<div class="generate-section">
  <h3 class="generate-section-title">Export</h3>
  <div class="generate-btn-wrapper">
    <button class="generate-btn" id="gen-download-btn"${disabled ? ' disabled' : ''}>
      Download ZIP
    </button>
    <div class="form-hint">
      Generates a complete AT Protocol app ready to run with npm install &amp;&amp; npm run dev.
    </div>
  </div>
</div>`;
}

// ── Wire ──────────────────────────────────────────────────────────────

export function wireGeneratePanel(): void {
  const appNameInput = document.getElementById('gen-app-name') as HTMLInputElement | null;
  const domainInput = document.getElementById('gen-domain') as HTMLInputElement | null;
  const descInput = document.getElementById('gen-description') as HTMLTextAreaElement | null;
  const authorInput = document.getElementById('gen-author') as HTMLInputElement | null;

  const persistAndUpdate = () => {
    const state = getWizardState();
    if (appNameInput) state.appInfo.appName = appNameInput.value;
    if (domainInput) state.appInfo.domain = domainInput.value;
    if (descInput) state.appInfo.description = descInput.value;
    if (authorInput) state.appInfo.authorName = authorInput.value;
    saveWizardState(state);
    debouncedUpdate();
  };

  appNameInput?.addEventListener('input', persistAndUpdate);
  domainInput?.addEventListener('input', persistAndUpdate);
  descInput?.addEventListener('input', persistAndUpdate);
  authorInput?.addEventListener('input', persistAndUpdate);

  // Download button
  const downloadBtn = document.getElementById('gen-download-btn') as HTMLButtonElement | null;
  downloadBtn?.addEventListener('click', handleDownload);
}

async function handleDownload(): Promise<void> {
  const btn = document.getElementById('gen-download-btn') as HTMLButtonElement | null;
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    const state = getWizardState();
    state.appConfig.outputMethod = 'zip';
    saveWizardState(state);

    await generateApp();

    // Mark as generated
    const updatedState = getWizardState();
    updatedState.hasGenerated = true;
    saveWizardState(updatedState);
    updateGenerateSidebar();
    updateAccordionSummaries();
  } catch {
    // ZipExporter handles its own error alert
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Download ZIP';
      updateDownloadButtonState();
    }
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────

export function updateGenerateSidebar(): void {
  const { appInfo, hasGenerated } = getWizardState();
  const section = document.querySelector(
    '.sidebar-section[data-section="generate"]',
  );
  if (!section) return;

  // has-items: set when user has successfully generated
  if (hasGenerated) {
    section.classList.add('has-items');
  } else {
    section.classList.remove('has-items');
  }

  // Update sidebar items
  const itemsContainer = section.querySelector('.sidebar-items');
  if (!itemsContainer) return;

  const appName = appInfo.appName.trim();
  if (appName) {
    itemsContainer.innerHTML =
      `<div class="sidebar-item"><span class="dot"></span> ${escapeHtml(appName)}</div>`;
  } else {
    itemsContainer.innerHTML =
      '<div class="sidebar-item-empty">Configure &amp; generate</div>';
  }
}

// ── Update helpers ───────────────────────────────────────────────────

function updateReviewSection(): void {
  const container = document.getElementById('generate-review-container');
  if (container) {
    container.innerHTML = renderReviewSection();
  }
}

function updateDownloadButtonState(): void {
  const btn = document.getElementById('gen-download-btn') as HTMLButtonElement | null;
  if (!btn) return;
  const { appInfo } = getWizardState();
  const needsDomain = isDomainNeeded();
  btn.disabled = !appInfo.appName.trim() || (needsDomain && !appInfo.domain.trim());
}

// ── Re-render ────────────────────────────────────────────────────────

function rerender(): void {
  const body = isNarrowViewport()
    ? document.querySelector('.accordion-section[data-section="generate"] .accordion-body')
    : document.getElementById('workspace-panel-body');

  if (body) {
    body.innerHTML = renderGeneratePanel();
    wireGeneratePanel();
  }

  updateGenerateSidebar();
  updateAccordionSummaries();
}

// Export rerender for external use if needed
export { rerender as rerenderGeneratePanel };
