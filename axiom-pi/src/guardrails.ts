/**
 * Tool-hook logic ported from Axiom's Claude Code hooks. Pure functions so
 * they're unit-testable; the Pi wiring in index.ts feeds them tool I/O.
 *
 *  - unscopedStateVars      ← swift-guardrails.py   (@State without access control)
 *  - unguardedRelationships ← swift-guardrails.py   (to-many @Relationship, no default)
 *  - crashFileHint          ← pretool-crash-route.py (route crash Reads to xcsym)
 *  - bashOutputHints        ← posttool-bash-hints.py (suggest a skill from output)
 *
 * Pi appends these as advisory text on the tool result (it can't block), so both
 * Swift checks are warnings here — which matches the warn-first stance for the
 * @Relationship check on the other harnesses.
 */

/**
 * `@State var` declarations missing an explicit access level. Without one,
 * child views can create independent copies of the state — a silent-bug class.
 * Honors a `// axiom-ignore` trailing comment, matching the Claude hook.
 */
export function unscopedStateVars(swift: string): { line: number; text: string }[] {
  // Mirrors swift-guardrails.py check_state: drop access-controlled forms (a modifier
  // on either side of @State), the axiom-ignore escape hatch, and false positives where
  // the match is inside a // comment or a string literal.
  const ACCESS =
    /(private|fileprivate|internal|public|package|open)\s+@State|@State\s+(private|fileprivate|internal|public|package|open)/;
  const hits: { line: number; text: string }[] = [];
  const lines = swift.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    if (!/@State\s+var\b/.test(text)) continue;
    if (ACCESS.test(text)) continue;
    if (/\/\/\s*axiom-ignore/.test(text)) continue;
    if (/\/\/.*@State\s+var/.test(text)) continue; // commented-out / doc comment
    if (/".*@State\s+var/.test(text)) continue; // inside a string literal
    hits.push({ line: i + 1, text: text.trim() });
  }
  return hits;
}

/**
 * SwiftData to-many `@Relationship` array properties with no `= []` default. Without
 * one, SwiftData crashes at runtime when it reads the relationship — and it compiles
 * clean, so the compiler won't catch it. Mirrors swift-guardrails.py check_relationship:
 * the attribute may sit on the `var` line or up to 3 lines above it; skips to-one
 * (non-array / optional), already-defaulted, dictionary, commented, and ignored decls.
 */
export function unguardedRelationships(swift: string): { line: number; text: string }[] {
  const hits: { line: number; text: string }[] = [];
  const lines = swift.split("\n");
  const n = lines.length;
  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!line.includes("@Relationship")) continue;
    const stripped = line.replace(/^\s+/, "");
    if (stripped.startsWith("//") || stripped.startsWith("*")) continue;
    const rel = line.indexOf("@Relationship");
    const cmt = line.indexOf("//");
    if (cmt !== -1 && cmt < rel) continue; // inside a trailing comment
    if (line.slice(0, rel).includes('"')) continue; // inside a string literal
    if (line.includes("axiom-ignore")) continue;
    // The `var` may be on this line or on a following non-blank line (attribute above).
    let decl = line.slice(rel);
    let j = i;
    while (!decl.includes("var ") && j + 1 < n && j - i < 3) {
      j++;
      if (lines[j].trim() === "" || lines[j].includes("axiom-ignore")) {
        decl = "";
        break;
      }
      decl += " " + lines[j].trim();
    }
    if (!/var\s+\w+\s*:\s*\[[^\]:]+\]/.test(decl)) continue; // not a to-many array (to-one/dict)
    if (/\]\s*\?/.test(decl)) continue; // optional to-many — defaults to nil
    const defaultedOnNextLine = j + 1 < n && /^\s*=/.test(lines[j + 1]);
    if (/\]\s*=/.test(decl) || defaultedOnNextLine) continue; // already has a default
    hits.push({ line: i + 1, text: line.trim() });
  }
  return hits;
}

type CrashKind =
  | "ips"
  | "crash_text"
  | "xccrashpoint_bundle_root"
  | "xccrashpoint_inner_crash"
  | "xccrashpoint_inner_other"
  | "";

/** Categorize a path so the caller can pick the right crash hint. */
export function classifyCrashPath(p: string): CrashKind {
  if (!p) return "";
  if (p.endsWith(".xccrashpoint") || p.endsWith(".xccrashpoint/")) return "xccrashpoint_bundle_root";
  if (p.includes(".xccrashpoint/")) {
    return p.endsWith(".crash") ? "xccrashpoint_inner_crash" : "xccrashpoint_inner_other";
  }
  if (p.endsWith(".ips")) return "ips";
  if (p.endsWith(".crash")) return "crash_text";
  return "";
}

const CRASH_HINTS: Record<Exclude<CrashKind, "">, (p: string) => string> = {
  ips: (p) =>
    `This is an .ips crash report. Before reading it as text, run ` +
    `\`xcsym crash --format=summary "${p}"\` — it symbolicates against local ` +
    `dSYMs and tags the crash pattern. Analyze the JSON output, not the raw .ips. ` +
    `See the axiom-tools skill (xcsym-ref).`,
  crash_text: (p) =>
    `This is an Apple legacy .crash text file. Run ` +
    `\`xcsym crash --format=summary "${p}"\` first — xcsym parses the legacy ` +
    `format, symbolicates via dSYM discovery, and surfaces pattern_tag + crashed frames.`,
  xccrashpoint_inner_crash: (p) =>
    `This is a .crash inside an .xccrashpoint bundle. Pass it directly to ` +
    `\`xcsym crash --format=summary "${p}"\`. Prefer a \`LocallySymbolicated/\` ` +
    `sibling with the same timestamp if present.`,
  xccrashpoint_bundle_root: (p) =>
    `This is an .xccrashpoint bundle (a directory). xcsym needs a .crash file ` +
    `inside it — they live at \`${p}/Filters/*/Logs/*.crash\`. List the directory, ` +
    `then pass the right one to \`xcsym crash\`.`,
  xccrashpoint_inner_other: () =>
    `This file is inside an .xccrashpoint bundle but isn't the crash payload. ` +
    `For crash analysis, route \`Filters/*/Logs/*.crash\` under the bundle root to ` +
    `\`xcsym crash --format=summary\`.`,
};

/** Advisory hint when a crash file is read, or null when the path isn't a crash. */
export function crashFileHint(p: string): string | null {
  const kind = classifyCrashPath(p);
  return kind ? CRASH_HINTS[kind](p) : null;
}

// Output-signature rules from posttool-bash-hints.py. The Python hook's
// duration-aware rules (slow-build / slow-test) are intentionally omitted: Pi's
// tool_result event carries no command duration to gate them on.
const BASH_PATTERN_RULES: { pattern: RegExp; hint: string }[] = [
  { pattern: /Unable to simultaneously satisfy constraints/, hint: "💡 Auto Layout conflict — load the axiom-uikit skill." },
  { pattern: /Actor-isolated|Sendable|data race|@MainActor/i, hint: "💡 Concurrency issue — load the axiom-concurrency skill." },
  { pattern: /no such column|FOREIGN KEY constraint|migration/, hint: "💡 Database migration issue — load the axiom-data skill." },
  { pattern: /retain cycle|memory leak|deinit.*never called/, hint: "💡 Memory issue — load the axiom-performance skill." },
  { pattern: /CKError|CKRecord.*error/, hint: "💡 CloudKit issue — load the axiom-data skill." },
  { pattern: /ubiquitous.*error|iCloud Drive|NSFileCoordinator/, hint: "💡 iCloud Drive issue — load the axiom-data skill." },
  { pattern: /file.*disappeared|file not found|storage.*full/, hint: "💡 File storage issue — load the axiom-data skill." },
  { pattern: /FileProtection|data protection|file.*locked/, hint: "💡 File protection issue — load the axiom-data skill." },
  { pattern: /error:.*module.*not found|linker command failed/, hint: "💡 Build configuration issue — try /axiom-fix-build." },
];

const DIAGNOSTIC_LINE = /\b(?:error|warning|failed|failure|detected|unavailable|fatal|exception)\b|\b(?:note|reason):|never called|not available|data race|Unable to simultaneously satisfy constraints|Leaks:|CKError\s*\d|^\s*(?:[\w.]+(?:Error|Exception):|no such column\b|file not found\b|CKError(?:Domain)?\b|(?:Application terminated:\s*)?file (?:is )?locked\b)/i;
const LOG_PREFIX = /^\s*(?:(?:\[[^\]\n]+\]|[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9:.,+\-]+Z?|[0-9]{2}:[0-9]{2}:[0-9]{2}(?:[.,][0-9]+)?|[A-Za-z_][\w.-]*\[[0-9:]+\]:?)\s*)+/;
const ISSUE_TERMS = String.raw`(?:migration\s+(?:errors?|failures?|issues?|problems?)|memory leaks?|retain cycles?)\b`;
const NEGATED_ISSUE = new RegExp(String.raw`\b(?:no|without)\s+${ISSUE_TERMS}(?:\s+(?:or|and)\s+${ISSUE_TERMS})*`, "gi");

/** Every skill hint whose pattern matches diagnostic output, in rule order. */
export function bashOutputHints(output: string): string[] {
  const diagnostics = output.split(/[;\n]|(?<=[.!?])\s+/)
    .flatMap((fragment) => {
      const original = fragment.replace(NEGATED_ISSUE, "");
      const payload = original.replace(LOG_PREFIX, "");
      return DIAGNOSTIC_LINE.test(original) || DIAGNOSTIC_LINE.test(payload) ? [payload] : [];
    });
  return BASH_PATTERN_RULES.filter((r) => diagnostics.some((line) => r.pattern.test(line))).map((r) => r.hint);
}

type ShellToken = { text: string; operator: boolean };
type CommandGroup = { words: string[]; pipeline: boolean; executesExpansion: boolean };

function expansionEnd(command: string, start: number): number | null {
  const backtick = command[start] === "`";
  let depth = 1;
  let quote = "";
  let i = start + (backtick ? 1 : 2);
  while (i < command.length) {
    const char = command[i];
    if (char === "\\" && quote !== "'") { i += 2; continue; }
    if (backtick) {
      if (char === "`") return i + 1;
    } else if (quote) {
      if (char === quote) quote = "";
    } else if ("'\"".includes(char)) quote = char;
    else if (char === "(") depth++;
    else if (char === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return null;
}

/** Lex words/operators without expansion; mirrored in Python and tested by one corpus. */
function shellTokens(command: string, allowIncomplete = false): ShellToken[] | null {
  const tokens: ShellToken[] = [];
  let word = "";
  let active = false;
  let quoted = false;
  let quote = "";
  let i = 0;
  while (i < command.length) {
    const char = command[i];
    if (char === "\\" && quote !== "'") {
      if (i + 1 === command.length) {
        if (!allowIncomplete) return null;
        word += char;
        active = true;
        break;
      }
      const following = command[i + 1];
      if (!quote || '\\"$`\n'.includes(following)) {
        if (following !== "\n") { word += following; active = true; }
        i += 2;
        continue;
      }
    }
    if (quote !== "'" && (command.startsWith("$(", i) || char === "`" ||
        (!quote && ["<(", ">("].includes(command.slice(i, i + 2))))) {
      const end = expansionEnd(command, i);
      if (end === null) return null;
      word += "\0"; // Opaque argument: can execute commands, never a literal action/path.
      active = true;
      i = end;
      continue;
    }
    if (quote) {
      if (char === quote) quote = "";
      else word += char;
      i++;
      continue;
    }
    if ("'\"".includes(char)) {
      quote = char;
      active = quoted = true;
      i++;
      continue;
    }
    if (char === "#" && !active) {
      while (i < command.length && command[i] !== "\n") i++;
      continue;
    }
    if (" \t\r\n;&|()<>".includes(char)) {
      const operator = command.slice(i).match(/^(&>>|&>|&&|\|\||\|&|>>|<<<?|<>|>&|<&|[;\n&|()<>])/);
      let descriptor = "";
      if (active) {
        if (operator && "<>".includes(char) && /^[0-9]+$/.test(word) && !quoted) descriptor = word;
        else tokens.push({ text: word, operator: false });
        word = ""; active = false; quoted = false;
      }
      if (operator) {
        tokens.push({ text: descriptor + operator[0], operator: true });
        i += operator[0].length;
      } else i++;
      continue;
    }
    word += char;
    active = true;
    i++;
  }
  if (quote && !allowIncomplete) return null;
  if (active) tokens.push({ text: word, operator: false });
  return tokens;
}

function commandGroups(command: string, depth = 0, allowIncomplete = false): CommandGroup[] | null {
  const tokens = shellTokens(command, allowIncomplete);
  if (!tokens || depth > 8) return null;
  const groups: CommandGroup[] = [];
  let words: string[] = [];
  let pipeline = false;
  let executesExpansion = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    executesExpansion ||= token.text.includes("\0");
    if (token.operator && /^(?:[0-9]*(?:[<>]+|[<>]&)|&>>?)$/.test(token.text)) {
      const target = tokens[++i];
      if (!target || target.operator) return null;
      executesExpansion ||= target.text.includes("\0");
      if (/^[0-9]*<>?$/.test(token.text)) words.push(target.text);
      continue;
    }
    if (token.operator) {
      groups.push({ words, pipeline, executesExpansion });
      words = [];
      executesExpansion = false;
      pipeline = ["|", "|&"].includes(token.text);
    } else words.push(token.text);
  }
  groups.push({ words, pipeline, executesExpansion });
  const expanded: CommandGroup[] = [];
  const optionArguments: Record<string, Set<string>> = {
    env: new Set(["-u", "--unset", "-C", "--chdir", "-S", "--split-string"]),
    sudo: new Set(["-u", "--user", "-g", "--group", "-h", "--host", "-p", "--prompt",
      "-C", "--close-from", "-T", "--command-timeout", "-R", "--chroot", "-D", "--chdir",
      "-r", "--role", "-t", "--type", "-a", "--auth-type"]),
    nice: new Set(["-n", "--adjustment"]),
    time: new Set(["-f", "--format", "-o", "--output"]),
    command: new Set(),
    exec: new Set(["-a"]),
    xcrun: new Set(["--sdk", "--toolchain"]),
  };
  for (const group of groups) {
    const commandWords = [...group.words];
    while (commandWords.length) {
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(commandWords[0])) commandWords.shift();
      else if (Object.hasOwn(optionArguments, commandWords[0].split("/").at(-1) ?? "")) {
        const prefix = commandWords[0].split("/").at(-1) ?? "";
        const wrappedWords = [...commandWords];
        commandWords.shift();
        let lookup = false;
        while (commandWords[0]?.startsWith("-")) {
          const option = commandWords.shift() ?? "";
          lookup ||= (prefix === "xcrun" && ["--find", "-f"].includes(option)) ||
            (prefix === "command" && ["-v", "-V"].includes(option));
          if (optionArguments[prefix].has(option)) commandWords.shift();
        }
        if (lookup) {
          commandWords.splice(0, commandWords.length, ...wrappedWords);
          break;
        }
      } else break;
    }
    if (["sh", "bash", "zsh"].includes(commandWords[0]?.split("/").at(-1) ?? "")) {
      const index = commandWords.findIndex((word, j) => j > 0 && /^-[A-Za-z]*c[A-Za-z]*$/.test(word));
      if (index >= 0 && index + 1 < commandWords.length) {
        const nested = commandGroups(commandWords[index + 1], depth + 1, allowIncomplete);
        if (!nested) return null;
        expanded.push(...nested.map((inner) => ({ ...inner, executesExpansion: inner.executesExpansion || group.executesExpansion })));
        continue;
      }
    }
    expanded.push({ words: commandWords, pipeline: group.pipeline, executesExpansion: group.executesExpansion });
  }
  return expanded;
}

function documentationOperand(word: string): boolean {
  if (["$", "`", "\0"].some((character) => word.includes(character))) return false;
  const parts = word.toLowerCase().split("/");
  const name = parts.at(-1) ?? "";
  const suffix = name.includes(".") ? name.split(".").at(-1) ?? "" : "";
  if (["", "txt", "json", "jsonl", "ndjson", "out", "err"].includes(suffix) &&
      /(?:^|[-_.])(?:stdout|stderr|output|logs?|results?|traces?|diagnostics|console|captured?)(?:[-_.]|$)/.test(name)) return false;
  const suffixes = new Set(["md", "mdx", "rst", "adoc", "swift", "m", "mm", "h", "c", "cc", "cpp",
    "hpp", "js", "ts", "tsx", "jsx", "py", "rs", "go", "java", "kt", "kts", "rb", "sh", "bash",
    "zsh", "json", "yaml", "yml", "toml", "xml", "plist", "xcconfig", "pbxproj", "xcproj", "html",
    "css", "scss", "sql"]);
  const names = new Set(["readme", "license", "licence", "copying", "notice", "authors", "changelog",
    "contributing", "code_of_conduct", "security", "agents", "claude", "makefile", "dockerfile",
    "gemfile", "podfile", "package.resolved"]);
  const directories = new Set(["docs", "documentation", "sources", "source", "src", "scripts", "tests",
    "test", ".claude", ".claude-plugin"]);
  return suffixes.has(suffix) || names.has(name) || names.has(name.split(".")[0]) ||
    parts.some((part) => directories.has(part));
}

function isDocumentationCommand(command: string): boolean {
  const groups = commandGroups(command, 0, true);
  if (!groups) return false;
  const searches = new Set(["rg", "grep", "sed", "awk"]);
  const readers = new Set(["cat", "head", "tail", "less", "more", "bat", "nl"]);
  let inspection = false;
  let runtime = groups.some((group) => group.executesExpansion);
  for (const { words, pipeline } of groups) {
    const program = words[0]?.split("/").at(-1);
    if (!program) continue;
    if (readers.has(program) || searches.has(program)) {
      let operands: string[] = [];
      let patternProvided = false;
      const patternOptions = new Set(searches.has(program) ? ["-e", "--regexp", "-f", "--file", "--expression"] : []);
      const pairedOptions = new Set([...patternOptions, "-A", "-B", "-C", "--context", "-g", "--glob"]);
      if (["head", "tail"].includes(program)) for (const option of ["-n", "-c", "--lines", "--bytes"]) pairedOptions.add(option);
      if (program === "awk") for (const option of ["-F", "-v"]) pairedOptions.add(option);
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (word === "--") {
          operands.push(...words.slice(i + 1));
          break;
        } else if (pairedOptions.has(word)) {
          i++;
          patternProvided ||= patternOptions.has(word);
        } else if (word.startsWith("-") && word !== "-") {
          patternProvided ||= [...patternOptions].some((option) => word.startsWith(`${option}=`));
          patternProvided ||= searches.has(program) && /^-[ef][^-]/.test(word);
        } else operands.push(word);
      }
      if (searches.has(program) && !patternProvided) operands = operands.slice(1);
      if (operands.some((word) => word === "-" || /\.(log|crash|ips)$/.test(word))) runtime = true;
      else if (operands.length) {
        if (operands.every((word) => documentationOperand(word) || (searches.has(program) && [".", "./"].includes(word)))) inspection = true;
        else runtime = true;
      } else if (!pipeline) {
        if (program === "rg") inspection = true; // Without file operands, ripgrep searches source in cwd.
        else runtime = true;
      }
    } else if (["echo", "printf", "git"].includes(program)) inspection = true;
    else if (["curl", "wget"].includes(program) && words.slice(1).some((word) => /\.(md|swift|txt|rst)$/.test(word))) inspection = true;
    else if (!["cd", "pwd", "true", "false", ":", "export"].includes(program)) runtime = true;
  }
  return inspection && !runtime;
}

/** A file path off a tool event's input, tolerating either `path` or `filePath`. */
export function inputPath(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const rec = input as Record<string, unknown>;
  const p = rec.path ?? rec.filePath;
  return typeof p === "string" ? p : undefined;
}

/** Advisory text for the Swift guardrails (@State + @Relationship) in source, or null. */
export function swiftGuardrailWarning(swiftSource: string): string | null {
  const sections: string[] = [];
  const stateHits = unscopedStateVars(swiftSource).slice(0, 3);
  if (stateHits.length) {
    const detail = stateHits.map((h) => `  L${h.line}: ${h.text}`).join("\n");
    sections.push(
      "⚠️ Axiom guardrail: `@State` without an explicit access level " +
        "(use `@State private var` — child views can otherwise create independent " +
        `state copies):\n${detail}`,
    );
  }
  const relHits = unguardedRelationships(swiftSource).slice(0, 3);
  if (relHits.length) {
    const detail = relHits.map((h) => `  L${h.line}: ${h.text}`).join("\n");
    sections.push(
      "⚠️ Axiom guardrail: SwiftData to-many `@Relationship` without a default " +
        `(add \`= []\` — it crashes at runtime when SwiftData reads it):\n${detail}`,
    );
  }
  return sections.length ? sections.join("\n\n") : null;
}

/** Minimal structural shape of a Pi `tool_result` event (keeps this module Pi-free). */
export type ToolResultLike = {
  toolName: string;
  input: unknown;
  content: ReadonlyArray<{ type: string; text?: string }>;
};

/**
 * Advisory text to append to a `write`/`edit`/`bash` tool result, or null.
 * `readFile` is injected so this is unit-testable without touching disk.
 * Crash-file routing is handled pre-read on `tool_call`, not here.
 */
export function toolResultHint(event: ToolResultLike, readFile: (p: string) => string): string | null {
  if (event.toolName === "write" || event.toolName === "edit") {
    const p = inputPath(event.input);
    if (!p || !p.endsWith(".swift")) return null;
    try {
      return swiftGuardrailWarning(readFile(p));
    } catch {
      return null; // file unreadable (e.g. deleted) — nothing to check
    }
  }
  if (event.toolName === "bash") {
    if (typeof event.input === "object" && event.input !== null) {
      const command = (event.input as Record<string, unknown>).command;
      if (typeof command === "string" && isDocumentationCommand(command)) return null;
    }
    const text = event.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n");
    const hints = bashOutputHints(text);
    return hints.length ? hints.join("\n") : null;
  }
  return null;
}
