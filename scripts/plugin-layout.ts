/**
 * Pre-deploy check 1c: claude.ai and Claude Desktop refuse to install a
 * plugin that has a top-level bin/ ("Plugin contains a top-level bin/ directory"),
 * which is why the bundled tools live in plugins/axiom/tools/.
 *
 * The verdict is a pure function of two facts, so each way a bin/ can survive the
 * move is testable: what lstat sees on disk (a dangling symlink still counts,
 * which existsSync would miss) and whether git indexes anything under it (null
 * when git is unavailable, so the disk half still runs without git).
 */

export type BinOnDisk = "absent" | "directory" | "symlink" | "file";

export interface PluginBinInput {
  binRel: string;
  onDisk: BinOnDisk;
  tracked: boolean | null;
  gitError?: string;
}

export interface PluginBinVerdict {
  level: "ok" | "error";
  kind: "clean" | "on-disk" | "untracked-leftover" | "indexed" | "git-unavailable";
  message: string;
}

export function resolvePluginBin({ binRel, onDisk, tracked, gitError }: PluginBinInput): PluginBinVerdict {
  if (onDisk !== "absent" && tracked === false)
    return {
      level: "error",
      kind: "untracked-leftover",
      message: `${binRel} is on disk (${onDisk}) but nothing in it is tracked: likely a leftover, such as a .DS_Store kept after the move to tools/, or a tool never committed. A local install of this folder is still refused by claude.ai; move anything you need into plugins/axiom/tools/, then delete it: rm -rf ${binRel}`,
    };
  if (onDisk !== "absent")
    return {
      level: "error",
      kind: "on-disk",
      message: `${binRel} exists (${onDisk}); claude.ai and Claude Desktop refuse to install a plugin with a top-level bin/. Keep executables in plugins/axiom/tools/`,
    };
  if (tracked === true)
    return {
      level: "error",
      kind: "indexed",
      message: `${binRel}/ is gone from disk but still in the git index, so a commit made now ships it and claude.ai refuses the plugin; stage the deletion (git add -A ${binRel})`,
    };
  if (tracked === null)
    return {
      level: "error",
      kind: "git-unavailable",
      message: `no ${binRel} on disk, but git could not say whether one is still indexed and would ship${gitError ? `: ${gitError}` : ""}`,
    };
  return { level: "ok", kind: "clean", message: "no top-level bin/ in the plugin, so claude.ai can install it" };
}

/**
 * Pre-deploy check 1d. A file under docs/ or the plugin that an ignore rule hides is
 * never committed, so it never ships, while every local gate still sees it on disk.
 * Observed 2026-10-13: `.gitignore`'s `CLAUDE*.md`, matched case-insensitively on
 * macOS, hid docs/start/claude-app-install.md; the sidebar, README and three install
 * pages linked a page the published site would not have.
 *
 * Judged by the rule that hid each file (from `git check-ignore -v`), not its path:
 * editor, OS, log, environment, Python and dependency rules are clutter wherever they
 * match, and the VitePress build output is generated. Any other rule hiding a file
 * here is a defect.
 */
// Compared after normalizing, so a global excludes file's `**/.DS_Store` or `.vscode/` matches too.
const normalizeRule = (rule: string) => rule.replace(/^\*\*\//, "").replace(/\/\*\*$/, "").replace(/\/$/, "");

const CLUTTER_RULES = new Set([
  ".DS_Store", "Thumbs.db", "._*", ".AppleDouble", "*.swp", "*.swo", "*.sw[op]", "*~", "*.orig", "*.rej",
  ".idea", ".vscode", ".claude/settings.local.json",
  "*.log", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*",
  ".env", ".env.local", ".env.*.local", "__pycache__", "*.pyc", "*.py[cod]", ".pytest_cache", "node_modules",
  "docs/.vitepress/cache", "docs/.vitepress/dist",
].map(normalizeRule));

// Planning docs are ignored on purpose, and check 12c tells the author to move them out of docs/.
const OWNED_BY_12C = new Set(["docs/superpowers", "docs/plans", "docs/specs"]);

/** Ignored paths that look authored. `roots` drops anything outside them: `git ls-files
 * --directory` also lists a directory whose name prefixes a pathspec (.claude/ for .claude-plugin/). */
export function findIgnoredAuthoredFiles(ignored: ReadonlyArray<{ path: string; rule: string }>, roots?: readonly string[]): string[] {
  return ignored
    .filter(({ path, rule }) => {
      const r = normalizeRule(rule);
      return path !== "" && !CLUTTER_RULES.has(r) && !OWNED_BY_12C.has(r) && (!roots || roots.some((root) => path.startsWith(root)));
    })
    .map(({ path }) => path);
}
