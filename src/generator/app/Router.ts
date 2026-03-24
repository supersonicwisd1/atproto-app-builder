/**
 * Router generator
 *
 * Generates a Router class that switches between wizard-defined views.
 * Replaces the old hardcoded NavigationManager.
 */

import type { View } from '../../types/wizard';
import { toPascalCase, toCamelCase } from '../../utils';

interface ViewEntry {
  viewId: string;        // camelCase slug for use in router map
  fileName: string;      // PascalCase filename (without extension)
  functionName: string;  // render function name
}

/**
 * Generate the Router class file.
 */
export function generateRouterTs(viewEntries: ViewEntry[]): string {
  const imports = viewEntries
    .map(v => `import { ${v.functionName} } from './views/${v.fileName}';`)
    .join('\n');

  const mapEntries = viewEntries
    .map(v => `      ['${v.viewId}', { render: ${v.functionName} }]`)
    .join(',\n');

  return `/**
 * Router — switches between app views
 */

${imports}

export class Router {
  private activeViewId: string | null = null;
  private container: HTMLElement;
  private views: Map<string, { render: (container: HTMLElement, router: Router) => void }>;

  constructor() {
    this.container = document.getElementById('appContent')!;
    this.views = new Map([
${mapEntries}
    ]);
  }

  navigate(viewId: string): void {
    this.container.innerHTML = '';
    this.activeViewId = viewId;

    const view = this.views.get(viewId);
    if (view) {
      view.render(this.container, this);
    }
  }

  getActiveViewId(): string | null {
    return this.activeViewId;
  }
}
`;
}
