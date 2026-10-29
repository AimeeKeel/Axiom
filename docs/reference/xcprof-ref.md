---
name: xcprof-ref
description: Complete reference for the `xcprof` CLI that ships with Axiom — doctor/record/analyze/compare subcommands, recording presets, security gates, the per-family support matrix, dSYM symbolication, output envelope, and exit codes
---

# xcprof Reference (Structured xctrace Capture and Analysis)

Reference for `xcprof`, the profiling tool bundled with Axiom, which records Instruments traces and turns them into compact reports your assistant can read. Instead of grepping exported XML, it bounds and gates each recording, resolves xctrace's `id`/`ref` back-references, attributes CPU work to your code rather than `dyld` or `libsystem`, and keeps a per-family support matrix that never reports "no findings" when it means "couldn't measure".

## When to Use This Reference

Use this reference when:
- Looking up the flags for the `doctor`, `record`, `analyze`, and `compare` subcommands
- Choosing a recording preset (`cpu`, `memory`, `network`, `energy`, `full`, `full-ios`) or recording a single `--template` or `--instrument`
- Understanding the security gates: why launching a command (`-- <cmd>`) needs `--allow-launch`, why `--all-processes` needs `--allow-all-processes`, and how `--max-duration` and `XCPROF_TRACE_ROOT` bound a capture
- Interpreting an exit code (`0` ok, `2` environment or usage error, `3` regression found by `compare --fail-on-regression`, `8` output-write error)
- Reading the support matrix (`available`, `partial`, `not_exportable`, `not_present`) and understanding why memory and macOS energy read `not_exportable`
- Symbolicating raw-address frames from a stripped release build with `--dsym`, or letting xcprof find the dSYM by UUID
- Re-scoping CPU analysis to a hang window with `--start-ms` and `--end-ms` without re-recording
- Previewing the exact `xctrace` command a `record` would run (`--dry-run`)

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I record a CPU trace and analyze it in one workflow?"
- "How do I profile my app without letting the tool launch arbitrary processes?"
- "Why does my analyze report show memory as `not_exportable`?"
- "How do I symbolicate a release build's stack frames in a trace?"
- "How do I re-analyze just the 2.0–2.5s window where I saw a hang?"
- "Which processes used the network in my trace, and how many bytes?"
- "What does `xcprof doctor` check?"
- "Why did `xcprof record` exit non-zero but still save a trace?"
- "Which preset records leaks and allocations?"
- "Can I run xcprof from Cursor or Codex instead of Claude Code?"

## What's Covered

- **Invocation** – In Claude Code, `xcprof` is on your `PATH` because Axiom's session hook adds the plugin's `tools/` folder; if the bare name isn't found, `<plugin-root>/tools/xcprof` works, where `<plugin-root>` is the installed plugin's folder. Codex runs `<plugin-root>/tools/xcprof` (there, the folder containing `.codex-plugin/plugin.json`) unless `command -v xcprof` finds it on `PATH`. In Pi, `xcprof` isn't on your `PATH` until you add it ([Pi setup](/start/pi-install#command-line-helpers)). MCP clients call `axiom_xcprof_doctor`, `axiom_xcprof_analyze`, `axiom_xcprof_compare`, and `axiom_xcprof_record`, and the skill's table maps each subcommand and flag to the tool's inputs
- **MCP limits** – The MCP tools always return compact JSON and run headless and non-interactive, so they drop `--json`, `--both`, `--human`, `--open`, and `--no-prompt`. The server stops any call at 300 seconds, so keep `record`'s time limit well under that
- **`doctor` subcommand** – Verifies `xcrun xctrace` and counts the available instruments and devices; `--human` for prose. Exits `0` when ready, `2` if xctrace is missing
- **`record` subcommand** – Captures a `.trace` and reports the saved path, ready for `analyze`. It picks instruments by `--preset` (default `cpu`), `--template <name>`, or repeated `--instrument <name>`; use only one of the three. It needs exactly one target: `--attach <pid|name>`, `--all-processes`, or `-- <cmd>` (a launch, after a literal `--`). It emits compact JSON (the saved `trace`, resolved `instruments`, effective `time_limit`, `target_mode`, and the full `command` it ran); `--human` for text; `--dry-run` previews without recording
- **Recording presets** – Six preset-to-instrument maps (see the table below); `analyze` parses only the CPU Profiler and Network Connections data they record
- **Security gates** – `--max-duration` (default 60s) caps the requested recording time, and an unset `--time-limit` adopts it; a longer `--time-limit` is refused. Neither bounds a launched process's lifetime or guarantees its cleanup. `-- <cmd>` launches nothing without `--allow-launch`, and system-wide capture needs `--allow-all-processes`. `--output` must stay inside `XCPROF_TRACE_ROOT` (or the working directory when it's unset) unless you pass `--allow-external-output`. Pass `--no-prompt` for non-interactive use, or xctrace's privacy prompt can stall the recording
- **`analyze` subcommand** – Exports the table of contents, the `cpu-profile` table, and the `network-connection-stat` table (when present), and resolves back-references into full backtraces. It reports a summary, the support matrix, CPU hot frames (inclusive and self, as a percentage of total cycles plus an approximate ms), an approximate main-thread stall signal, top user-code frames, and a network section (connections grouped by socket: process, protocol, remote address, bytes in and out). Flags: `--json`, `--both`, `--start-ms` and `--end-ms` (hang-window scoping), `--hang-threshold-ms` (default 250), `--user-binary <names>`, `--dsym <path>`, `--open`. Flags may come before or after the trace path
- **`compare` subcommand** – Diffs two traces (`xcprof compare <baseline> <current>`) into per-function CPU-share deltas (`incl_pct_delta`, `self_pct_delta`, `incl_ms_delta`), marks each frame `changed`, `new`, or `gone`, and reports a rise of at least `--threshold-pct` (default 5) as a regression and an equal fall as an improvement. `--fail-on-regression` exits `3` for CI gating; `--dsym` symbolicates both traces; `--human` gives markdown and `--both` markdown then JSON. Both recordings must run the same workload
- **Honest support matrix** – Each instrument family reads `available` (parsed, results present), `partial` (table present, nothing parsed), `not_exportable`, or `not_present` (not in the recording). Memory is `not_exportable` because Allocations and Leaks data lives in the trace's event store, so open the trace in Instruments.app; macOS energy is `not_exportable` because Power Profiler runs only on iOS and iPadOS. Silence never reads as "clean", and "couldn't measure" never reads as "measured, nothing found"
- **Symbolication** – `--dsym <path>` resolves raw `0x…` frames; without it, xcprof finds dSYMs by UUID through Spotlight, and frames with no match stay raw and are flagged, never invented
- **Output and exit codes** – `analyze` defaults to terse markdown (`--json` or `--both` for JSON); `record`, `doctor`, and `compare` default to compact JSON (`--human` for text). Exit `0` ok, `2` environment or usage error (xctrace missing, trace not found, bad arguments, refused gate), `3` regression found (`compare --fail-on-regression`), `8` output-write error
- **The `record` exit-code caveat** – When a launched recording stops at its time limit, `xctrace record` exits non-zero (it returns the killed target's status) but still saves a valid trace, so `record` trusts the saved bundle, not the exit code, and reports `ok: true` with an explanatory `notes` entry
- **Native launch cleanup** – With Xcode 27.2, recording an app launched on your Mac can leave a second, stopped copy of it behind. `record` gives each launch a per-recording token and kills only stopped processes carrying it, so processes that were already running or belong to another recording are never touched. Under `launch_cleanup` it reports the processes it killed, the ones it would not or could not kill, and whether its process check failed

## Recording Presets

Each `record --preset <name>` maps to a fixed set of instruments. For a narrow, one-off capture, use `--template` or `--instrument` instead.

| Preset | Instruments | Use |
|----------|-------------|-----|
| `cpu` | CPU Profiler | "slow" / CPU bottlenecks (analyze round-trips) |
| `memory` | Allocations, Leaks | growth, retain cycles (Instruments.app only) |
| `network` | CPU Profiler, Network Connections | connections + bytes per process (analyze round-trips) |
| `energy` | Power Profiler | battery (iOS/iPadOS only) |
| `full` | CPU Profiler, Allocations, Leaks, Network Connections | macOS "find everything" |
| `full-ios` | full + Power Profiler | iOS "find everything" |

Two instrument choices are deliberate, and both were verified against real Xcode 26 exports. `cpu` uses **CPU Profiler** (schema `cpu-profile`), not Time Profiler. `network` uses **Network Connections** (schema `network-connection-stat`, socket-level, any process), not HTTP Traffic, which captures only URLSession traffic and which `analyze` doesn't read. Allocations and Leaks stay in `memory` and `full` so the recording opens in Instruments.app, but `analyze` can't surface their data (see the support matrix above).

```bash
xcprof record --preset cpu --attach MyApp --time-limit 10s       # attach (no gate)
xcprof record --allow-launch --time-limit 10s -- /path/to/MyApp  # launch from startup
xcprof record --preset cpu --attach MyApp --dry-run              # preview the exact xctrace command
xcprof analyze MyApp.trace --json                                # structured report
```

## Documentation Scope

This page documents the `xcprof-ref` skill in the `axiom-tools` suite. xcprof is Axiom's bundled tool for recording and analyzing Instruments traces.

- For choosing an Instruments template and reading traces in the Instruments app, see [performance-profiling](/skills/debugging/performance-profiling)
- For the raw `xctrace` command-line tool that xcprof wraps, see [xctrace-ref](/reference/xctrace-ref)

## Related

- [performance-profiler](/agents/performance-profiler) – The agent that records and analyzes traces with xcprof for you
- [/axiom:profile](/commands/debugging/profile) – The command that starts a profiling session
- [trace-comparison](/skills/debugging/trace-comparison) – The before-and-after workflow and CI recipe built on `xcprof compare`
- [/axiom:compare-traces](/commands/debugging/compare-traces) – The command that compares two traces
- [metrickit-ref](/reference/metrickit-ref) – Performance metrics from users in the field, where a trace can't reach
- [xclog-ref](/reference/xclog-ref), [xcsym-ref](/reference/xcsym-ref), and [xcui-ref](/reference/xcui-ref) – References for the other bundled tools; the [Tools overview](/tools/) covers axbuild and xcproject
