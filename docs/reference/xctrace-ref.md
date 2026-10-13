---
name: xctrace-ref
description: xctrace CLI reference for headless Instruments profiling, CI/CD integration, and trace export
---

# xctrace Reference

Reference for `xctrace`, Apple's command-line tool behind Instruments.app. It covers recording traces without the Instruments window, exporting trace data as XML, and automating performance checks in CI.

## When to Use This Reference

Use this reference when:
- Recording Instruments traces from the command line
- Automating profiling in a CI/CD pipeline
- Exporting trace data to XML for programmatic analysis
- Finding the right instrument for your profiling need
- Troubleshooting xctrace recording or export problems
- Comparing performance before and after a code change
- Post-processing a `sample` call tree with `filtercalltree`

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I profile my app from the command line?"
- "How do I record a CPU trace with xctrace?"
- "How do I export an Instruments trace to XML?"
- "How do I automate performance testing in CI?"
- "What instruments are available in xctrace?"
- "Why does my trace export fail with a template error?"
- "How do I charge UIKit time to my own code in a call tree?"

## What's Covered

- Recording traces with the `--instrument` and `--template` flags
- Target selection: attach by name or PID, launch, all processes, a specific simulator or device
- Recording options: `--output`, `--time-limit`, `--no-prompt`, `--append-run`, `--run-name`
- Core instruments: CPU Profiler, Allocations, Leaks, SwiftUI, Swift Concurrency
- The full list of more than 50 instruments
- XML export with `--toc` (table of contents) and `--xpath` (specific tables)
- CPU profile schema columns and how to read them
- Process discovery for simulator apps
- A CI/CD script for automated profiling
- Before-and-after comparison with `xcprof compare` instead of diffing XML by hand
- Troubleshooting: template errors in Xcode 26 and later, attach failures, empty traces, symbolication with `xctrace symbolicate`
- The Xcode 26 gotcha: prefer `--instrument` to `--template` for reliable export
- Post-processing with `filtercalltree` (invert, charge library costs to callers, prune) and quick checks with `sample`
- Limitations: privacy permissions, Developer Mode for physical devices, backgrounded apps, XML-only export

## Key Pattern

```bash
# Record a CPU profile
xcrun xctrace record \
    --instrument 'CPU Profiler' \
    --attach 'MyApp' \
    --time-limit 10s \
    --output profile.trace

# See available tables
xcrun xctrace export --input profile.trace --toc

# Export a specific table
xcrun xctrace export --input profile.trace \
    --xpath '/trace-toc/run[@number="1"]/data/table[@schema="cpu-profile"]'
```

## Documentation Scope

This page documents the `xctrace-ref` skill in the `axiom-performance` suite. Your assistant draws on it for headless profiling and automated performance analysis; the skill was tested with Xcode 26.2.

- For choosing an Instruments template and reading traces in the Instruments app, see [performance-profiling](/skills/debugging/performance-profiling)

## Related

- [xcprof-ref](/reference/xcprof-ref) – Axiom's bundled wrapper around xctrace, which gates recordings and turns traces into compact reports
- [trace-comparison](/skills/debugging/trace-comparison) – The before-and-after workflow and CI recipe built on `xcprof compare`
- [metrickit-ref](/reference/metrickit-ref) – Performance metrics from users in the field, where a local trace can't reach
- [app-store-connect-ref](/reference/app-store-connect-ref) – Crash reports and performance metrics from TestFlight and App Store builds
