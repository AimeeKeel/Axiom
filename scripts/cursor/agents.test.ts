import assert from "node:assert/strict";
import { test } from "node:test";
import matter from "gray-matter";
import { transformAgent } from "./agents.ts";
import { buildCapabilityReport } from "./report.ts";
import { CURSOR_FORCED_FOREGROUND, CURSOR_HOOK_EXPECTATIONS } from "./contract.ts";
import { loadCursorSource } from "./source.ts";
import type { SourceAgent } from "./types.ts";
import { MCP_SUBCOMMANDS, WRAPPED_BINARY_PATTERN } from "./references.ts";

// A Cursor agent that still says `command -v xcsym` or starts a line with a wrapped command
// would send Cursor users to a binary the plugin does not install.
const wrappedCommandResidue = new RegExp(
  `command -v ${WRAPPED_BINARY_PATTERN}\\b|^\\s*(?:${[...MCP_SUBCOMMANDS.keys()].map((c) => c.replace(" ", "\\s+")).join("|")})\\b`,
  "m",
);

const readonlyAgent: SourceAgent = {
  name: "readonly-auditor",
  filename: "readonly-auditor.md",
  frontmatter: {
    name: "readonly-auditor",
    description: "Reads source files.",
    model: "sonnet",
    background: true,
    tools: ["Glob", "Grep", "Read"],
    skills: ["axiom-testing"],
  },
  body: "# Readonly Auditor\n",
  tools: ["Glob", "Grep", "Read"],
};

const screenshotValidator: SourceAgent = {
  name: "screenshot-validator",
  filename: "screenshot-validator.md",
  frontmatter: {
    name: "screenshot-validator",
    description: "Validates screenshots.",
    background: true,
    tools: ["Glob", "Read", "Bash"],
  },
  body: "# Screenshot Validator\n",
  tools: ["Glob", "Read", "Bash"],
};

test("full profile maps read-only background authority", () => {
  const result = transformAgent(readonlyAgent, "full");
  assert.equal(result.authority, "readonly");
  assert.equal(result.releasedBackground, true);
  assert.match(result.file.content, /model: inherit/);
  assert.match(result.file.content, /readonly: true/);
  assert.match(result.file.content, /is_background: true/);
});

test("writable screenshot-validator is forced foreground", () => {
  const result = transformAgent(screenshotValidator, "full");
  assert.equal(result.authority, "writable");
  assert.equal(result.releasedBackground, false);
  assert.match(result.file.content, /is_background: false/);
});

test("minimal profile omits enforcement fields and never ships", () => {
  const result = transformAgent(readonlyAgent, "minimal");
  assert.equal(result.releasedBackground, false);
  assert.doesNotMatch(result.file.content, /model:|readonly:|is_background:/);
});

test("preserves required skills without inventing hook compatibility metadata", () => {
  const source = loadCursorSource(process.cwd());
  const buildFixer = source.agents.find((agent) => agent.name === "build-fixer");
  assert.ok(buildFixer);
  const result = transformAgent(buildFixer, "full");
  assert.match(result.file.content, /## Required Skills/);
  assert.match(result.file.content, /`axiom-build`/);
  assert.doesNotMatch(result.file.content, /## Advisory Hook Compatibility/);
});

test("should preserve all six agent warnings in canonical body steps without frontmatter hooks", () => {
  const warnings = {
    "build-fixer": /Before running[^\n]*`killall`[^\n]*DerivedData[^\n]*`xcrun simctl erase`[^\n]*Destructive command detected/,
    "build-optimizer": /Before[^\n]*`\.pbxproj`[^\n]*`\.xcproj`[^\n]*Modifying Xcode project file\. Ensure backup exists/,
    "iap-implementation": /Before[^\n]*StoreKit[^\n]*`\.storekit`[^\n]*Modifying StoreKit configuration/,
    "simulator-tester": /Before[^\n]*`simctl`[^\n]*erases, deletes, shuts down, or boots[^\n]*Simulator state change command/,
    "test-debugger": /Before deleting[^\n]*`\.xcresult`[^\n]*`rm -rf`[^\n]*About to delete test results/,
    "test-runner": /Before deleting[^\n]*`\.xcresult`[^\n]*`rm -rf`[^\n]*About to delete test results/,
  };
  const source = loadCursorSource(process.cwd());
  for (const [owner, warning] of Object.entries(warnings)) {
    const agent = source.agents.find((candidate) => candidate.name === owner);
    assert.ok(agent, owner);
    assert.equal(agent.frontmatter.hooks, undefined, owner);
    assert.match(agent.body, warning, owner);
    assert.match(transformAgent(agent, "full").file.content, warning, owner);
  }
});

test("rejects unsupported frontmatter hooks on any agent", () => {
  assert.throws(() => transformAgent({
    ...readonlyAgent,
    frontmatter: { ...readonlyAgent.frontmatter, hooks: { PreToolUse: [] } },
  }, "full"), /unknown agent frontmatter field: hooks/);
});

test("reduces agent descriptions to the first concise routing paragraph", () => {
  const result = transformAgent({
    ...readonlyAgent,
    frontmatter: {
      ...readonlyAgent.frontmatter,
      description: [
        "Use this agent when source files need a focused read-only audit. This second sentence is implementation detail, not routing metadata.",
        "",
        "<example>",
        "assistant: [Launches readonly-auditor agent]",
        "</example>",
      ].join("\n"),
    },
  }, "full");

  assert.equal(
    matter(result.file.content).data.description,
    "Use this agent when source files need a focused read-only audit.",
  );
});

test("renders every canonical agent with native Cursor delegation language", () => {
  const files = loadCursorSource(process.cwd()).agents.map((agent) => transformAgent(agent, "full").file);
  const forbidden = /subagent_type|run_in_background|\bAgent calls?\b|delegated subagent result(?: tool)?|\b(?:agent|auditor)s?['’]s? launch\b|\b(?:automatically\s+)?launch(?:es|ed|ing)?\b(?=[^\n.]{0,120}\b(?:agent|subagent|auditor)s?\b)/i;

  for (const file of files) {
    const parsed = matter(file.content);
    assert.equal(typeof parsed.data.description, "string", file.path);
    assert.ok(parsed.data.description.length <= 250, `${file.path}: ${parsed.data.description.length}`);
    assert.doesNotMatch(parsed.data.description, /<example>|\bClaude\b|CLI-based|\b(?:automatically\s+)?launch(?:es|ed|ing)?\b(?=[^\n.]{0,120}\b(?:agent|subagent|auditor)s?\b)/i, file.path);
    assert.doesNotMatch(file.content, forbidden, file.path);
  }
});

test("routes agent binary workflows through Axiom MCP tools and gives xcui a degraded path", () => {
  const transformed = new Map(loadCursorSource(process.cwd()).agents.map((agent) => [
    agent.name,
    transformAgent(agent, "full").file.content,
  ]));
  const expectedTools = {
    "performance-profiler": ["axiom_xcprof_doctor", "axiom_xcprof_record", "axiom_xcprof_analyze", "axiom_xcprof_compare"],
    "crash-analyzer": ["axiom_xcsym_crash", "axiom_xcsym_verify", "axiom_xcsym_find_dsym"],
    "triage-analyzer": ["axiom_xcsym_triage"],
    "test-failure-analyzer": ["axiom_xcsym_crash"],
    "memory-auditor": ["axiom_xcsym_crash"],
    "energy-auditor": ["axiom_xcsym_crash"],
  } as const;

  for (const [agent, tools] of Object.entries(expectedTools)) {
    const content = transformed.get(agent);
    assert.ok(content, agent);
    for (const tool of tools) assert.match(content, new RegExp(`\\b${tool}\\b`), `${agent}: ${tool}`);
    assert.match(content, /If a required MCP tool is unavailable, stop and report that the Axiom MCP integration is missing/);
    assert.doesNotMatch(content, /fall back to (?:the )?(?:raw CLI|legacy manual parsing)|(?:xcsym|xcprof) not found|If (?:`xcprof`|xcsym) is (?:NOT |still )?(?:absent|present)/i, agent);
    assert.doesNotMatch(content, /XCSYM_DSYM_PATHS=[^\n]*`axiom_(?:xclog|xcsym|xcprof)_/, agent);
  }
  for (const [agent, content] of transformed) {
    assert.doesNotMatch(content, wrappedCommandResidue, agent);
  }

  const simulator = transformed.get("simulator-tester");
  assert.ok(simulator);
  assert.match(simulator, /`xcui` is Axiom's own tool, distributed separately from the Cursor plugin/);
  assert.match(simulator, /check `command -v xcui`/);
  assert.match(simulator, /check `command -v axe`/);
  assert.match(simulator, /If neither tool is available, stop UI automation/);
});

test("preserves concrete profiling arguments in emitted MCP guidance", () => {
  const source = loadCursorSource(process.cwd());
  const profiler = source.agents.find((agent) => agent.name === "performance-profiler");
  assert.ok(profiler);
  const content = transformAgent(profiler, "full").file.content;

  assert.match(content, /axiom_xcprof_record[^\n]*preset: "cpu"[^\n]*attach: "<app>"[^\n]*timeLimit: "10s"/);
  assert.match(content, /axiom_xcprof_record[^\n]*instruments: \["SwiftUI", "CPU Profiler"\][^\n]*attach: "<app>"[^\n]*timeLimit: "10s"/);
  // These two now come from the canonical MCP-only clients notes, which name the params.
  assert.match(content, /`axiom_xcprof_analyze` with `trace`, `startMs`, and `endMs`/);
  assert.match(content, /`axiom_xcprof_compare` with `baseline` and `current`/);
  assert.match(content, /failOnRegression: true/);
  assert.match(content, /dsym: "<path>"/);
  assert.doesNotMatch(content, /axiom_xcprof_record` MCP tool[^\n]*--(?:preset|instrument|attach|time-limit)/);
});

test("describes xcui ownership and setup and limits AXe fallback to compatible input verbs", () => {
  const source = loadCursorSource(process.cwd());
  const simulator = source.agents.find((agent) => agent.name === "simulator-tester");
  assert.ok(simulator);
  const content = transformAgent(simulator, "full").file.content;

  assert.match(content, /`xcui` is Axiom's own tool, distributed separately from the Cursor plugin/);
  assert.match(content, /AXe fallback is limited to compatible input verbs/);
  assert.match(content, /AXe cannot replace `wait`, `assert`, `a11y`, `dialog`, `voiceover`, `resize`, or `doctor`/);
  assert.doesNotMatch(content, /on PATH automatically only on Claude Code|`xcui` \(bundled\)|\*\*xcui\*\*: bundled/i);
  assert.doesNotMatch(content, /use AXe directly with equivalent arguments/);
});

test("rejects agents whose filename does not match their canonical name", () => {
  assert.throws(
    () => transformAgent({ ...readonlyAgent, filename: "other.md" }, "full"),
    /agent filename must match name: other.md/,
  );
});

test("builds the reviewed capability report from canonical source", () => {
  const source = loadCursorSource(process.cwd());
  const report = buildCapabilityReport(source, source.agents.map((agent) => transformAgent(agent, "full")));
  assert.deepEqual({
    routers: report.routers,
    agents: report.agents,
    commands: report.commands,
    excludedMirrors: report.excludedMirrors,
    globalHookEntries: report.globalHookEntries,
    perAgentHooks: report.perAgentHooks,
  }, {
    routers: source.skills.length,
    agents: source.agents.length,
    commands: source.commands.length,
    excludedMirrors: source.excludedMirrors,
    globalHookEntries: CURSOR_HOOK_EXPECTATIONS.globalHookEntries,
    perAgentHooks: CURSOR_HOOK_EXPECTATIONS.perAgentHooks,
  });
  assert.equal(
    report.releasedReadonlyBackground + report.releasedWritableForeground,
    source.agents.length,
    "every released agent is either read-only background or writable foreground",
  );
  assert.equal(report.authorityExpansions.length, source.agents.length);
});

test("reports the observed generated-mirror count without pinning it", () => {
  const source = loadCursorSource(process.cwd());
  const agents = source.agents.map((agent) => transformAgent(agent, "full"));
  assert.ok(Number.isSafeInteger(source.excludedMirrors) && source.excludedMirrors >= 0);
  assert.equal(buildCapabilityReport(source, agents).excludedMirrors, source.excludedMirrors);
  assert.equal(
    buildCapabilityReport({ ...source, excludedMirrors: source.excludedMirrors + 1 }, agents).excludedMirrors,
    source.excludedMirrors + 1,
    "the mirror count is reported from source, not asserted against a frozen literal",
  );
});

test("rejects duplicate transformed names that omit a canonical agent", () => {
  const source = loadCursorSource(process.cwd());
  const transformed = source.agents.map((agent) => transformAgent(agent, "full"));
  const duplicateAccessibility = transformed.map((agent) =>
    agent.name === "camera-auditor" ? { ...agent, name: "accessibility-auditor" } : agent,
  );
  assert.throws(
    () => buildCapabilityReport(source, duplicateAccessibility),
    /transformed agent names differ from source/,
  );
});

test("forced-foreground exclusion reaches the emitted frontmatter, not just the report", () => {
  const forced = [...CURSOR_FORCED_FOREGROUND][0];
  const transformed = transformAgent(
    {
      name: forced,
      filename: `${forced}.md`,
      frontmatter: { name: forced, description: "Probe agent.", background: true, tools: ["Glob", "Grep", "Read"] },
      body: "Probe body.",
      tools: ["Glob", "Grep", "Read"],
    },
    "full",
  );
  assert.equal(transformed.releasedBackground, false, "report must say foreground");
  assert.match(
    transformed.file.content,
    /^is_background: false$/m,
    "emitted frontmatter must agree with the report",
  );
});

test("rendered agents give only instructions the MCP tool schemas can follow (Axiom-dyfi.8)", () => {
  const transformed = new Map(loadCursorSource(process.cwd()).agents.map((agent) => [
    agent.name,
    transformAgent(agent, "full").file.content,
  ]));
  const contradictions: Record<string, RegExp[]> = {
    "crash-analyzer": [/`XCSYM_[A-Z_]+`/, /Pass `--arch`/, /Retry with `--no-spotlight`/, /accept `-` as the file argument/, /setting `--dsym-paths`/, /`XCSYM_FRAMEWORK_SCAN_TIMEOUT`/, /check the `--output` path/],
    "triage-analyzer": [/< \/tmp\/corpus\.jsonl/],
    "performance-profiler": [/Pass `--no-prompt`/, /`--all-processes --allow-all-processes`/, /add `--dry-run`/],
  };
  for (const [agent, patterns] of Object.entries(contradictions)) {
    const content = transformed.get(agent);
    assert.ok(content, agent);
    for (const pattern of patterns) assert.doesNotMatch(content, pattern, `${agent}: ${pattern}`);
  }
});
