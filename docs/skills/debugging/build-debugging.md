---
name: build-debugging
description: Dependency and build configuration debugging for CocoaPods, SPM and framework conflicts
version: 1.1.0
---

# Build Debugging

Guidance for build failures caused by dependencies and build configuration rather than code. The skill helps your assistant tell package, framework and project settings problems apart before choosing a fix.

## When to Use

Use this skill when:

- A newly added package produces a "No such module" error
- A build fails because multiple commands produce the same output file
- CocoaPods installs successfully but the project still fails to build
- Package resolution hangs, or dependencies require conflicting versions
- A build works locally but fails in CI, or builds in Debug but fails in Release
- Xcode 27 ignores `-ld_classic`, or dependency scanning reports duplicate Clang module names

## Example Prompts

- "I added a Swift package and now the compiler cannot find its module."
- "Why do two targets produce the same file?"
- "My build log says '-ld_classic is no longer supported and will be ignored' — does that matter?"
- "The build failed but the error scrolled away. Can you find it without rebuilding?"

## What This Skill Provides

- Checks for missing modules, framework search paths and duplicate target membership
- CocoaPods lockfile and installation diagnostics, including opening the workspace rather than the project
- SPM version conflicts, dependency graphs and package cache resets
- Dependency strategies: exact versions, version ranges, forks and excluded transitive dependencies
- Debug and Release build setting comparisons
- Xcode 27 linker and dependency-scanning guidance
- A short diagnosis to run before trying a quick fix suggested under deadline pressure
- Build and test output saved through axbuild, or a plain log file where axbuild isn't available

## Documentation Scope

This page documents the `build-debugging` skill (in the `axiom-build` suite), which your assistant loads when a build fails because of dependencies, packages or build settings rather than code. When your assistant runs a build or test, the skill has it use axbuild where available: axbuild returns a short summary and saves the full report and compiler log, so your assistant can find the real error without rebuilding. To hand the whole diagnosis to an agent, run `/axiom:fix-build`, which launches the build-fixer agent; it asks before deleting caches or stopping processes. For package conflicts specifically, `/axiom:resolve-deps` launches the spm-conflict-resolver agent.

## Related

- [xcode-debugging](/skills/debugging/xcode-debugging) – Environment checks for Xcode and simulator problems, which come before dependency checks
- [build-fixer](/agents/build-fixer) – Autonomous diagnosis using retained build evidence
- [spm-conflict-resolver](/agents/spm-conflict-resolver) – Explains SPM version conflicts, "No such module" errors and duplicate symbols
- [build-performance](/skills/debugging/build-performance) – For builds that succeed but take too long
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Swift 6 isolation and concurrency build errors
- [Tools](/tools/) – axbuild installation, report handling and compatibility limits
