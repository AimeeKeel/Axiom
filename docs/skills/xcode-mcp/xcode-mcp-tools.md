---
name: xcode-mcp-tools
description: Workflow patterns, workspace targeting, and tool-selection discipline for Xcode's MCP server — headless bootstrap, BuildFix and TestFix loops, preview verification, file-op safety
---

# Xcode MCP Tool Workflows

How to use Xcode's MCP tools in iterative workflows. Covers workspace targeting via `XcodeListWorkspaces`, bootstrapping a session when nothing is open, the BuildFix and TestFix loops, preview verification, debugger inspection, diagnostics triage, and the destructive-operation guard rails for `XcodeRM` and `XcodeMV`. Includes the schema differences verified on Xcode 27.2 beta 2 (27B5028f).

## When to Use

Use this skill when:
- Building, testing, or previewing a project via MCP tools rather than `xcodebuild`
- Starting work with no workspace open — the normal headless case
- A call fails with `workspaceIdentifier is required for this action`
- Deciding between `XcodeUpdate` and `XcodeWrite` for an edit
- Choosing between MCP file tools and standard Read/Write/Grep
- Running test iterations and trying to avoid full-suite runs on every change
- Rendering SwiftUI previews to verify a layout change
- Choosing a preview render destination on Xcode 27.2 beta 2
- A documentation or coverage tool is missing from the live list
- About to call `XcodeRM` or `XcodeMV` — both can break the project if invoked carelessly
- A tool call is rejected with "This agent isn't approved to use Xcode's tools yet" — or, on Xcode 27 beta 5 and earlier, hangs with no error at all

## Example Prompts

- "Build my project using MCP tools"
- "Open my project through MCP without launching Xcode"
- "Run just the failing test, not the whole suite"
- "Render the preview for my ContentView"
- "Render my preview on a destination returned by Xcode 27.2 beta 2"
- "Inspect this variable using InvokeDebuggerCommand"
- "Why are DocumentationSearch and GetCodeCoverage missing on Xcode 27.2 beta 2?"
- "Why does it say workspaceIdentifier is required when I only have one project open?"
- "Should I use XcodeWrite or XcodeUpdate to edit this file?"
- "Can I delete this file via MCP?"

## What This Skill Provides

- **Workspace targeting and bootstrap** – `XcodeListWorkspaces` first, cache the identifier, then open or create a project with `XcodeListTemplates` and `XcodeNewProject`; an empty workspace list is a normal starting state, and targeted calls still need an identifier when only one project is open
- **BuildFix loop** – `BuildProject` → `GetBuildLog` (filtered by severity) → `XcodeRefreshCodeIssuesInFile` → `XcodeUpdate` → repeat (max 5 iterations); fall back to environment-first diagnostics when the same error survives 3 attempts
- **TestFix loop** – `GetTestList` → `RunSomeTests` for fast iteration → `XcodeUpdate` → `RunAllTests` for final verification, plus the `{targetName, testIdentifier}` specifier shape and the 100-test inline cap
- **PreviewVerify workflow** – localization, variant and returned group-item overrides, plus destination discovery and selection on Xcode 27.2 beta 2; inspect fallback results instead of assuming the requested destination was used
- **Debugger inspection** – debugger-attached process and stopped-state checks, with the 27.2 beta 2 recommendation to use `p`/`v` for variable inspection
- **IssueTriage workflow** – server-side severity, pattern, and glob filtering on `GetBuildLog` for project-wide diagnostics; `XcodeRefreshCodeIssuesInFile` for a single file
- **File-operation choices and safety** – when MCP tools provide project context, when standard tools suffice, why `XcodeWrite` overwrites wholesale, and confirmation before `XcodeRM` or `XcodeMV`
- **The unapproved-agent trap** – on Xcode 27.0 an unapproved agent's tool calls are rejected with "This agent isn't approved…" (beta 5 and earlier hung indefinitely on a dialog nobody saw, while `initialize` succeeded and status looked healthy); includes the `Permitted agents` pre-flight check
- **Build-specific tool availability** – `DocumentationSearch` and the release-noted `GetCodeCoverage` are absent from both measured 27.2 beta 2 listings, including the approved-with-workspace capture
- **Anti-patterns table** – "I'll just use xcodebuild", "Skip the identifier", "No workspace is open so MCP is broken", "The call is just slow", "Parse the build log for errors"

## Related

- [Xcode MCP Setup](/skills/xcode-mcp/xcode-mcp-setup) – get connected, in attached or headless mode, before applying these workflows
- [Xcode MCP Reference](/reference/xcode-mcp-ref) – exact parameters and return shapes for every tool referenced here
- [Xcode Debugging](/skills/debugging/xcode-debugging) – environment-first fallback when BuildFix can't make progress (zombie processes, stale Derived Data, simulator issues)
