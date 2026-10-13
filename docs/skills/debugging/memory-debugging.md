---
name: memory-debugging
description: Use when debugging retain cycles, memory leaks, crashes after 10+ minutes, or progressive memory growth from 50MB → 200MB — provides systematic diagnosis, Instruments patterns, and production-ready fixes for iOS/macOS apps under time pressure
---

# Memory Debugging

Systematic memory leak diagnosis with Instruments and the Memory Graph Debugger. Most leaks come from forgetting to stop timers, observers, or subscriptions, and this skill covers those patterns and the rest.

## When to Use

Use this skill when:
- App memory grows steadily during use (50MB → 100MB → 200MB) instead of leveling off
- Instruments shows several instances of the same view controller
- The app crashes after 10–15 minutes with no error message
- Instruments shows retain cycles or leaked objects
- View controllers don't deallocate after they're dismissed

**Time investment** Finding a leak with Instruments takes 5–15 minutes; guessing takes 45 minutes or more.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My app crashes after 10–15 minutes of use with no error messages. How do I find the leak?"
- "Memory jumps from 50MB to 200MB+ on a specific action. Is this a leak or normal caching?"
- "View controllers don't deallocate after dismiss. How do I find the retain cycle?"
- "I have timers and observers that might be leaking. How do I verify and fix them?"
- "My app uses 200MB. Is that normal, or do I have multiple leaks?"
- "How do I set up Instruments to track memory leaks?"
- "How do I verify my fix actually worked?"

## What This Skill Provides

### Common Leak Patterns

1. **Timer leaks** (about 50% of leaks) – Repeating timers the run loop keeps alive; `[weak self]` alone doesn't stop them, so invalidate them or use a Combine timer
2. **Observer and notification leaks** (about 25%) – Observers that are never removed
3. **Closure capture leaks** (about 15%) – `self` captured strongly in stored closures and callback arrays
4. **Strong reference cycles** – Objects that hold each other through closures
5. **View and layout callback leaks** – Closures that capture view controllers, where a weak delegate would do
6. **PhotoKit image request leaks** – `PHImageManager` requests that are never cancelled during scrolling

### Diagnosis
- Mandatory first steps: check device logs, open the Memory Graph Debugger, and repeat the action while profiling
- Reading the shape of the memory line: flat, a steady climb, a spike that levels off, or stacked spikes (compound leaks)
- A three-phase workflow: confirm the leak, locate it, then fix and verify
- Intermittent leaks that disappear under Instruments, diagnosed with `deinit` logging and MetricKit
- Command-line checks without Instruments: `leaks`, `heap`, `vmmap`, `stringdups`, `malloc_history`, and `xctrace`

### Measuring Peak and Resting Memory
- Reading `phys_footprint` and `ledger_phys_footprint_peak` from `task_info` (`TASK_VM_INFO`), plus your remaining headroom from `os_proc_available_memory()`
- Which number each termination is judged against: a memory-limit kill checks your instantaneous footprint, while background jetsam picks victims by their resting figure
- Why the peak never resets (read it before and after, and take the difference), why polling misses spikes, and where peaks hide (scrolling back, reopening a document, image pipelines)

### Jetsam
- Clearing caches when the app moves to the background
- Restoring state so users don't notice a jetsam termination
- Tracking memory-pressure exits with MetricKit, and memory exception diagnostics with the call stack at a memory-limit kill (iOS 27)

### The Swift 6.4 Capture Warning (Xcode 27)
- The `[#ImplicitStrongCapture]` warning for a `[weak self]` inner closure inside an outer closure that already captures `self` strongly, and how to fix it by intent rather than silencing it

## Key Pattern

### Closure Capture Fix

```swift
// ❌ LEAKS: Strong capture of self
viewModel.onUpdate = {
    self.updateUI()  // self captured strongly
}

// ✅ SAFE: Weak capture
viewModel.onUpdate = { [weak self] in
    self?.updateUI()
}

// ✅ Verify fix worked
deinit {
    print("ViewController deallocated")  // Should print on dismiss
}
```

### Quick Diagnosis Checklist

1. Does the class have a `deinit`? Add one with a print statement
2. Does `deinit` run when expected? If not, there's a leak
3. Check closures, delegates, timers, and observers
4. Use the Memory Graph Debugger to find what's holding the object

## Documentation Scope

This page documents the `memory-debugging` skill in the `axiom-performance` suite. Your assistant uses its leak diagnosis workflows, Instruments setup, leak patterns, and peak-memory measurement when helping you debug memory problems.

## Related

- [/axiom:audit memory](/commands/debugging/audit-memory) – A quick automated scan of your code for leak patterns
- [memory-auditor](/agents/memory-auditor) – An agent that scans your whole codebase for leaks
- [objc-block-retain-cycles](/skills/debugging/objc-block-retain-cycles) – The same diagnosis for Objective-C blocks
- [timer-patterns](/skills/debugging/timer-patterns) – Timer crash patterns and run loop mode problems
- [lldb](/skills/debugging/lldb) – Inspecting the objects you find at a breakpoint
- [performance-profiling](/skills/debugging/performance-profiling) – Broader profiling, including CPU and energy
- [metrickit-ref](/reference/metrickit-ref) – `DiagnosticReport.memoryException` and MetricKit setup for memory-limit kills in the field

## Resources

**WWDC**: 2021-10180, 2020-10078, 2018-416

**Docs**: /xcode/gathering-information-about-memory-use, /metrickit/mxbackgroundexitdata
