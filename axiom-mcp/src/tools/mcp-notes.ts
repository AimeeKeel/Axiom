/**
 * "MCP-only clients:" notes give the MCP form of a CLI instruction in canonical agent and
 * command text, for clients that have the `axiom_<binary>_*` tools but no shell binary:
 * inline after the instruction, as in
 *   `xcsym verify <file>` (MCP-only clients: `axiom_xcsym_verify` with `file`)
 * or as a line after a fenced block or table, one `; `-separated entry per command (a single
 * entry covers every command of its tool). A leaf module with no imports: root scripts load
 * it as `.ts` under bare-node type-stripping, and the MCP server as `./mcp-notes.js`.
 */

const INLINE_NOTE = / \(MCP-only clients: ((?:`[^`\n]*`|\([^()\n]*\)|[^()`\n])*)\)/g;
const LINE_NOTE = /^[ \t]*MCP-only clients: (.*)$/;

/** The text without its notes, for harnesses that run the binaries or render their own MCP form. */
export function stripMcpClientNotes(text: string): string {
  return text
    .replace(INLINE_NOTE, '')
    .replace(/(?<=^|\n\n)[ \t]*MCP-only clients: [^\n]*\n(?:\n|$)/g, '')
    .replace(/^[ \t]*MCP-only clients: [^\n]*\n?/gm, '');
}

/**
 * Flags and binary-prefixed env vars (as camelCase) that a wrapped CLI takes but its MCP tools
 * have no param for, because the server supplies or never needs them.
 */
export const MCP_IMPLIED_FLAGS: Readonly<Record<string, readonly string[]>> = {
  xcprof: ['json', 'both', 'human', 'open', 'noPrompt', 'traceRoot'],
};

export interface NotedMcpTool {
  name: string;
  inputSchema: { properties?: Record<string, unknown>; required?: string[] };
}

interface NoteEntry { tool: string; given: string[]; omitted: string[] }
interface Command { subcommand: string; cli: string; hasArgs: boolean; flags: string[]; envs: string[] }

const camel = (s: string) => s.toLowerCase().replace(/[-_]([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
const ENV_PREFIX = /^\s*(?:env\s+)?((?:[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|(?:\$\([^)]*\)|[^\s"'])*)\s+)*)/;

function noteEntries(body: string): NoteEntry[] {
  return body.split(/;\s+/).flatMap((entry) => {
    const m = entry.match(/^`(axiom_[a-z0-9_]+)`(?: with (.*))?/);
    if (!m) return [];
    const given: string[] = [];
    const omitted: string[] = [];
    const params = m[2] ?? '';
    let end = 0;
    let lastOmitted = false;
    for (const p of params.matchAll(/`([A-Za-z]\w*)(?::[^`]*)?`/g)) {
      const gap = params.slice(end, p.index);
      const isOmitted: boolean = /\bno\s*$/.test(gap) || (lastOmitted && /^\s*,?\s*(?:or\s+)?$/.test(gap));
      (isOmitted ? omitted : given).push(p[1]);
      lastOmitted = isOmitted;
      end = p.index + p[0].length;
    }
    return [{ tool: m[1], given, omitted }];
  });
}

/** Split a shell line at `&&`, `||`, `;` and `|` outside quotes. */
function shellSegments(line: string): string[] {
  const segments: string[] = [];
  let quote = '';
  let start = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) { if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === ';' || c === '|' || (c === '&' && line[i + 1] === '&')) {
      segments.push(line.slice(start, i));
      if ((c === '|' && line[i + 1] === '|') || c === '&') i++;
      start = i + 1;
    }
  }
  segments.push(line.slice(start));
  return segments;
}

/** The wrapped commands a shell line or backticked span runs, one per segment that opens with one. */
function commandsIn(line: string, subcommands: readonly string[]): Command[] {
  return shellSegments(line).flatMap((segment) => {
    const envRun = segment.match(ENV_PREFIX)?.[1] ?? '';
    const rest = segment.slice(segment.match(ENV_PREFIX)?.[0].length ?? 0).trim();
    const subcommand = subcommands.find((sub) => rest === sub || (rest.startsWith(sub) && /^[^\w-]/.test(rest.slice(sub.length))));
    if (!subcommand) return [];
    const flags = [...rest.split(/\s--(?=\s|$)/)[0].matchAll(/(?:^|\s)--([a-z][a-z0-9-]*)/g)].map((f) => f[1]);
    const envs = [...envRun.matchAll(/([A-Z_][A-Z0-9_]*)=/g)].map((e) => e[1]);
    return [{ subcommand, cli: `${envRun}${rest}`.trim(), hasArgs: rest !== subcommand, flags, envs }];
  });
}

interface Fence { open: number; close: number }

function fencesIn(lines: string[]): Fence[] {
  const fences: Fence[] = [];
  let open: { at: number; char: string; width: number } | null = null;
  lines.forEach((line, i) => {
    const m = line.match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
    if (!m) return;
    if (!open) open = { at: i, char: m[1][0], width: m[1].length };
    else if (m[1][0] === open.char && m[1].length >= open.width && m[2].trim() === '') {
      fences.push({ open: open.at, close: i });
      open = null;
    }
  });
  if (open) fences.push({ open: (open as { at: number }).at, close: lines.length });
  return fences;
}

/**
 * Disagreements between the notes in served agent or command text and the wrapped tools'
 * `listTools()` schemas. Every wrapped instruction (a backticked command with arguments, or a
 * fenced line) needs its own note naming a wrapped tool, and a bare subcommand name needs some
 * note naming its tool. A note's params must exist and include the tool's required inputs
 * (given, not `no \`x\``), and every flag or binary-prefixed env var of the command it follows
 * must map to a param the note names, unless the server implies it. One entry per tool covers
 * all of that tool's commands in a block; otherwise entries pair with commands in order.
 */
export function mcpClientNoteMismatches(
  text: string,
  tools: NotedMcpTool[],
  impliedFlags: Readonly<Record<string, readonly string[]>> = MCP_IMPLIED_FLAGS,
): string[] {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const toolForSubcommand = new Map<string, string>();
  const families = new Set<string>();
  for (const t of tools) {
    const m = t.name.match(/^axiom_([a-z0-9]+)_([a-z0-9_]+)$/);
    if (!m) continue;
    families.add(m[1]);
    toolForSubcommand.set(`${m[1]} ${m[2].replace(/_/g, '-')}`, t.name);
  }
  const subcommands = [...toolForSubcommand.keys()].sort((a, b) => b.length - a.length);
  const problems: string[] = [];
  const noted = new Set<string>();
  const ours = (tool: string) => families.has(tool.split('_')[1]);

  const check = (entry: NoteEntry, command?: Command) => {
    noted.add(entry.tool);
    const tool = byName.get(entry.tool);
    if (!tool) {
      if (ours(entry.tool)) problems.push(`note names \`${entry.tool}\`, which the server does not register`);
      return;
    }
    const props = tool.inputSchema.properties ?? {};
    const named = [...entry.given, ...entry.omitted];
    for (const p of named) if (!(p in props)) problems.push(`note gives \`${entry.tool}\` \`${p}\`, which it lacks`);
    for (const r of tool.inputSchema.required ?? []) {
      if (!entry.given.includes(r)) problems.push(`note for \`${entry.tool}\` omits required \`${r}\``);
    }
    if (!command) return;
    const expected = toolForSubcommand.get(command.subcommand);
    if (expected !== entry.tool) {
      problems.push(`\`${command.cli}\` is followed by a note for \`${entry.tool}\`; expected \`${expected}\``);
      return;
    }
    const binary = command.subcommand.split(' ')[0];
    const implied = impliedFlags[binary] ?? [];
    const inputs = [
      ...command.flags.map((flag) => ({ shown: `passes \`--${flag}\``, name: camel(flag) })),
      ...command.envs.filter((env) => env.startsWith(`${binary.toUpperCase()}_`))
        .map((env) => ({ shown: `sets \`${env}\``, name: camel(env.slice(binary.length + 1)) })),
    ];
    for (const { shown, name } of inputs) {
      if (implied.includes(name)) continue;
      const param = [name, `${name}s`].find((n) => n in props);
      if (!param) problems.push(`\`${command.cli}\` ${shown}, which \`${entry.tool}\` has no param for`);
      else if (!named.includes(param)) problems.push(`\`${command.cli}\` ${shown}; its note for \`${entry.tool}\` omits \`${param}\``);
    }
  };

  // Check a note's entries against the commands it follows: one entry per tool covers all of
  // that tool's commands; otherwise entries pair with commands in order.
  const checkNote = (entries: NoteEntry[], commands: Command[]) => {
    const wrapped = entries.filter((e) => ours(e.tool));
    const others = entries.filter((e) => !ours(e.tool));
    others.forEach((entry) => check(entry));
    if (commands.length === 0) {
      wrapped.forEach((entry) => check(entry));
      return;
    }
    const toolOf = (c: Command) => toolForSubcommand.get(c.subcommand);
    const perTool = [...new Set(commands.map(toolOf))].every((tool) => wrapped.filter((e) => e.tool === tool).length === 1)
      && wrapped.every((e) => commands.some((c) => toolOf(c) === e.tool));
    if (perTool) {
      commands.forEach((c) => check(wrapped.find((e) => e.tool === toolOf(c))!, c));
    } else if (commands.length === wrapped.length) {
      wrapped.forEach((entry, n) => check(entry, commands[n]));
    } else {
      const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
      problems.push(`note after a block of ${plural(commands.length, 'command')} lists ${plural(wrapped.length, 'tool')}`);
      wrapped.forEach((entry) => check(entry));
    }
  };

  const lines = text.split('\n');
  const fences = fencesIn(lines);
  const fenceAt = new Map<number, Fence>();
  for (const f of fences) for (let i = f.open; i <= f.close; i++) fenceAt.set(i, f);
  const coveredFences = new Set<Fence>();
  const prose: string[] = [];

  const spans: Array<{ line: number; end: number; commands: Command[]; instruction: boolean; covered: boolean }> = [];
  lines.forEach((line, i) => {
    if (fenceAt.has(i)) return;
    let stripped = line;
    for (const m of line.matchAll(/`([^`\n]+)`/g)) {
      const commands = commandsIn(m[1], subcommands);
      if (commands.length === 0) continue;
      const instruction = commands.some((c) => c.hasArgs);
      spans.push({ line: i, end: m.index + m[0].length, commands, instruction, covered: false });
      if (instruction) stripped = stripped.replace(m[0], '');
    }
    if (!LINE_NOTE.test(line)) prose.push(stripped);
  });

  lines.forEach((line, i) => {
    if (fenceAt.has(i)) return;
    for (const m of line.matchAll(INLINE_NOTE)) {
      const span = spans.find((s) => s.line === i && s.end === m.index);
      const entries = noteEntries(m[1]);
      if (span?.instruction && !entries.some((e) => ours(e.tool))) {
        problems.push(`note for \`${span.commands[0].cli}\` names no wrapped tool`);
        span.covered = true;
        continue;
      }
      if (span) span.covered = true;
      checkNote(entries, span?.commands ?? []);
    }
    const note = line.match(LINE_NOTE);
    if (!note) return;
    const entries = noteEntries(note[1]);
    let k = i - 1;
    while (k >= 0 && lines[k].trim() === '') k--;
    let commands: Command[] = [];
    const fence = fenceAt.get(k);
    if (fence && fence.close === k) {
      coveredFences.add(fence);
      const body = lines.slice(fence.open + 1, fence.close).join('\n').replace(/\s*\\\n\s*/g, ' ').split('\n');
      commands = body.flatMap((l) => commandsIn(l, subcommands));
    } else if (k >= 0 && lines[k].trimStart().startsWith('|')) {
      const rows = spans.filter((s) => s.instruction && !s.covered && s.line <= k
        && lines.slice(s.line, k + 1).every((l) => l.trimStart().startsWith('|')));
      rows.forEach((s) => { s.covered = true; });
      commands = rows.flatMap((s) => s.commands);
    }
    if (commands.length === 0) {
      for (const entry of entries.filter((e) => ours(e.tool))) problems.push(`note for \`${entry.tool}\` follows no command`);
    }
    checkNote(entries, commands);
  });

  for (const s of spans) {
    if (s.instruction && !s.covered) problems.push(`\`${s.commands.find((c) => c.hasArgs)!.cli}\` has no MCP-only clients note`);
  }
  for (const f of fences) {
    if (coveredFences.has(f)) continue;
    const first = lines.slice(f.open + 1, f.close).flatMap((l) => commandsIn(l, subcommands))[0];
    if (first) problems.push(`block with \`${first.cli}\` has no MCP-only clients note`);
  }
  const proseText = prose.join('\n');
  for (const [subcommand, tool] of toolForSubcommand) {
    if (new RegExp(`(?<![\\w-])${subcommand}(?![\\w-])`).test(proseText) && !noted.has(tool)) {
      problems.push(`\`${subcommand}\` has no MCP-only clients note naming \`${tool}\``);
    }
  }
  return [...new Set(problems)];
}

const FLAG_EXAMPLES: Readonly<Record<string, string>> = {
  xclog: '`--max-lines` → `maxLines`',
  xcsym: '`--dsym-paths` → `dsymPaths`',
  xcprof: '`--time-limit` → `timeLimit`',
};

/**
 * A note for served agent, skill, prompt and resource text that names a wrapped subcommand,
 * or '' when it names none. That text is written for harnesses that run the CLI, and a
 * section-filtered read can miss the reference that maps a CLI call to its MCP tool.
 */
export function mcpToolFooter(text: string, toolNames: string[]): string {
  const found: Array<{ binary: string; phrase: string; tool: string; at: number }> = [];
  for (const tool of toolNames) {
    const m = tool.match(/^axiom_([a-z0-9]+)_([a-z0-9_]+)$/);
    if (!m) continue;
    const phrase = `${m[1]} ${m[2].replace(/_/g, '-')}`;
    const at = text.search(new RegExp(`(?<![\\w-])${phrase}(?![\\w-])`));
    if (at >= 0) found.push({ binary: m[1], phrase, tool, at });
  }
  if (found.length === 0) return '';
  const binaries = [...new Set(toolNames.map((t) => t.split('_')[1]))].filter((b) => found.some((f) => f.binary === b));
  const first = found.reduce((a, b) => (b.at < a.at ? b : a));
  const named = binaries.map((b) => `\`${b}\``);
  const list = named.length < 3 ? named.join(' and ') : `${named.slice(0, -1).join(', ')}, and ${named.at(-1)}`;
  const pattern = binaries.length === 1 ? `axiom_${binaries[0]}_<subcommand>` : 'axiom_<binary>_<subcommand>';
  const flag = FLAG_EXAMPLES[first.binary] ?? '`--some-flag` → `someFlag`';
  return `**Axiom MCP tools** – Each ${list} subcommand above is the MCP tool \`${pattern}\`, with hyphens as underscores (\`${first.phrase}\` → \`${first.tool}\`); your client may show it with a server prefix, such as \`mcp__axiom__${first.tool}\`. Call the tool instead of a shell command, pass each flag as its camelCase input (${flag}; the server sets any flag with no matching input itself), and pass files as absolute paths: the tools read no stdin or environment variables.`;
}
