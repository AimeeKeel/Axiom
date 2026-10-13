---
name: energy-diag
description: Symptom-based energy troubleshooting for battery drain, overheating, and background power issues
version: 1.0.0
---

# Energy Diagnostics

Symptom-based troubleshooting for iOS battery drain and overheating. Start with your symptom, follow the decision tree, and get the fix.

## Symptoms This Diagnoses

Use when you're experiencing:
- App at the top of Battery Settings
- Device gets hot during app use, or users complain their phone gets hot
- High background battery drain
- Battery drains faster on cellular than on Wi-Fi
- Energy spike during a specific action
- Drain that users report but you can't reproduce at your desk

## Example Prompts

- "My app is at the top of Battery Settings"
- "Users say their phone gets hot when using my app"
- "High background battery drain reported"
- "App drains battery more on cellular than WiFi"
- "Energy spikes when user taps this button"
- "How do I diagnose battery drain?"

## Diagnostic Workflow

Your assistant first rules out the two mistakes that invalidate a whole profiling session. A device charging over a USB cable reports power metrics near zero, so profile over wireless debugging with the device unplugged. And drain that only happens in real-world use, such as a commute, needs an on-device Performance Trace rather than a trace from your Mac. Then it follows your symptom.

### Symptom 1: App at Top of Battery Settings

Instruments' Power Profiler shows which subsystem is drawing power:
- CPU high → Timer leak or polling loop
- Network high → Many small unbatched requests, or polling
- GPU high → Animations running when not visible
- Display high → Light backgrounds on OLED

### Symptom 2: Device Gets Hot

During a specific action:
- Video or camera → Check encoding efficiency, and stop the capture session when done
- Scrolling or animation → Reduce effects and check the frame rate
- Data processing → Move work to the background and cache results

During normal use:
- Run Power Profiler to find the continuous drain
- Check for infinite loops or runaway recursion

### Symptom 3: Background Drain

Check your Info.plist background modes:
- Location → Use significant-change monitoring, not continuous updates
- Audio → Deactivate the session when nothing is playing
- Fetch → Set a reasonable `earliestBeginDate`
- Background tasks → Call `setTaskCompleted` promptly

### Symptom 4: Cellular-Only Drain

Check your `URLSession` configuration:
- `allowsExpensiveNetworkAccess` → Set to `false` for non-urgent requests
- `isDiscretionary` → Set to `true` for background downloads
- `waitsForConnectivity` → Set to `true` to avoid failed connection retries
- Request patterns → Batch small requests

### Symptom 5: Energy Spike During a Specific Action

Record Power Profiler during the action and note which subsystem spikes. A CPU spike usually means data parsed repeatedly or too many views created at once.

## Quick Diagnostic Checklist

### 30-Second Check
- Profiling over a USB cable? Power metrics read near zero; switch to wireless debugging, unplugged
- Debug build? (Less optimized than release)
- Low Power Mode on? (May affect measurements)

### 5-Minute Check
- Which subsystem dominates? (CPU, GPU, network, or display)
- Sustained or spiky?
- Foreground or background?

### Common Quick Fixes

| Finding | Fix | Time |
|---------|-----|------|
| Timer without tolerance | Add `.tolerance = 0.1` | 1 min |
| `VStack` with a large `ForEach` | Change to `LazyVStack` | 1 min |
| `allowsExpensiveNetworkAccess = true` | Set to `false` | 1 min |
| Missing `stopUpdatingLocation` | Add the stop call | 2 min |
| Audio session always active | Add `setActive(false)` | 5 min |
| Off-screen `CADisplayLink` at a high frame rate | Cap it with `preferredFrameRateRange`, or pause it off-screen | 5 min |
| No Dark Mode | Add asset variants | 30 min |
| Polling on a timer | Convert to push notifications | 2–4 hours |

After shipping a fix, confirm it in the field with MetricKit by comparing against a pre-fix baseline; a clean local trace says nothing about real users.

## Documentation Scope

This page documents the `energy-diag` diagnostic skill (in the `axiom-performance` suite) — symptom-based troubleshooting your assistant uses when you report battery or energy issues.

## Related

- [energy](/skills/debugging/energy) – Energy optimization patterns and the full audit checklist
- [energy-ref](/reference/energy-ref) – Complete energy API reference with code examples
- [metrickit-ref](/reference/metrickit-ref) – The MetricKit fields that prove a fix worked for real users
- [energy-auditor](/agents/energy-auditor) – Scans your codebase for energy anti-patterns; run it with `/axiom:audit energy`

## Resources

**WWDC**: 2025-226, 2025-227, 2022-10083

**Docs**: /xcode/improving-your-app-s-performance
