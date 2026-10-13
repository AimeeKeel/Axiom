---
name: xcode-mcp-ref
description: Tool parameters, return shapes, and build-specific behavior for Xcode's MCP server, including verified 27.2 beta 2 schema changes
---

# Xcode MCP Tool Reference

Reference for Xcode's Model Context Protocol server, which lets an AI assistant drive Xcode directly. Covers the 54-tool Xcode 27.1 RC baseline (27A9275, server 25320), matching Xcode 27.0, plus verified differences in the 53-tool Xcode 27.2 beta 2 capture (27B5028f, server 25447.1).

## When to Use This Reference

Use this reference when:
- Looking up the exact parameter list for a specific MCP tool
- Checking the return-shape contract for `BuildProject`, `RunAllTests`, `RenderPreview`, or any other tool
- Verifying which parameters are required versus optional
- Working out why a call failed with `workspaceIdentifier is required for this action`
- Choosing between near-equivalent tools (`XcodeUpdate` vs `XcodeWrite`, `RunAllTests` vs `RunSomeTests`, `GetBuildLog` vs `XcodeRefreshCodeIssuesInFile`)
- Bootstrapping a headless session — opening, creating, or listing workspaces
- Wondering why a tool you expected is missing from `tools/list`

## Example Prompts

- "What parameters does BuildProject take?"
- "What does GetBuildLog return?"
- "How do I open a project when Xcode isn't running?"
- "What's the difference between RunSomeTests and RunAllTests?"
- "Why does my tool call say workspaceIdentifier is required when only one project is open?"
- "Why can't I find DocumentationSearch in the tool list?"
- "What does XcodeNewProject need — projectName or productName?"
- "How do I choose a RenderPreview destination on Xcode 27.2 beta 2?"
- "Why is GetCodeCoverage mentioned in release notes but missing from my tool list?"
- "Which LLDB commands does InvokeDebuggerCommand recommend for inspecting variables?"

## Two Things That Trip Everyone Up

**Tool availability depends on the captured build.** Beta 6 and Xcode 27.0 list all 54 tools with no workspace open, including `DocumentationSearch`; the 27.1 RC has the same schemas. Xcode 27.2 beta 2 lists 53 tools, with `DocumentationSearch` absent even in the approved-with-workspace capture. Its release-noted `GetCodeCoverage` is also absent. The server advertises `listChanged`, so check the live list before calling a tool; a shorter list alone does not establish a workspace or approval problem.

**Pass `workspaceIdentifier` even though it never appears in a `required` list.** It is required wherever tested, including `XcodeListSchemes` and `XcodeListTargets` with a single workspace open; treat it as required for all 46 tools that accept it. The error names the valid identifiers, so a missed one costs a round trip rather than a wrong-target write. Identifiers are readable slugs (`workspace-Gxw7GRzGoI`), not UUIDs, and come from `XcodeListWorkspaces`. On Xcode 26.x this parameter was `tabIdentifier`. It survived into Xcode 27 beta 5 on the running-Xcode path, and beta 6 removed it everywhere — along with `XcodeListWindows`, `XcodeGetCurrentFile`, and `XcodeListNavigatorIssues`. Code written against a beta-5 capture taken with Xcode open will break.

## What's Covered

### Workspaces & projects
`XcodeListWorkspaces`, `XcodeOpenWorkspace`, `XcodeCloseWorkspace`, `XcodeNewProject`, `XcodeListTemplates`, `XcodeNewTarget`, `XcodeListTargets`

### File operations
`XcodeRead`, `XcodeWrite`, `XcodeUpdate`, `XcodeGlob`, `XcodeGrep`, `XcodeLS`, `XcodeMakeDir`, `XcodeMV`, `XcodeRM`

### Build
`BuildProject`, `GetBuildLog`, `XcodeRefreshCodeIssuesInFile`, `GetTargetBuildSettings`, `UpdateTargetBuildSetting`, `GetFileCompilerFlags`, `UpdateFileCompilerFlags`

### Run & debug
`RunProject`, `StopProject`, `GetConsoleOutput`, `InvokeDebuggerCommand`, `RunCodeSnippet`

### Testing
`GetTestList`, `RunAllTests`, `RunSomeTests`, `XcodeListTestPlans`, `XcodeSwitchTestPlan`

### Schemes & run destinations
`XcodeListSchemes`, `XcodeSwitchScheme`, `XcodeListRunDestinations`, `XcodeSwitchRunDestination`

### Previews
`RenderPreview`, `preferredRenderDestination`, `availableRenderDestinations`, `renderedDestination.identifier`, `supportedCanvasControlOverrides.groupItems` (Xcode 27.2 beta 2)

### Device interaction
`DeviceInteractionStartSession`, `DeviceInteractionStartWorkspaceSession`, `DeviceInteractionInstallAndRun`, `DeviceInteractionSynthesize`, `DeviceInteractionEndSession`

### Crash & field diagnostics
`GetTopCrashIssues`, `GetCrashIssueLogs`, `GetTopFieldPerformanceIssues`, `GetFieldPerformanceIssueLogs`

### Localization & string catalogs
`LocalizationPlanner`, `StringCatalogContext`, `StringCatalogRead`, `StringCatalogEdit`

### Project configuration
`AddEntitlement`, `AddInfoPlist`

### Documentation
`DocumentationSearch` (absent in Xcode 27.2 beta 2)

Entries carry extra notes for caveats their schema descriptions bury — among them the word "test" being forbidden in `RunCodeSnippet`'s `purpose`, `XcodeRM` moving files to the Trash by default, `XcodeListTemplates` truncating to 100 of 193 templates, and `GetTestList` capping inline output at 100 tests. The full reference covers preview-destination selection and debugger-command recommendations for Xcode 27.2 beta 2, plus the unverified `GetCodeCoverage` release-note claim.

## Documentation Scope

This page documents the `xcode-mcp-ref` reference skill (in the `axiom-xcode-mcp` suite). For setup and connection guidance, including the headless server, see [Xcode MCP Setup](/skills/xcode-mcp/xcode-mcp-setup). For workflow patterns (workspace bootstrap, BuildFix loop, TestFix loop), see [Xcode MCP Tools](/skills/xcode-mcp/xcode-mcp-tools).

- For environment diagnostics outside MCP (Derived Data, zombie xcodebuild processes), see [Xcode Debugging](/skills/debugging/xcode-debugging)
- For Apple's bundled for-LLM documentation guides, see [Apple Documentation Access](/skills/integration/apple-docs) — a separate resource from the `DocumentationSearch` tool
- For driving simulators and devices without MCP, see [Device Control](/reference/device-control-ref)
