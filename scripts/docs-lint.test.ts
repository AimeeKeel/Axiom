/**
 * Tests for scripts/docs-lint.ts (pre-deploy check 12u).
 *
 * Four defect classes that shipped on many docs pages without any review or gate
 * catching them, measured 2026-10-13 across 403 pages: "ask Claude" on 126 pages
 * (from the doc templates themselves), a Documentation Scope line naming a
 * different skill than the page's frontmatter on 67, Documentation Scope repeating
 * Related links on 113, and " -- " standing in for a dash on 14.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findMissingSidebarTargets, findMissingTools, findUnreachablePages, findNonLiteralSidebarLinks, findPluginReadmeDrift, lintDocPage, nestedFenceViolations, sidebarLinkTargets } from "./docs-lint.ts";

const ROUTERS = new Set(["axiom-networking", "axiom-swiftui", "axiom-performance"]);
const rules = (content: string) => lintDocPage(content, ROUTERS).map((f) => f.rule);

describe("lintDocPage — double hyphen", () => {
  it("flags each spaced double hyphen in prose", () => {
    assert.deepEqual(rules("The build -- not the code -- is stale.\n"), ["double-hyphen", "double-hyphen"]);
  });
  const clean: Array<[string, string]> = [
    ["count markers", "Installs all <!--ax:skills-->276<!--/ax--> skills.\n"],
    ["an HTML comment", "<!-- AXIOM_BEGIN — maintained by a script -->\n"],
    ["a CLI flag in a code span", "Run `xcprof record -- /path/to/App` to launch.\n"],
    ["a fenced code block", "```bash\nxcprof record -- ./App\n```\n"],
    ["a table separator", "| a | b |\n|---|---|\n"],
    ["frontmatter", "---\nname: x\n---\n"],
  ];
  for (const [name, content] of clean) {
    it(`ignores ${name}`, () => assert.deepEqual(rules(content), []));
  }
  it("ignores a fence indented inside a list item, and a pre block", () => {
    assert.deepEqual(rules("1. Run this:\n\n   ```bash\n   git ls-files -- docs  # Claude needs this\n   ```\n"), []);
    assert.deepEqual(rules("<pre>\nask Claude -- now\n</pre>\n"), []);
  });
  it("flags a spaced triple hyphen used as a dash, but not a table separator or rule", () => {
    assert.deepEqual(rules("The build --- not the code.\n| a | b |\n| --- | --- |\n\n---\n"), ["double-hyphen"]);
  });
  const prosey: Array<[string, string]> = [
    ["a link target", "See [the id](axiom://skill/axiom-build--xcode-debugging) and [x](#foo--bar).\n"],
    ["a double-backtick span", "Run ``git log -- f`` first.\n"],
    ["a code span that wraps a line", "Run `git\nlog -- f` first.\n"],
    ["a reference definition", "[r]: https://example.com/a--b\n"],
    ["an autolink", "<https://example.com/a--b>\n"],
    ["an HTML attribute", "Use <span class=\"btn--x\">this</span>.\n"],
    ["a script block", "<script setup>\nconst c = 'btn--x'\n</script>\n"],
    ["a style block", "<style>\n.btn--x { color: red }\n</style>\n"],
  ];
  for (const [name, content] of prosey) it(`ignores ${name}`, () => assert.deepEqual(rules(content), []));
  it("flags a dash next to a code span or a link", () => {
    const page = "| `xcsym` -- symbolicates |\n`xcsym` -- symbolicates.\nSymbolicate -- `xcsym`\nSee [it](/a) -- now.\n";
    assert.deepEqual(rules(page), ["double-hyphen", "double-hyphen", "double-hyphen", "double-hyphen"]);
  });
  it("does not open a code span inside a longer backtick run, or across a heading", () => {
    assert.deepEqual(rules("Type `` then -- and end with `.\n"), ["double-hyphen"]);
    assert.deepEqual(rules("Press the ` key.\n## Next\nThe build -- is stale `x`.\n"), ["double-hyphen"]);
  });
  it("still lints a line that only looks like a reference definition", () => {
    assert.deepEqual(rules("[Tip]: ask Claude to run it.\n"), ["claude-as-assistant"]);
  });
  it("flags an unspaced double hyphen between words", () => {
    assert.deepEqual(rules("The build--not the code--is stale.\n"), ["double-hyphen", "double-hyphen"]);
  });
  it("keeps checking prose after a code span that holds a comment opener", () => {
    assert.deepEqual(rules("Type `<!--` here. The build -- is stale. Close with `-->`.\n"), ["double-hyphen"]);
  });
  it("ignores tilde fences and a four-backtick fence holding a three-backtick one", () => {
    assert.deepEqual(rules("~~~\nask Claude -- now\n~~~\n"), []);
    assert.deepEqual(rules("````md\n```\nask Claude -- now\n```\n````\n"), []);
  });
});

describe("lintDocPage — Claude as the assistant", () => {
  const flagged = [
    "Questions you can ask Claude that will draw from this reference:\n",
    "Comprehensive guidance Claude uses when answering your questions.\n",
    "Tell Claude what's happening.\n",
  ];
  for (const line of [...flagged, "How Claude Processes your request.\n", "Claude Codex runs it.\n"]) {
    it(`flags "${line.trim()}"`, () => assert.deepEqual(rules(line), ["claude-as-assistant"]));
  }
  const products = [
    "Install it in Claude Code.\n",
    "Use Claude Desktop or claude.ai.\n",
    "The Claude desktop app refuses a top-level bin/.\n",
    "See the Claude Agent SDK and the Claude API.\n",
    "Run `claude --plugin-dir .` from a terminal.\n",
    "Add it in the Claude desktop app, not the Claude mobile app.\n",
    "## Claude App\n",
    "Sign in to the same Claude account.\n",
    "Install Claude in Chrome from the extension store.\n",
  ];
  for (const line of products) {
    it(`allows "${line.trim()}"`, () => assert.deepEqual(rules(line), []));
  }
});

describe("lintDocPage — Documentation Scope", () => {
  const page = (scopeSkill: string, scope: string, related: string) =>
    `---\nname: energy-diag\n---\n\n# Energy\n\n## Documentation Scope\n\nThis page documents the \`${scopeSkill}\` diagnostic skill.\n\n${scope}\n\n## Related\n\n${related}\n`;

  it("flags a scope line naming a different skill than the frontmatter", () => {
    assert.deepEqual(rules(page("axiom-performance", "", "- [energy](/skills/debugging/energy) – patterns")), ["scope-skill"]);
  });
  it("accepts the real sub-skill name behind an area-prefixed frontmatter name", () => {
    const prefixed = page("x", "", "").replace("name: energy-diag", "name: swiftui-animation-ref").replace("`x`", "`animation-ref`");
    assert.deepEqual(rules(prefixed), []);
  });
  it("accepts the router name for a router page", () => {
    const router = page("x", "", "").replace("name: energy-diag", "name: networking").replace("`x`", "`axiom-networking`");
    assert.deepEqual(rules(router), []);
  });
  it("rejects a retired pre-consolidation name", () => {
    const legacy = page("x", "", "").replace("name: energy-diag", "name: swiftui-animation-ref").replace("`x`", "`axiom-swiftui-animation-ref`");
    assert.deepEqual(rules(legacy), ["scope-skill"]);
  });
  it("falls back to the file name when a page has no frontmatter", () => {
    const bare = "# AlarmKit\n\n## Documentation Scope\n\nThis page documents the `axiom-integration` skill.\n";
    assert.deepEqual(lintDocPage(bare, ROUTERS, "docs/reference/alarmkit-ref.md").map((f) => f.rule), ["scope-skill"]);
    assert.deepEqual(lintDocPage(bare.replace("axiom-integration", "alarmkit-ref"), ROUTERS, "docs/reference/alarmkit-ref.md"), []);
    assert.deepEqual(lintDocPage(bare.replace("axiom-integration", "xcsym-ref"), ROUTERS, "docs/skills/debugging/xcsym.md"), []);
    assert.deepEqual(lintDocPage(bare.replace("axiom-integration", "asc-mcp"), ROUTERS, "docs/reference/asc-mcp-ref.md"), []);
  });
  it("accepts a scope line naming the frontmatter skill", () => {
    assert.deepEqual(rules(page("energy-diag", "", "- [energy](/skills/debugging/energy) – patterns")), []);
  });
  it("flags a link that appears in both Documentation Scope and Related", () => {
    assert.deepEqual(
      rules(page("energy-diag", "For patterns, see [energy](/skills/debugging/energy).", "- [energy](/skills/debugging/energy) – patterns")),
      ["scope-related-dup"],
    );
  });
  it("accepts distinct links in the two sections", () => {
    assert.deepEqual(
      rules(page("energy-diag", "For APIs, see [energy-ref](/reference/energy-ref).", "- [energy](/skills/debugging/energy) – patterns")),
      [],
    );
  });
});

describe("lintDocPage — scope line against the real skills", () => {
  const SKILLS = new Map<string, readonly string[]>([
    ["energy-diag", ["axiom-performance"]], ["foo", ["axiom-x"]], ["foo-ref", ["axiom-x"]], ["xcsym-ref", ["axiom-tools"]],
    ["memory-debugging", ["axiom-performance"]], ["debugging", ["axiom-performance"]], ["bar", ["axiom-swift"]],
  ]);
  const lint = (content: string, file: string) => lintDocPage(content, ROUTERS, file, SKILLS).map((f) => f.rule);
  const scoped = (skill: string, tail = "") => `# T\n\n## Documentation Scope\n\nThis page documents the \`${skill}\` skill${tail}.\n`;

  it("reads frontmatter only at the top of the file, not a later horizontal rule", () => {
    const hr = "# T\n\n---\n\nname: foo\n\n---\n\n## Documentation Scope\n\nThis page documents the `energy-diag` skill (in the `axiom-performance` suite).\n";
    assert.deepEqual(lint(hr, "docs/diagnostic/energy-diag.md"), []);
  });
  it("rejects a -ref pairing when the page's own name is a real skill", () => {
    assert.deepEqual(lint(scoped("foo-ref", " (in the `axiom-x` suite)"), "docs/skills/foo.md"), ["scope-skill"]);
  });
  it("accepts a -ref pairing when the page's name is not a skill", () => {
    assert.deepEqual(lint(scoped("xcsym-ref", " (in the `axiom-tools` suite)"), "docs/skills/debugging/xcsym.md"), []);
  });
  it("flags a sub-skill scope line that never names its suite", () => {
    assert.deepEqual(lint(scoped("energy-diag"), "docs/diagnostic/energy-diag.md"), ["scope-suite"]);
  });
  it("treats a trailing slash and a relative link as the same page", () => {
    const page = scoped("energy-diag", " (in the `axiom-performance` suite)") + "\nSee [energy](../skills/debugging/energy.md).\n\n## Related\n\n- [energy](/skills/debugging/energy/) – patterns\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-related-dup"]);
  });
  it("rejects a suffix match when the page's own name is a real skill", () => {
    const page = "---\nname: memory-debugging\n---\n" + scoped("debugging", " (in the `axiom-performance` suite)");
    assert.deepEqual(lint(page, "docs/skills/debugging/memory-debugging.md"), ["scope-skill"]);
  });
  it("does not accept a longer suite name that contains the real one", () => {
    assert.deepEqual(lint(scoped("bar", " (in the `axiom-swiftui` suite)"), "docs/skills/bar.md"), ["scope-suite"]);
  });
  it("accepts a collection page that says no skill has its name, if it names a real skill and suite", () => {
    const body = "This page documents the `foo` skill (in the `axiom-x` suite) and its companions. No single skill named `foo-api` exists.";
    assert.deepEqual(lint(`# T\n\n## Documentation Scope\n\n${body}\n`, "docs/reference/foo-api.md"), []);
    assert.deepEqual(lint(`# T\n\n## Documentation Scope\n\n${body.replace("`foo`", "`nope`")}\n`, "docs/reference/foo-api.md"), ["scope-skill"]);
  });
  it("requires the scope line inside the Documentation Scope section", () => {
    const page = "# T\n\nThis page documents the `energy-diag` skill (in the `axiom-performance` suite).\n\n## Documentation Scope\n\nSee the skill.\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-missing"]);
  });
  it("requires the suite in its `suite` suite form, not merely named in the paragraph", () => {
    assert.deepEqual(lint(scoped("energy-diag", ". Unlike axiom-performance, it diagnoses"), "docs/diagnostic/energy-diag.md"), ["scope-suite"]);
    assert.deepEqual(lint(scoped("energy-diag", ". See `axiom-performance` for the router"), "docs/diagnostic/energy-diag.md"), ["scope-suite"]);
  });
  it("reports the scope line's own line number", () => {
    const page = "# T\n\nIntro.\n\n## Documentation Scope\n\nThis page documents the `energy-diag` skill.\n";
    assert.deepEqual(lintDocPage(page, ROUTERS, "docs/diagnostic/energy-diag.md", SKILLS).map((f) => [f.rule, f.line]), [["scope-suite", 7]]);
  });
  it("resolves shortcut reference links when checking link ownership", () => {
    const page = scoped("energy-diag", " (in the `axiom-performance` suite)") + "\nSee [energy].\n\n## Related\n\n- [energy](/skills/debugging/energy) – patterns\n\n[energy]: /skills/debugging/energy\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-related-dup"]);
  });
  it("resolves reference-style links when checking link ownership", () => {
    const page = scoped("energy-diag", " (in the `axiom-performance` suite)") + "\nSee [energy][e].\n\n## Related\n\n- [energy](/skills/debugging/energy) – patterns\n\n[e]: /skills/debugging/energy\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-related-dup"]);
  });
  it("flags a Documentation Scope section with no scope line", () => {
    const page = "# T\n\n## Documentation Scope\n\nThis is a **diagnostic skill** — mandatory workflows.\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-missing"]);
  });
  it("checks link ownership against every Related section", () => {
    const page = scoped("energy-diag", " (in the `axiom-performance` suite)") + "\nSee [b](/b).\n\n## Related\n\n- [a](/a) – x\n\n## Related Skills\n\n- [b](/b) – y\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-related-dup"]);
  });
  it("checks link ownership against a Related Skills heading too", () => {
    const page = scoped("energy-diag", " (in the `axiom-performance` suite)") + "\nSee [energy](/skills/debugging/energy).\n\n## Related Skills\n\n- [energy](/skills/debugging/energy) – patterns\n";
    assert.deepEqual(lint(page, "docs/diagnostic/energy-diag.md"), ["scope-related-dup"]);
  });
});

describe("findMissingSidebarTargets", () => {
  const config = "items: [ { text: 'A', link: '/start/install' }, { text: 'B', link: '/tools/' }, { text: 'C', link: '/start/gone#x' }, { text: 'D', link: 'https://example.com' } ]";
  const pages = new Set(["docs/start/install.md", "docs/tools/index.md"]);
  it("names each sidebar link with no page behind it, ignoring anchors and external URLs", () => {
    assert.deepEqual(findMissingSidebarTargets(config, (p) => pages.has(p)), ["/start/gone#x"]);
  });
  it("accepts a public asset and ignores a protocol-relative URL", () => {
    const assets = new Set(["docs/public/llms.txt"]);
    assert.deepEqual(findMissingSidebarTargets("{ link: '/llms.txt' }, { link: '//cdn.example.com/x' }", (p) => assets.has(p)), []);
  });
  it("needs an index page behind a trailing slash, accepts a .md link, and skips commented-out links", () => {
    const more = "{ link: '/start/install/' }, { link: '/start/install.md' }, // { link: '/old' }\n/* { link: '/older' } */";
    assert.deepEqual(findMissingSidebarTargets(more, (p) => pages.has(p)), ["/start/install/"]);
  });
});

describe("sidebarLinkTargets", () => {
  it("keeps strings that contain comment markers, so a later comment cannot hide links", () => {
    const config = "srcExclude: ['**/public/plugins/**'],\n{ text: 'A // B', link: '/a' },\n/* note */\n{ link: '/b' }";
    assert.deepEqual(sidebarLinkTargets(config), ["/a", "/b"]);
  });
});

describe("findNonLiteralSidebarLinks", () => {
  it("names each link that is not a quoted string, since 12v cannot resolve it", () => {
    const config = "{ link: '/a' }, { link: `/b/${x}` }, { link: base + '/c' }, { link: \"/d\" }";
    assert.deepEqual(findNonLiteralSidebarLinks(config), ["link: `/b/${x}`", "link: base + '/c'"]);
  });
  it("reports links in source order", () => {
    assert.deepEqual(findNonLiteralSidebarLinks("{ link: 'start/x' }, { link: base }"), ["link: 'start/x'", "link: base"]);
  });
  it("names a quoted relative link, and skips comments and a type annotation", () => {
    const config = "{ link: 'start/x' }, // { link: base }\ntype Item = { link: string }";
    assert.deepEqual(findNonLiteralSidebarLinks(config), ["link: 'start/x'"]);
  });
});

describe("findPluginReadmeDrift", () => {
  const routers = new Set(["axiom-build", "axiom-tools"]);
  const commands = new Set(["fix-build", "audit"]);
  it("names a router or command the README omits, and any it names that do not exist", () => {
    const readme = "| `axiom-build` | builds |\n| `/axiom:fix-build` | fixes |\n#### `axiom-extensions-widgets`\nRun `/axiom-audit-memory` or `/axiom:audit-memory`.\n";
    assert.deepEqual(findPluginReadmeDrift(readme, routers, commands), [
      "missing router axiom-tools",
      "missing command /axiom:audit",
      "unknown skill axiom-extensions-widgets",
      "unknown command /axiom-audit-memory",
      "unknown command /axiom:audit-memory",
    ]);
  });
  it("is clean when the README lists exactly what ships", () => {
    const readme = "`axiom-build` `axiom-tools` `/axiom:fix-build` `/axiom:audit`\n";
    assert.deepEqual(findPluginReadmeDrift(readme, routers, commands), []);
  });
  const tools = new Set(["xclog", "xcsym"]);
  const others = new Set(["axiom-mcp", "axiom-marketplace"]);
  const base = "`axiom-build` `axiom-tools` `/axiom:fix-build` `/axiom:audit`\n";
  it("names a tool the Tools table omits, and a row for a tool that does not ship", () => {
    const readme = base + "## Tools\n\n| Tool | What |\n|---|---|\n| `xclog` | logs |\n| `xcgone` | gone |\n\n## Next\n";
    assert.deepEqual(findPluginReadmeDrift(readme, routers, commands, { tools, otherNames: others }), [
      "missing tool xcsym",
      "unknown tool xcgone",
    ]);
  });
  it("accepts package and marketplace names, and ignores a path segment that looks like a command", () => {
    const readme = base + "Install `axiom-mcp` from `axiom-marketplace`, cached at `plugins/cache/axiom-marketplace/`.\n";
    assert.deepEqual(findPluginReadmeDrift(readme, routers, commands, { otherNames: others }), []);
  });
  it("names a retired skill written in bold rather than code", () => {
    assert.deepEqual(findPluginReadmeDrift(base + "See **axiom-swiftui-nav**.\n", routers, commands, { otherNames: others }), [
      "unknown skill axiom-swiftui-nav",
    ]);
  });
});

describe("findMissingTools", () => {
  const tools = new Set(["xclog", "xcsym", "axbuild", "xcproject"]);
  it("names each tool the surface never mentions, sorted", () => {
    assert.deepEqual(findMissingTools("Use **xclog**, or see /reference/xcsym-ref.", tools), ["axbuild", "xcproject"]);
  });
  it("does not count a longer word that contains a tool's name", () => {
    assert.deepEqual(findMissingTools("xclogger, axbuilds and myxcsym xcproject", tools), ["axbuild", "xclog", "xcsym"]);
  });
});

// A ``` block quoted inside a ``` block: CommonMark closes the outer one at the
// inner block's bare ```, so the rest renders and parses as the wrong thing.
// Ten files shipped this way, three of them docs pages (Axiom-w4d0).
describe("nestedFenceViolations", () => {
  // The inner close ends the outer fence, so the author's final ``` opens a new
  // fence that never closes: both lines are reported.
  it("flags an inner opener as wide as the open fence, and the fence it leaves open", () => {
    assert.deepEqual(nestedFenceViolations("```markdown\nReport:\n```swift\nlet x = 1\n```\n```\n"), [3, 6]);
  });

  it("accepts an inner opener narrower than a wider outer fence", () => {
    assert.deepEqual(nestedFenceViolations("````markdown\n```swift\nlet x = 1\n```\n````\n"), []);
  });

  // Everything after an unclosed fence reads as code, headings included.
  it("flags a fence still open at the end of the file, at its opening line", () => {
    assert.deepEqual(nestedFenceViolations("# T\n\n```bash\necho hi\n\n## Lost heading\n"), [3]);
  });

  it("ignores the other fence character and a bare closing fence", () => {
    assert.deepEqual(nestedFenceViolations("~~~\n```swift\n~~~\n\n```\ncode\n```\n"), []);
  });
});

describe("findUnreachablePages", () => {
  const redirect = "---\nsearch: false\nhead:\n  - - meta\n    - http-equiv: refresh\n      content: 0; url=/Axiom/a\n---\n";
  const pages = new Map([
    ["docs/index.md", "---\nlayout: home\nhero:\n  actions:\n    - text: Start\n      link: /hero/\n---\n# Home\n\n[Guide](/guide/) and [Reindex](/reindex)\n\n<a href=\"/anchor\" class=\"card\">Anchor</a>\n\nlink: /bodylink\n"],
    ["docs/hero.md", "# Linked only from a frontmatter hero action\n"],
    ["docs/anchor.md", "# Linked only from an HTML anchor\n"],
    ["docs/bodylink.md", "# Named by a link: line in the body, not the frontmatter\n"],
    ["docs/late-redirect.md", "# Not a stub\n\n---\nhttp-equiv: refresh\n---\n"],
    ["docs/crlf-redirect.md", "---\r\nhead:\r\n  - - meta\r\n    - \"http-equiv\": \"refresh\"\r\n---\r\n"],
    ["docs/spans.md", "# Code spans\n\nUse `<a href=\"/span-anchor\">` or `[x](/span-link)`; <a data-href=\"/data\" href=\"#top\">top</a>\n"],
    ["docs/span-anchor.md", "# Named only inside a code span\n"],
    ["docs/span-link.md", "# Named only inside a code span\n"],
    ["docs/data.md", "# Named only by a data-href attribute\n"],
    ["docs/guide/index.md", "# Guide\n\n- [Install](./install)\n- [Deep](../deep/page.md#top)\n"],
    ["docs/guide/install.md", "# Install\n"],
    ["docs/deep/page.md", "# Deep\n\n```md\n[Fenced](/fenced)\n```\n"],
    ["docs/fenced.md", "# Linked only from inside a code fence\n"],
    ["docs/sidebar-only.md", "# Sidebar\n\n[Chain](/chain)\n"],
    ["docs/chain.md", "# Reached through a sidebar page\n"],
    ["docs/legal.md", "# Linked from a manifest\n"],
    ["docs/old.md", redirect],
    ["docs/island.md", "# Linked only by another unreachable page\n\n[Orphan](/orphan)\n"],
    ["docs/orphan.md", "# Orphan\n\n[Island](/island)\n"],
    ["docs/reindex.md", "# Ends in index without being an index page\n"],
  ]);

  it("returns the pages no walk from the home page, sidebar and manifest URLs reaches, skipping redirect stubs", () => {
    assert.deepEqual(findUnreachablePages(pages, ["/sidebar-only", "/legal", "/spans"]), ["docs/bodylink.md", "docs/data.md", "docs/fenced.md", "docs/island.md", "docs/late-redirect.md", "docs/orphan.md", "docs/span-anchor.md", "docs/span-link.md"]);
  });
});
