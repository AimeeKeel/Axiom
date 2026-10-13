---
name: trace-comparison
description: Use when comparing two performance traces, detecting CPU regressions between builds, or gating CI on performance — function-level deltas with xcprof compare and a non-zero exit code your pipeline can fail on
---

# Trace Comparison

`xcprof compare`, part of Axiom's bundled `xcprof` profiling tool, diffs two Instruments `.trace` recordings into function-level regressions and improvements. Its non-zero exit code lets CI fail a build on the result, replacing the old routine of exporting both traces and eyeballing the XML.

## When to Use

Use this skill when you're:
- Checking whether a change slowed down a hot path ("did this PR regress CPU?")
- Gating a merge on performance in CI
- Quantifying how much an optimization actually helped
- Tired of manually diffing two exported trace XMLs

**Core principle:** Only CPU-cycle *share* is comparable across two runs — raw cycles and milliseconds depend on total work and duration, so `xcprof compare` reports percentage-point deltas.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "Did my change regress CPU performance? Here are two traces."
- "Compare baseline.trace and current.trace for regressions."
- "How do I gate my CI on performance regressions?"
- "What does the `severity` number in the compare output mean?"
- "Why are some frames missing from the comparison?"
- "What threshold should I use for `--fail-on-regression`?"

## What This Skill Provides

- **The two-trace workflow** – record a baseline, make the change, record the current trace exercising the *same* workload, then compare.
- **Reading the deltas** – inclusive vs. self share, the severity ranking (% delta × absolute time), the regression and improvement lists, and why to check both traces' total CPU before trusting a falling share.
- **A CI recipe** – a shell gate plus a GitHub Actions example using `--fail-on-regression`.
- **Exit-code semantics** – `0` clean, `2` usage/environment error, `3` regression met the threshold under the gate, `8` output-write error.
- **Caveats** – raw-address frames are excluded (ASLR), the top-frame cutoff can overstate a delta, millisecond deltas are approximate, and network deltas are totals only.
- **The GUI alternative** – Instruments in Xcode 27 has built-in Run Comparisons for interactive before/after analysis; `xcprof compare` remains the headless/CI path.

## Documentation Scope

This page documents the `trace-comparison` skill (in the `axiom-performance` suite). The `xcprof compare` subcommand performs the comparison itself.

- For recording and single-trace analysis, see [/axiom:profile](/commands/debugging/profile)
- For every `xcprof` flag and output field, see [xcprof Reference](/reference/xcprof-ref)

## Related

- [/axiom:compare-traces](/commands/debugging/compare-traces) – The command that runs this comparison
- [Performance Profiling](/skills/debugging/performance-profiling) – Choosing and reading Instruments tools
- [performance-profiler](/agents/performance-profiler) – Records the traces you compare
