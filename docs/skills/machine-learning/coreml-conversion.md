---
name: coreml-conversion
description: Converting a trained PyTorch, TensorFlow, or Keras model to Core ML with coremltools — capture method, deployment target, stateful models, and validating that the converted model matches the original
---

# Core ML Conversion

How to turn a model you've already trained in PyTorch, TensorFlow, or Keras into a Core ML model with Apple's Python `coremltools` package, and how to prove the converted model gives the same answers as the original.

## When to Use

Use this skill when you're:
- Converting a trained model to `.mlpackage` for the first time
- Choosing between tracing and exporting a PyTorch model
- Picking a minimum deployment target, and seeing what each one enables
- Converting a transformer whose KV cache should live in model state
- Converting a model that was already compressed before conversion
- Hitting `coremltools` import errors, unsupported operations, or output that differs from the original

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I convert my PyTorch model to Core ML?"
- "Should I use torch.jit.trace or torch.export?"
- "My converted model gives different results from PyTorch. How do I find out why?"
- "What changes if I set the deployment target to iOS 18?"
- "How do I convert a transformer with a stateful KV cache?"
- "coremltools says an op isn't supported. What are my options?"

## What This Skill Provides

- **The unified converter** – Supported source formats, and tracing versus exporting a PyTorch model
- **Deployment targets** – What each `minimum_deployment_target` unlocks, such as fused attention at iOS 18
- **Stateful conversion** – Declaring a KV cache as model state, with the constraints that apply
- **Already-compressed sources** – Converting a model that was compressed during training
- **Parity validation** – Comparing converted output with the original before you ship
- **Common failures** – Import errors, unsupported operations, and output divergence

## Documentation Scope

This page documents the `coreml-conversion` skill (in the `axiom-ai` suite), which your assistant loads when you convert a trained model to Core ML. Language-model-scale models headed for the iOS 27 Core AI runtime use a different toolchain, covered by [Core AI](/skills/machine-learning/core-ai).

## Related

- [ios-ml](/skills/machine-learning/ios-ml) – The hub that routes Core ML work to each stage
- [coreml-compression](/skills/machine-learning/coreml-compression) – Shrinking the converted model
- [coreml-deployment](/skills/machine-learning/coreml) – Running the converted model in your app
- [coreml-ref](/reference/coreml-ref) – An index of the `coremltools` conversion and optimization APIs

## Resources

**WWDC**: 2024-10159

**Docs**: /coreml
