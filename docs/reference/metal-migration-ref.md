---
name: metal-migration-ref
description: Metal migration reference — GLSL to MSL, HLSL to MSL, OpenGL to Metal API mappings, MTKView setup, compute shaders
---

# Metal Migration Reference

Reference for converting OpenGL and DirectX code to Metal: shader language conversion tables, API equivalents, and setup code for `MTKView`, `CAMetalLayer`, and compute pipelines. It also covers the Metal 4 machine learning and neural rendering APIs, including the 27-release additions.

## When to Use This Reference

Use this reference when:
- Converting GLSL shaders to Metal Shading Language (MSL)
- Converting HLSL shaders to MSL
- Looking up OpenGL or DirectX API equivalents in Metal
- Setting up `MTKView` or `CAMetalLayer`
- Building render or compute pipelines
- Using Apple's Metal Shader Converter for DirectX
- Integrating MetalFX denoising or upscaling into a render pipeline
- Using quantized `MTLTensor` types or TensorOps in shaders

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I convert this GLSL shader to Metal?"
- "What's the MSL equivalent of `vec4` and `texture()`?"
- "How do I convert HLSL semantics to Metal attributes?"
- "What does `glDrawElements` map to in Metal?"
- "How do I set up a Metal compute shader?"
- "What are the buffer storage modes in Metal?"
- "How do I integrate MetalFX denoising into my path tracer?"
- "What quantized `MTLTensorDataType` formats are available in the 27 SDKs?"
- "Can I create a three-channel RGB Metal texture without an alpha channel?"

## What's Covered

- **GLSL to MSL type mappings** – `vec4` to `float4`, `sampler2D` to `texture2d` + `sampler`, matrix types, precision qualifiers
- **GLSL to MSL built-in variable mappings** – `gl_Position`, `gl_FragCoord`, `gl_VertexID` and their MSL attribute equivalents
- **GLSL to MSL function mappings** – `texture()`, `mod()`, `inversesqrt()`, `atan()` and their MSL counterparts
- **Complete vertex and fragment shader conversion examples** – Side-by-side GLSL and MSL with struct definitions, uniform buffers, and texture sampling
- **HLSL to MSL type, semantic, and function mappings** – `SV_Position`, `SV_Target`, dispatch thread IDs
- **Metal Shader Converter** – Apple's tool for converting DXIL bytecode to Metal libraries, with workflow and options
- **OpenGL API to Metal API tables** – View and context setup, resource creation, state management, draw commands, primitive types
- **Complete setup examples** – `MTKView` (recommended), `CAMetalLayer` (custom control), compute shader pipeline
- **Buffer and texture storage modes** – Shared, private, and managed (macOS), with use case guidance
- **Buffer alignment** – Critical `float3`/`SIMD3` alignment rules for structs shared between CPU and GPU
- **Metal 4 ML and neural rendering** – MetalFX denoising best practices, the machine learning command encoder, TensorOps in-shader networks, quantized tensors and MX scale formats (27 releases)
- **Other 27-release Metal additions** – MSL 4.1, multi-plane tensors, MetalFX content regions and frame interpolation options, persistent-kernel compute flags, forward-progress and contention-relief modes, three-channel RGB texture-buffer formats, and texture-view `minLOD`

## Documentation Scope

This page documents the `metal-migration-ref` skill (in the `axiom-graphics` suite). It covers only the Metal side of machine learning; for model conversion, quantization, and deployment with Core ML and Core AI, see [Core AI](/skills/machine-learning/core-ai).

## Related

- [Metal Migration](/skills/games/metal-migration) – Migration strategy, phased approach, and anti-patterns
- [Metal Migration Diagnostics](/diagnostic/metal-migration-diag) – Troubleshooting black screens, shader errors, and GPU crashes
- [Display Performance](/skills/debugging/display-performance) – Frame pacing and ProMotion once your renderer runs on Metal
- [RealityKit API Reference](/reference/realitykit-ref) – RealityKit uses Metal under the hood

## Resources

**WWDC**: 2016-00602, 2018-00604, 2019-00611, 2026-359, 2026-330

**Docs**: /metal/migrating-opengl-code-to-metal, /metalkit/mtkview, /metalfx
