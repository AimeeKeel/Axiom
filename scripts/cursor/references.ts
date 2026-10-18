import path from "node:path";
import type { VirtualFile } from "./types.ts";
import { mcpClientNoteBodies, renderMcpClientNotes, stripMcpClientNotes, wrappedCommandFlags } from "../../axiom-mcp/src/tools/mcp-notes.ts";
import { MCP_TOOL_NAMES } from "../../axiom-mcp/src/tools/binaries.ts";

export const CURSOR_INVOCATION_REWRITES: ReadonlyArray<[RegExp, string]> = [
  [/`\/axiom:([a-z0-9-]+)`/g, "`/axiom-$1`"],
  [/\b(?:Automatically\s+)?Launch(?:es|ed|ing)?\s+the\s+\*\*([a-z0-9-]+)\*\*\s+agent\b/gi, "Delegate to the **$1** subagent"],
  [/\b(?:Automatically\s+)?Launch(?:es|ed|ing)?\s+(?:the\s+)?`([a-z0-9-]+)`\s+agent\b/gi, "Delegate to the `$1` subagent"],
  [/\b(?:Automatically\s+)?Launch(?:es|ed|ing)?\s+(?:the\s+)?(?!(?:the|an|a|this|that|each|appropriate|corresponding|specific)\b)([a-z0-9-]+)\s+agent\b/gi, "Delegate to the `$1` subagent"],
  [/\bTaskOutput tool\b/g, "subagent completion results"],
  [/\bTaskOutput\b/g, "the returned subagent result"],
  [/\bTask tool\b/g, "Cursor subagent delegation"],
  [/\bAgent tool\b/g, "Cursor subagent delegation"],
  [/\bAgent calls\b/g, "subagent delegations"],
  [/\bAgent call\b/g, "subagent delegation"],
  [/\bthe agent's launch prompt\b/gi, "the subagent delegation prompt"],
  [/\b(?:the\s+)?auditors?['’]s? launch prompt\b/gi, "the auditor subagent delegation prompt"],
  [/\bagent launch prompt\b/gi, "subagent delegation prompt"],
  [/\blaunch prompt\b/gi, "delegation prompt"],
  [/\bsubagent_type set to the agent name\b/g, "the matching subagent name"],
  [/`run_in_background:\s*true`(?: parameter)?/g, "background subagent execution"],
  [/\brun_in_background:\s*true(?: parameter)?/g, "background subagent execution"],
  [/\bLaunch each agent in background\b/gi, "Delegate to each agent as a background subagent"],
  [/\bLaunch Auditors\b/g, "Delegate to Auditor Subagents"],
  [/\blaunches specialized Axiom auditors\b/gi, "delegates to specialized Axiom auditor subagents"],
  [/\blaunching agents\b/gi, "delegating to subagents"],
  [/\blaunch(?:es|ed|ing)? that specific audit agent\b/gi, "delegate to that specific audit subagent"],
  [/\blaunch(?:es|ed|ing)? the (appropriate|corresponding|specific) agent(?:\(s\)|s)?\b/gi, "delegate to the $1 subagent(s)"],
  // Lowercase only: a capitalized "Launch the Agent" is Apple's run-agent heading, not delegation.
  [/\blaunching (this|that|each|the) agent\b/g, "delegating to $1 subagent"],
  [/\blaunched (this|that|each|the) agent\b/g, "delegated to $1 subagent"],
  [/\blaunches (this|that|each|the) agent\b/g, "delegates to $1 subagent"],
  [/\blaunch (this|that|each|the) agent\b/g, "delegate to $1 subagent"],
  [/\bLaunch (that|each) agent\b/g, "Delegate to $1 subagent"],
  [/\blaunch ALL of them\b/g, "delegate to all of them"],
  [/\bauditors were launched\b/gi, "auditors were delegated to"],
  [/\bAskUserQuestion tool\b/g, "ask the user directly"],
  // Cursor documents no Skill tool (cursor.com/docs/agent/tools); skills load by reading files.
  [/\b(?:using|via|with) the Skill tool\b/g, "by reading its `SKILL.md`"],
];

const UNSUPPORTED_TOKENS: ReadonlyArray<[RegExp, string]> = [
  [/\/axiom:/, "/axiom:"],
  [/\bTaskOutput\b/, "TaskOutput"],
  [/\bAskUserQuestion\b/, "AskUserQuestion"],
  [/\bSkill tool\b/, "Skill tool"],
  [/CLAUDE_PLUGIN_ROOT/, "CLAUDE_PLUGIN_ROOT"],
  [/\$ARGUMENTS/, "$ARGUMENTS"],
  [/(?<!\$)\{\{/, "double-brace template marker"],
  [/<\/?Task>/, "<Task>"],
  [/\bsubagent_type\b/, "subagent_type"],
  [/\brun_in_background\b/, "run_in_background"],
  [/\bAgent calls?\b/, "Agent call"],
  [/\bdelegated subagent result(?: tool)?\b/, "delegated subagent result"],
  [/^\s*prompt\s*:\s*\|/m, "prompt: |"],
];

/** The binaries the MCP server wraps, from the server's own tool list. */
export const WRAPPED_BINARIES = Object.keys(MCP_TOOL_NAMES) as ReadonlyArray<keyof typeof MCP_TOOL_NAMES>;
export const WRAPPED_BINARY_PATTERN = `(?:${WRAPPED_BINARIES.join("|")})`;

/** `xcsym find-dsym` → `axiom_xcsym_find_dsym`, for every tool the server registers. */
export const MCP_SUBCOMMANDS: ReadonlyMap<string, string> = new Map(WRAPPED_BINARIES.flatMap((binary) =>
  MCP_TOOL_NAMES[binary].map((tool): [string, string] => [`${binary} ${tool.slice(`axiom_${binary}_`.length).replace(/_/g, "-")}`, tool])));

const MCP_COMMAND_PATTERN = `(?:${WRAPPED_BINARIES.map((binary) => {
  const subcommands = [...MCP_SUBCOMMANDS.keys()].filter((c) => c.startsWith(`${binary} `)).map((c) => c.slice(binary.length + 1));
  return `${binary}\\s+(?:${subcommands.sort((a, b) => b.length - a.length || a.localeCompare(b)).join("|")})`;
}).join("|")})`;

export const CURSOR_MCP_MISSING_TOOL_BOUNDARY = "If a required MCP tool is unavailable, stop and report that the Axiom MCP integration is missing; do not fall back to a same-named executable.";

export const CURSOR_MCP_TOOL_BOUNDARY = "## Cursor MCP Tool Boundary\n\nThe `xclog`, `xcsym`, and `xcprof` examples below are reference syntax, not executable commands for Cursor. Map each subcommand to the same-named MCP tool—for example, `xclog launch` to `axiom_xclog_launch`, `xcsym crash` to `axiom_xcsym_crash`, and `xcprof record` to `axiom_xcprof_record`—and preserve its arguments as structured fields. Do not run a bare helper binary. " + CURSOR_MCP_MISSING_TOOL_BOUNDARY;

export const CURSOR_XCUI_TOOL_BOUNDARY = "## Cursor UI Tool Availability\n\n`xcui` is an external tool and is not bundled with the Cursor plugin; it has no Axiom MCP wrapper. Before UI automation, check `command -v xcui`. If it is absent, AXe fallback is limited to compatible input verbs: `tap`, `slider`, `type`, `swipe`, `drag`, `touch`, `gesture`, `button`, `key`, `key-sequence`, `key-combo`, and `screenshot`. Then check `command -v axe` before that fallback and handle `DEVELOPER_DIR` explicitly if AXe reports a SimulatorKit loading error. AXe cannot replace `wait`, `assert`, `a11y`, `dialog`, `voiceover`, `resize`, or `doctor`. If neither tool is available, stop UI automation, explain the external setup requirement, and continue only with non-UI simulator and log checks. If AXe exists but the requested workflow requires an xcui-only capability, stop that UI workflow and report the limitation.";

function mcpToolFor(command: string): string {
  const tool = MCP_SUBCOMMANDS.get(command.replace(/\s+/g, " ").trim().toLowerCase());
  if (!tool) throw new Error(`unsupported Axiom binary workflow: ${command}`);
  return tool;
}

interface HostClaimRewrite {
  id: string;
  pattern: RegExp;
  replacement: string;
}

/**
 * Rewrites that strip Claude-host capability claims ("xclog is on PATH, just run it")
 * from canonical prose. Each pattern is pinned to current canonical wording, so a
 * reword upstream would silently stop matching and ship Cursor users instructions to
 * run a binary the plugin does not install. `assertHostClaimRewritesFired` turns that
 * silent rot into a build failure.
 */
const HOST_CLAIM_REWRITES: ReadonlyArray<HostClaimRewrite> = [
  { id: "codex-bundled-helpers", pattern: /On \*\*Codex plugin installs\*\*[^\n]*\n\n/g, replacement: "" },
  ...WRAPPED_BINARIES.map((tool) => ({
    id: `${tool}-front-ends`,
    pattern: new RegExp(`${tool} has two front-ends over the same engine — the CLI and MCP tools; use whichever your harness provides:\\n\\n(?:- \\*\\*(?:Claude Code|Codex|Pi)\\*\\*[^\\n]*\\n)*- \\*\\*MCP clients\\*\\*[^\\n]*`, "g"),
    replacement: `In Cursor, use the \`axiom_${tool}_*\` MCP tools. The plugin does not provide a bare \`${tool}\` executable on \`PATH\`.`,
  })),
  { id: "xcui-on-path", pattern: /On \*\*Claude Code\*\*, `xcui` is already on PATH[^\n]*\n\nOn \*\*Pi\*\*, the binary is in the Axiom clone[^\n]*/g, replacement: "In Cursor, `xcui` is external and is not placed on `PATH` by the plugin. Check `command -v xcui` before following an `xcui` workflow." },
  { id: "xcui-check-first", pattern: /\*\*Check first: `command -v xcui`\.\*\* If that finds nothing, use `<plugin-root>\/tools\/xcui`[^\n]*/g, replacement: "**Check first: `command -v xcui`.** In Cursor it is external. If absent, use AXe only for compatible input verbs; do not substitute AXe for xcui-only test-harness workflows." },
  { id: "xcui-bundled-semantics", pattern: /`xcui` \(bundled\) adds the test-harness semantics AXe lacks\./g, replacement: "When installed externally, `xcui` adds the test-harness semantics AXe lacks." },
  // Cursor ships no binaries, so the Claude Code bundled-tools fallback has nothing to point at.
  { id: "claude-code-tools-fallback", pattern: /If (?:that|`command -v [a-z]+`) finds nothing, use `<plugin-root>\/tools\/[a-z]+` wherever this file says `[a-z]+`: on Claude Code, `<plugin-root>` is two levels above the `Base directory for this skill:` path of [^;\n]*; on Codex, it is the plugin root named in Axiom's startup context\.(?: |$)/gm, replacement: "" },
  // The shared axbuild section resolves the helper inside the Claude Code, Codex or Pi package.
  // Cursor ships no axbuild, but one may be on PATH; every "$AXBUILD" example needs that
  // assignment, and the section's next paragraph gives the fallback when there is none.
  {
    id: "axbuild-helper-resolution",
    pattern: /Before the next necessary build or test, resolve `tools\/axbuild` under the \*\*actual loaded package\*\*[^\n]*\n\n/g,
    replacement:
      "Before the next necessary build or test, run `command -v axbuild`. If it finds an executable, run that absolute path with `--help`; assign that observed path to `AXBUILD`. Never infer an installation path from an example.\n\n",
  },
  { id: "claude-code-bundled-tools-line", pattern: /\*\*Bundled tools on Claude Code:\*\*[^\n]*\n\n/g, replacement: "" },
  { id: "xcprof-missing", pattern: /If `xcprof` is (?:still )?absent[^\n]*/g, replacement: CURSOR_MCP_MISSING_TOOL_BOUNDARY },
  { id: "xcsym-missing", pattern: /If xcsym is (?:NOT present|still absent)[^\n]*/g, replacement: CURSOR_MCP_MISSING_TOOL_BOUNDARY },
  { id: "xcui-bundled-bullet", pattern: /- \*\*xcui\*\*: bundled —/g, replacement: "- **xcui**: external —" },
];

/**
 * CLI-only mechanics that the MCP tool schemas express as inputs: environment
 * variables, raw flags and stdin (Axiom-dyfi.8). Harness-neutral, so it can move
 * with the shared workflow rewrite planned in Axiom-dyfi.1. Tracked like the
 * host-claim rewrites, so a pattern the canonical wording outgrows fails the build.
 */
const MCP_SCHEMA_REWRITES: ReadonlyArray<HostClaimRewrite> = [
  { id: "dsym-paths-env", pattern: /set `XCSYM_DSYM_PATHS` to where it lives/g, replacement: "pass its folder as `dsymPaths`" },
  { id: "dsym-paths-archive", pattern: /point `XCSYM_DSYM_PATHS` at its `dSYMs\/` directory/g, replacement: "pass its `dSYMs/` directory as `dsymPaths`" },
  { id: "timeout-no-spotlight", pattern: /Retry with `--no-spotlight`;/g, replacement: "Retry with `noSpotlight: true`;" },
  { id: "output-path", pattern: /Real failure — check the `--output` path/g, replacement: "Real failure — read the error text" },
  { id: "stdin", pattern: /^\*\*Stdin\.\*\* Both `crash` and `anonymize` accept `-` as the file argument[^\n]*$/gm, replacement: "**Pasted crashes.** The MCP tools take file paths only, with no stdin: save pasted crash text to a file first." },
  { id: "dsym-paths-flag", pattern: /setting `--dsym-paths`/g, replacement: "passing `dsymPaths`" },
  { id: "scan-timeout-env", pattern: /consider setting `XCSYM_FRAMEWORK_SCAN_TIMEOUT` to a lower value or using `--dsym-paths` to skip discovery entirely/g, replacement: "consider passing `dsymPaths` with `noDefaults: true` to skip default discovery" },
  { id: "all-processes", pattern: /^- \*\*System-wide\*\* — `--all-processes --allow-all-processes`, only when there's no single target\. `--all-processes` records/gm, replacement: "- **System-wide** — `allProcesses: true` with `allowAllProcesses: true`, only when there's no single target. System-wide capture records" },
  { id: "no-prompt", pattern: /^- Pass `--no-prompt` \(non-interactive\), and add `--device "\$BOOTED"` when profiling a sim\.$/gm, replacement: "- Recording is always non-interactive over MCP; pass `device: \"<booted-udid>\"` when profiling a sim." },
  { id: "dry-run", pattern: /^- When unsure, add `--dry-run` first to print/gm, replacement: "- When unsure, set `dryRun: true` first to print" },
  // The note after this cell is a sentence, not a param, so renderMcpClientNotes leaves it; the env var cannot reach Cursor.
  { id: "trace-root-sandbox", pattern: /keep the capture under `XCPROF_TRACE_ROOT`/g, replacement: "leave `output` unset, or ask the user before setting `allowExternalOutput: true`" },
];

// Workflow passages rewritten to their MCP form, tracked like the lists above so a pattern
// that no longer matches the canonical wording fails the build.
const MCP_WORKFLOW_REWRITES: ReadonlyArray<HostClaimRewrite> = [
  { id: "doctor-check", pattern: /command -v xcprof\s*&&\s*xcprof doctor/g, replacement: "call the `axiom_xcprof_doctor` MCP tool" },
  { id: "command-v-check", pattern: new RegExp(`command -v ${WRAPPED_BINARY_PATTERN}\\b`, "g"), replacement: "confirm the required Axiom MCP tool is available" },
  { id: "hand-parse-boundary", pattern: /Do not hand-parse `\.ips` JSON unless neither xcsym nor the `axiom_xcsym_crash` MCP tool is available\./g, replacement: CURSOR_MCP_MISSING_TOOL_BOUNDARY },
  { id: "check-for-xcsym", pattern: /^1\. Check for xcsym:$/gm, replacement: "1. Use the `axiom_xcsym_crash` MCP tool:" },
  { id: "export-trace-root", pattern: /^export XCPROF_TRACE_ROOT="\$\(mktemp -d\)"$/gm, replacement: "Use the MCP server's default trace sandbox, or pass a reviewed path in `output`." },
  { id: "trace-root-contained", pattern: /Recording into `XCPROF_TRACE_ROOT` keeps traces contained\./g, replacement: "The MCP server's default trace sandbox keeps traces contained." },
  { id: "cleanup-phase", pattern: /\(A safe, preview-first `xcprof cleanup` is a later xcprof phase\.\)/g, replacement: "(No cleanup MCP tool is exposed; leave trace deletion to explicit user action.)" },
  { id: "record-preset-table", pattern: /`xcprof record --preset ([a-z-]+) --attach '<app>' --time-limit ([^`]+)`/g, replacement: "`axiom_xcprof_record` with `preset: \"$1\"`, `attach: \"<app>\"`, and `timeLimit: \"$2\"`" },
  { id: "record-swiftui", pattern: /`xcprof record --instrument 'SwiftUI' --instrument 'CPU Profiler' --attach '<app>' --time-limit 10s`/g, replacement: "`axiom_xcprof_record` with `instruments: [\"SwiftUI\", \"CPU Profiler\"]`, `attach: \"<app>\"`, and `timeLimit: \"10s\"`" },
  { id: "record-concurrency", pattern: /`xcprof record --instrument 'Swift Tasks' --instrument 'Swift Actors' --instrument 'CPU Profiler' --attach '<app>' --time-limit 10s`/g, replacement: "`axiom_xcprof_record` with `instruments: [\"Swift Tasks\", \"Swift Actors\", \"CPU Profiler\"]`, `attach: \"<app>\"`, and `timeLimit: \"10s\"`" },
  { id: "record-preset-full", pattern: /`xcprof record --preset full --attach '<app>'`/g, replacement: "`axiom_xcprof_record` with `preset: \"full\"` and `attach: \"<app>\"`" },
  { id: "preset-full-ios", pattern: /`--preset full-ios`/g, replacement: "`preset: \"full-ios\"`" },
  { id: "launch-from-startup", pattern: /^- \*\*Launch from startup\*\*[^\n]*/gm, replacement: "- **Launch from startup** — call `axiom_xcprof_record` with `launch: [\"<app-path>\"]` and `allowLaunch: true`; add `device: \"<booted-udid>\"` for a simulator. Launch is gated, so follow the consent rule below." },
  { id: "compare-flags", pattern: /Add `--fail-on-regression` to exit 3 for CI gating, and `--dsym` to symbolicate both traces\./g, replacement: "Set `failOnRegression: true` for CI gating, and pass `dsym: \"<path>\"` to symbolicate both traces." },
];

const TRACKED_REWRITES: ReadonlyArray<HostClaimRewrite> = [...HOST_CLAIM_REWRITES, ...MCP_WORKFLOW_REWRITES, ...MCP_SCHEMA_REWRITES];

const hostClaimHits = new Map<string, number>(TRACKED_REWRITES.map((rewrite) => [rewrite.id, 0]));

export function resetHostClaimRewriteTracking(): void {
  for (const rewrite of TRACKED_REWRITES) hostClaimHits.set(rewrite.id, 0);
}

/** Fail the build when a host-claim rewrite matched nothing across the whole corpus. */
export function assertHostClaimRewritesFired(): void {
  const dead = TRACKED_REWRITES
    .filter((rewrite) => (hostClaimHits.get(rewrite.id) ?? 0) === 0)
    .map((rewrite) => rewrite.id);
  if (dead.length > 0) {
    throw new Error(
      `Cursor host-claim, MCP-workflow, or MCP-schema rewrite matched no canonical text (the canonical wording likely changed — update the pattern): ${dead.join(", ")}`,
    );
  }
}

function rewriteCursorHostClaims(content: string): string {
  return applyTrackedRewrites(content, HOST_CLAIM_REWRITES);
}

function applyTrackedRewrites(content: string, rewrites: ReadonlyArray<HostClaimRewrite>): string {
  let rewritten = content;
  for (const rewrite of rewrites) {
    const before = rewritten;
    rewritten = rewritten.replace(rewrite.pattern, rewrite.replacement);
    if (rewritten !== before) hostClaimHits.set(rewrite.id, (hostClaimHits.get(rewrite.id) ?? 0) + 1);
  }
  return rewritten;
}

function referenceCall(command: string, argumentsText: string, inline: boolean): string {
  const tool = mcpToolFor(command);
  const reference = argumentsText.trim();
  if (!reference) return inline ? `the \`${tool}\` MCP tool` : `Call the \`${tool}\` MCP tool.`;
  const detail = `with structured inputs matching reference arguments \`${reference}\``;
  return inline ? `the \`${tool}\` MCP tool ${detail}` : `Call the \`${tool}\` MCP tool ${detail}.`;
}

/** Translate executable helper workflows used by agent and command prompts. */
export function rewriteCursorMcpWorkflows(content: string): string {
  // Cursor is an MCP-only client: a command its checked note covers becomes that note's call.
  const noted = stripMcpClientNotes(renderMcpClientNotes(content, MCP_SUBCOMMANDS));
  let rewritten = applyTrackedRewrites(rewriteCursorHostClaims(noted), MCP_WORKFLOW_REWRITES);

  rewritten = applyTrackedRewrites(rewritten, MCP_SCHEMA_REWRITES);
  rewritten = rewritten.replace(
    new RegExp(`\\\`(${MCP_COMMAND_PATTERN})([^\\\`\\n]*)\\\``, "gi"),
    (_inline, command: string, argumentsText: string) => referenceCall(command, argumentsText, true),
  );
  rewritten = rewritten.replace(
    new RegExp(`^([ \\t]*)(${MCP_COMMAND_PATTERN})([^\\n]*)$`, "gim"),
    (_line, indentation: string, command: string, argumentsText: string) => `${indentation}${referenceCall(command, argumentsText, false)}`,
  );
  return rewritten.replace(
    new RegExp(`\\b(${MCP_COMMAND_PATTERN})\\b`, "gi"),
    (_phrase, command: string) => `\`${mcpToolFor(command)}\` MCP tool`,
  ).replace(/\bthe the (`axiom_[a-z0-9_]+` MCP tool)\b/g, "the $1");
}

/** Preserve detailed CLI examples as reference syntax while fixing Cursor host claims. */
export function rewriteCursorSkillReferences(content: string): string {
  return rewriteCursorHostClaims(rewriteCursorInvocations(content));
}

export function rewriteCursorInvocations(content: string): string {
  const commandArgumentsSeparated = content.replace(
    /`\/axiom:([a-z0-9-]+)\s+([^`]+)`/g,
    "`/axiom:$1` $2",
  ).replace(/\/axiom:([a-z0-9-]+)/g, "/axiom-$1");
  return CURSOR_INVOCATION_REWRITES.reduce(
    (rewritten, [pattern, replacement]) => rewritten.replace(pattern, replacement),
    commandArgumentsSeparated,
  );
}

/**
 * The flags Cursor text must name as MCP params instead: those canonical text passes to wrapped
 * commands, and every backticked `--flag` whose param a note names (prose-only and gated flags
 * such as `--allow-launch` appear in no command). Notes are schema-checked in axiom-mcp's tests.
 */
export function wrappedFlagsIn(texts: Iterable<string>): ReadonlySet<string> {
  const subcommands = [...MCP_SUBCOMMANDS.keys()];
  return new Set([...texts].flatMap((text) => {
    const noted = new Set(mcpClientNoteBodies(text).flatMap((body) =>
      [...body.matchAll(/`([a-z][A-Za-z0-9]*)(?::[^`]*)?`/g)].map((m) => m[1].replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))));
    const prose = [...text.matchAll(/`--([a-z][a-z0-9-]*)/g)].map((m) => m[1]).filter((flag) => noted.has(flag));
    return [...wrappedCommandFlags(text, subcommands), ...prose];
  }));
}

/**
 * Fail the build when a Cursor agent or command still carries a CLI-only mechanic: a binary's
 * env var, a `command -v` check for a wrapped binary, reference arguments that leave flags for
 * the model to translate, or a backticked flag canonical text passes to a wrapped command. Run
 * per file, so a rewrite that still fires elsewhere cannot hide a file it no longer matches.
 */
export function assertNoCliResidue(content: string, file: string, wrappedFlags: ReadonlySet<string>): void {
  const flags = [...wrappedFlags].sort((a, b) => b.length - a.length).map((f) => f.replace(/[-]/g, "\\-"));
  const residue: ReadonlyArray<[RegExp, string]> = [
    [new RegExp(`\\b(?:${WRAPPED_BINARIES.map((b) => b.toUpperCase()).join("|")})_[A-Z_]+\\b`), "a wrapped binary's environment variable"],
    [new RegExp(`command -v ${WRAPPED_BINARY_PATTERN}\\b`), "a command -v check for a wrapped binary"],
    [/structured inputs matching reference arguments `[^`]*--/, "reference arguments with flags"],
    ...(flags.length > 0 ? [[new RegExp(`\`--(?:${flags.join("|")})(?![a-z0-9-])`), "a wrapped command's flag"] as [RegExp, string]] : []),
  ];
  for (const [pattern, what] of residue) {
    const hit = content.match(pattern);
    if (hit) throw new Error(`${file} still carries ${what} for Cursor: ${hit[0]} — add an MCP-only clients note at its source, or a tracked rewrite`);
  }
}

export function assertNoUnsupportedClaudeTokens(content: string): void {
  for (const [pattern, token] of UNSUPPORTED_TOKENS) {
    if (pattern.test(content)) {
      throw new Error(`unsupported Claude token: ${token}`);
    }
  }
}

function isExternalPointer(pointer: string): boolean {
  return pointer.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(pointer);
}

function assertSafeVirtualPath(filePath: string): void {
  if (!filePath || path.posix.isAbsolute(filePath) || filePath.split("/").includes("..")) {
    throw new Error(`unsafe virtual path: ${filePath}`);
  }
}

function pointerCandidates(filePath: string, pointer: string): string[] {
  const clean = pointer.split(/[?#]/, 1)[0] ?? "";
  if (!clean || isExternalPointer(clean)) return [];

  const candidates = [path.posix.normalize(path.posix.join(path.posix.dirname(filePath), clean))];
  if (clean.startsWith("skills/")) {
    const segments = filePath.split("/");
    if (segments[0] === "skills" && segments.length >= 3) {
      candidates.push(path.posix.normalize(path.posix.join(segments[0], segments[1] ?? "", clean)));
    }
  } else if (/^axiom-[a-z0-9-]+\/(?:skills|references|scripts|assets)\//.test(clean)) {
    candidates.push(`skills/${clean}`);
  } else {
    candidates.push(path.posix.normalize(clean));
  }
  return [...new Set(candidates)];
}

function localPointers(content: string): string[] {
  const pointers: string[] = [];
  for (const match of content.matchAll(/\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
    pointers.push(match[1] ?? "");
  }
  for (const match of content.matchAll(/^[ \t]{0,3}\[[^\]]+\]:[ \t]*(?:<([^>]+)>|(\S+))/gm)) {
    pointers.push(match[1] ?? match[2] ?? "");
  }
  for (const match of content.matchAll(/`((?:skills|references|scripts|assets)\/[^`\s]+|axiom-[a-z0-9-]+\/(?:skills|references|scripts|assets)\/[^`\s]+)`/g)) {
    pointers.push(match[1] ?? "");
  }
  return pointers;
}

export function validateCursorReferences(files: ReadonlyMap<string, VirtualFile>): void {
  for (const [filePath, file] of files) {
    assertSafeVirtualPath(filePath);
    if (file.path !== filePath) {
      throw new Error(`virtual file path key mismatch: ${filePath}`);
    }
  }

  for (const [filePath, file] of files) {
    for (const pointer of localPointers(file.content)) {
      const candidates = pointerCandidates(filePath, pointer);
      const clean = pointer.split(/[?#]/, 1)[0] ?? "";
      const crossSuiteMatches = clean.startsWith("skills/")
        ? [...files.keys()].filter((candidate) => candidate.endsWith(`/${clean}`))
        : [];
      if (
        candidates.length > 0
        && !candidates.some((candidate) => files.has(candidate))
        && crossSuiteMatches.length !== 1
      ) {
        throw new Error(`unresolved local reference from ${filePath}: ${pointer}`);
      }
    }
  }
}
