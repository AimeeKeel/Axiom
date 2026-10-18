import { describe, it, expect, vi } from 'vitest';
import { PromptsHandler } from './handler.js';
import { mcpToolFooter } from '../tools/mcp-notes.js';
import type { Loader } from '../loader/types.js';
import { Logger, type Config } from '../config.js';
import { CLI_ONLY_BINARIES } from '../tools/binaries.js';

const mockLogger = new Logger({ mode: 'production', enableAppleDocs: false, logLevel: 'error' } satisfies Config);
const toolNames = ['axiom_xclog_launch', 'axiom_xclog_list'];

function handlerFor(content: string): PromptsHandler {
  const loader = {
    getCommand: vi.fn().mockResolvedValue({ name: 'console', description: 'Console', content }),
  } as unknown as Loader;
  return new PromptsHandler(loader, mockLogger, toolNames);
}

describe('PromptsHandler.getPrompt', () => {
  it('follows a command that names a wrapped subcommand with the MCP tool footer', async () => {
    const result = await handlerFor('Run `xclog launch <bundle-id>`.').getPrompt('console');

    expect(result.messages[0].content.text).toBe(`Run \`xclog launch <bundle-id>\`.\n\n---\n${mcpToolFooter('xclog launch', toolNames, CLI_ONLY_BINARIES)}`);
  });

  it('leaves a command that names no wrapped subcommand unchanged', async () => {
    const result = await handlerFor('Audit the project.').getPrompt('console');

    expect(result.messages[0].content.text).toBe('Audit the project.');
  });
});
