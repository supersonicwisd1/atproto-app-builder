/**
 * Lexicon discovery — API client for Lexicon Garden search and schema resolution.
 *
 * Search: autocomplete via /api/autocomplete-nsid
 * Resolve: full schema via /xrpc/com.atproto.lexicon.resolveLexicon
 */

import type { LexiconSchema } from '../../types/generation';

const LEXICON_GARDEN_BASE = '/lexicon-garden';

export interface AutocompleteResult {
  type: string;
  label: string;
  did?: string;
  url?: string;
}

export interface ResolveResult {
  cid: string;
  uri: string;
  schema: LexiconSchema;
}

/**
 * Search for lexicons by name or NSID fragment.
 * Returns an array of autocomplete suggestions.
 */
export async function searchLexicons(
  query: string,
): Promise<AutocompleteResult[]> {
  const url = `${LEXICON_GARDEN_BASE}/api/autocomplete-nsid?q=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.suggestions ?? [];
}

/**
 * Resolve a full lexicon schema by NSID.
 * Tries Lexicon Garden first.
 */
export async function resolveLexicon(
  nsid: string,
): Promise<ResolveResult> {
  const url = `${LEXICON_GARDEN_BASE}/xrpc/com.atproto.lexicon.resolveLexicon?nsid=${encodeURIComponent(nsid)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Resolution failed: ${response.status}`);
  }

  return response.json();
}
