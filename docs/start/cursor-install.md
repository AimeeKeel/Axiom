# Cursor Plugin

Axiom's native plugin for Cursor IDE/Desktop on macOS packages <!--ax:routers-->27<!--/ax--> skill routers, <!--ax:agents-->42<!--/ax--> agents, <!--ax:commands-->17<!--/ax--> `/axiom-*` commands, and advisory hooks. It also configures Axiom's MCP server, `axiom-mcp`, a separately published npm package that Cursor launches through `npx`.

## Support Target and Prerequisites

- **Cursor IDE/Desktop on macOS.** Other operating systems and Cursor products aren't part of the verified support target.
- **Node.js 18 or newer.** The plugin's root `mcp.json` launches `npx -y axiom-mcp`.
- **Python 3.** Cursor invokes the shipped advisory hook adapters as Python source.
- **Apple development tools as needed.** Individual Axiom workflows may require Xcode or Apple command-line tools, but this plugin doesn't bundle them.
- **A Cursor plan that allows named models, to use the agents.** Cursor Free restricts model selection to Auto and refuses subagent delegation with `Named models unavailable. Free plans can only use Auto.` Skills, commands, hooks, and MCP work on Free; the <!--ax:agents-->42<!--/ax--> agents don't run there.

The generated plugin contains Markdown, JSON, Python source, and static assets. It ships no compiled or executable binary payload. The npm-resolved MCP runtime is a separate dependency and may need network access on first use.

This support target doesn't include Cursor Cloud Agents. In particular, Axiom doesn't claim that Cursor Cloud loads this plugin or runs its hooks or local MCP command.

## Install

### Cursor Marketplace

Axiom isn't listed in Cursor's plugin marketplace yet; until it is, use [Local Checkout](#local-checkout). Once a listing exists, install **Axiom** from the marketplace, review its components and requested behavior, and continue with [Verify the Installation](#verify-the-installation).

### Local Checkout

Clone Axiom to a stable absolute path and check out the revision you intend to test.

In Cursor:

1. Open **Customize** and choose **Add → From Local Repo**.
2. Select the Axiom repository root — the directory containing `.cursor-plugin/marketplace.json` — and choose **Add Plugins**. Don't select `axiom-cursor/` directly.
3. Open **Browse Marketplace**. Under **Axiom Cursor Marketplace**, choose **Add** for Axiom.

Cursor imports the local marketplace into its plugin cache, so it doesn't pick up later changes to the checkout. After you pull a different revision or run `npm run build:cursor`, uninstall Axiom, remove **Axiom Cursor Marketplace**, and repeat the steps above.

## Verify the Installation

Open Cursor's **Customize** panel and inspect the Axiom plugin. Confirm that the panel shows the expected plugin version and discovers:

- <!--ax:routers-->27<!--/ax--> skills
- <!--ax:agents-->42<!--/ax--> agents
- <!--ax:commands-->17<!--/ax--> commands in the `/axiom-*` namespace
- native hooks
- the `axiom` MCP server

Try a command such as `/axiom-status` or `/axiom-ask`. Axiom's Cursor command names use a hyphen after `axiom`; Claude Code's `/axiom:*` namespace doesn't apply here.

The plugin root is `axiom-cursor/`. Cursor discovers `axiom-cursor/mcp.json` automatically, so the plugin and marketplace manifests deliberately don't repeat the MCP definition.

## Agent Authority

The released plugin has two agent classes:

| Class | Which agents | Behavior |
| --- | --- | --- |
| Read-only/background | The auditors, and any other agent that only reads | Declared read-only and eligible to run in the background. |
| Writable/foreground | Agents that build, test, fix, or delegate | Runs in the foreground because it may use write, edit, shell, or delegation capabilities. |

`screenshot-validator` is one of the writable agents, so it deliberately runs in the foreground in Cursor.

Agent delegation depends on the Cursor plan. On Cursor Free every delegation fails before the agent starts, so the plugin's agents register and appear in the picker but can't run. Verified on Cursor 3.17.8: the plugin's <!--ax:agents-->42<!--/ax--> agents load, and delegation returns `Named models unavailable. Free plans can only use Auto.` regardless of an agent's `model` field.

Cursor doesn't provide Axiom's canonical per-agent tool allowlists. Every generated agent inherits host tool and MCP access that may be broader than its source declaration. Before delegating, review the agent, Cursor's tool approvals, and the MCP allowlist/blocklist. `readonly`, prompts, and advisory hooks reduce accidental scope; they aren't substitutes for an enforced sandbox or user approval. Writable agents can change the shared checkout.

## Hooks

The plugin registers Cursor hooks for session start, prompt submission, subagent start, file reads, and shell and write events after a tool runs. They add routing hints or diagnostics as `additional_context` where Cursor supports it.

- **Prompt hook** – The per-prompt router. Cursor's `beforeSubmitPrompt` supplies the prompt text and accepts `additional_context`, so Axiom's routing carries over: a prompt that matches a router is annotated with the skill to invoke before the model answers. It skips prompts under five characters.
- **Subagent hook** – Adds Axiom skill awareness when a subagent starts, alongside the Required Skills preamble in each agent file. The hook is confirmed to fire and receive the subagent type, but whether its context reaches the subagent hasn't been verified, because a Cursor plan that refuses to start subagents can't demonstrate it. If it doesn't, the preamble still carries each agent's declared skills.
- **Read hook** – Routes crash reports. Opening an `.ips`, legacy `.crash`, or `.xccrashpoint` path adds a note pointing at the `axiom_xcsym_crash` MCP tool instead of reading the raw file. It emits no `permission` field, so it never gates the read.
- **Write hook** – Runs after the edit, so its findings never block or undo the change.

Every hook shares these properties:

- It stays silent when the workspace isn't an Apple project. Override that with `AXIOM_SESSION_CONTEXT`, described under [Non-Apple Projects](/start/install#non-apple-projects).
- It's advisory, and fails open on malformed input, missing files, child-process failure, oversized output, or timeout. No hook is a permission boundary, and none fails closed.
- It's non-executable Python source that Cursor runs through `python3`.
- It loads behind a Cursor feature gate, `enable_cc_plugin_import`. The gate is on by default, but Cursor controls it remotely, and when it's off Cursor drops plugin hooks silently rather than reporting an error.

Without Python 3, the plugin's skills, agents, and commands can still appear, but the hooks can't run. Because hooks fail open and the feature gate is silent, missing hook context never means a check passed.

## MCP Behavior

Cursor discovers the plugin-root `mcp.json` automatically and launches:

```text
npx -y axiom-mcp
```

Don't add a second Axiom definition to a workspace's `.cursor/mcp.json` while the native plugin is installed. Duplicate definitions can start duplicate servers or leave it unclear which configuration is in charge. For a standalone MCP-only setup, use the exact configuration in the [MCP setup guide](/start/mcp-install).

`npx -y` resolves the separately published npm package and suppresses npm's install confirmation; it doesn't bypass Cursor's MCP approvals or allowlist/blocklist. The first launch may need network access. A later launch may work offline from the local npm cache, but don't count on it. Review the resolved package version and the tools it exposes before approving it.

## Updating and Removing

For a marketplace installation, use Cursor's plugin management UI and follow Axiom's release notes.

For a local checkout, uninstall Axiom in **Customize**, then open **Browse Marketplace**, choose **Axiom Cursor Marketplace → Remove**, and confirm your checkout is unaffected. Don't delete the checkout as part of removal.

## Troubleshooting

### Axiom is missing from Customize

- Confirm you selected the Axiom repository root, not `axiom-cursor/`, in **Add → From Local Repo**.
- Confirm the repository root contains `.cursor-plugin/marketplace.json` and its Axiom source is `./axiom-cursor`.
- Confirm `axiom-cursor/.cursor-plugin/plugin.json` exists.
- If the checkout changed after installation, remove the cached local marketplace and add it again.

### Skills, agents, or commands are incomplete

- Compare the panel with the inventory under [Verify the Installation](#verify-the-installation).
- Run `npm run check:cursor` from the Axiom checkout to detect stale generated output.
- If check mode reports drift, regenerate with `npm run build:cursor` and inspect the complete delta before reloading Cursor.

### Agents appear but won't run

- Confirm the Cursor plan allows named models. Cursor Free refuses delegation with `Named models unavailable. Free plans can only use Auto.`
- Confirm the agent appears in the picker. Registration and delegation fail independently: an agent can load and still be unable to start.
- You can verify registration without running an agent: the picker should list all <!--ax:agents-->42<!--/ax--> agents.

### Hooks don't add context

- Run `python3 --version` and confirm Cursor can find the same `python3` executable.
- Treat absent hook context as a diagnostic problem, not proof that a safety check passed.
- Confirm the plugin itself loaded. Cursor's `enable_cc_plugin_import` gate can disable plugin hooks without surfacing an error, leaving skills and commands working while hooks are silently inert.
- Sanitize hook diagnostics before you report them: leave out source code, secrets, personal paths, and MCP credentials.

### MCP doesn't start

- Run `node --version` and confirm Node.js 18 or newer.
- Check Cursor's MCP approval and allowlist/blocklist state.
- Check whether first launch can reach npm and whether the requested package version resolved.
- Remove any duplicate Axiom entry from `.cursor/mcp.json`, after deciding which definition should stay.
- Use the [MCP setup guide](/start/mcp-install) for server-level diagnostics.

## Support Boundaries

Report reproducible native-plugin issues in the [Axiom issue tracker](https://github.com/CharlesWiltgen/Axiom/issues) with the Axiom version, Cursor build, macOS version, architecture, Node and Python versions, install method, and sanitized logs.

Axiom's issue triage covers the generated plugin content, adapters, and documentation. Cursor Marketplace review, Cursor behavior outside the macOS IDE/Desktop target, Cursor Cloud Agents, npm registry availability, third-party MCP policy, local machine policy, and Apple toolchain failures are up to their respective providers or environments.

## For Contributors

The plugin is generated. To change it, edit the canonical Axiom source or `scripts/cursor/render.ts`, run `npm run build:cursor`, and commit the generated output rather than editing `axiom-cursor/` directly.

## Also Available

- **[Claude Code](/start/install)** – The full Axiom experience, with every agent, command, and hook
- **[Claude App](/start/claude-app-install)** – Skills in chat, plus agents and hooks in Cowork
- **[Codex Plugin](/start/codex-install)** – Native skills for the OpenAI Codex CLI, web app, and IDE extensions
- **[Pi Coding Agent](/start/pi-install)** – Native skills for the Pi terminal coding agent
- **[MCP Server](/start/mcp-install)** – Skills in VS Code, Cursor, Gemini CLI, and any MCP-compatible tool
- **[Xcode Integration](/start/xcode-setup)** – Axiom's skills inside Xcode's Claude Agent and Codex, through MCP
