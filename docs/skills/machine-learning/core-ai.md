---
name: core-ai
description: Core AI (iOS 27) — the on-device inference framework that powers Apple Intelligence, now open to your apps. Convert PyTorch models to .aimodel, run them from Swift, manage specialization and caching, and back a LanguageModelSession with your own model.
---

# Core AI

Core AI is the on-device inference framework behind Apple Intelligence, opened to your apps in iOS 27 and the other OS 27 releases. Use it to run your **own** advanced models (large language models, or vision transformers like SAM 3) locally across the CPU, GPU, and Neural Engine, with no server and no per-token cost.

## When to Use

Use this skill when you're:

- Bringing a PyTorch LLM, segmentation model, or custom transformer on-device with Core AI
- Compressing a large model to fit in device memory and run fast on Apple Silicon
- Loading and running a `.aimodel` from Swift (`AIModel`, `InferenceFunction`, `NDArray`)
- Fixing a transformer decode loop that slows down over time (a KV cache via Core AI **states**)
- Diagnosing first-launch stalls caused by model **specialization**, or planning model download and caching
- Backing a Foundation Models `LanguageModelSession` with your own custom model

## Core AI vs Core ML vs Foundation Models

| What you're doing | Skill |
|---|---|
| Run Apple's built-in LLM (`@Generable`, no model to ship) | [foundation-models](/skills/integration/foundation-models) |
| Bring an LLM-scale or transformer model on-device (OS 27 and later) | This skill (Core AI) |
| Convert or compress a classic Core ML model (`.mlpackage`) | [ios-ml](/skills/machine-learning/ios-ml) |
| Back a `LanguageModelSession` with your own model | This skill (the Foundation Models bridge) |

**Rule of thumb** Core ML is the established path for classic models. Core AI, introduced with the OS 27 releases, is built for modern, LLM-scale workloads and deep customization: custom Metal kernels, multi-function assets, and ahead-of-time compilation. Both convert from PyTorch.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I convert my PyTorch LLM to Core AI and run it from Swift?"
- "My Core AI model freezes the app on first launch — how do I handle specialization?"
- "How do I add a KV-cache to my Core AI transformer so it stops slowing down?"
- "How do I share a specialized model cache between my app and its extension?"
- "How do I back a `LanguageModelSession` with my own model?"
- "Should I bundle my 1 GB model in the app or download it?"
- "What's the difference between Core AI and Core ML?"

## What This Skill Provides

- **The deployment lifecycle** – Convert (`coreai-torch`), optimize (`coreai-opt`), debug (Core AI Debugger), integrate (the Swift `CoreAI` framework), and deploy (specialization, caching, ahead-of-time compilation)
- **Python authoring** – Dynamic shapes, states, and multi-function assets at conversion; int4, int8, FP4, and FP8 compression and palettization; custom Metal kernels embedded in the model; reauthoring a model for iOS hardware
- **The Swift runtime API** – `AIModel`, `InferenceFunction`, `NDArray` and its scalar types, KV-cache states, and `AIModelAsset` inspection, checked against the Xcode 27 SDK
- **Specialization and caching** – Why the first load is slow, why it must stay out of interactive flows, `AIModelCache` (including sharing through an app group), and ahead-of-time compilation with `coreai-build`
- **Model delivery** – Downloading models over 1 GB on demand instead of bundling them
- **The Foundation Models bridge** – Using `CoreAILanguageModel` (from the open-source `coreai-models` Swift package) to reuse `respond`, `@Generable`, and streaming with your own model
- **The developer tools** – Core AI Instruments, the Core AI debug gauge, and the standalone Core AI Debugger

## Documentation Scope

This page documents the `core-ai` skill (in the `axiom-ai` suite), which your assistant uses when you bring your own model on-device with Core AI.

## Related

- [foundation-models-ref](/reference/foundation-models-ref) – The `LanguageModel` protocol and Ecosystem section that the Core AI bridge plugs into
- [metal-migration-ref](/reference/metal-migration-ref) – Writing the custom Metal kernels (`TorchMetalKernel`, `MTLTensor`) that Core AI embeds in a model
- [background-assets](/skills/integration/background-assets) – Delivering large models on demand instead of bundling them

## Resources

**WWDC**: 2026-324, 2026-325, 2026-326, 2026-330

**Docs**: /CoreAI, /CoreAI/integrating-on-device-ai-models-in-your-app-with-core-ai, /CoreAI/compiling-core-ai-models-ahead-of-time, /CoreAI/managing-model-specialization-and-caching
