# Hooks

Axiom ships **event-driven hooks**: small scripts that run automatically at points in a coding session to inject context, route you to the right skill, and catch a few high-value Swift mistakes as code is written. They work in **Claude Code, Codex, Cursor, and Pi**, with some differences per assistant (see the matrix below).

## What Are Hooks

Unlike skills, which your assistant reads when they're relevant, and commands, which you run explicitly, hooks run on their own in response to events:

- **Session start** – Inject iOS and Xcode version ground truth, and report available helpers
- **Your prompt** – Route the request to the right Axiom skill
- **After a command** – Suggest a skill based on error output
- **After a file edit** – Flag risky Swift patterns
- **Before reading a crash file** – Route it to the `xcsym` symbolicator
- **Subagent start** – Give spawned agents the same Axiom awareness

A hook returns JSON that either *injects context* (advisory) or *blocks an action* (forcing a fix). See [Hook Outputs](#hook-outputs).

Every hook stays silent outside an Apple project, so a web or Node project stays clean. See [Non-Apple Projects](/start/install#non-apple-projects) for how detection works and how to override it.

## Support by Assistant

Each assistant gets the same intent, but the surface differs. Codex has no `Read` tool, so it gets no crash-file routing. Cursor's and Pi's hooks are **advisory only**: they add context but can't block an action.

| Hook (event) | Claude Code | Codex | Cursor | Pi |
|---|:---:|:---:|:---:|:---:|
| Skill routing (per prompt) | ✓ | ✓ | ✓ | session context instead |
| Session ground truth + helpers | ✓ | ✓ | ✓ | ✓ |
| Subagent skill injection | ✓ | ✓ | ✓ (delivery unverified) | — (no subagents) |
| Bash error → skill hint | ✓ | ✓ | ✓ | ✓ |
| Crash file → `xcsym` routing | ✓ | — (no `Read` tool) | ✓ (via the MCP server) | ✓ |
| Swift guardrails (`@State`, `@Relationship`) | ✓ block + warn | ✓ block + warn | ✓ advisory | ✓ advisory |
| **Enablement** | automatic | install + `features.hooks = true` | automatic (needs Python 3) | the `axiom-pi` extension |

- **Claude Code** – Bundled in the plugin; nothing to enable. Cowork in the Claude desktop app runs the hooks too; chat doesn't. See the [Claude app guide](/start/claude-app-install).
- **Codex** – Install the full plugin (`codex plugin marketplace add CharlesWiltgen/Axiom`, then `codex plugin add axiom@axiom-marketplace`), set `features.hooks = true`, and approve the trust prompt. See the [Codex guide](/start/codex-install).
- **Cursor** – Registered by the Cursor plugin. See the [Cursor guide](/start/cursor-install#hooks).
- **Pi** – Delivered by the `axiom-pi` extension (`pi install git:github.com/CharlesWiltgen/Axiom`). See the [Pi guide](/start/pi-install#commands-and-hooks).

## The Hooks

### Skill Routing

**Event** – On each user prompt (Claude Code, Codex, Cursor)

Analyzes your message for Apple-platform intent and injects a specific skill recommendation before the model responds. This is the main mechanism that makes Axiom skills fire automatically. A negative gate avoids false positives on non-Apple work such as TypeScript, React, or Python.

```
You type: "My SwiftUI view isn't updating when the data changes"
Hook injects: "Axiom: This prompt matches `axiom-swiftui`. Invoke it before responding."
```

Pi has no per-prompt hook; instead, Axiom injects a compact skill menu into the session context at start.

### Session Ground Truth + Helpers

**Event** – Session start (all assistants)

Injects iOS and Xcode version ground truth, so the model never insists that a newer OS "doesn't exist". It names the Xcode you've switched to (with `xcode-select` or `DEVELOPER_DIR`) and its iOS SDK. Claude Code, Codex, Cursor, and Pi receive the same text, and the MCP server includes it in its instructions. The hook also reports which of Axiom's bundled helpers, such as `xclog`, `xcsym`, and `xcui`, are available, and in Claude Code it puts them on your `PATH`.

### Subagent Skill Injection

**Event** – Subagent start (Claude Code, Codex, Cursor)

Gives a spawned subagent the same compact Axiom skill menu, so it inherits Axiom's expertise instead of starting blind. It skips agent types that don't do Apple-platform work (beads, plugin-dev, and similar) to avoid wasting context.

### Bash Error → Skill Hint

**Event** – After a Bash command (all assistants)

Scans command output for Apple-platform error signatures and suggests the matching skill or command:

| Error signature | Suggested skill or command |
|---|---|
| Auto Layout constraint conflict | `axiom-uikit` |
| Actor-isolated / Sendable / data race | `axiom-concurrency` |
| no such column / FOREIGN KEY / migration | `axiom-data` |
| CKError / CKRecord | `axiom-data` |
| iCloud Drive / `NSFileCoordinator` errors | `axiom-data` |
| File not found / storage full / file protection | `axiom-data` |
| retain cycle / memory leak | `axiom-performance` |
| module not found / linker failed | `/axiom:fix-build` |
| An `xcodebuild` test run over 5 minutes | `axiom-testing` |
| An `xcodebuild` build over a minute with error output | `/axiom:fix-build` |
| A failed build whose output was truncated | Use `axbuild` for the next build |

### Crash-File Routing

**Event** – Before a `Read` of an `.ips`, legacy `.crash`, or `.xccrashpoint` file (Claude Code, Cursor, Pi)

Advises running `xcsym crash --format=summary <path>` first (in Cursor, the `axiom_xcsym_crash` MCP tool). `xcsym` symbolicates against local dSYMs and tags the crash pattern, so the model analyzes structured output instead of a raw, unsymbolicated file. It isn't available on Codex, which has no `Read` tool to intercept.

### Swift Guardrails

**Event** – After a Write or Edit of a `.swift` file (all assistants)

Catches two latent bug classes the compiler can't:

- **`@State` without an access level** – *Blocked* on Claude Code and Codex (advisory on Cursor and Pi). Without an explicit level, usually `private`, child views can create independent copies of the state, a silent data-flow bug. Fix: `@State private var`.
- **SwiftData to-many `@Relationship` without a default** – *Advisory* on every assistant. A to-many array relationship with no `= []` compiles clean but crashes at runtime when SwiftData reads it. Fix: add `= []`. It ships as a warning rather than a hard block while its precision is proven in the wild.

Add a trailing `// axiom-ignore` to silence both checks on a line, or `// axiom-ignore:state` or `// axiom-ignore:relationship` to silence one. These hooks do **not** reformat your code. Format-on-save was removed because a silent reformat desyncs the file from the model's in-memory view and breaks its follow-up edits; run `swiftformat` yourself or in your own tooling.

## Hook Outputs

A hook returns JSON that controls what happens next:

| Output | Effect |
|---|---|
| `hookSpecificOutput.additionalContext` | Injects advisory text into the model's context (routing, hints, the `@Relationship` warning) |
| `decision: "block"` | Stops the action and makes the model fix it first (the `@State` guardrail on Claude Code and Codex) |
| `reason` | The explanation shown when an action is blocked |

A block is reserved for clear-cut rules with a trivial, unambiguous fix. Everything else is advisory, so the model weighs it without being forced; that's the safer default, and it keeps the hooks trustworthy enough to leave on.

## Disabling

- **Any assistant** – Set `AXIOM_SESSION_CONTEXT=never` in your shell profile or a project's `.envrc` to silence the hooks for that shell or project. Unlike edits to plugin files, this survives updates.
- **Claude Code** – Disable the plugin in `/plugin` to turn off everything, hooks included.
- **Codex** – Set `features.hooks = false`, or omit it, in `~/.codex/config.toml`.
- **Cursor** – Disable the Axiom plugin.
- **Pi** – Disable or uninstall the `axiom-pi` extension.
