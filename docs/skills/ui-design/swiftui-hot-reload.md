---
name: swiftui-hot-reload
description: Discipline for hot-reloading a running app with InjectionNext + Inject — two-layer setup, the device codesigning flow, verifying with xclog, and the inject-vs-rebuild boundary
skill_type: discipline
version: 1.0.0
---

# SwiftUI Hot Reload

Hot reload lets you edit a SwiftUI view on your Mac and watch the running app update in place, on the simulator or a physical device, with navigation and state preserved and no rebuild or relaunch. This skill covers the third-party **InjectionNext + Inject** toolchain, a debug-only setup that isn't part of Xcode.

## When to Use

Use this skill when:

- The build → install → relaunch → navigate-back loop is too slow and breaking your flow
- You want to iterate on a view *inside the running app*, with real navigation depth and model state intact
- You're iterating on a physical device, not just the simulator
- A teammate set up "Inject" or "InjectionIII" and it isn't reloading, and you need to know why
- You want to know which edits reload live and which still force a rebuild

**Core principle:** Hot reload is the tightest loop for iterating on a view in its real app context, which is exactly what the preview canvas isolates away. Setup is the failure-prone part, and it fails *silently*, so verify rather than assume.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I set up live editing so the app updates on my iPhone while I use it?"
- "What's the difference between InjectionIII and InjectionNext, and which do I use?"
- "I added Inject but my view isn't reloading when I save. What's wrong?"
- "What linker flag do I need for hot reload, and which build configuration?"
- "Why won't injection connect on my physical device?"
- "Which kinds of edits reload live and which need a full rebuild?"
- "How do I confirm hot reload is actually working?"

## What This Skill Provides

### The Two Layers

Mixing these up makes debugging miserable:

- **Engine (`InjectionNext.app`)** – the current-generation injection engine, successor to the legacy `InjectionIII` and `HotReloading`. It recompiles the one file you saved and injects it into the running process through the `-interposable` linker feature.
- **Ergonomics (the `Inject` package)** – `@ObserveInjection` and `.enableInjection()`, which make SwiftUI views re-render after an injection. The `Inject` README still calls itself a wrapper around InjectionIII; that's naming lag, and it works on InjectionNext.

### Setup, in Order

- Launching Xcode from InjectionNext's own menu, which is how the engine hooks the build
- The Debug-only `-Xlinker -interposable` linker flag, in both its project and Swift package forms, plus the Xcode-version gotchas (`EMIT_FRONTEND_COMMAND_LINES`, and an environment-variable workaround for a local-package linker bug)
- The **physical-device flow**: turning on Enable Devices and selecting the code signing identity your build log shows. A signing mismatch is the most common device trap, because the injection bundle then fails to load without any error.
- The two-line view change (`@ObserveInjection` and `.enableInjection()`), which needs no `#if DEBUG` because it compiles to a no-op in release builds

### Verifying with xclog

Setup failures are silent, so confirm rather than guess. InjectionNext prints `🔥`-prefixed lines to the running app's console, which the xclog tool captures. Start xclog, edit a view, save, and watch for a `🔥 Recompiling:` line. A `🔥 ⚠️` line means your edit is bad; no `🔥` line at all means the wiring is wrong. The menu bar icon (orange for connected, green for recompiling, yellow for failed) is the human-eye fallback.

### The Inject-vs-Rebuild Boundary

Body changes, layout, modifiers, literal values, and logic inside an existing method reload live. Adding or removing stored properties, reordering methods in a non-`final` class, changing a function signature, and adding new types or protocol conformances force a normal rebuild. Knowing the line saves you from chasing a "broken" setup that's actually working.

### Gotchas and Choosing a Loop

- A table of setup gotchas, each with its symptom and fix
- When to use hot reload, the preview canvas, on-device previews, Device Hub, or an agent-driven simulator loop

## Documentation Scope

This page documents the `hot-reload` skill (in the `axiom-swiftui` suite), which your assistant draws on when you set up or debug hot reloading with the third-party InjectionNext + Inject stack.

## Related

- [swiftui-previews](/skills/ui-design/swiftui-previews) – The complementary loop: the preview canvas for iterating on a view in isolation, hot reload for iterating inside the running app
- [xclog](/skills/debugging/xclog) – The console capture tool that verifies injection without you watching the menu bar icon
- [device-control-ref](/reference/device-control-ref) – Device Hub and `devicectl`, Apple's native path for controlling devices without code injection
- [simulator-tester](/agents/simulator-tester) – The agent-driven loop that drives the simulator and screenshots each change

## Resources

**Tools**: [InjectionNext](https://github.com/johnno1962/InjectionNext) (engine), [Inject](https://github.com/krzysztofzablocki/Inject) (SwiftUI ergonomics)
