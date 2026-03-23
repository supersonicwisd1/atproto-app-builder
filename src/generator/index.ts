/**
 * Main generator module - orchestrates all file generation
 */

import type { WizardState, AppConfig } from '../types/wizard';
import type { FileOutput } from '../types/generation';


// Config generators
import { generatePackageJson } from './config/PackageJson';
import { generateViteConfig } from './config/ViteConfig';
import { generateTsConfig } from './config/TsConfig';

// Template generators
import { generateIndexHtml } from './templates/IndexHtml';
import { generateStyles } from './templates/Styles';

// AT Protocol generators
import { generateAuthTs } from './atproto/Auth';
import { generateTypesTs } from './atproto/Types';
import { generateApiTs } from './atproto/Api';
import { generateSessionManagerTs } from './atproto/Session';

// App generators
import { generateAppTs } from './app/Main';
import { generateStoreTs } from './app/Store';
import { generateUITs } from './app/UI';
import { generateNavigationTs } from './app/Router';

// Component generators
import { generateListViewTs } from './components/RecordList';
import { generateDetailViewTs } from './components/RecordDetail';
import { generateFormViewTs } from './components/RecordForm';

// Other generators
import { generateRecordLexicon, computeRecordTypeNsid } from './Lexicon';
import { generateReadme } from './Readme';

export function generateAllFiles(wizardState: WizardState, appConfig: AppConfig): FileOutput {
  const files: FileOutput = {};
  const { appInfo, recordTypes } = wizardState;
  const domain = appInfo.domain;

  // Root files
  files['package.json'] = generatePackageJson(appInfo);
  files['vite.config.ts'] = generateViteConfig();
  files['tsconfig.json'] = generateTsConfig();
  files['index.html'] = generateIndexHtml(appInfo, recordTypes, appConfig);
  files['styles.css'] = generateStyles();

  // App entry and core
  files['src/main.ts'] = generateAppTs(recordTypes, appConfig);
  files['src/router.ts'] = generateNavigationTs(recordTypes, appConfig);
  files['src/store.ts'] = generateStoreTs(recordTypes);
  files['src/ui.ts'] = generateUITs();

  // AT Protocol layer
  files['src/atproto/auth.ts'] = generateAuthTs();
  files['src/atproto/types.ts'] = generateTypesTs(recordTypes, domain);
  files['src/atproto/api.ts'] = generateApiTs(recordTypes, domain);
  files['src/atproto/session.ts'] = generateSessionManagerTs(recordTypes);

  // Components
  files['src/components/RecordList.ts'] = generateListViewTs(recordTypes, appConfig);
  files['src/components/RecordDetail.ts'] = generateDetailViewTs(recordTypes, appConfig);
  files['src/components/RecordForm.ts'] = generateFormViewTs(recordTypes, appConfig);

  // Lexicons
  recordTypes.forEach(record => {
    const nsid = computeRecordTypeNsid(record, domain);
    const lexicon = generateRecordLexicon(record, domain, recordTypes);
    files[`lexicons/${nsid.replace(/\./g, '/')}.json`] = JSON.stringify(lexicon, null, 2);
  });

  // README
  files['README.md'] = generateReadme(appInfo, recordTypes, domain);

  return files;
}

// Re-export for use in views
export { generateRecordLexicon, computeRecordTypeNsid } from './Lexicon';
