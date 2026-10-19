import assert from "node:assert/strict";
import { test } from "node:test";
import { transformAgent } from "./agents.ts";
import { compareCursorPaths } from "./compare.ts";
import { buildCapabilityReport } from "./report.ts";
import { loadCursorSource } from "./source.ts";

function fixture() {
  const source = loadCursorSource(process.cwd());
  const agents = source.agents.map((agent) => transformAgent(agent, "full"));
  return { source, report: buildCapabilityReport(source, agents) };
}

test("capability report enumerates exactly the canonical router, agent, and command inventories", () => {
  const { source, report } = fixture();
  const canonicalRouters = source.skills.map((skill) => skill.name).sort(compareCursorPaths);
  const canonicalAgents = source.agents.map((agent) => agent.name).sort(compareCursorPaths);
  const canonicalCommands = source.commands.map((command) => command.name).sort(compareCursorPaths);

  assert.deepEqual(
    report.routerDispositions.map((row) => row.name),
    canonicalRouters,
  );
  assert.ok(report.routerDispositions.every((row) => row.disposition === "generated-native-skill"));
  assert.deepEqual(
    report.agentDispositions.map((row) => row.name),
    canonicalAgents,
  );
  assert.ok(report.agentDispositions.every((row) =>
    row.disposition === "generated-native-subagent"
      && typeof row.sourceBackground === "boolean"
      && typeof row.releasedBackground === "boolean"
      && (row.authority === "readonly" || row.authority === "writable")
      && row.sourceTools.length > 0
      && row.inheritedAuthority === "Cursor agent inherits its host tool and MCP access.",
  ));
  assert.deepEqual(
    report.commandDispositions.map((row) => row.canonicalName),
    canonicalCommands,
  );
  assert.deepEqual(
    report.commandDispositions.map((row) => row.generatedName),
    canonicalCommands.map((name) => `axiom-${name}`),
  );
  assert.ok(report.commandDispositions.every((row) => row.disposition === "generated-native-command"));
});

test("capability report has only supported global hook coverage", () => {
  const { source, report } = fixture();
  const expectedIds = source.hooks.map((hook) => [
    hook.source,
    hook.owner ?? "global",
    hook.event,
    hook.matcher ?? "*",
  ].join(":"));

  assert.deepEqual(
    report.hookDispositions.map((row) => row.id),
    expectedIds.sort(compareCursorPaths),
  );
  assert.equal(new Set(report.hookDispositions.map((row) => row.id)).size, source.hooks.length);
  assert.equal(report.perAgentHooks, 0);
  assert.deepEqual(report.hookDispositions.filter((row) => row.source === "agent"), []);
});

test("capability report explicitly accounts for MCP, every binary, and Cloud", () => {
  const { report } = fixture();
  assert.deepEqual(report.mcpDispositions, [{
    name: "axiom",
    disposition: "external-runtime-mcp",
    command: "npx -y axiom-mcp",
    bundled: false,
  }]);
  assert.deepEqual(report.binaryDispositions, [
    { name: "xclog", disposition: "external-via-axiom-mcp" },
    { name: "xcprof", disposition: "external-via-axiom-mcp" },
    { name: "xcsym", disposition: "external-via-axiom-mcp" },
    { name: "xcui", disposition: "separate-checkout-no-mcp-wrapper" },
  ]);
  assert.deepEqual(report.cloudDispositions, [{
    name: "Cursor Cloud Agents",
    disposition: "unsupported",
  }]);
});
