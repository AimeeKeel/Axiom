/**
 * Pre-deploy check 12u: docs page hygiene the review checklist kept missing.
 *
 * Measured 2026-10-13 across 403 docs pages, each class shipped through every
 * review pass because a reviewer can skim past it: "ask Claude" on 126 pages
 * (the doc templates themselves said it), a Documentation Scope line naming a
 * different skill than the page's frontmatter on 67, Documentation Scope
 * repeating Related links on 113, and " -- " standing in for a dash on 14.
 * The rules live in .claude/rules/documentation-standards.md (Editorial
 * Standards) and documentation-style.md (Dashes).
 */

export type DocLintRule = "double-hyphen" | "claude-as-assistant" | "scope-skill" | "scope-suite" | "scope-missing" | "scope-related-dup";

export interface DocLintFinding {
  line: number;
  rule: DocLintRule;
  message: string;
}

// "Claude" meaning the assistant. Product, surface and plan names stay legitimate:
// Claude Code, the Claude app (desktop, mobile), a Claude account, claude.ai.
const CLAUDE_AS_ASSISTANT =
  /\bClaude\b(?!\s+(?:Code|Desktop|desktop|Agent|API|Opus|Sonnet|Haiku|Fable|Tag|Cowork|Max|Pro|Team|Enterprise|[Aa]pp|mobile|account|Developer|in Chrome)\b|\.ai\b)/g;

const blank = (s: string) => s.replace(/[^\n]/g, " ");
// Masks inline material with a non-space, non-letter character, so a dash beside a code span
// or link still has a neighbor and is flagged.
const fill = (s: string) => s.replace(/[^\n]/g, "0");

// A code span of any backtick-run length, which may wrap lines but not cross a blank line or
// a heading, and never opens or closes inside a longer backtick run.
const CODE_SPAN = /(?<!`)(`+)(?!`)(?:(?!\n[ \t]*(?:\n|#))[\s\S])*?(?<!`)\1(?!`)/;

/**
 * Blank fenced code (``` or ~~~, any length, closed by a run at least as long, indented
 * as inside a list item), <pre>, <script> and <style> blocks, and HTML comments. Code spans
 * are matched in the same pass and kept, so a `<!--` written as code does not blank the
 * prose after it.
 */
function maskFences(content: string): string {
  return content
    .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[`~]*[ \t]*$/gm, blank)
    .replace(new RegExp(`${CODE_SPAN.source}|<(pre|script|style)\\b[\\s\\S]*?<\\/\\2>|<!--[\\s\\S]*?-->`, "gi"), (m) =>
      m.startsWith("`") ? m : blank(m));
}

// A reference definition: label, destination, and an optional quoted or parenthesized title.
const LINK_DEFINITION = /^[ \t]*\[([^\]\n]+)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?[ \t]*$/gm;

/** maskFences plus code spans, link targets, definitions, autolinks and HTML tags, keeping
 * newlines so line numbers hold. */
const maskNonProse = (content: string) =>
  maskFences(content)
    .replace(new RegExp(CODE_SPAN.source, "g"), fill)
    .replace(/\]\([^)\n]*\)/g, (m) => "]" + fill(m.slice(1)))
    .replace(LINK_DEFINITION, fill)
    .replace(/<[a-z][a-z0-9+.-]*:[^>\s]*>/gi, fill)
    .replace(/<\/?[a-z][^>\n]*>/gi, fill);

const lineOf = (text: string, index: number) => text.slice(0, index).split("\n").length;

function sections(content: string, heading: RegExp): Array<{ body: string; start: number; bodyStart: number }> {
  const re = new RegExp(`^## ${heading.source}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "gm");
  return [...content.matchAll(re)].map((m) => ({ body: m[1], start: m.index, bodyStart: m.index + m[0].length - m[1].length }));
}

/** Reference-style link definitions (`[label]: url`), keyed by lowercased label. */
function linkDefinitions(content: string): Map<string, string> {
  return new Map([...content.matchAll(LINK_DEFINITION)].map((m) => [m[1].toLowerCase(), m[2]]));
}

/** Site paths of a section's internal links, inline or reference-style: relative links resolved
 * against the page, and `.md`, `.html`, `index` and a trailing slash dropped, so /a/, /a and
 * ../a.md compare equal. */
function internalLinks(text: string, file?: string, defs: ReadonlyMap<string, string> = new Map()): Set<string> {
  const pageDir = file ? "/" + file.replace(/^docs\//, "").split("/").slice(0, -1).join("/") : "/";
  const links = new Set<string>();
  const targets = [
    ...[...text.matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]),
    ...[...text.matchAll(/\[([^\]\n]+)\]\[([^\]\n]*)\]/g)].map((m) => defs.get((m[2] || m[1]).toLowerCase()) ?? ""),
    // Shortcut references, [label] alone; a definition line itself is not a link.
    ...[...text.matchAll(/(?<!\])\[([^\]\n]+)\](?![[(:])/g)].map((m) => defs.get(m[1].toLowerCase()) ?? ""),
  ];
  for (const target of targets) {
    const raw = target.replace(/[#?].*$/, "");
    if (raw === "") continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
    const parts = (raw.startsWith("/") ? raw : `${pageDir}/${raw}`).split("/");
    const out: string[] = [];
    for (const part of parts) {
      if (part === "" || part === ".") continue;
      if (part === "..") out.pop();
      else out.push(part);
    }
    links.add("/" + out.join("/").replace(/\.(?:md|html)$/, "").replace(/(?:^|\/)index$/, ""));
  }
  return links;
}

/**
 * `skills` maps every sub-skill name to the suites that hold it. When given, the
 * scope line must name a real skill, and a sub-skill's line must also name its suite.
 */
export function lintDocPage(
  content: string,
  routers: ReadonlySet<string> = new Set(),
  file?: string,
  skills?: ReadonlyMap<string, readonly string[]>,
): DocLintFinding[] {
  const findings: DocLintFinding[] = [];
  const prose = maskNonProse(content);
  const fenced = maskFences(content);

  // A spaced -- or --- between words on one line (not a table separator or a rule), or an
  // unspaced -- between letters.
  for (const m of prose.matchAll(/(?<=[^\s|])[ \t]+-{2,3}[ \t]+(?=[^\s|])|(?<=[A-Za-z])--(?=[A-Za-z])/g)) {
    findings.push({ line: lineOf(prose, m.index + m[0].indexOf("-")), rule: "double-hyphen", message: "\"--\" used as a dash; use a spaced em-dash \" — \" in prose, or an en-dash \" – \" after a list-led label (documentation-style.md §Dashes)" });
  }
  for (const m of prose.matchAll(CLAUDE_AS_ASSISTANT)) {
    findings.push({ line: lineOf(prose, m.index), rule: "claude-as-assistant", message: "\"Claude\" used for the assistant; Axiom serves several harnesses, so say \"your assistant\"" });
  }

  // Frontmatter only counts at the very top; a later "---" is a horizontal rule. Without
  // frontmatter, the file name stands in: docs/reference/alarmkit-ref.md documents alarmkit-ref.
  const frontmatter = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(content)?.[1];
  const declared = frontmatter ? /^name:\s*(\S+)/m.exec(frontmatter)?.[1] : undefined;
  const name = declared ?? file?.split("/").pop()?.replace(/\.md$/, "");
  const isSkill = (s: string) => routers.has(s) || (skills?.has(s) ?? false);
  // A sub-skill page may carry an area-prefixed name (swiftui-animation-ref for the
  // sub-skill animation-ref), and a router page drops the axiom- prefix. Only a real
  // router qualifies, so a retired name such as axiom-swiftui-animation-ref fails.
  const scopeMatches = (scope: string, page: string) =>
    scope === page ||
    (scope === `axiom-${page}` && routers.has(scope)) ||
    (!scope.startsWith("axiom-") && page.endsWith(`-${scope}`) && (!skills || skills.has(scope)) && !(skills?.has(page) ?? false)) ||
    // A tool page such as xcsym.md documents xcsym-ref, and a reference page such as
    // asc-mcp-ref.md documents asc-mcp, but only when the page's own name is not a skill.
    (!declared && (scope === `${page}-ref` || page === `${scope}-ref`) && !(skills?.has(page) ?? false));
  // The scope line belongs in the Documentation Scope section; a page without one is searched whole.
  const [scopeSection] = sections(fenced, /Documentation Scope/);
  const scopeRe = /This page documents the `([^`]+)`([^\n]*(?:\n(?!\s*\n)[^\n]*)*)/;
  const scopeMatch = scopeRe.exec(scopeSection ? scopeSection.body : fenced);
  const scopeLine = scopeMatch && { 1: scopeMatch[1], 2: scopeMatch[2], index: scopeMatch.index + (scopeSection?.bodyStart ?? 0) };
  // A page that collects several skills says so outright ("No single skill named `coreml-ref`
  // exists"); its scope line must still name a real skill, but not one matching the page.
  const collection = name !== undefined && fenced.includes(`No single skill named \`${name}\` exists`);
  if (name && scopeLine) {
    const scope = scopeLine[1];
    if ((!collection && !scopeMatches(scope, name)) || (skills && !isSkill(scope))) {
      findings.push({
        line: lineOf(fenced, scopeLine.index),
        rule: "scope-skill",
        message: `Documentation Scope names \`${scope}\` but the page documents \`${name}\``,
      });
    } else if (skills?.has(scope) && !routers.has(scope)) {
      const suites = skills.get(scope) ?? [];
      const namesSuite = (suite: string) => scopeLine[2].includes(`\`${suite}\` suite`);
      if (!suites.some(namesSuite)) {
        findings.push({
          line: lineOf(fenced, scopeLine.index),
          rule: "scope-suite",
          message: `Documentation Scope names \`${scope}\` without its suite (${suites.join(" or ")})`,
        });
      }
    }
  }

  if (scopeSection && !scopeLine) {
    findings.push({
      line: lineOf(fenced, scopeSection.start),
      rule: "scope-missing",
      message: "Documentation Scope has no \"This page documents the `skill` skill (in the `suite` suite)\" line",
    });
  }
  const related = sections(fenced, /Related\b/);
  if (scopeSection && related.length > 0) {
    const defs = linkDefinitions(fenced);
    const relatedLinks = new Set(related.flatMap((r) => [...internalLinks(r.body, file, defs)]));
    const shared = [...internalLinks(scopeSection.body, file, defs)].filter((link) => relatedLinks.has(link));
    if (shared.length > 0) {
      findings.push({
        line: lineOf(fenced, scopeSection.start),
        rule: "scope-related-dup",
        message: `Documentation Scope repeats Related link(s): ${shared.join(", ")}; keep each link in one section`,
      });
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

/**
 * Pre-deploy check 12v. VitePress's dead-link check covers links inside markdown, not
 * sidebar and nav targets in config.ts, so a sidebar entry for a page that is missing
 * (deleted, renamed, or never committed) ships as a 404. Returns each such link.
 */
/** config.ts with comments blanked, so a commented-out link is neither checked nor flagged.
 * Strings are matched first and kept, so a glob string such as srcExclude's cannot open a block comment. */
const stripComments = (text: string) =>
  text.replace(/('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m, str?: string) => (str ? m : blank(m)));

/** Every quoted site-path link in config.ts. Check 12v fails when this is empty, since a
 * parsing problem would otherwise pass every link it never saw. */
export function sidebarLinkTargets(configText: string): string[] {
  return [...stripComments(configText).matchAll(/\blink:\s*['"](\/(?!\/)[^'"]*)['"]/g)].map((m) => m[1]);
}

export function findMissingSidebarTargets(configText: string, exists: (docsPath: string) => boolean): string[] {
  const missing = new Set<string>();
  for (const link of sidebarLinkTargets(configText)) {
    const target = link.replace(/[#?].*$/, "");
    // A trailing slash needs an index page: GitHub Pages serves /start/install/ from
    // start/install/index.html, never from start/install.html. Files in docs/public/ are
    // served as they are.
    const page = target.replace(/\.(?:html|md)$/, "");
    const candidates = target.endsWith("/")
      ? [`docs${target}index.md`]
      : [`docs${page}.md`, `docs${page}/index.md`, `docs/public${target}`];
    if (!candidates.some(exists)) missing.add(link);
  }
  return [...missing];
}

/** Sidebar and nav links 12v cannot resolve: values that are not a quoted string, and quoted
 * paths that are neither absolute site paths, anchors nor URLs. */
export function findNonLiteralSidebarLinks(configText: string): string[] {
  const text = stripComments(configText);
  const found = [
    ...[...text.matchAll(/\blink:(?!\s*['"])\s*(`[^`]*`|[^,}\n]+)/g)].filter((m) => !/^(?:string|undefined)\b/.test(m[1].trim())),
    ...text.matchAll(/\blink:\s*(['"])(?![/#]|[a-z][a-z0-9+.-]*:)[^'"]*\1/gi),
  ];
  return found.sort((a, b) => a.index - b.index).map((m) => m[0].trim());
}

/**
 * Pre-deploy check 12w. The plugin README ships inside every install, and it sat at
 * version 0.9.35 for months: 50 skills, standalone names such as axiom-extensions-widgets,
 * `/axiom-audit-*` commands, and none of the routers by name (found 2026-10-13). It must
 * name every router and command, and nothing that no longer exists.
 */
export function findPluginReadmeDrift(
  readme: string,
  routers: ReadonlySet<string>,
  commands: ReadonlySet<string>,
  extras: { tools?: ReadonlySet<string>; otherNames?: ReadonlySet<string> } = {},
): string[] {
  const problems: string[] = [];
  // Any axiom-* token outside a path, in code, bold or plain prose; otherNames holds the
  // package and marketplace names (axiom-mcp, axiom-marketplace) that are not skills.
  const named = new Set([...readme.matchAll(/(?<![\w/.-])axiom-[a-z0-9-]*[a-z0-9]/g)].map((m) => m[0]));
  const invoked = [...readme.matchAll(/(?<![\w.~-])\/axiom[:-]([a-z0-9-]+)/g)].map((m) => m[0]);
  for (const r of routers) if (!named.has(r)) problems.push(`missing router ${r}`);
  for (const c of commands) if (!invoked.includes(`/axiom:${c}`)) problems.push(`missing command /axiom:${c}`);
  for (const n of named) if (!routers.has(n) && !extras.otherNames?.has(n)) problems.push(`unknown skill ${n}`);
  for (const i of new Set(invoked)) if (!i.startsWith("/axiom:") || !commands.has(i.slice(7))) problems.push(`unknown command ${i}`);
  if (extras.tools) {
    const table = /^## Tools[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readme)?.[1] ?? "";
    const listed = new Set([...table.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]));
    for (const t of extras.tools) if (!listed.has(t)) problems.push(`missing tool ${t}`);
    for (const t of listed) if (!extras.tools.has(t)) problems.push(`unknown tool ${t}`);
  }
  return problems;
}
