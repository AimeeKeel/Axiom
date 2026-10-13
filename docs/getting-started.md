---
name: getting-started
description: Interactive onboarding that recommends skills based on your project
---

# Getting Started with Axiom

Welcome to Axiom! This guide helps you find the skills, agents, and commands that fit your Apple-platform development work.

## How Axiom Works

Axiom adds skills, agents, and tools to AI coding assistants such as Claude Code, Codex, Cursor, and Pi:

- **Skills** – Domain knowledge your assistant loads to help you
- **Agents** – Autonomous helpers that scan and analyze your code
- **Commands** – Explicit actions you can run, such as `/axiom:audit`
- **Bundled tools** – `axbuild` (saves full build and test output), `xcproject` (project inspection), `xclog` (simulator console capture), `xcsym` (crash symbolication), `xcui` (simulator UI and accessibility testing), and `xcprof` (CPU and performance profile analysis). They ship with the Claude Code plugin and the full Codex plugin, and your assistant uses them automatically when a task calls for them; in Pi, put them on your `PATH` ([Pi setup](/start/pi-install#command-line-helpers))

**You don't need to memorize anything.** Describe your problem, and your assistant uses the right skill automatically.

## Updating Axiom

In Claude Code, run `/plugin marketplace update axiom-marketplace`, then restart Claude Code to activate the update.

Or enable auto-updates for `axiom-marketplace` and restart Claude Code twice: once to check for and download updates, which takes several seconds, and again to activate them.

Other assistants update differently; see the [Codex](/start/codex-install), [Pi](/start/pi-install#updating), and [Claude app](/start/claude-app-install#updating) guides.

## Quick Start

### Debugging Something?

Tell your assistant what's happening:
- "My build is failing with [error]" → your assistant uses [xcode-debugging](/skills/debugging/xcode-debugging)
- "My app has a memory leak" → your assistant uses [memory-debugging](/skills/debugging/memory-debugging)
- "SwiftUI view isn't updating" → your assistant uses [swiftui-debugging](/skills/ui-design/swiftui-debugging)
- "Symbolicate this .ips crash" or "Why is my TestFlight crash unsymbolicated?" → your assistant runs [xcsym](/reference/xcsym-ref) through the [crash-analyzer](/agents/crash-analyzer) agent
- "Show me what the app is logging" → your assistant uses [xclog](/skills/debugging/xclog)

### Building Something New?

Ask about the feature:
- "How do I implement Liquid Glass?" → your assistant uses [liquid-glass](/skills/ui-design/liquid-glass)
- "Help me add deep linking" → your assistant uses [swiftui-nav](/skills/ui-design/swiftui-nav)
- "I need to add in-app purchases" → your assistant uses [in-app-purchases](/skills/integration/in-app-purchases)

### Want a Code Review?

Run an audit command:
```
/axiom:audit                # Smart mode — suggests relevant audits
/axiom:audit concurrency    # Check for Swift 6 violations
/axiom:audit memory         # Find leak patterns
/axiom:audit accessibility  # Check WCAG compliance
```

## Finding Skills by Category

### Debugging and Performance
- [xcode-debugging](/skills/debugging/xcode-debugging) – BUILD FAILED, simulator issues, environment diagnostics
- [memory-debugging](/skills/debugging/memory-debugging) – Memory growth, retain cycles, leak detection
- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – View update issues, preview crashes
- [performance-profiling](/skills/debugging/performance-profiling) – Decision trees for choosing an Instruments tool

### UI and Design
- [liquid-glass](/skills/ui-design/liquid-glass) – The iOS 26 Liquid Glass material
- [swiftui-nav](/skills/ui-design/swiftui-nav) – `NavigationStack`, deep linking, state restoration
- [hig](/skills/ui-design/hig) – Quick Human Interface Guidelines decisions

### Data and Persistence
- [swiftdata](/skills/persistence/swiftdata) – `@Model`, `@Query`, CloudKit integration
- [database-migration](/skills/persistence/database-migration) – Safe schema evolution

### Concurrency
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Swift 6 strict concurrency, `@MainActor`, `Sendable`

### Networking
- [networking](/skills/integration/networking) – Network.framework patterns and `URLSession`

## Skill Naming

- **No suffix** – Discipline skills that enforce a workflow (e.g., `memory-debugging`)
- **`-diag` suffix** – Diagnostic skills for troubleshooting (e.g., `energy-diag`)
- **`-ref` suffix** – Reference skills with comprehensive API coverage (e.g., `storekit-ref`)

## Tips

1. **Describe your problem** – Your assistant picks the right skill
2. **Run audits first** – Automated scans find quick wins
3. **Use diagnostic skills** – When troubleshooting a specific issue
4. **Check reference skills** – When implementing a new feature

## Example Prompts

Try these to see skills in action:

- "I'm getting a retain cycle warning in Xcode"
- "How do I handle SwiftData migration?"
- "My app drains battery quickly"
- "Help me implement zoom transitions"
- "Review my code for Swift 6 concurrency issues"

## Related

- [Getting Started skill](/skills/getting-started) – Ask "I just installed Axiom, where should I start?" and your assistant recommends skills for your project
- [/axiom:audit](/commands/utility/audit) – The smart audit command
- [/axiom:status](/commands/utility/status) – Project environment health
