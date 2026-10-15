<script setup>
import stats from '../.vitepress/theme/stats.json'
const skills = stats.disciplineSkills + stats.referenceSkills + stats.diagnosticSkills
</script>

# MCP Server

Axiom includes an MCP (Model Context Protocol) server that brings its Apple-platform development skills to any MCP-compatible AI coding tool — VS Code, Claude Desktop, Cursor, Gemini CLI, OpenCode, and more.

## What You Get

The MCP server exposes Axiom's full catalog:

- **{{ skills }} skills** as MCP Resources, loaded on demand, plus tools to browse, search, and read them (`axiom_get_catalog`, `axiom_search_skills`, `axiom_read_skill`)
- **{{ stats.agents }} agents**, whose instructions your assistant fetches with the `axiom_get_agent` tool and then follows
- **{{ stats.commands }} commands** as MCP Prompts (structured workflows)
- **`xclog`, `xcsym`, and `xcprof`** as MCP Tools, for console capture, crash symbolication, and CPU profiling on an Apple Silicon Mac with Xcode
- **Apple's documentation bundled inside Xcode**, searchable alongside Axiom's skills when Xcode is installed

## Prerequisites

- **Node.js 18+** – check with `node --version`

That's it. No cloning, no building.

## Installation by Tool

Each tool needs a configuration snippet that tells it how to launch the Axiom MCP server.

### VS Code

Add this to `~/.copilot/mcp-config.json` to use Axiom in every project, or to `.mcp.json` at the root of a project for just that one:

```json
{
  "mcpServers": {
    "axiom": {
      "command": "npx",
      "args": ["-y", "axiom-mcp"]
    }
  }
}
```

**MCP: Add Server** in the Command Palette walks you through the same setup. VS Code still reads the older `.vscode/mcp.json` and user-profile `mcp.json` files, which use a top-level `servers` object, but marks them deprecated.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "axiom": {
      "command": "npx",
      "args": ["-y", "axiom-mcp"]
    }
  }
}
```

### Cursor

When Axiom is installed as a native Cursor plugin, Cursor automatically discovers the plugin-root `mcp.json`. Do not also add Axiom to `.cursor/mcp.json`: duplicate definitions can produce duplicate servers or unclear configuration ownership. See the [native Cursor install guide](/start/cursor-install).

For an **MCP-only setup without the native plugin**, add this exact configuration to `.cursor/mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "axiom": {
      "command": "npx",
      "args": ["-y", "axiom-mcp"]
    }
  }
}
```

### Gemini CLI

Add to `~/.gemini/settings.json` (or `.gemini/settings.json` in a project):

```json
{
  "mcpServers": {
    "axiom": {
      "command": "npx",
      "args": ["-y", "axiom-mcp"]
    }
  }
}
```

### OpenCode

Add to `opencode.jsonc` in your project root (or `~/.config/opencode/opencode.jsonc` for global):

```json
{
  "mcp": {
    "axiom": {
      "type": "local",
      "command": ["npx", "-y", "axiom-mcp"]
    }
  }
}
```

Or use the CLI: `opencode mcp add` and follow the prompts.

## Configuration

### Environment Variables

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `AXIOM_MCP_MODE` | `development`, `production` | `production` | Runtime mode |
| `AXIOM_DEV_PATH` | File path | — | Plugin directory for development mode |
| `AXIOM_LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` | Logging verbosity |
| `AXIOM_APPLE_DOCS` | `false` | Enabled | Set to `false` to leave Xcode's bundled Apple documentation out of the catalog |
| `AXIOM_XCODE_PATH` | Path to an Xcode app | The one `xcode-select` points to | The Xcode whose bundled documentation and version the server reads |
| `AXIOM_XCLOG_PATH`, `AXIOM_XCSYM_PATH`, `AXIOM_XCPROF_PATH` | File path | Bundled binary | Use a different `xclog`, `xcsym`, or `xcprof` binary |
| `AXIOM_XCLOG_TIMEOUT`, `AXIOM_XCSYM_TIMEOUT`, `AXIOM_XCPROF_TIMEOUT` | Seconds | `120`, `120`, `300` | Time limit for each call to that tool; raise it for long recordings |

### Development Mode (Live Skills)

For Axiom contributors working on skills:

```bash
AXIOM_MCP_MODE=development \
AXIOM_DEV_PATH=/path/to/Axiom/.claude-plugin/plugins/axiom \
node /path/to/Axiom/axiom-mcp/dist/index.js
```

Changes to skill files are reflected immediately — no rebuild needed.

### Production Mode (Bundled)

The default when you install from npm. The server reads Axiom's skills from a pre-compiled snapshot instead of a plugin checkout.

```bash
npx axiom-mcp
```

## Verify It Works

### Quick Test

Run the server directly to confirm it launches without errors:

```bash
npx axiom-mcp
```

The server should start and wait for stdin input (MCP uses stdio transport). Press `Ctrl+C` to stop.

### MCP Inspector

For interactive testing, use the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx axiom-mcp
```

This opens a web UI where you can browse resources, test prompts, and invoke tools.

### In Your Tool

Once it's configured, try asking your assistant:

> "What Axiom skills do you have for debugging iOS builds?"

It should list Axiom's skills from the MCP server.

## Troubleshooting

### Server Won't Start

Check that Node.js is version 18 or newer:

```bash
node --version
```

### Skills Not Appearing

Turn on debug logging to see what the server loads:

```bash
AXIOM_LOG_LEVEL=debug npx axiom-mcp 2>&1 | grep -i skill
```

### Client Can't Connect

MCP communicates over stdin and stdout. Common issues:

- **Wrong config** – Make sure `command` is `"npx"` and `args` is `["-y", "axiom-mcp"]`
- **Other stdout writers** – Make sure nothing else writes to stdout; the server logs only to stderr

Run the command from your config by hand:

```bash
npx axiom-mcp
# Should start without errors, waiting for stdin
```

## What's Next

- [View all skills →](/skills/) – Browse the complete skill catalog
- [Agents overview →](/agents/) – See what Axiom's agents check and fix
- [Example Workflows →](/start/workflows) – Step-by-step guides for common tasks
- [Xcode Integration →](/start/xcode-setup) – Add this server to Xcode's Claude Agent and Codex
