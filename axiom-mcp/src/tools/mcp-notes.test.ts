import { describe, it, expect, beforeAll } from 'vitest';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
  FLAG_EXAMPLES, MCP_IMPLIED_FLAGS, mcpClientNoteBodies, mcpClientNoteMismatches, mcpCallMismatches, mcpToolFooter, renderMcpClientNotes, stripMcpClientNotes, wrappedCommandFlags,
  type NotedMcpTool,
} from './mcp-notes.js';
import { createBinaryToolProviders } from './providers.js';
import { CLI_ONLY_BINARIES } from './binaries.js';
import { DynamicToolsHandler } from './handler.js';
import type { Loader } from '../loader/types.js';
import { Logger, type Config } from '../config.js';

const L = 'MCP-only clients:';

const tools = [
  { name: 'axiom_demo_crash', inputSchema: { properties: { file: {}, format: { enum: ['summary', 'standard', 'full'] }, dsymPaths: {}, instruments: {}, noSpotlight: { type: 'boolean' }, allowLaunch: { type: 'boolean' } }, required: ['file'] } },
  { name: 'axiom_demo_verify', inputSchema: { properties: { file: {} }, required: ['file'] } },
];
const otherTools = [{ name: 'axiom_get_agent', inputSchema: { properties: { agent: {} }, required: ['agent'] } }];

describe(mcpClientNoteMismatches, () => {
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
    ['nothing for a prose span that only mentions a command mid-sentence', `Run \`see demo crash --format=x <f>\` now.\n\nRun \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`, []],
    ['nothing for a pipe inside a quoted flag value', `\`\`\`bash\ndemo crash --format "<a|b>" <file>\n\`\`\`\n${crashNote}`, []],
    ['nothing for a command piped into another tool', `\`\`\`bash\ndemo crash --format=summary <file> | jq --slurp .\n\`\`\`\n${crashNote}`, []],
    ['nothing for one entry per tool in a mixed block', `\`\`\`bash\ndemo crash <a>\ndemo crash <b>\ndemo verify <c>\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`; \`axiom_demo_verify\` with \`file\`.`, []],
    ['nothing for a table row that has its own inline note', `| a | \`demo verify <f>\` (${L} \`axiom_demo_verify\` with \`file\`) |\n| b | \`demo crash <f>\` |\n${L} \`axiom_demo_crash\` with \`file\`.`, []],
    ['an inline note that names no wrapped tool', `Run \`demo crash --format=x <f>\` (${L} use the CLI).`, ['note for `demo crash --format=x <f>` names no wrapped tool']],
    ['a command after && inside a span', `Run \`cd /tmp && demo crash --format=x <f>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo crash --format=x <f>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a command after env inside a span', `Run \`env DEMO_DSYM_PATHS=/x demo crash <f>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`DEMO_DSYM_PATHS=/x demo crash <f>` sets `DEMO_DSYM_PATHS`; its note for `axiom_demo_crash` omits `dsymPaths`']],
    ['a quoted binary env var the note leaves out', `Run \`DEMO_DSYM_PATHS="$(mktemp -d)" demo crash <f>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`DEMO_DSYM_PATHS="$(mktemp -d)" demo crash <f>` sets `DEMO_DSYM_PATHS`; its note for `axiom_demo_crash` omits `dsymPaths`']],
    ['an unquoted command-substitution env var the note leaves out', `\`\`\`bash\nDEMO_DSYM_PATHS=$(mktemp -d) demo crash <f>\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`DEMO_DSYM_PATHS=$(mktemp -d) demo crash <f>` sets `DEMO_DSYM_PATHS`; its note for `axiom_demo_crash` omits `dsymPaths`']],
    ['the second command on a fenced line', `\`\`\`bash\ndemo crash <a> && demo verify --format x <b>\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['note after a block of 2 commands lists 1 tool']],
    ['a required input left out in a no-or run', `Run \`demo crash <f>\` (${L} \`axiom_demo_crash\` with no \`format\` or \`file\`).`, ['note for `axiom_demo_crash` omits required `file`']],
    ['a row of an earlier, separate table', `| a | \`demo crash --format=x <f>\` |\n\nProse.\n\n| b | \`demo crash <f>\` |\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash --format=x <f>` has no MCP-only clients note']],
    ['a fence an info-string line cannot close', `\`\`\`\ndemo crash --format=x <f>\n\`\`\`bash\nx\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash --format=x <f>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
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
    ['nothing for a param-only note its command\'s family takes', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n\nIf it is slow (${L} pass \`noSpotlight: true\`).`, []],
    ['nothing for a registered non-binary tool mid-sentence', `${L} follow the agent's instructions from \`axiom_get_agent\` with \`agent: "x"\`.`, []],
    ['nothing for a placeholder enum value', `Run \`demo crash --format=<f> <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: "<fmt>"\`).`, []],
    ['nothing for a wildcard family in a param-only note', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n\n${L} skip this and use the \`axiom_demo_*\` tools.`, []],
    ['a note in neither recognized form', `| 1 | x | fix it. ${L} \`axiom_demo_crash\` with \`file\` |`,
      ['MCP-only clients note in an unrecognized form: "| 1 | x | fix it. MCP-only clients: `axiom_demo_crash` with `file` |"']],
    ['a note after a semicolon inside a parenthetical', `Pass \`--dsym\` for release builds (or not; ${L} \`dsymPaths\`).`,
      ['MCP-only clients note in an unrecognized form: "Pass `--dsym` for release builds (or not; MCP-only clients: `dsymPaths`)."']],
    ['a param-only note naming a param its family lacks', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n\nIf it is slow (${L} pass \`frob: true\`).`,
      ['note names `frob`, which no `demo` tool takes']],
    ['a param-only note with no command before it', `${L} pass \`frob\`.`, ['note names `frob`, which no wrapped tool takes']],
    ['a mistyped tool family', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`; \`axiom_dmeo_verify\` with \`file\`).`,
      ['note names `axiom_dmeo_verify`, which the server does not register']],
    ['a non-binary tool param it lacks', `${L} follow the agent's instructions from \`axiom_get_agent\` with \`agnt: "x"\`.`,
      ['note gives `axiom_get_agent` `agnt`, which it lacks', 'note for `axiom_get_agent` omits required `agent`']],
    ['a value outside the param\'s enum', `Run \`demo crash --format=sumary <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: "sumary"\`).`,
      ['note gives `axiom_demo_crash` `format: "sumary"`, which is not one of "summary", "standard", "full"']],
    ['a non-boolean value for a boolean param', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`noSpotlight: yes\`).`,
      ['note gives `axiom_demo_crash` `noSpotlight: yes`, which is not a boolean']],
    ['a short flag', `Run \`demo crash -f summary <file>\` (${L} \`axiom_demo_crash\` with \`file\`).`,
      ['`demo crash -f summary <file>` passes `-f`; write the long flag so its note can be checked']],
    ['a command inside $( )', `\`\`\`bash\nOUT=$(demo crash --format=x <f>)\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash --format=x <f>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a command after if, with no note', '```bash\nif demo verify <f>; then echo ok; fi\n```\n', ['block with `demo verify <f>` has no MCP-only clients note']],
    ['a command after timeout, with no note', '```bash\ntimeout 30 demo verify <f>\n```\n', ['block with `demo verify <f>` has no MCP-only clients note']],
    ['a path-qualified binary', `\`\`\`bash\n"$ROOT/tools/demo" crash --format=x <f>\n\`\`\`\n${L} \`axiom_demo_crash\` with \`file\`.`,
      ['`demo crash --format=x <f>` passes `--format`; its note for `axiom_demo_crash` omits `format`']],
    ['a note inside a code block', `\`\`\`markdown\nRun \`demo crash <f>\` (${L} \`axiom_demo_crsh\` with \`fiel\`)\n\`\`\``,
      ['MCP-only clients note inside a code block, where nothing checks it: "Run `demo crash <f>` (MCP-only clients: `axiom_demo_crsh` with `fiel`)"']],
    ['a prose flag whose note names another param', `Pass \`--dsym-paths <p>\` (${L} \`format\`).`,
      ['`--dsym-paths <p>` is followed by a note that does not name `dsymPaths`']],
    ['nothing for a prose flag whose note names its param', `Pass \`--format <f>\` (${L} \`format\`).`, []],
    ['CRLF line endings', `Run \`demo crash <f>\` (${L} \`axiom_demo_crash\` with \`file\`).\r\n`,
      ['text uses CRLF line endings; MCP-only clients notes are checked only in LF text']],
    ['an unquoted value outside the param\'s enum', `Run \`demo crash --format sumary <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: sumary\`).`,
      ['note gives `axiom_demo_crash` `format: sumary`, which is not one of "summary", "standard", "full"']],
    ['a command in a subshell, with no note', '```bash\n(demo verify <f>)\n```\n', ['block with `demo verify <f>)` has no MCP-only clients note']],
    ['a command in a brace group, with no note', '```bash\n{ demo verify <f>; }\n```\n', ['block with `demo verify <f>` has no MCP-only clients note']],
    ['a command after a lone &, with no note', '```bash\nls & demo verify <f>\n```\n', ['block with `demo verify <f>` has no MCP-only clients note']],
    ['a note value that contradicts its command\'s flag', `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: "full"\`).`,
      ['`demo crash --format=summary <file>` passes `--format=summary`; its note for `axiom_demo_crash` gives `format: "full"`']],
    ['nothing for a note value against a placeholder flag', `Run \`demo crash --format <fmt> <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: "full"\`).`, []],
    ['a consent param its command does not pass', `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`allowLaunch: true\`).`,
      ['note for `axiom_demo_crash` sets `allowLaunch: true`, which `demo crash <file>` does not pass (`--allow-launch`)']],
    ['nothing for a semicolon inside a backticked value', `Run \`demo crash --dsym-paths x <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`dsymPaths: "a; b"\`).`, []],
  ] as const)('reports %s', (_case, text, expected) => {
    expect(mcpClientNoteMismatches(text, tools, implied, otherTools)).toEqual(expected);
  });

  it('reports nothing when notes are optional and a command has none', () => {
    expect(mcpClientNoteMismatches('Run `demo crash <file>`.\n\n```bash\ndemo verify <f>\n```\n', tools, implied, otherTools, { requireNotes: false })).toEqual([]);
  });

  it('still checks a present note when notes are optional', () => {
    expect(mcpClientNoteMismatches(`Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`fil\`).`, tools, implied, otherTools, { requireNotes: false }))
      .toEqual(['note gives `axiom_demo_crash` `fil`, which it lacks', 'note for `axiom_demo_crash` omits required `file`']);
  });
});

describe(mcpClientNoteBodies, () => {
  it('returns every recognized note body in text order, and none in an unrecognized form', () => {
    const text = `Run \`demo x\` (${L} \`axiom_demo_crash\` with \`file\`).\n\n${L} one.\n| a | fix. ${L} not this |\n`;
    expect(mcpClientNoteBodies(text)).toEqual(['`axiom_demo_crash` with `file`', 'one.']);
  });
});

describe(stripMcpClientNotes, () => {
  it.each([
    ['inline and line notes, leaving the CLI text byte-identical',
      `Run \`demo crash <file>\` (${L} \`axiom_demo_crash\` with \`file\`).\n\n\`\`\`bash\ndemo verify <file>\n\`\`\`\n${L} \`axiom_demo_verify\` with \`file\`.\n\nNext.\n`,
      'Run `demo crash <file>`.\n\n```bash\ndemo verify <file>\n```\n\nNext.\n'],
    ['a note that is its own paragraph, with one of its blank lines', `A.\n\n${L} skip this.\n\nB.\n`, 'A.\n\nB.\n'],
    ['an inline note whose value holds a parenthesis', `Run \`demo x\` (${L} \`axiom_demo_crash\` with \`instruments: ["A (x)"]\`).`, 'Run `demo x`.'],
    ['two adjacent standalone notes, leaving one blank line', `A.\n\n${L} one.\n\n${L} two.\n\nB.\n`, 'A.\n\nB.\n'],
    ['an inline note holding an unbackticked parenthetical', `Run \`demo x\` (${L} pass an absolute path (not relative) as \`file\`).`, 'Run `demo x`.'],
    ['an indented note inside a list item', `1. Step\n   \`\`\`\n   demo crash\n   \`\`\`\n   ${L} \`axiom_demo_crash\` with \`file\`.\n2. Next\n`, '1. Step\n   ```\n   demo crash\n   ```\n2. Next\n'],
  ])('removes %s', (_case, text, expected) => {
    expect(stripMcpClientNotes(text)).toBe(expected);
  });

  it('leaves a note inside a code block, so the checker reports it', () => {
    const text = `\`\`\`markdown\nadd \`--dsym\` (${L} \`dsym\`)\n${L} \`axiom_demo_crash\` with \`file\`.\n\`\`\`\n`;
    expect(stripMcpClientNotes(text)).toBe(text);
  });
});

describe(renderMcpClientNotes, () => {
  const toolFor = new Map([['demo crash', 'axiom_demo_crash'], ['demo verify', 'axiom_demo_verify']]);
  const crashNote = `${L} \`axiom_demo_crash\` with \`file\` and \`format\`.`;

  it.each([
    ['an inline note with its command, as the call',
      `Run \`demo crash --format=summary <file>\` (${L} \`axiom_demo_crash\` with \`file\` and \`format: "summary"\`) now.`,
      'Run `axiom_demo_crash` with `file` and `format: "summary"` now.'],
    ['each fenced command its tool\'s one entry covers, keeping other lines and the note',
      `\`\`\`bash\nX=1 demo crash --format x <a>\nls\ndemo verify <b>\n\`\`\`\n${L} \`axiom_demo_verify\` with \`file\`; \`axiom_demo_crash\` with \`file\` and \`format\`.\n`,
      `\`\`\`bash\nCall \`axiom_demo_crash\` with \`file\` and \`format\`.\nls\nCall \`axiom_demo_verify\` with \`file\`.\n\`\`\`\n${L} \`axiom_demo_verify\` with \`file\`; \`axiom_demo_crash\` with \`file\` and \`format\`.\n`],
    ['fenced commands paired with entries in order',
      `\`\`\`\ndemo crash <a>\ndemo verify <b>\n\`\`\`\n\n${L} \`axiom_demo_crash\` with \`file\`; \`axiom_demo_verify\` with \`file\`.`,
      `\`\`\`\nCall \`axiom_demo_crash\` with \`file\`.\nCall \`axiom_demo_verify\` with \`file\`.\n\`\`\`\n\n${L} \`axiom_demo_crash\` with \`file\`; \`axiom_demo_verify\` with \`file\`.`],
    ['a flag whose note names its param, as the param',
      `Pass \`--dsym <path>\` (${L} \`dsym\`), or rely on discovery; use \`--no-spotlight\` (${L} \`noSpotlight\`) next.`,
      'Pass `dsym`, or rely on discovery; use `noSpotlight` next.'],
    ['an indented fenced command, keeping its indentation',
      `1. Crash it:\n   \`\`\`bash\n   demo crash <f>\n   \`\`\`\n   ${crashNote}`,
      `1. Crash it:\n   \`\`\`bash\n   Call \`axiom_demo_crash\` with \`file\` and \`format\`.\n   \`\`\`\n   ${crashNote}`],
  ])('replaces %s', (_case, text, expected) => {
    expect(renderMcpClientNotes(text, toolFor)).toBe(expected);
  });

  it.each([
    ['an inline note with a prose entry', `\`demo crash <f>\` (${L} \`axiom_demo_crash\` with \`file\`; skip the check).`],
    ['an inline note after no command', `Pass the flag (${L} pass \`dsymPaths\`).`],
    ['an inline note naming another command\'s tool', `\`demo verify <f>\` (${L} \`axiom_demo_crash\` with \`file\`).`],
    ['a fence whose note lists fewer entries than its commands', `\`\`\`\ndemo crash <a>\ndemo verify <b>\n\`\`\`\n${crashNote}`],
    ['a fence with a continuation line', `\`\`\`\ndemo crash <a> \\\n  --format x\n\`\`\`\n${crashNote}`],
    ['a fence line with two wrapped commands', `\`\`\`\ndemo crash <a> && demo crash <b>\n\`\`\`\n${crashNote}`],
    ['a flag whose note names another param', `Pass \`--dsym <path>\` (${L} \`dsymPaths\`).`],
    ['a flag whose note is prose', `Pass \`--dsym <path>\` (${L} pass \`dsym\` instead).`],
    ['two lines of one tool under one entry', `\`\`\`\ndemo crash <a>\ndemo crash --format full <b>\n\`\`\`\n${crashNote}`],
    ['a fenced command piped into another', `\`\`\`\ndemo crash <f> | jq .pattern_tag\n\`\`\`\n${crashNote}`],
    ['a fenced command with a fallback', `\`\`\`\ndemo crash <f> || echo mismatch\n\`\`\`\n${crashNote}`],
    ['a fenced command inside $( )', `\`\`\`\nOUT=$(demo crash <f>)\n\`\`\`\n${crashNote}`],
    ['a fenced command after an opener', `\`\`\`\nif demo crash <f>; then :; fi\n\`\`\`\n${crashNote}`],
    ['a fence with a heredoc', `\`\`\`\ncat <<EOF\ndemo crash <f>\nEOF\n\`\`\`\n${crashNote}`],
    ['a prose flag with a value', `Use \`--format=full\` (${L} \`format\`).`],
    ['a line note whose tool is mid-sentence', `\`\`\`\ndemo crash <a>\n\`\`\`\n${L} follow the steps in \`axiom_demo_crash\`.`],
  ])('leaves %s', (_case, text) => {
    expect(renderMcpClientNotes(text, toolFor)).toBe(text);
  });
});

describe(wrappedCommandFlags, () => {
  it('returns each flag passed to a wrapped command in spans and fences, and none of other commands', () => {
    const text = 'Run `demo crash --format=x --dsym-paths /a <f>` and `xcrun swift --format`.\n\n```bash\ndemo verify --no-spotlight <f>\nls --color\n```\n';
    expect(wrappedCommandFlags(text, ['demo crash', 'demo verify'])).toEqual(['dsym-paths', 'format', 'no-spotlight']);
  });
});

describe(mcpCallMismatches, () => {
  it.each([
    ['nothing for params, enum values and placeholders the tool takes',
      'Call `axiom_demo_crash` with `file`, `noSpotlight: true`, and only `summary` or `full` in `format`. Then `axiom_demo_verify` with `file: "<path>"`.', []],
    ['nothing for a clause that names the tool as an MCP tool', 'Use the `axiom_demo_crash` MCP tool with `file` and `dsymPaths`.', []],
    ['a param the tool lacks', 'Call `axiom_demo_crash` with `file` and `fiel`.', ['`axiom_demo_crash` is given `fiel`, which it lacks']],
    ['a value outside an enum', 'Call `axiom_demo_crash` with `file` and `format: "sumary"`.',
      ['`axiom_demo_crash` is given `format: "sumary"`, which is not one of "summary", "standard", "full"']],
    ['an unregistered tool', 'Call `axiom_demo_crsh` with `file`.', ['`axiom_demo_crsh` is not a registered tool']],
  ] as const)('reports %s', (_case, text, expected) => {
    expect(mcpCallMismatches(text, tools)).toEqual(expected);
  });
});

describe(mcpToolFooter, () => {
  const toolNames = ['axiom_xclog_launch', 'axiom_xcsym_crash', 'axiom_xcsym_find_dsym', 'axiom_xcprof_record'];
  const tail = 'Pass each flag as its camelCase input (FLAG); a flag with no matching input is not available over MCP. Pass files as absolute paths: the tools read no stdin or environment variables.';
  const head = '**Axiom MCP tools** – Over MCP, call these tools instead of the commands above:';

  it.each([
    ['nothing when no wrapped subcommand is named', 'Read `pattern_tag` from xcsym output.', ''],
    ['one subcommand, with its binary\'s flag example', 'Run `xcsym find-dsym <uuid>`.',
      `${head} \`xcsym find-dsym\` → \`axiom_xcsym_find_dsym\`. Your client may show them with a server prefix, such as \`mcp__axiom__axiom_xcsym_find_dsym\`. ${tail.replace('FLAG', '`--dsym-paths` → `dsymPaths`')}`],
    ['every subcommand named, in the order the text first names them', 'Run `xcprof record`, then `xclog launch`, then `xcsym crash`.',
      `${head} \`xcprof record\` → \`axiom_xcprof_record\`, \`xclog launch\` → \`axiom_xclog_launch\`, \`xcsym crash\` → \`axiom_xcsym_crash\`. Your client may show them with a server prefix, such as \`mcp__axiom__axiom_xcprof_record\`. ${tail.replace('FLAG', '`--time-limit` → `timeLimit`')}`],
    ['no mapping for a subcommand the server has no tool for', 'Run `xcsym crash <f>`; `xcprof cleanup` comes later.',
      `${head} \`xcsym crash\` → \`axiom_xcsym_crash\`. Your client may show them with a server prefix, such as \`mcp__axiom__axiom_xcsym_crash\`. ${tail.replace('FLAG', '`--dsym-paths` → `dsymPaths`')}`],
    ['nothing for a subcommand inside a longer word', 'See `xcsym crash-report` docs.', ''],
    ['nothing for a type name that only spells a CLI-only binary in capitals', 'XCUI types are main-actor isolated.', ''],
    ['a CLI-only binary, alone', 'Run `xcui tap --id save`.',
      '**Axiom MCP tools** – `xcui` has no MCP tool: where the text gives a fallback, use it; otherwise ask the user to run those steps.'],
    ['CLI-only binaries after the mapped ones', 'Run `xcsym crash <f>`, then `"$AXBUILD" xcodebuild test` and `xcproject inspect`.',
      `${head} \`xcsym crash\` → \`axiom_xcsym_crash\`. Your client may show them with a server prefix, such as \`mcp__axiom__axiom_xcsym_crash\`. ${tail.replace('FLAG', '`--dsym-paths` → `dsymPaths`')} \`axbuild\` and \`xcproject\` have no MCP tools: where the text gives a fallback, use it; otherwise ask the user to run those steps.`],
  ])('returns %s', (_case, text, expected) => {
    expect(mcpToolFooter(text, toolNames, CLI_ONLY_BINARIES)).toBe(expected);
  });
});

describe('MCP-only clients notes in served text', () => {
  // axiom_get_agent, prompts/get and axiom_read_skill serve this text unchanged, and an
  // MCP-only client has the axiom_* tools but not the CLIs.
  const pluginDir = fileURLToPath(new URL('../../../.claude-plugin/plugins/axiom', import.meta.url));
  const tools = Object.values(createBinaryToolProviders({ paths: { xcprof: '', xclog: '', xcsym: '' } })).flatMap((p) => p.listTools());
  const logger = new Logger({ mode: 'production', enableAppleDocs: false, logLevel: 'error' } satisfies Config);
  let otherTools: NotedMcpTool[] = [];
  const served: Array<{ file: string; text: string; requireNotes: boolean }> = [];

  beforeAll(async () => {
    otherTools = (await new DynamicToolsHandler({} as Loader, logger).listTools()).tools;
    const files = [
      ...(await readdir(join(pluginDir, 'agents'))).map((f) => `agents/${f}`),
      ...(await readdir(join(pluginDir, 'commands'))).map((f) => `commands/${f}`),
      ...(await readdir(join(pluginDir, 'skills'), { recursive: true })).map((f) => `skills/${f}`),
    ].filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const text = await readFile(join(pluginDir, file), 'utf-8');
      // Agent text needs a note at every wrapped command; hand-written skills teach the CLI and
      // carry the served footer instead, so a note there is optional but checked when present.
      const requireNotes = !file.startsWith('skills/') || text.startsWith('<!-- GENERATED from agents/');
      served.push({ file, text, requireNotes });
    }
  });

  it('finds no mismatch with the live MCP tool schemas', () => {
    const mismatches: Record<string, string[]> = {};
    for (const { file, text, requireNotes } of served) {
      const found = mcpClientNoteMismatches(text, tools, MCP_IMPLIED_FLAGS, otherTools, { requireNotes });
      if (found.length > 0) mismatches[file] = found;
    }
    expect(mismatches).toEqual({});
  });

  it('keeps notes out of hand-written skills, which no build strips', () => {
    // Hand-written skills teach the CLI and get the served footer; neither the Codex copy nor the
    // Cursor skill transform strips notes, so one there would ship to harnesses that run the binaries.
    const withNotes = served.filter((s) => s.file.startsWith('skills/') && !s.requireNotes && s.text.includes('MCP-only clients:'));
    expect(withNotes.map((s) => s.file)).toEqual([]);
  });

  it('gives the Cursor build\'s agents and commands only MCP calls the schemas allow', async () => {
    // Cursor runs on MCP alone; its text comes from rendered notes, tracked rewrites and
    // hand-written command bodies, and this holds all of them to the live schemas.
    const cursorDir = fileURLToPath(new URL('../../../axiom-cursor', import.meta.url));
    const files = [
      ...(await readdir(join(cursorDir, 'agents'))).map((f) => `agents/${f}`),
      ...(await readdir(join(cursorDir, 'commands'))).map((f) => `commands/${f}`),
    ].filter((f) => f.endsWith('.md'));
    const mismatches: Record<string, string[]> = {};
    let calls = 0;
    for (const file of files) {
      const text = await readFile(join(cursorDir, file), 'utf-8');
      calls += (text.match(/`axiom_[a-z0-9_]+`(?: MCP tool)? with /g) ?? []).length;
      const found = mcpCallMismatches(text, [...tools, ...otherTools]);
      if (found.length > 0) mismatches[file] = found;
    }
    expect({ checked: calls >= 30, mismatches }).toEqual({ checked: true, mismatches: {} });
  });

  it('parses the notes it checks', () => {
    // A grammar that stopped matching would pass the check above while checking nothing.
    const parsed = served.reduce((n, { text }) => n + mcpClientNoteBodies(text).length, 0);
    expect(parsed).toBeGreaterThanOrEqual(50);
  });

  it('reports a live note whose param no longer exists', () => {
    const { text } = served.find((s) => s.file === 'agents/crash-analyzer.md')!;
    const mutated = text.replace(/(MCP-only clients: `axiom_xcsym_crash` with )`file`/, '$1`fiel`');
    expect(mutated).not.toBe(text);
    expect(mcpClientNoteMismatches(mutated, tools, MCP_IMPLIED_FLAGS, otherTools)).toContain('note gives `axiom_xcsym_crash` `fiel`, which it lacks');
  });

  it('gives each binary a footer flag example whose param exists, and implies no flag a tool takes', () => {
    const paramsOf = (binary: string) => new Set(tools.filter((t) => t.name.startsWith(`axiom_${binary}_`))
      .flatMap((t) => Object.keys(t.inputSchema.properties ?? {})));
    const missing = Object.entries(FLAG_EXAMPLES).filter(([binary, example]) => !paramsOf(binary).has(example.match(/→ `(\w+)`/)![1]));
    const shadowed = Object.entries(MCP_IMPLIED_FLAGS).flatMap(([binary, flags]) => flags.filter((f) => paramsOf(binary).has(f)));
    expect({ missing, shadowed }).toEqual({ missing: [], shadowed: [] });
  });
});
