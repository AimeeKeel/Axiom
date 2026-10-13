---
name: ios-ml
description: Hub for on-device machine learning and speech-to-text — routes Core ML conversion, compression, training, deployment, API lookup, and diagnostics, and SpeechAnalyzer transcription, to dedicated skills
---

# iOS Machine Learning

The hub for running your own machine learning models on Apple devices with Core ML, and for on-device speech-to-text. It sends each question to a dedicated skill for conversion, compression, training, deployment, diagnostics, or speech.

## When to Use

Use this skill when you're:
- Converting a PyTorch or TensorFlow model to Core ML
- Deploying a custom ML model on iOS, iPadOS, macOS, watchOS, or tvOS
- Compressing a model with quantization, palettization, or pruning
- Implementing a KV cache for a custom large language model
- Stitching multiple models together with `MLTensor`
- Adding live or file-based speech transcription
- Debugging slow inference, load failures, or accuracy drops after compression

## Boundary with Foundation Models

ML and AI sound interchangeable, but they lead to different skills:

| What you're doing | Skill |
|---|---|
| Running your own model on-device | This skill (Core ML) |
| Using Apple's built-in on-device LLM | [foundation-models](/skills/integration/foundation-models) |
| Specializing the built-in LLM with a custom adapter | [foundation-models-adapters](/skills/integration/foundation-models-adapters) |
| Bringing an LLM-scale or transformer model on-device (iOS 27) | [core-ai](/skills/machine-learning/core-ai) |
| Image analysis, pose detection, text recognition | [vision](/skills/computer-vision/vision) |

**Rule of thumb** If you're converting, compressing, or deploying your own model, you want Core ML. If you're calling Apple's `LanguageModelSession`, you want Foundation Models. If you're bringing an LLM-scale or transformer model, use Core AI (iOS 27).

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I convert my PyTorch model to CoreML?"
- "My model is 5 GB. How do I compress it to fit on iPhone?"
- "Should I use CoreML or Foundation Models for text generation?"
- "How do I implement KV-cache for my LLM?"
- "Why is my CoreML inference slow on the first call?"
- "What's MLTensor and when should I use it?"
- "Add live transcription with SpeechAnalyzer to my app."
- "My compressed model has bad accuracy. What went wrong?"
- "How do I use Core AI to serve my own on-device model to Foundation Models?" (iOS 27)

## What This Skill Provides

- **Routing** – Sends each question to the skill for its stage: conversion, compression, training, deployment, API lookup, diagnostics, or speech
- **The boundaries** – When a task belongs to Core ML, Core AI (iOS 27), Foundation Models, or Vision
- **Core AI pointer** – When a language-model-scale model belongs in Core AI instead of Core ML

## Documentation Scope

This page documents the `ios-ml` skill (in the `axiom-ai` suite), the hub your assistant starts from for on-device machine learning and speech-to-text. The work itself lives in the skills listed below.

## Related

- [coreml-conversion](/skills/machine-learning/coreml-conversion) – Converting a trained model with `coremltools`
- [coreml-compression](/skills/machine-learning/coreml-compression) – Shrinking a model with quantization, palettization, or pruning
- [coreml-training](/skills/machine-learning/coreml-training) – Create ML training and on-device personalization
- [coreml-deployment](/skills/machine-learning/coreml) – Running a model in your app under Swift 6
- [coreml-ref](/reference/coreml-ref) – Core ML API reference
- [coreml-diag](/diagnostic/coreml-diag) – Troubleshooting load failures, slowness, memory, and accuracy loss
- [speech](/skills/machine-learning/speech) – `SpeechAnalyzer` and `SpeechTranscriber` for live and file transcription
- [training-paths](/skills/machine-learning/training-paths) – Choosing among Create ML, `MLUpdateTask`, adapters, and the other training toolchains before you build

## Resources

**WWDC**: 2023-10047, 2023-10049, 2024-10159, 2024-10161, 2025-277

**Docs**: /coreml, /coreml/mlmodel, /coreml/mltensor, /speech, /speech/speechanalyzer
