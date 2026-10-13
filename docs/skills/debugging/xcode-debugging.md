---
name: xcode-debugging
description: Use when encountering BUILD FAILED, test crashes, simulator hangs, stale builds, zombie xcodebuild processes, "Unable to boot simulator", "No such module" after SPM changes, or mysterious test failures despite no code changes — systematic environment-first diagnostics for iOS/macOS projects
---

# Xcode Debugging

Environment-first diagnostics for mysterious Xcode issues. Checking the build environment before debugging code turns a 30–120 minute investigation into a 2–5 minute fix.

## When to Use

Use this skill when:
- You get BUILD FAILED with no clear error
- Tests passed yesterday but fail today, with no code changes
- The build succeeds but old code runs
- A simulator says "Unable to boot" or sticks at the splash screen
- You get "No such module" after updating Swift packages
- Builds fail intermittently
- `xcodebuild` processes pile up and you suspect zombies

**Core principle:** 80% of "mysterious" Xcode issues are environment problems (stale Derived Data, stuck simulators, zombie processes), not code bugs.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My build fails with 'BUILD FAILED' but no error details. I haven't changed anything."
- "Tests passed yesterday, failing today with no code changes. What's going on?"
- "My app builds but runs old code from before my changes."
- "Simulator says 'Unable to boot simulator'. How do I recover?"
- "I'm getting 'No such module' errors after updating SPM dependencies."
- "Build sometimes succeeds, sometimes fails. Why?"
- "I have 20 xcodebuild processes running. Is that normal?"
- "What's Device Hub in Xcode 27, and how does it relate to simctl and devicectl?"
- "Xcode 27 shows an inline issue before I build. Is that a real build failure?"
- "A bug only reproduces on my physical device. How do I recreate it on a simulator with Device Hub?"

## What This Skill Provides

### Red Flags (Check Environment First)
- "It works on my machine but not CI"
- "Tests passed yesterday, failing today"
- "Build succeeds but old code executes"
- Intermittent success and failure
- A simulator stuck at the splash screen, or "Unable to install app"
- 10 or more `xcodebuild` processes older than 30 minutes

### Environment Diagnostics
- Checks for running `xcodebuild`, Simulator, and Device Hub processes
- Derived Data size, and why size alone doesn't prove it's stale
- Simulator states with `simctl`
- What each result means: investigate code, or clean only what is confirmed

### Recovery Commands
- Deleting only this project's Derived Data folder, not all of DerivedData
- Shutting down or erasing only the affected simulator
- Stopping one confirmed abandoned build instead of running `killall`
- Isolating one failing test with `-only-testing`

### Devices, Crashes, and Verification
- `devicectl` for installing, launching, and inspecting apps on a physical device
- Device Hub (Xcode 27) for reproducing a device-only bug on a simulator
- Predicted issues (Xcode 27): inline markers that appear before you build and are not yet confirmed failures
- Where crash logs live, and how to symbolicate them
- Screenshot checks in the simulator after a fix

### Time Cost
- 2–5 minutes: environment cleanup
- 30–120 minutes: debugging code when the problem is the environment

## Key Pattern

### The Environment-First Checklist

```bash
# 1. Check for running builds (exit 1 = none, 0 = listed, 2/3 = the check itself failed)
pgrep -lx xcodebuild; echo "pgrep exit=$?"
# Inspect a listed build before stopping anything; count and age don't prove it's stuck
ps -ww -o pid,ppid,user,stat,lstart,etime,time,command -p <PID>

# 2. Stop only a confirmed abandoned build you started
#    (never killall: it also kills other people's builds, CI jobs and archives)
kill -TERM <PID>

# 3. Clean this project's Derived Data folder, not all of DerivedData
#    (the skill includes a script that finds the right folder)

# 4. Reset only the stuck simulator
xcrun simctl shutdown <device-uuid>
xcrun simctl erase <device-uuid>   # erases that simulator's data
```

### Which Fix for Which Symptom

| Symptom | Fix |
|---------|-----|
| BUILD FAILED with no details | Delete this project's Derived Data, then rebuild |
| Old code runs after a successful build | Delete this project's Derived Data, then rebuild |
| "No such module" | Clean, delete this project's Derived Data, then rebuild |
| "Unable to boot simulator" | Shut down that simulator, then erase it |
| Tests hang | Check `xcrun simctl list`, then reboot the simulator |
| Abandoned build process | Inspect it, then stop that one PID |

## Documentation Scope

This page documents the `xcode-debugging` skill (in the `axiom-build` suite), the environment-first diagnostics your assistant runs before investigating code. The skill holds the complete command sequences, the decision tree, and the recovery steps for each symptom.

- For Device Hub's interface and the full `devicectl` and `simctl` reference, see [Device Control Reference](/reference/device-control-ref)

## Related

- [/axiom:fix-build](/commands/build/fix-build) – Command that launches the build-fixer agent
- [build-fixer](/agents/build-fixer) – Agent that runs these environment checks and fixes build issues autonomously
- [Build Debugging](/skills/debugging/build-debugging) – Dependency resolution for CocoaPods and SPM, including when to clear the SwiftPM cache
- [Crash Symbolication (xcsym)](/reference/xcsym-ref) – Symbolicates the crash logs this skill points you to
- [TestFlight Triage](/skills/debugging/testflight-triage) – For a TestFlight crash rather than a build-environment problem
- [Performance Profiling](/skills/debugging/performance-profiling) – For a performance problem rather than an environment problem

## Resources

**WWDC**: 2026-258 (What's new in Xcode 27)

**Docs**: /xcode/debugging
