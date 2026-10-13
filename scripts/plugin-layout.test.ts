/**
 * Tests for scripts/plugin-layout.ts (pre-deploy check 1c).
 *
 * claude.ai and the Claude desktop app refuse a plugin with a top-level bin/.
 * Each case is one way a bin/ can survive the move to tools/, keyed by what
 * lstat sees on disk and what git has indexed (null when git is unavailable).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findIgnoredAuthoredFiles, resolvePluginBin, type PluginBinInput } from "./plugin-layout.ts";

const BIN = ".claude-plugin/plugins/axiom/bin";

describe("resolvePluginBin", () => {
  const cases: Array<[string, Omit<PluginBinInput, "binRel">, { level: string; kind: string }]> = [
    ["no bin/ anywhere", { onDisk: "absent", tracked: false }, { level: "ok", kind: "clean" }],
    ["a tracked bin/ directory", { onDisk: "directory", tracked: true }, { level: "error", kind: "on-disk" }],
    ["a dangling bin symlink, untracked", { onDisk: "symlink", tracked: false }, { level: "error", kind: "untracked-leftover" }],
    ["a bin/ holding only untracked files", { onDisk: "directory", tracked: false }, { level: "error", kind: "untracked-leftover" }],
    ["a bin/ on disk with git unavailable", { onDisk: "directory", tracked: null }, { level: "error", kind: "on-disk" }],
    ["bin/ deleted but still indexed", { onDisk: "absent", tracked: true }, { level: "error", kind: "indexed" }],
    ["no bin/ on disk, git unavailable", { onDisk: "absent", tracked: null }, { level: "error", kind: "git-unavailable" }],
  ];
  for (const [name, input, expected] of cases) {
    it(`${name} → ${expected.level} (${expected.kind})`, () => {
      const { level, kind } = resolvePluginBin({ binRel: BIN, ...input });
      assert.deepEqual({ level, kind }, expected);
    });
  }

  it("says to keep needed files before naming the folder to delete", () => {
    assert.match(resolvePluginBin({ binRel: BIN, onDisk: "directory", tracked: false }).message, new RegExp(`move anything you need into .*tools/.* rm -rf ${BIN}`));
  });

  it("carries git's own error when git cannot answer", () => {
    assert.match(resolvePluginBin({ binRel: BIN, onDisk: "absent", tracked: null, gitError: "spawn git ENOENT" }).message, /spawn git ENOENT/);
  });
});

describe("findIgnoredAuthoredFiles", () => {
  it("flags a file hidden by a project rule, and skips editor, OS, Python and build clutter", () => {
    const ignored = [
      { path: "docs/start/claude-app-install.md", rule: "CLAUDE*.md" },
      { path: ".claude-plugin/plugins/axiom/skills/axiom-tools/skills/notes.md", rule: "notes/" },
      { path: "docs/.vitepress/dist/index.html", rule: "docs/.vitepress/dist" },
      { path: "docs/.vitepress/cache/deps/x.js", rule: "docs/.vitepress/cache" },
      { path: ".claude-plugin/plugins/axiom/hooks/__pycache__/x.pyc", rule: "__pycache__" },
      { path: "docs/public/.DS_Store", rule: ".DS_Store" },
      { path: "docs/start/.install.md.swp", rule: "*.swp" },
      { path: "docs/start/install.md~", rule: "*~" },
      { path: "docs/.idea/workspace.xml", rule: ".idea/" },
      { path: "docs/.vscode/settings.json", rule: ".vscode/" },
      { path: "docs/build.log", rule: "*.log" },
      { path: "docs/node_modules/vue/index.js", rule: "node_modules/" },
    ];
    assert.deepEqual(findIgnoredAuthoredFiles(ignored), [
      "docs/start/claude-app-install.md",
      ".claude-plugin/plugins/axiom/skills/axiom-tools/skills/notes.md",
    ]);
  });
  it("leaves planning docs to check 12c, and skips common machine-wide clutter rules", () => {
    const ignored = [
      { path: "docs/plans/2026-10-13-x.md", rule: "docs/plans/" },
      { path: "docs/specs/y.md", rule: "docs/specs/" },
      { path: "docs/superpowers/z.md", rule: "docs/superpowers/" },
      { path: "docs/.vscode/settings.json", rule: ".vscode" },
      { path: "docs/start/._install.md", rule: "._*" },
      { path: "docs/start/install.md.orig", rule: "*.orig" },
      { path: "docs/start/install.md.rej", rule: "*.rej" },
      { path: "docs/.claude/settings.local.json", rule: "**/.claude/settings.local.json" },
      { path: "docs/start/install.md", rule: "*.md" },
    ];
    assert.deepEqual(findIgnoredAuthoredFiles(ignored), ["docs/start/install.md"]);
  });
  it("matches clutter rules however a global excludes file spells them", () => {
    const ignored = [
      { path: "docs/public/.DS_Store", rule: "**/.DS_Store" },
      { path: ".claude-plugin/plugins/axiom/hooks/.pytest_cache/", rule: ".pytest_cache/" },
      { path: ".claude-plugin/plugins/axiom/hooks/x.pyc", rule: "*.pyc" },
      { path: "docs/.vscode/", rule: "**/.vscode/" },
      { path: "docs/.idea/", rule: ".idea/**" },
      { path: "docs/node_modules/", rule: "**/node_modules/**" },
      { path: ".claude-plugin/plugins/axiom/hooks/x.pyo", rule: "*.py[cod]" },
      { path: "docs/start/.x.swo", rule: "*.sw[op]" },
      { path: "docs/.AppleDouble/", rule: ".AppleDouble" },
    ];
    assert.deepEqual(findIgnoredAuthoredFiles(ignored), []);
  });
  it("drops paths outside the given roots, which git ls-files --directory can list", () => {
    const ignored = [{ path: ".claude/", rule: ".claude/" }, { path: "docs/start/a.toml", rule: "*.toml" }];
    assert.deepEqual(findIgnoredAuthoredFiles(ignored, ["docs/", ".claude-plugin/plugins/axiom/"]), ["docs/start/a.toml"]);
  });
});
