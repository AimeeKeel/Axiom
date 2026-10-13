---
name: metal-migration-diag
description: Metal migration diagnostics — black screen, shader errors, wrong colors, performance regression, GPU crashes
---

# Metal Migration Diagnostics

Systematic diagnosis for the six most common problems when porting from OpenGL or DirectX to Metal, with a decision tree and time-cost estimate for each.

## Symptoms This Diagnoses

Use when you're experiencing:
- Black screen after porting to Metal
- Shader compilation errors (GLSL to MSL conversion)
- Wrong colors, upside-down images, mirrored rendering, or other rendering artifacts
- Performance worse than the original OpenGL or DirectX version
- Camera or video frames that need a Metal texture (replacing `CVOpenGLESTextureCache`)
- Crashes during GPU work (`EXC_BAD_ACCESS`, command buffer aborts, GPU timeouts)

## Example Prompts

- "My Metal view is showing a black screen after porting from OpenGL"
- "I'm getting shader compilation errors converting GLSL to MSL"
- "The rendering is upside down after porting to Metal"
- "Colors are swapped red and blue in my Metal renderer"
- "My Metal port is slower than the OpenGL version"
- "How do I replace CVOpenGLESTextureCache for my camera frames?"
- "App crashes with 'command buffer was aborted'"

## Diagnostic Workflow

### Mandatory First Step

Enable Metal validation before any debugging: in Xcode, choose Edit Scheme → Run → Diagnostics, and turn on Metal API Validation, Metal Shader Validation, and GPU Frame Capture. Most Metal bugs produce clear validation errors, so 30 seconds of setup saves hours of blind debugging.

### Decision Trees

| Symptom | Branches | Time Saved |
|---------|----------|------------|
| Black screen | 8 branches (validation errors, drawable, pipeline, draw calls, resource binding, vertex data, coordinates, clear color) | 1–4 hrs to 5–10 min |
| Shader compilation errors | 7 branches (undeclared identifiers, texture sampling, types, constructors, attribute and buffer indices, implicit conversions) | 15–30 min per shader to 2–5 min |
| Wrong colors or coordinates | 7 branches (Y-flip, mirroring, color swap, sRGB, depth fighting, clipping, transparency) | 1–2 hrs to 5–10 min |
| Performance regression | 8 branches (validation overhead, per-frame resource creation, per-frame pipeline state, draw calls, sync stalls, buffer updates, storage modes, Metal-specific optimizations) | Hours to 15–30 min |
| Camera or video texture interop | API mapping, single-plane BGRA, YUV bi-planar, and `CVMetalTexture` lifetime | 1–3 hrs to minutes |
| GPU crashes | 6 branches (released resources, GPU timeout, validation errors, missing render targets, out-of-bounds access, GPU hang) | — |

### Debugging Tools Quick Reference

- **GPU Frame Capture** (Cmd+Opt+Shift+G) – Inspect buffers, textures, the draw call sequence, and shader variables
- **Metal System Trace** (Instruments) – Analyze the GPU and CPU timeline and find synchronization stalls
- **Shader Debugger** (in a GPU Frame Capture, select a draw call and click Debug) – Step through shader execution and inspect per-pixel or per-vertex values

## Documentation Scope

This page documents the `metal-migration-diag` diagnostic skill (in the `axiom-graphics` suite). The skill file holds each full decision tree, the common fixes with code (including triple buffering and resource lifetime), and a diagnostic checklist; your assistant loads it when you describe a porting problem.

## Related

- [Metal Migration](/skills/games/metal-migration) – Migration strategy, phased planning, architecture differences, and anti-patterns
- [Metal Migration Reference](/reference/metal-migration-ref) – GLSL and HLSL to MSL conversion tables, API equivalents, and setup code
