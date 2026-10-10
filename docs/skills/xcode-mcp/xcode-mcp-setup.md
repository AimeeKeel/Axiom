---
name: xcode-mcp-setup
description: Setup for Xcode's built-in MCP server — attached and headless modes, per-client config, agent approval, skills export, and connection troubleshooting.
---

# Xcode MCP Setup

How to connect external AI clients (Claude Code, Cursor, Codex, VS Code, Gemini CLI) to Xcode's MCP server. Covers both ways to run it — attached to a running Xcode, or headless with Xcode closed — plus per-client configuration, the agent approval model, the `run-agent` launch path, and connection troubleshooting.

## When to Use

Use this skill when:
- Setting up Xcode MCP for the first time on this machine
- Configuring a new MCP client (Claude Code, Cursor, Codex, VS Code, Gemini CLI)
- Running MCP in CI, or on a machine where you don't want Xcode open
- A tool call is rejected with "This agent isn't approved to use Xcode's tools yet" (Xcode 27.0; introduced in beta 6), or hangs forever with no error (earlier builds)
- A client connects but `tools/list` returns empty
- `DocumentationSearch` or the release-noted `GetCodeCoverage` is absent on Xcode 27.2 beta 2
- Seeing "Connection refused" from mcpbridge
- Permission prompts reappear every session
- Targeting one of multiple running Xcode instances

## Example Prompts

- "How do I set up Xcode MCP with Claude Code?"
- "How do I run Xcode MCP without keeping Xcode open?"
- "My MCP tool call just hangs and never returns"
- "Why does Xcode say my agent isn't approved to use its tools?"
- "My mcpbridge connection keeps failing"
- "Why do I have to re-approve my agent every day?"
- "Where do I enable MCP in Xcode Settings?"
- "How do I let Xcode launch Claude Code with my project's config?"
- "How do I export Xcode's built-in skills?"
- "Is missing DocumentationSearch on Xcode 27.2 beta 2 an approval problem?"

## Two Modes

Which setup you need depends on whether a human is at the keyboard.

| Mode | Needs | Xcode.app running? |
|:-----|:------|:-------------------|
| Attached (Xcode 26.3+) | A project open in Xcode, Intelligence toggle on | Yes |
| Headless (Xcode 27) | A one-time `sudo` opt-in | No |

Attached suits a developer already working in Xcode. Headless suits CI, agents that shouldn't depend on a GUI session, or simply not wanting Xcode up. Either way, clients register the same command: `xcrun mcpbridge` is the transport. In headless mode `xcrun mcp-server` is the service behind it; in attached mode the running Xcode is. `mcp-server` does not exist before Xcode 27.

## What This Skill Provides

- **Mode selection** – what attached and headless each require, and which to pick
- **Headless lifecycle** – `mcp-server enable`, `open <path>` to launch and load a project, `status`, `stop`, `disable`, and what `--unsafe-always-allow-all-agents` actually grants
- **Per-client config** for Claude Code, Codex, Cursor, VS Code + GitHub Copilot, Gemini CLI
- **Connection verification** – call `XcodeListWorkspaces`, and how to read an empty result
- **Approval and the unapproved-agent trap** – attached-mode dialogs, headless `sudo` grants, time-boxed trust for unsigned agents, and the `Permitted agents` check; rejected calls on Xcode 27.0 versus silent hangs through beta 5
- **Multi-Xcode targeting** – auto-detection fallback plus `MCP_XCODE_PID`, `MCP_XCODE_SESSION_ID`, and `DEVELOPER_DIR`
- **Troubleshooting decision tree and table** – hangs, connection failures, empty tool lists, wrong workspace, repeated prompts
- **Build-specific tool lists** – on 27.2 beta 2 (27B5028f), the unapproved/no-workspace and approved/with-workspace captures list the same 53 tools; `DocumentationSearch` and `GetCodeCoverage` remain absent
- **Letting Xcode launch the agent** – `xcrun agent` (alias for `xcrun mcpbridge run-agent`) starts an agent with Xcode's resolved config; `xcrun agent skills export` dumps Xcode's 10 built-in skill bundles to disk
- **Extending Xcode's agent** – per-agent config folders (Claude, Codex, Gemini) for custom models, MCP servers, and skills, plus Agents → Permissions and Plug-ins

## Related

- [Xcode MCP Tools](/skills/xcode-mcp/xcode-mcp-tools) – once setup works, this skill covers workspace bootstrap, workflow patterns, and tool gotchas
- [Xcode MCP Reference](/reference/xcode-mcp-ref) – baseline parameters and return shapes, plus verified 27.2 beta 2 differences
- [Xcode Debugging](/skills/debugging/xcode-debugging) – environment diagnostics for problems that aren't MCP-related (Derived Data, zombie xcodebuild processes, simulators)
- [Device Control](/reference/device-control-ref) – driving simulators and devices without MCP at all
