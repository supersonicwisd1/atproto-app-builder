import { signOut, getUserProfile } from './AuthService';
import type { UserProfile } from './AuthService';
import { setLoggedIn } from '../state/WizardState';

const menuNav = () => document.querySelector('.menu-nav') as HTMLElement | null;

let onLoggedOut: (() => void) | null = null;
let onLoggedIn: (() => void) | null = null;

export function showSigningIn(): void {
  const nav = menuNav();
  if (!nav) return;
  nav.innerHTML = `
    <span class="header-auth-status">
      <span class="spinner spinner--sm"></span>
      <span class="header-auth-text">Signing in\u2026</span>
    </span>
  `;
}

export function showLoggedIn(profile: UserProfile): void {
  const nav = menuNav();
  if (!nav) return;
  setLoggedIn(true);
  const name = profile.displayName || profile.handle || profile.did;
  nav.innerHTML = `
    <button class="user-menu-trigger" id="user-menu-trigger">${escapeHtml(name)}</button>
    <div class="user-menu-dropdown" id="user-menu-dropdown" hidden>
      <a href="#" class="user-menu-item" id="menu-my-projects">My Projects</a>
      <hr>
      <a href="#" class="user-menu-item" id="menu-logout">Log out</a>
    </div>
  `;
  setupUserMenu();
}

/** Register a callback to re-wire the login button after logout or error. */
export function setOnLoggedOut(cb: () => void): void {
  onLoggedOut = cb;
}

/** Register a callback for post-login actions (e.g., showing project picker). */
export function setOnLoggedIn(cb: () => void): void {
  onLoggedIn = cb;
}

export function showLoggedOut(): void {
  setLoggedIn(false);
  const nav = menuNav();
  if (!nav) return;
  nav.innerHTML = `<a href="#" class="login-btn" id="menu-login">Log in</a>`;
  onLoggedOut?.();
}

export function showError(message: string): void {
  const nav = menuNav();
  if (!nav) return;
  nav.innerHTML = `
    <span class="header-auth-error">${escapeHtml(message)}</span>
    <a href="#" class="login-btn" id="menu-login">Log in</a>
  `;
  const errorEl = nav.querySelector('.header-auth-error');
  if (errorEl) {
    setTimeout(() => errorEl.remove(), 4000);
  }
}

export async function completeLogin(): Promise<void> {
  try {
    const profile = await getUserProfile();
    showLoggedIn(profile);
  } catch {
    showLoggedIn({ displayName: '', handle: '', did: 'unknown' });
  }
  onLoggedIn?.();
}

async function handleLogout(e: Event): Promise<void> {
  e.preventDefault();
  closeUserMenu();
  try {
    await signOut();
  } catch {
    // Ignore revocation errors — clear UI regardless
  }
  showLoggedOut();
}

function setupUserMenu(): void {
  const trigger = document.getElementById('user-menu-trigger');
  const dropdown = document.getElementById('user-menu-dropdown');
  const logoutBtn = document.getElementById('menu-logout');
  const projectsBtn = document.getElementById('menu-my-projects');

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!dropdown) return;
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
  });

  logoutBtn?.addEventListener('click', handleLogout);

  projectsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeUserMenu();
    // Dispatch a custom event that the project picker dialog listens for
    document.dispatchEvent(new CustomEvent('open-project-picker'));
  });

  // Close on outside click
  document.addEventListener('click', closeUserMenu);
}

function closeUserMenu(): void {
  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown) dropdown.hidden = true;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
