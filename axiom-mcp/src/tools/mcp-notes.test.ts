import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { mcpClientNoteMismatches, mcpToolFooter, stripMcpClientNotes } from './mcp-notes.js';
import { XclogTools } from './xclog.js';
import { XcsymTools } from './xcsym.js';
import { XcprofTools } from './xcprof.js';

const L = 'MCP-only clients:';

describe(mcpClientNoteMismatches, () => {
  const tools = [
    { name: 'axiom_demo_crash', inputSchema: { properties: { file: {}, format: {}, dsymPaths: {}, instruments: {} }, required: ['file'] } },
    { name: 'axiom_demo_verify', inputSchema: { properties: { file: {} }, required: ['file'] } },
  ];
  const implied = { demo: ['json', 'traceRoot'] };
  const crashNote = `${L} \`axiom_demo_crash\` with \`file\` and \`format: "summary"\`.`;

  it.each([
    ['nothing for an inline note that maps every flag', `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`file\`, \`format: "summary"\`).`, []],
    ['nothing for a note after a fence that maps every flag', `\`\`\`bash\ndemo crash --format=summary <file>\n\`\`\`\n${crashNote}`, []],
    ['nothing for a note a blank line after its fence', `\`\`\`bash\ndemo crash --format=summary <file>\n\`\`\`\n\n${crashNote}`, []],
    ['nothing for a tilde fence', `~~~\ndemo crash --format=summary <file>\n~~~\n${crashNote}`, []],
    ['nothing for a command after another on its line', `\`\`\`bash\ncommand -v demo && demo crash --format=summary <file>\n\`\`\`\n${crashNote}`, []],
    ['nothing for a flag the server always passes', `Run \`demo crash --json <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for a repeated flag that maps to a plural param', `Run \`demo crash --instrument A <file>\` (${L} \`axiom_demo_crash\` with \`file\`, \`instruments: ["A (x)"]\`).`, []],
    ['nothing for a wildcard tool family', `${L} use the \`axiom_demo_*\` tools.\n\nRun \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for a launch argv after --', `Run \`demo crash <file> -- /bin/app --flag\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for an unrelated env assignment', `\`\`\`bash\nX=1 demo crash --format=summary <file>\n\`\`\`\n${crashNote}`, []],
    ['nothing for a binary env var the note maps', `Run \`DEMO_DSYM_PATHS="$(mktemp -d)" demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`dsymPaths\`).`, []],
    ['nothing for a binary env var the server implies', `Run \`DEMO_TRACE_ROOT=/t demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for a flag the note deliberately leaves out', `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`file\` and no \`format\`).`, []],
    ['nothing for one note covering every table row of its tool', `| a | \`demo crash --format=summary <f>\` |\n| b | \`demo crash --dsym-paths /x <f>\` |\n${L} \`axiom_demo_crash\` with \`file\`, \`format\`, and \`dsymPaths\`.`, []],
    ['nothing for a note naming a tool outside the wrapped families', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n${L} \`axiom_get_agent\` with \`agent\`.`, []],
    ['nothing for a bare subcommand name another note covers', `Running \`demo crash\` is quick.\n\nRun \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for an indented note after an indented fence', `1. Crash it:\n   \`\`\`bash\n   demo crash --format=summary <file>\n   \`\`\`\n   ${crashNote}`, []],
    ['an instruction with no note of its own', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`). Then \`demo crash --format=full <file>\`.`,
      ['`demo crash --format=full <file>` has no MCP-only clients note']],
    ['a fenced command with no note', '```bash\ndemo verify <file>\n```\n', ['block with `demo verify <file>` has no MCP-only clients note']],
    ['a bare subcommand name no note covers', `Run \`demo verify\` first.\n\nRun \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo verify` has no MCP-only clients note naming `axiom_demo_verify`']],
    ['a note naming an unregistered tool', `Run \`demo crash <file>\` (${L} \`axiom_demo_frob\` with \`file\`).`,
      ['note names `axiom_demo_frob`, which the server does not register']],
    ['a note param the tool lacks', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`, \`path\`).`, ['note gives `axiom_demo_crash` `path`, which it lacks']],
    ['a deliberately omitted param the tool lacks', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\` and no \`path\`).`, ['note gives `axiom_demo_crash` `path`, which it lacks']],
    ['a note omitting a required input', `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`format: "summary"\`).`, ['note for `axiom_demo_crash` omits required `file`']],
    ['a required input marked as left out', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with no \`file\`).`, ['note for `axiom_demo_crash` omits required `file`']],
    ['a CLI flag the note leaves out', `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo crash --format=summary <file>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a CLI flag no param backs', `Run \`demo crash --human <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo crash --human <file>` passes `--human`, which `axiom_demo_crash` has no param for']],
    ['a binary env var the note leaves out', `Run \`DEMO_DSYM_PATHS=/x demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`DEMO_DSYM_PATHS=/x demo crash <file>` sets `DEMO_DSYM_PATHS`; its note for `axiom_demo_crash` omits `dsymPaths`']],
    ['a note for another subcommand\'s tool', `Run \`demo verify <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo verify <file>` is followed by a note for `axiom_demo_crash`; expected `axiom_demo_verify`']],
    ['a block whose commands outnumber its note', `\`\`\`bash\ndemo crash <a>\ndemo verify <b>\n\`\`\`\n${crashNote}`, ['note after a block of 2 commands lists 1 tool']],
    ['a flag on a continuation line the note leaves out', `\`\`\`bash\ndemo crash <file> \\\n  --format summary\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash <file> --format summary` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a flag in a fence whose outer opener is wider than an inner one', `\`\`\`\`md\ndemo crash --format=summary <file>\n\`\`\`bash\nx\n\`\`\`\n\`\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash --format=summary <file>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a line note that follows no command', `Some prose.\n${L} \`axiom_demo_crash\` with \`file\`.`, ['note for `axiom_demo_crash` follows no command']],
  ] as const)('reports %s', (_case, text, expected) => {
    expect(mcpClientNoteMismatches(text, tools, implied)).toEqual(expected);
  });
});

describe(stripMcpClientNotes, () => {
  it.each([
    ['inline and line notes, leaving the CLI text byte-identical',
      `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n\n\`\`\`bash\ndemo verify <file>\n\`\`\`\n${L} \`axiom_demo_verify\` with \`file\`.\n\nNext.\n`,
      'Run `demo crash <file>`.\n\n```bash\ndemo verify <file>\n```\n\nNext.\n'],
    ['a note that is its own paragraph, with one of its blank lines', `A.\n\n${L} skip this.\n\nB.\n`, 'A.\n\nB.\n'],
    ['an inline note whose value holds a parenthesis', `Run \`demo x\` (${L} \`axiom_demo_crash\` with \`instruments: ["A (x)"]\`).`, 'Run `demo x`.'],
    ['an indented note inside a list item', `1. Step\n   \`\`\`\n   demo crash\n   \`\`\`\n   ${L} \`axiom_demo_crash\` with \`file\`.\n2. Next\n`, '1. Step\n   ```\n   demo crash\n   ```\n2. Next\n'],
  ])('removes %s', (_case, text, expected) => {
    expect(stripMcpClientNotes(text)).toBe(expected);
  });
});

describe(mcpToolFooter, () => {
  const toolNames = ['axiom_xclog_launch', 'axiom_xcsym_crash', 'axiom_xcsym_find_dsym', 'axiom_xcprof_record'];
  const tail = 'Call the tool instead of a shell command, pass each flag as its camelCase input (FLAG; the server sets any flag with no matching input itself), and pass files as absolute paths: the tools read no stdin or environment variables.';

  it.each([
    ['nothing when no wrapped subcommand is named', 'Read `pattern_tag` from xcsym output.', ''],
    ['one binary, with its own examples', 'Run `xcsym find-dsym <uuid>`.',
      `**Axiom MCP tools** – Each \`xcsym\` subcommand above is the MCP tool \`axiom_xcsym_<subcommand>\`, with hyphens as underscores (\`xcsym find-dsym\` → \`axiom_xcsym_find_dsym\`); your client may show it with a server prefix, such as \`mcp__axiom__axiom_xcsym_find_dsym\`. ${tail.replace('FLAG', '`--dsym-paths` → `dsymPaths`')}`],
    ['every binary named, in a serial list', 'Run `xcprof record`, then `xclog launch`, then `xcsym crash`.',
      `**Axiom MCP tools** – Each \`xclog\`, \`xcsym\`, and \`xcprof\` subcommand above is the MCP tool \`axiom_<binary>_<subcommand>\`, with hyphens as underscores (\`xcprof record\` → \`axiom_xcprof_record\`); your client may show it with a server prefix, such as \`mcp__axiom__axiom_xcprof_record\`. ${tail.replace('FLAG', '`--time-limit` → `timeLimit`')}`],
    ['nothing for a subcommand inside a longer word', 'See `xcsym crash-report` docs.', ''],
  ])('returns %s', (_case, text, expected) => {
    expect(mcpToolFooter(text, toolNames)).toBe(expected);
  });
});

describe('MCP-only clients notes in served agents, commands and inline auditors', () => {
  // axiom_get_agent, prompts/get and axiom_read_skill serve this text unchanged, and an
  // MCP-only client has the axiom_xc* tools but not the CLIs.
  it('finds no mismatch with the live MCP tool schemas', async () => {
    const pluginDir = fileURLToPath(new URL('../../../.claude-plugin/plugins/axiom', import.meta.url));
    const tools = [
      new XclogTools({ binaryPath: '' }),
      new XcsymTools({ binaryPath: '' }),
      new XcprofTools({ binaryPath: '' }),
    ].flatMap((provider) => provider.listTools());
    const files = [
      ...(await readdir(join(pluginDir, 'agents'))).map((f) => `agents/${f}`),
      ...(await readdir(join(pluginDir, 'commands'))).map((f) => `commands/${f}`),
      ...(await readdir(join(pluginDir, 'skills'), { recursive: true })).filter((f) => f.endsWith('-auditor.md')).map((f) => `skills/${f}`),
    ].filter((f) => f.endsWith('.md'));
    const mismatches: Record<string, string[]> = {};
    for (const file of files) {
      const found = mcpClientNoteMismatches(await readFile(join(pluginDir, file), 'utf-8'), tools);
      if (found.length > 0) mismatches[file] = found;
    }
    expect(mismatches).toEqual({});
  });
});
