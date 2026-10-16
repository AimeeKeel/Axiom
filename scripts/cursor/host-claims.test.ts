import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {
  assertHostClaimRewritesFired,
  resetHostClaimRewriteTracking,
  rewriteCursorInvocations,
  rewriteCursorSkillReferences,
} from "./references.ts";

test("a host-claim rewrite that matches no canonical prose fails the build", () => {
  // Simulates canonical wording drifting out from under a pinned pattern: with nothing
  // rewritten since the reset, every pattern is dead and the build must refuse to ship.
  resetHostClaimRewriteTracking();
  assert.throws(
    () => assertHostClaimRewritesFired(),
    /matched no canonical text/,
  );
});

for (const name of ["xclog", "xcsym", "xcui", "xcprof"]) {
  test(`Cursor ${name} guidance excludes Codex package paths and Claude PATH claims`, () => {
    const source = fs.readFileSync(`.claude-plugin/plugins/axiom/skills/axiom-tools/skills/${name}-ref.md`, "utf8");
    const rewritten = rewriteCursorSkillReferences(source);
    assert.equal(/Codex plugin installs|<plugin-root>|\*\*(?:Claude Code|Codex|Pi)\*\*/.test(rewritten), false, `${name} retained another harness invocation`);
    assert.match(rewritten, /In Cursor,/);
  });
}

test("rewrites named agent launches but leaves article phrases alone (Axiom-d7x2)", () => {
  const cases: Array<[string, string]> = [
    ["Launch the build-fixer agent now.", "Delegate to the `build-fixer` subagent now."],
    ["- Launching an agent via Xcode config (`xcrun mcpbridge run-agent`)", "- Launching an agent via Xcode config (`xcrun mcpbridge run-agent`)"],
    ["## Letting Xcode Launch the Agent (`run-agent`)", "## Letting Xcode Launch the Agent (`run-agent`)"],
    ["Do not launch the agent.", "Do not delegate to the subagent."],
    ["before launching the agent (it has no Bash tool)", "before delegating to the subagent (it has no Bash tool)"],
    ["Xcode launches a agent", "Xcode launches a agent"],
    ["Prompts that should launch this agent:", "Prompts that should delegate to this subagent:"],
  ];
  for (const [input, expected] of cases) assert.equal(rewriteCursorInvocations(input), expected, input);
});
