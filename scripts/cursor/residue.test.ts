import assert from "node:assert/strict";
import test from "node:test";
import { assertNoCliResidue, rewriteCursorMcpWorkflows, wrappedFlagsIn } from "./references.ts";
import { loadCursorSource } from "./source.ts";

const source = loadCursorSource(process.cwd());
const flags = wrappedFlagsIn([...source.agents.map((a) => a.body), ...source.commands.map((c) => c.body)]);

test("derives the flags from canonical commands and from flags named in prose beside their notes", () => {
  // A derivation that missed these would let the flag check pass on exactly the gated flags.
  const expected = ["format", "no-spotlight", "time-limit", "allow-launch", "allow-all-processes", "dsym", "max-duration", "arch"];
  assert.deepEqual(expected.filter((f) => !flags.has(f)), [], [...flags].join(", "));
});

for (const [name, content, message] of [
  ["a wrapped binary's env var", "Set `XCSYM_DSYM_PATHS` first.", /environment variable for Cursor: XCSYM_DSYM_PATHS/],
  ["a command -v check", "Run `command -v xcprof` first.", /command -v check/],
  ["reference arguments with flags", "the `axiom_xcsym_crash` MCP tool with structured inputs matching reference arguments `<f> --no-spotlight`", /reference arguments with flags/],
  ["a wrapped command's flag", "Pass `--allow-launch` only with consent.", /a wrapped command's flag for Cursor: `--allow-launch/],
] as const) {
  test(`fails a Cursor file that still carries ${name}`, () => {
    assert.throws(() => assertNoCliResidue(content, "agents/x.md", flags), message);
  });
}

test("passes MCP text, other tools' flags, and a longer flag that shares a prefix", () => {
  assertNoCliResidue("Call `axiom_xcsym_crash` with `file` and `noSpotlight: true`; run `swift build --no-spotlight`; `--no-spotlightish`.", "agents/x.md", flags);
});

test("renders a covered command and a prose flag to their notes' MCP form", () => {
  const out = rewriteCursorMcpWorkflows(
    "Run `xcsym crash --no-spotlight <file>` (MCP-only clients: `axiom_xcsym_crash` with `file` and `noSpotlight: true`), passing `--dsym-paths <dir>` (MCP-only clients: `dsymPaths`) if known.",
  );
  assert.equal(out, "Run `axiom_xcsym_crash` with `file` and `noSpotlight: true`, passing `dsymPaths` if known.");
});
