---
name: coreml-deployment
description: Running a converted Core ML model in an app — loading and pre-warming, compute units, Swift 6-safe prediction, stateful KV-cache models, multifunction adapters, and MLTensor pipelines
---

# Core ML Deployment

How to run a model you've converted to Core ML inside your app: getting it onto the device, loading it fast, running predictions safely under Swift 6, and using the newer model features such as a persistent KV cache for language models and several adapters in one model file.

## When to Use

Use this skill when you're:
- Loading a converted model and running predictions in an app
- Fixing a first prediction that's much slower than the rest
- Running predictions from several tasks or a background queue under Swift 6
- Choosing compute units (CPU, GPU, Neural Engine)
- Building a language model's token loop with a KV cache that persists between predictions
- Shipping several adapters or tasks in one model asset
- Chaining models, or decoding a model's output, with `MLTensor`

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I load my Core ML model so the first prediction isn't slow?"
- "Swift 6 says sending my MLModel risks a data race. How should I structure predictions?"
- "How do I run predictions on many images in parallel without Swift 6 data-race errors?"
- "How do I keep a KV cache between predictions for my language model?"
- "Can I ship two LoRA adapters in one Core ML model?"
- "Should I set computeUnits to the Neural Engine only?"

## What This Skill Provides

- **Model assets** – Bundling a compiled model, compiling a downloaded one on the device, and where to keep the result
- **Load, cache, and pre-warm** – Why the first load is slow, and how to pay that cost before the user needs the model
- **Predictions under Swift 6** – Why `MLModel` can't be shared across tasks, and three structures that compile cleanly: an actor that owns the model, one model instance per parallel lane, and a job that owns its model for one batch of async predictions
- **Compute units** – Choosing among CPU, GPU, and Neural Engine, and the iOS 27 entitlement for running inference in the background
- **Stateful models** – Keeping a transformer's KV cache in model state across predictions (iOS 18 and later)
- **Multifunction models** – One asset holding several functions, such as adapters that share base weights (iOS 18 and later)
- **`MLTensor`** – Pre- and post-processing between models without hand-written array loops (iOS 18 and later)
- **Anti-patterns and a checklist** – Including the concurrency shortcuts Swift 6 rejects

## Documentation Scope

This page documents the `coreml-deployment` skill (in the `axiom-ai` suite), which your assistant loads when you run a Core ML model in an app. Language-model-scale models on the iOS 27 runtime are covered by [Core AI](/skills/machine-learning/core-ai).

## Related

- [ios-ml](/skills/machine-learning/ios-ml) – The hub that routes Core ML work to each stage
- [coreml-conversion](/skills/machine-learning/coreml-conversion) – Producing the model you deploy, including stateful models
- [coreml-compression](/skills/machine-learning/coreml-compression) – Shrinking a model that's too large or slow to deploy
- [coreml-ref](/reference/coreml-ref) – API signatures, availability, and which types are Sendable
- [coreml-diag](/diagnostic/coreml-diag) – When a model fails to load, runs slowly, or grows memory

## Resources

**WWDC**: 2023-10049, 2024-10161, 2024-10159

**Docs**: /coreml/mlmodel, /coreml/mlmodelconfiguration, /coreml/mlstate, /coreml/mltensor, /coreml/mlmodelasset
