---
name: metrickit-ref
description: MetricKit API reference for field diagnostics — the 27-cycle Swift API (MetricManager, MetricResult, StateReporting) plus legacy MXMetricPayload, MXDiagnosticPayload, MXCallStackTree
---

# MetricKit Reference

API reference for collecting field performance metrics and diagnostics with MetricKit. It covers the Swift-first API from the 27 releases (`MetricManager`, typed metrics and diagnostics, per-state metrics through StateReporting) alongside the legacy `MX*` payload API, call stack symbolication, and integration patterns.

## When to Use This Reference

Use this reference when:
- Setting up MetricKit collection with the new `MetricManager` `AsyncSequence` streams (27 releases) or a legacy `MXMetricManagerSubscriber`
- Migrating from `MXMetricManager` to the new Swift API
- Splitting field metrics by app state (per-tab, per-experiment) with the StateReporting framework
- Parsing typed `MetricReport`/`DiagnosticReport` values or legacy `MXMetricPayload`/`MXDiagnosticPayload`
- Symbolicating MetricKit call-stack frames with dSYMs
- Understanding background exit reasons (jetsam, watchdog, CPU limit)
- Building a crash reporter extension with the CrashReportExtension framework (27 releases)
- Integrating MetricKit alongside a crash reporter like Crashlytics or Sentry

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I set up MetricKit to collect crash data?"
- "How do I migrate from `MXMetricManager` to `MetricManager`?"
- "Can I get hitch metrics per tab or per experiment arm?"
- "Where did the scroll hitch metric go in the new MetricKit API?"
- "How do I attach custom metadata to my reported app states?"
- "How do I symbolicate MetricKit call stacks?"
- "What background exit types does MetricKit track?"
- "How do I use MetricKit signpost metrics for custom operations?"
- "How do I build a crash reporter extension?"
- "What's the difference between MetricKit and Xcode Organizer?"

## What's Covered

- Version support across iOS 13 through the 27 releases
- The new Swift API (27 releases): `MetricManager` setup, `MetricReport` interval entries, the full `MetricResult` metric inventory (including Metal frame rate and storage metrics, and `HitchTimeMetric` with its `HitchTimeRatio` unit — the Swift API has no scroll-specific hitch metric), launch-task tracking, typed diagnostics with termination categories, memory exception diagnostics (iOS 27), and the typed `CallStackTree`
- Per-state metrics: StateReporting domains, state transitions, the `@ReportableMetadata` macro, and state-grouped report encoding
- Crash reporter extensions (27 releases; iOS, iPadOS, macOS, visionOS): the CrashReportExtension framework, `CrashedProcess`, in-extension symbolication, binary image inventory, and extension setup
- Migration map from the soft-deprecated `MX*` API to the 27 API
- `MXMetricManagerSubscriber` setup, registration timing, and development testing (legacy)
- `MXMetricPayload`: CPU, memory, launch time histograms, app exits, scroll hitches, disk I/O, network, signpost metrics, JSON export
- `MXDiagnosticPayload`: crash, hang, disk write exception, and CPU exception diagnostics
- `MXCallStackTree` JSON parsing and symbolication with `atos`
- `MXBackgroundExitData`: all 10 exit types with interpretation and recommended actions
- Integration patterns: analytics upload, hybrid crash reporting, regression alerting
- Best practices and privacy considerations
- MetricKit vs. Xcode Organizer comparison
- Common gotchas: daily metric delivery, opt-in only, no Simulator support, unsymbolicated stacks, keeping the manager alive, state rate limiting

## Documentation Scope

This page documents the `metrickit-ref` skill (in the `axiom-performance` suite), the MetricKit API guide your assistant uses when you need to collect and analyze field performance data. For hang diagnosis workflows, see [Hang Diagnostics](/skills/debugging/hang-diagnostics).

## Related

- [app-store-connect-ref](/reference/app-store-connect-ref) – Crash and metrics analysis in the App Store Connect web dashboard
- [xctrace-ref](/reference/xctrace-ref) – Command-line Instruments profiling during development
- [xcsym](/reference/xcsym-ref) – Symbolicating MetricKit JSON and `.ips` crash files on your Mac
- [Memory Debugging](/skills/debugging/memory-debugging) – Finding the memory growth behind jetsam and memory-limit exits

## Resources

**WWDC**: 2019-417, 2020-10081, 2021-10087, 2026-222

**Docs**: /metrickit, /metrickit/metricmanager, /statereporting, /crashreportextension, /metrickit/mxmetricmanager, /metrickit/mxdiagnosticpayload
