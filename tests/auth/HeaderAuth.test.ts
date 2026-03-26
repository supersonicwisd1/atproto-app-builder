// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AuthService before importing HeaderAuth
vi.mock('../../src/app/auth/AuthService', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  getUserProfile: vi.fn().mockResolvedValue({
    displayName: 'Alice',
    handle: 'alice.bsky.social',
    did: 'did:plc:abc123',
  }),
  getSession: vi.fn().mockReturnValue({ sub: 'did:plc:abc123' }),
}));

// Mock WizardState to avoid side effects
vi.mock('../../src/app/state/WizardState', () => ({
  setLoggedIn: vi.fn(),
}));

import {
  showSigningIn,
  showLoggedIn,
  showLoggedOut,
  showError,
  completeLogin,
  setOnLoggedOut,
} from '../../src/app/auth/HeaderAuth';
import { getUserProfile } from '../../src/app/auth/AuthService';

describe('HeaderAuth', () => {
  let nav: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `<nav class="menu-nav"><a href="#" class="login-btn" id="menu-login">Log in</a></nav>`;
    nav = document.querySelector('.menu-nav') as HTMLElement;
    vi.clearAllMocks();
  });

  describe('showSigningIn', () => {
    it('shows spinner and "Signing in…" text', () => {
      showSigningIn();
      expect(nav.querySelector('.spinner')).not.toBeNull();
      expect(nav.textContent).toContain('Signing in');
    });

    it('removes the login button', () => {
      showSigningIn();
      expect(nav.querySelector('#menu-login')).toBeNull();
    });
  });

  describe('showLoggedIn', () => {
    it('shows display name in the menu trigger', () => {
      showLoggedIn({ displayName: 'Alice', handle: 'alice.bsky.social', did: 'did:plc:abc123' });
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('Alice');
    });

    it('falls back to handle when no display name', () => {
      showLoggedIn({ displayName: '', handle: 'alice.bsky.social', did: 'did:plc:abc123' });
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('alice.bsky.social');
    });

    it('falls back to DID when no display name or handle', () => {
      showLoggedIn({ displayName: '', handle: '', did: 'did:plc:abc123' });
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('did:plc:abc123');
    });

    it('shows a dropdown with Log out and My Projects', () => {
      showLoggedIn({ displayName: 'Alice', handle: 'alice.bsky.social', did: 'did:plc:abc123' });
      const dropdown = nav.querySelector('.user-menu-dropdown');
      expect(dropdown).not.toBeNull();
      expect(nav.querySelector('#menu-logout')?.textContent).toBe('Log out');
      expect(nav.querySelector('#menu-my-projects')?.textContent).toBe('My Projects');
    });

    it('dropdown is initially hidden', () => {
      showLoggedIn({ displayName: 'Alice', handle: 'alice.bsky.social', did: 'did:plc:abc123' });
      const dropdown = nav.querySelector('#user-menu-dropdown') as HTMLElement;
      expect(dropdown.hidden).toBe(true);
    });

    it('escapes HTML in display name', () => {
      showLoggedIn({ displayName: '<script>alert("xss")</script>', handle: 'h', did: 'd' });
      expect(nav.innerHTML).not.toContain('<script>');
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('<script>alert("xss")</script>');
    });
  });

  describe('showLoggedOut', () => {
    it('shows the Log in link', () => {
      showLoggedIn({ displayName: 'Alice', handle: 'alice.bsky.social', did: 'did:plc:abc123' });
      showLoggedOut();
      const login = nav.querySelector('#menu-login') as HTMLElement;
      expect(login).not.toBeNull();
      expect(login.textContent).toBe('Log in');
    });

    it('calls the onLoggedOut callback', () => {
      const cb = vi.fn();
      setOnLoggedOut(cb);
      showLoggedOut();
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe('showError', () => {
    it('shows error message and login link', () => {
      showError('Login failed');
      expect(nav.querySelector('.header-auth-error')?.textContent).toBe('Login failed');
      expect(nav.querySelector('#menu-login')).not.toBeNull();
    });
  });

  describe('completeLogin', () => {
    it('fetches profile and shows logged-in state', async () => {
      await completeLogin();
      expect(getUserProfile).toHaveBeenCalled();
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('Alice');
    });

    it('shows fallback when getUserProfile throws', async () => {
      vi.mocked(getUserProfile).mockRejectedValueOnce(new Error('fail'));
      await completeLogin();
      // Falls back to unknown DID
      expect(nav.querySelector('.user-menu-trigger')?.textContent).toContain('unknown');
    });
  });
});
