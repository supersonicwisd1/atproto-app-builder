/**
 * App entry point generator
 */

import type { RecordType, AppConfig } from '../../types/wizard';
import { toPascalCase } from '../../utils';

export function generateAppTs(recordTypes: RecordType[], appConfig: AppConfig): string {
  const primaryRecord = recordTypes.find(r => r.name === appConfig.primaryRecordType) || recordTypes[0];
  const pascalName = toPascalCase(primaryRecord.name);

  return `import Store from './store';
import { NavigationManager } from './router';
import {
  createButton,
  showLoadingScreen,
  showLoginScreen,
  showAppScreen,
  showStatus,
} from './ui';
import {
  restoreSession,
  updateUserInfo,
  loadUserData,
} from './atproto/session';
import {
  initOAuthClient,
  signIn,
  signOut,
} from './atproto/auth';

declare global {
  interface Window {
    app: any;
  }
  var app: any;
}

window.app = {};
app.store = Store;

let navigationManager: NavigationManager;

initOAuthClient();

window.addEventListener('DOMContentLoaded', async () => {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));

  const isOAuthCallback =
    queryParams.has('code') ||
    queryParams.has('error') ||
    hashParams.has('code') ||
    hashParams.has('error');

  if (isOAuthCallback) {
    showLoadingScreen();
  }

  await initializeApp();

  document.getElementById('loginForm')!.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    const handleInput = document.getElementById('handleInput') as HTMLInputElement;
    const handle = handleInput.value.trim();

    if (!handle) {
      showStatus('loginStatus', 'Please enter your handle', true);
      return;
    }

    try {
      showStatus('loginStatus', 'Redirecting to sign in...');
      await signIn(handle);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showStatus('loginStatus', \`Login failed: \${errorMsg}\`, true);
    }
  });

  document.getElementById('logoutButton')!.addEventListener('click', async () => {
    try {
      await signOut();
      showLoginScreen();
      showStatus('loginStatus', 'Signed out successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showStatus('appStatus', \`Logout failed: \${errorMsg}\`, true);
    }
  });
});

async function initializeApp(): Promise<void> {
  const result = await restoreSession();

  if (result) {
    showAppScreen();
    updateUserInfo();
    await loadUserData();
    initializeMainMenu();

    if (result.state) {
      console.log(\`\${result.session.sub} was successfully authenticated\`);
    } else {
      console.log(\`\${result.session.sub} was restored\`);
    }
  } else {
    showLoginScreen();
  }
}

function initializeMainMenu(): void {
  navigationManager = new NavigationManager();

  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;

  menuContainer.innerHTML = '';

  const viewAllBtn = createButton('View All ${pascalName}s', 'primary', () => {
    navigationManager.showList();
  });

  const createNewBtn = createButton('Create New ${pascalName}', 'primary', () => {
    navigationManager.showForm(null);
  });

  menuContainer.appendChild(viewAllBtn);
  menuContainer.appendChild(createNewBtn);
}
`;
}
