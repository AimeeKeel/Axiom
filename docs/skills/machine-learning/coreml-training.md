---
name: coreml-training
description: Training a new Core ML model with Create ML, or personalizing a deployed model on-device with MLUpdateTask, including the NN-spec-only limitation that blocks most modern models
---

# Core ML Training and Personalization

Two different ways to train a Core ML model that developers often mix up: Create ML trains a new model from your data, and `MLUpdateTask` adapts a model you've already shipped to each user's data, on their device.

## When to Use

Use this skill when you're:
- Training an image, sound, text, or tabular model without writing a training loop
- Choosing between the Create ML app and the `CreateML` framework
- Making each user's copy of a model adapt to their own data, on-device
- Planning on-device personalization for a model you converted to `.mlpackage`, which `MLUpdateTask` can't update

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I train an image classifier from a folder of labeled photos?"
- "Can I train a Create ML model on iPhone, or only on a Mac?"
- "How do I personalize my model on the user's device with their data?"
- "Why can't I use `MLUpdateTask` with my converted PyTorch model?"
- "Training freezes my app's UI. How do I run it without blocking?"

## What This Skill Provides

- **Create ML** – The app and the `CreateML` framework, the model types each supports, and which ones train on iOS, iPadOS, and visionOS as well as macOS
- **Programmatic training** – Data sources, exporting a `.mlmodel`, and the async training session that keeps a long run off the main thread
- **On-device personalization** – How `MLUpdateTask` retrains a deployed model's last layers on a user's data and saves the result
- **The NN-spec limitation** – Why `MLUpdateTask` only updates NeuralNetwork-format models, not the ML Program (`.mlpackage`) models modern conversion produces, and what that means before you build a pipeline
- **A boundary table** – How Create ML, `MLUpdateTask`, Foundation Models adapters, and model conversion differ

## Documentation Scope

This page documents the `coreml-training` skill (in the `axiom-ai` suite), which your assistant loads when you train or personalize a Core ML model. Training a custom adapter for Apple's built-in language model is a different toolchain, covered by [foundation-models-adapters](/skills/integration/foundation-models-adapters).

## Related

- [ios-ml](/skills/machine-learning/ios-ml) – The hub that routes Core ML work to conversion, compression, training, and deployment
- [training-paths](/skills/machine-learning/training-paths) – Choosing among Create ML, `MLUpdateTask`, adapters, and the other training toolchains before you build
- [coreml-conversion](/skills/machine-learning/coreml-conversion) – Converting a model you trained elsewhere instead of training it with Create ML
- [coreml-compression](/skills/machine-learning/coreml-compression) – Shrinking a trained model before you ship it

## Resources

**WWDC**: 2018-703, 2019-430, 2019-704, 2021-10037, 2024-10183

**Docs**: /createml, /createml/mlimageclassifier, /coreml/mlupdatetask, /coreml/mlupdatecontext
