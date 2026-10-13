---
name: xcsym-ref
description: Complete reference for the `xcsym` CLI that ships with Axiom — crash/resolve/find-dsym/list-dsyms/verify/anonymize subcommands, output schema, exit codes, pattern catalog, dSYM discovery order
---

# xcsym Reference (iOS/macOS Crash Symbolication)

Reference for `xcsym`, the crash symbolication tool bundled with Axiom. It reads `.ips` (v1 and v2), MetricKit (`MXCrashDiagnostic`), Apple's legacy `.crash` text, and Xcode Organizer `.xccrashpoint` bundles; finds the matching dSYMs; symbolicates with `atos`; tags each crash with a `pattern_tag`; and reports UUID and architecture mismatches for every image. Apple's own tools (`atos`, `symbolicatecrash`) produce text meant for a person reading Xcode; xcsym adds dSYM discovery, pattern categorization, and compact JSON, so your assistant can triage a crash in one call.

## When to Use This Reference

Use this reference when:
- Looking up the flags for the `crash`, `verify`, `resolve`, `find-dsym`, `list-dsyms`, `triage`, and `anonymize` subcommands
- Checking the JSON that `crash` emits (`tool`, `version`, `format`, `input`, `crash`, `images`, `images_summary`, `warnings`, `size_warning`)
- Interpreting an exit code (`0` success, `1` usage, `2` input or main dSYM missing, `3` UUID mismatch, `4` architecture mismatch, `5` tool error, `6` timeout, `7` partial match, `8` output error)
- Mapping a `pattern_tag` to its rule ID, confidence, and signal
- Understanding the dSYM discovery order (`--dsym` → cache → Spotlight → Archives → DerivedData → Frameworks → Downloads → Toolchain → `--dsym-paths` or `XCSYM_DSYM_PATHS`)
- Handling `.xccrashpoint` bundles (`--filter`, `--prefer-locally-symbolicated`, `empty_bundle` versus `unsupported_format`)
- Reading the JSON xcsym returns for a hang report (`bug_type=298`) or an unsupported format
- Choosing `--format=summary`, `standard`, or `full`, and reading the size warnings for each tier
- Classifying a corpus of grouped crashes and hangs from Sentry or App Store Connect with `triage`
- Scrubbing a crash for use as a test fixture (what `anonymize` scrubs and what it keeps; it keeps dSYM UUIDs so the fixture still symbolicates)

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What does `xcsym crash` return?"
- "What pattern tags can xcsym emit?"
- "Why did xcsym exit with code 3?"
- "How does xcsym find dSYMs?"
- "What does anonymize preserve so the fixture still symbolicates?"
- "How do I handle an `.xccrashpoint` bundle with multiple builds?"
- "What's the difference between the `crash` and `verify` exit codes?"
- "Why does xcsym take minutes to symbolicate on my machine?"

## What's Covered

- **Invocation** – In Claude Code, `xcsym` is on your `PATH` because Axiom's session hook adds the plugin's `tools/` folder; if the bare name isn't found, `<plugin-root>/tools/xcsym` works, where `<plugin-root>` is the installed plugin's folder. Codex runs `<plugin-root>/tools/xcsym` (there, the folder containing `.codex-plugin/plugin.json`) unless `command -v xcsym` finds it on `PATH`. In Pi, `xcsym` isn't on your `PATH` until you add it ([Pi setup](/start/pi-install#command-line-helpers)). MCP clients call the seven `axiom_xcsym_*` tools (`crash`, `verify`, `find_dsym`, `list_dsyms`, `resolve`, `triage`, `anonymize`), and a table maps each subcommand and flag to the tool's inputs
- **MCP limits** – MCP tools take file paths, not stdin, so pasted crash text must be saved to a file first. Pass absolute paths, and pass the folders that hold your project's dSYMs as `dsymPaths`. The server stops any call at 120 seconds; after a timeout, retry with `noDefaults` plus `dsymPaths`. Reports are always JSON
- **Output format** – Compact, single-line JSON by default, so it costs your assistant few tokens. Every report subcommand (`crash`, `verify`, `resolve`, `find-dsym`, `list-dsyms`) takes `--human` for a terse prose version, and `… | jq .` gives indented JSON. `anonymize` is the exception: it reproduces the `.ips` wire format rather than a report, so it has no `--human`
- **`crash` subcommand** – The full pipeline (parse → discover dSYMs → symbolicate → categorize → emit JSON), with `--format`, `--human`, `--from-metrickit`, `--dsym`, `--dsym-paths`, `--no-symbolicate`, `--no-cache`, `--no-spotlight`, `--no-defaults`, `--output`, stdin input, and the `.xccrashpoint` flags. Flags may come before or after the file path
- **`verify` subcommand** – Per-image UUID and architecture match diagnostics, with exit codes that differ from `crash`
- **`resolve` subcommand** – Resolves individual addresses with `atos` against an explicit dSYM
- **`find-dsym` subcommand** – Looks up a dSYM by UUID across the discovery chain
- **`list-dsyms` subcommand** – Inventories dSYMs by source (`archives`, `deriveddata`, `downloads`, `toolchain`, `frameworks`, `env`, `all`)
- **`triage` subcommand** – Classifies a JSONL corpus of grouped issues from Sentry or App Store Connect, crashes and hangs alike, into pattern tags, clusters, and noise flags. It runs without symbolication or network access and exits `0` even when it skips reports
- **`anonymize` subcommand** – What it scrubs (bundle IDs, process, app, framework, and binary names, user paths, IP addresses, device names, account IDs, foreign UUIDs in freeform strings, identifying `.crash` header fields) and what it keeps (dSYM UUIDs, thread names, library identifiers, the structural fields symbolication depends on)
- **Output schema** – The top-level JSON shape, with `pattern_tag`, `pattern_confidence`, `pattern_rule_id`, `pattern_reason`, `crashed_thread`, and `images` split into matched, mismatched, and missing
- **Format tiers** – `summary` (~2 KB, warns past 4 KB), `standard` (~12 KB, warns past 50 KB), `full` (warns past 100 KB)
- **Exit codes** – Codes shared by every subcommand (0, 1, 5, 6, 8) plus symbolication codes (2, 3, 4, 7) that differ by subcommand, including what code 7 means for `crash` versus `verify`
- **Pattern tag catalog** – The 20 tags `crash` can emit (19 rules plus `unclassified`) (`swift_forced_unwrap`, `swift_concurrency_violation`, `swift_fatal_error`, `zombie_or_heap_corruption`, `stack_overflow`, `bad_memory_access`, `illegal_instruction`, `exc_guard`, `objc_exception`, `main_thread_checker_violation`, `abort`, `watchdog_termination`, `user_force_quit`, `background_task_expired`, `data_protection_violation`, `code_signing_killed`, `jetsam_oom`, `cpu_resource_fatal`, `swiftui_update_loop`, `unclassified`), with their rule IDs and confidence levels
- **dSYM discovery order** – The nine-step chain, with the `XCSYM_FRAMEWORK_SCAN_TIMEOUT` and `XCSYM_DSYM_PATHS` environment variables
- **Hang and unsupported input** – The JSON rejections (`hang_report`, `unsupported_format`, `empty_bundle`), so your assistant can route on the error field instead of scraping stderr
- **Troubleshooting table** – Symptom, cause, and fix for the common exit codes, bundle errors, and slow symbolication

## Documentation Scope

This page documents the `xcsym-ref` skill in the `axiom-tools` suite. xcsym is Axiom's bundled tool for analyzing a crash after it happens.

- `xcsym crash` rejects hang reports (`.ips` files with `bug_type=298`) by design; for a single hang, see [Hang Diagnostics](/skills/debugging/hang-diagnostics)
- For building an in-app crash reporter with the CrashReportExtension framework, see [metrickit-ref](/reference/metrickit-ref)

## Key Concepts

- **Start with `crash`** – It detects the format, finds dSYMs, runs `atos`, categorizes the crash, and emits JSON. Reach for `verify`, `resolve`, or `find-dsym` only when `crash` reports a specific problem.
- **Exit codes carry the diagnosis** – Codes 2, 3, 4, and 7 say why symbolication was incomplete, so read them before assuming the tool failed. Codes 1, 5, 6, and 8 are real failures.
- **Size tiers protect context** – `standard`, the default, covers the full crashed thread. Use `summary` for a quick look and `full` only when you need every thread.
- **Formats are detected automatically** – `.ips`, MetricKit JSON, and legacy `.crash` text need no flags. In an `.xccrashpoint` bundle, xcsym picks the most recently modified Filter and the raw `.crash` over `LocallySymbolicated/`.

## Related

- [crash-analyzer](/agents/crash-analyzer) – The agent that runs `xcsym crash` and maps the `pattern_tag` to fix guidance
- [/axiom:analyze-crash](/commands/debugging/analyze-crash) – The command that analyzes a single crash file
- [triage-analyzer](/agents/triage-analyzer) and [/axiom:triage](/commands/debugging/triage) – Fetch a Sentry or App Store Connect corpus and rank it with `xcsym triage`
- [Production Triage](/skills/debugging/production-triage) – The corpus-triage workflow and the report format `triage` reads
- [TestFlight Triage](/skills/debugging/testflight-triage) – TestFlight crash workflows that start with xcsym
- [Console Capture (xclog)](/skills/debugging/xclog) – The live counterpart: xclog captures logs while the app runs, while xcsym reads the crash afterward
- [xclog-ref](/reference/xclog-ref), [xcprof-ref](/reference/xcprof-ref), and [xcui-ref](/reference/xcui-ref) – References for the other bundled tools; the [Tools overview](/tools/) covers axbuild and xcproject
