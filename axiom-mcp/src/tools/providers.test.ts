import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createBinaryToolProviders } from './providers.js';
import { MCP_TOOL_NAMES } from './binaries.js';

describe(createBinaryToolProviders, () => {
  it('registers exactly the static tool names of each binary', () => {
    const providers = createBinaryToolProviders({ paths: { xcprof: '', xclog: '', xcsym: '' } });
    const registered = Object.fromEntries(Object.entries(providers).map(([binary, p]) => [binary, p.listTools().map((t) => t.name)]));
    expect(registered).toEqual(MCP_TOOL_NAMES);
  });
});

describe('modules root scripts load under bare-node type stripping', () => {
  // scripts/build-codex.ts, scripts/cursor/*.ts and pre-deploy import these as .ts; an import
  // of a sibling .js file resolves for tsc but not for node, and breaks every generator.
  it.each(['binaries.ts', 'mcp-notes.ts'])('%s imports nothing', (file) => {
    const source = readFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), 'utf-8');
    expect(source.match(/^\s*(?:import\b|export\s+\*|export\s+\{[^}]*\}\s+from\b).*$|\bimport\s*\(/gm)).toBeNull();
  });
});
