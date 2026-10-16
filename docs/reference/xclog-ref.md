---
name: xclog-ref
description: Complete reference for the `xclog` CLI that ships with Axiom — list/launch/attach/show subcommands, JSON output schema, simulator and physical-device coverage, preferences file
---

# xclog Reference (iOS Console Capture)

Reference for `xclog`, the console capture tool bundled with Axiom. It merges `simctl launch --console` output (`print`, `debugPrint`, `NSLog`) with `log stream --style json` output (`os_log`, `Logger`) into one JSON stream your assistant can read, and it can search recent logs on a connected iPhone or iPad.

## When to Use This Reference

Use this reference when:
- Looking up the flags and behavior of the `list`, `launch`, `attach`, and `show` subcommands
- Checking which Swift logging APIs each subcommand captures
- Reading the JSON output schema (`time`, `source`, `level`, `subsystem`, `category`, `process`, `pid`, `text`)
- Configuring `--timeout`, `--max-lines`, `--filter`, `--subsystem`, `--output`, `--human`, or `--no-color`
- Targeting a specific simulator with `--device <udid>` or a physical device with `--device-udid <udid>`
- Reading or writing `.axiom/preferences.yaml`, which saves the simulator and bundle ID between sessions
- Understanding why `attach` skips `print()` output (it streams `os_log` only)
- Diagnosing common errors (bad bundle ID, no booted simulator, invalid regex, invalid subsystem, a log stream that dies mid-capture)

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What flags does `xclog launch` accept?"
- "What's the JSON schema xclog emits?"
- "Can xclog read logs from a physical device?"
- "How do I capture only errors from my app's subsystem?"
- "How does the `.axiom/preferences.yaml` file work?"
- "Why doesn't `xclog attach` show my `print()` output?"
- "How do I cap the output so it doesn't flood my assistant's context?"

## What's Covered

- **Invocation** – In Claude Code, `xclog` is on your `PATH` because Axiom's session hook adds the plugin's `tools/` folder; if the bare name isn't found, `<plugin-root>/tools/xclog` works, where `<plugin-root>` is the installed plugin's folder. Codex runs `<plugin-root>/tools/xclog` (there, the folder containing `.codex-plugin/plugin.json`) unless `command -v xclog` finds it on `PATH`. In Pi, `xclog` isn't on your `PATH` until you add it ([Pi setup](/start/pi-install#command-line-helpers)). MCP clients call `axiom_xclog_launch`, `axiom_xclog_attach`, `axiom_xclog_show`, and `axiom_xclog_list`, and a table maps each subcommand and flag to the tool's inputs
- **MCP limits** – Each tool call blocks until it returns. `launch` and `attach` get a 30-second timeout when you set no bound, and every call ends at 120 seconds. Results are JSON only, and `attach` can't write to a file
- **`list` subcommand** – Discovers installed apps, as JSON lines (`bundle_id`, `name`, `version`)
- **`launch` subcommand** – Full capture (`print`, `debugPrint`, `NSLog`, `os_log`, `Logger`), simulator only; terminates any running instance of the app first
- **`attach` subcommand** – Monitors an already-running process through `os_log` only, simulator only; preserves app state but captures no `print()` output
- **`show` subcommand** – Searches recent logs on a simulator or a physical device (for a device, it runs `log collect` over USB; the device must be connected and unlocked)
- **JSON output schema** – `time`, `source` (`print`, `stderr`, `os_log`), `level` (`debug`, `default`, `info`, `error`, `fault`), `subsystem`, `category`, `process`, `pid`, `text`; fields that don't apply are omitted, not null
- **Human-readable mode** – `--human`, plus `--no-color`
- **Options reference table** – `--device`, `--device-udid`, `--output`, `--human`, `--no-color`, `--filter`, `--subsystem`, `--max-lines`, `--timeout`, `--last`
- **Coverage tables** – Swift API by subcommand (`print`, `debugPrint`, `NSLog`, `os_log`, `Logger`) and subcommand by platform (simulator or physical device)
- **Preferences file** – The `.axiom/preferences.yaml` schema (`simulator.device`, `deviceUDID`, `bundleId`), when to read and write it, and adding `.axiom/` to `.gitignore`
- **Filtering** – `--filter` matches message text with a Go regular expression; filtering by level or another JSON field needs `jq`
- **Common subsystems** – `com.apple.network`, `com.apple.coredata`, `com.apple.swiftui`, `com.apple.uikit`
- **Errors** – xclog writes errors to stderr and exits with code 1, or 2 for a flag it can't parse; a table lists the common messages and their fixes
- **Workflows** – Step-by-step command sequences for a runtime crash and a silent failure

## Documentation Scope

This page documents the `xclog-ref` skill in the `axiom-tools` suite. xclog is Axiom's bundled tool for live console capture.

- For when to reach for console capture and how it fits a debugging session, see [Console Capture (xclog)](/skills/debugging/xclog)

## Related

- [/axiom:console](/commands/debugging/console) – The command that runs a guided xclog capture for you
- [Crash Symbolication (xcsym)](/reference/xcsym-ref) – The after-the-fact counterpart: xcsym reads a crash report, while xclog captures logs as they happen
- [Xcode Debugging](/skills/debugging/xcode-debugging) – Environment-first checks to run when the app won't build or launch at all
- [xcprof-ref](/reference/xcprof-ref), [xcsym-ref](/reference/xcsym-ref), and [xcui-ref](/reference/xcui-ref) – References for the other bundled tools; the [Tools overview](/tools/) covers axbuild and xcproject
