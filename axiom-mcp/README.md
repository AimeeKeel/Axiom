# Axiom MCP Server

Model Context Protocol (MCP) server for Axiom's Apple-platform development skills, agents, commands, and bundled CLI tools. Enables cross-platform access to Axiom's battle-tested guidance in any MCP-compatible AI coding tool.

## Features

- **Skills** — Axiom's full Apple-platform skill catalog as MCP Resources, loaded on demand, plus tools to browse, search, and read it
- **Agents** — fetch any agent's instructions with `axiom_get_agent`, then follow them
- **Commands** — structured workflows as MCP Prompts
- **Command-line tools** — `xclog`, `xcsym`, and `xcprof` as MCP Tools, for console capture, crash symbolication, and profiling (Apple Silicon Mac with Xcode)
- **`xcproject`** — a command the package installs alongside the server, for reading `project.pbxproj` and JSON5 `project.xcproj` files; it has no MCP tool
- **Apple's bundled documentation** — the guides and diagnostics inside Xcode, searchable alongside the skills when Xcode is installed
- **Two modes** — production (the bundled snapshot, the default) or development (reads a plugin checkout)

## Installation

### Quick Start (npm)

No clone or build step needed. Add to your tool's MCP configuration:

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

This downloads and runs the server in production mode with all skills bundled.

### Claude Code and the Claude app

The Axiom plugin gives Claude Code and the Claude app its skills, agents, commands, and hooks natively; the plugin does not start this server. See the [install guides](https://charleswiltgen.github.io/Axiom/start/). To add the MCP server to Claude Code as well:

```bash
claude mcp add axiom -- npx -y axiom-mcp
```

## Usage

### VS Code + GitHub Copilot

Add to `.mcp.json` at the root of your project, or to `~/.copilot/mcp-config.json` for every project:

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

VS Code still reads the older `.vscode/mcp.json` (with a top-level `servers` object), but marks it deprecated.

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

Add to `.cursor/mcp.json` in your workspace:

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

### Modes

#### Development Mode (Live Skills)

```bash
AXIOM_MCP_MODE=development AXIOM_DEV_PATH=/path/to/plugin node dist/index.js
```

- Reads skills directly from a checkout of the plugin directory
- Changes to skills are reflected immediately (no rebuild needed)
- For developing and testing Axiom's skills

#### Production Mode (Bundled Skills)

```bash
# Default mode — no environment variables needed
npx axiom-mcp
```

- Reads Axiom's skills, commands, and agents from the snapshot in `dist/bundle.json`, never from a plugin checkout
- Reads Xcode's bundled Apple documentation at startup, when Xcode is installed and `AXIOM_APPLE_DOCS` isn't `false`
- Self-contained, distributed via npm

## MCP Resources

Skills are exposed as MCP Resources with URI scheme:

```
axiom://skill/{skill-name}
```

A router's id is its name; a specialized skill's id is its router's name, two hyphens, then its own name. Apple's guides and diagnostics bundled inside Xcode use `apple-guide-` and `apple-diag-` prefixes. Examples:
- `axiom://skill/axiom-swiftui` (a router)
- `axiom://skill/axiom-build--xcode-debugging`
- `axiom://skill/axiom-swiftui--nav`
- `axiom://skill/axiom-design--liquid-glass-ref`
- `axiom://skill/apple-diag-actor-isolated-call`

### Resource Discovery

```json
// resources/list response
{
  "resources": [
    {
      "uri": "axiom://skill/axiom-build--xcode-debugging",
      "name": "Axiom Build Xcode Debugging",
      "description": "Check build environment BEFORE debugging code. …",
      "mimeType": "text/markdown"
    }
  ]
}
```

### Resource Reading

```json
// resources/read request
{
  "method": "resources/read",
  "params": {
    "uri": "axiom://skill/axiom-build--xcode-debugging"
  }
}

// Response includes full skill content as markdown
{
  "contents": [{
    "uri": "axiom://skill/axiom-build--xcode-debugging",
    "mimeType": "text/markdown",
    "text": "# Axiom Build Xcode Debugging\n\n..."
  }]
}
```

## MCP Tools

| Family | Tools | Side effects |
|--------|-------|--------------|
| Lookup | `axiom_get_catalog`, `axiom_search_skills`, `axiom_read_skill`, `axiom_get_agent` | None |
| `xclog` console capture | `axiom_xclog_list`, `axiom_xclog_launch`, `axiom_xclog_attach`, `axiom_xclog_show` | `launch` terminates and relaunches the target app in the simulator |
| `xcsym` crash symbolication | `axiom_xcsym_crash`, `axiom_xcsym_verify`, `axiom_xcsym_resolve`, `axiom_xcsym_find_dsym`, `axiom_xcsym_list_dsyms`, `axiom_xcsym_triage`, `axiom_xcsym_anonymize` | None |
| `xcprof` profiling | `axiom_xcprof_doctor`, `axiom_xcprof_analyze`, `axiom_xcprof_compare`, `axiom_xcprof_record` | `record` captures a new trace |

The `xclog`, `xcsym`, and `xcprof` tools run macOS arm64 binaries shipped inside the package (`dist/bin/`). **They need an Apple Silicon Mac with Xcode installed**; on other platforms they return an explanatory message instead of running.

**`axiom_xcprof_record` keeps its higher-risk modes gated.** It attaches to a process by default and always runs non-interactively. Launching a process (`launch`) requires `allowLaunch: true`, and system-wide capture (`allProcesses`) requires `allowAllProcesses: true`; without those flags the binary refuses. Recordings are always duration-bounded.

## Development

### Project Structure

```
axiom-mcp/
├── package.json              # npm package config
├── tsconfig.json             # TypeScript config
├── skill-annotations.json    # MCP search/catalog metadata
├── src/
│   ├── index.ts              # Entry point + stdio transport
│   ├── config.ts             # Configuration + logging
│   ├── instructions.ts       # Server instructions sent to clients
│   ├── version-context.ts    # iOS/Xcode version ground truth
│   ├── loader/
│   │   ├── types.ts          # Loader interface
│   │   ├── parser.ts         # Frontmatter parsing
│   │   ├── dev-loader.ts     # Live file reading
│   │   ├── prod-loader.ts    # Bundle reading
│   │   └── xcode-docs.ts     # Xcode's bundled Apple docs
│   ├── resources/
│   │   └── handler.ts        # Resources protocol
│   ├── prompts/
│   │   └── handler.ts        # Prompts protocol
│   ├── tools/
│   │   ├── handler.ts        # Tools protocol + lookup tools
│   │   ├── xclog.ts          # Console capture tools
│   │   ├── xcsym.ts          # Crash symbolication tools
│   │   ├── xcprof.ts         # Profiling tools
│   │   ├── binaries.ts       # Bundled binary list
│   │   └── binary-exec.ts    # Bounded binary execution
│   ├── catalog/
│   │   └── index.ts          # Skill catalog + search
│   ├── search/
│   │   └── index.ts          # BM25 search engine
│   └── scripts/
│       ├── bundle.ts                 # Bundle generator
│       ├── binary-coverage.ts        # Bundled binary checks
│       └── generate-annotations.ts   # skill-annotations.json generator
└── dist/                     # Compiled output
    ├── index.js              # Server entry point
    ├── bundle.json           # Production bundle
    ├── bin/                  # xclog, xcsym, xcprof, xcproject binaries
    └── ...
```

### Build Commands

The package uses pnpm (`pnpm-lock.yaml`).

```bash
# Install dependencies
pnpm install

# Build once
pnpm run build

# Build with production bundle
pnpm run build:bundle

# Watch mode (rebuild on changes)
pnpm run dev

# Run server
pnpm start

# Run tests
pnpm test
```

The `build:bundle` command:
1. Compiles TypeScript (`tsc`)
2. Adds annotations for any new skills to `skill-annotations.json`
3. Generates `dist/bundle.json` from the plugin's skills, commands, and agents, and copies the tool binaries into `dist/bin/`
4. Is required for production mode

### Adding Skills

Routers are discovered from `{AXIOM_DEV_PATH}/skills/<router>/SKILL.md`, and their specialized skills from `{AXIOM_DEV_PATH}/skills/<router>/skills/<name>.md`, which the server names `<router>--<name>`.

Skill frontmatter follows the Agent Skills spec:

```yaml
---
name: my-skill
description: Use when...
license: MIT
---
```

MCP search/catalog annotations (category, tags, related) live in `skill-annotations.json`, keyed by the same ids. `pnpm run annotations` (also part of `build:bundle`) adds an entry for each skill that lacks one and keeps existing entries, so you can edit an entry by hand:

```json
{
  "my-skill": {
    "category": "debugging",
    "tags": ["xcode", "swift", "performance"],
    "related": ["axiom-build--xcode-debugging", "axiom-swiftui"]
  }
}
```

Changes are picked up automatically in development mode.

## Testing

### Manual Testing (Development Mode)

Pipe a request into a development-mode server. It answers on stdout, logs to stderr, and exits when its input ends:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"resources/list"}' | \
  AXIOM_MCP_MODE=development AXIOM_DEV_PATH=../.claude-plugin/plugins/axiom node dist/index.js
```

### Testing with MCP Inspector

Run the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx axiom-mcp
```

Opens a web UI for testing MCP protocol interactions.

## Troubleshooting

### Server Won't Start

**Check Node version:**
```bash
node --version
# Should be 18.0.0 or higher
```

**Check environment variables:**
```bash
echo $AXIOM_MCP_MODE
echo $AXIOM_DEV_PATH
```

**Verify plugin path exists (dev mode):**
```bash
ls $AXIOM_DEV_PATH/skills
# Should show skill directories
```

### Skills Not Appearing

**Check log output (stderr):**
```bash
AXIOM_LOG_LEVEL=debug npx axiom-mcp 2>&1 | grep -i skill
```

### MCP Client Can't Connect

MCP uses stdin/stdout for communication. Common issues:

- **Wrong command** in your tool's config — use `npx` with args `["-y", "axiom-mcp"]`
- **Other stdout writers** — make sure nothing else writes to stdout; logs go to stderr only

Test the command from your config manually:
```bash
npx axiom-mcp
# Should start without errors, waiting for stdin
```

## Architecture

### Two Distributions

**Plugin (Claude Code, the Claude app, Codex, Cursor)** – skills, agents, and commands load natively in the harness. The Codex and Cursor plugins also start this server through `npx -y axiom-mcp`.

**npm package (any MCP client)**
```
npx axiom-mcp → server (production mode) → bundled skills, commands, agents, and tools
```

Development mode runs the same server against a plugin checkout, for working on Axiom's skills.

### Why MCP?

Many AI coding tools, such as VS Code, Gemini CLI, and OpenCode, have no plugin format Axiom ships for. Any of them that speaks MCP gets the same skills, commands, agents, and tools from this one server.

## Contributing

See the main Axiom repository for contribution guidelines.

## License

MIT License — See [LICENSE](LICENSE)
