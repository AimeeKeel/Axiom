---
name: coreml-compression
description: Shrinking a Core ML model with quantization, palettization, and pruning — post-training versus training-time compression, deployment-target requirements, matching the method to the hardware, and re-measuring accuracy
---

# Core ML Compression

How to make a Core ML model smaller and faster on device, and the decision that matters most: compressing after training, or training with compression in the loop.

## When to Use

Use this skill when you're:
- Fitting a model that's too large for memory or download size
- Choosing among quantization, palettization, and pruning
- Deciding between post-training compression and training-time compression
- Picking a bit width, and knowing which ones need an iOS 18 deployment target
- Matching a compression method to the Neural Engine or a Mac GPU
- Recovering accuracy that compression cost you

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My model is 4 GB. How do I get it small enough for iPhone?"
- "Should I quantize or palettize my model?"
- "My model lost accuracy after 4-bit compression. What now?"
- "Which compression works best on the Neural Engine?"
- "Why does coremltools say this compression needs iOS 18?"

## What This Skill Provides

- **The core decision** – When post-training compression is enough and when training-time compression is worth the effort
- **The three families** – Quantization, palettization, and pruning, and what each trades away
- **Deployment target and hardware** – Which methods need iOS 18, and which suit the Neural Engine or a Mac GPU
- **A bit-width ladder** – Stepping down from 16-bit through 8, 6, and 4 bits while measuring each step
- **Re-measuring** – Checking accuracy after every compression step instead of assuming it held

## Documentation Scope

This page documents the `coreml-compression` skill (in the `axiom-ai` suite), which your assistant loads when you shrink a Core ML model. If accuracy drops after compression and you need to find which layer caused it, see [Core ML Diagnostics](/diagnostic/coreml-diag).

## Related

- [ios-ml](/skills/machine-learning/ios-ml) – The hub that routes Core ML work to each stage
- [coreml-conversion](/skills/machine-learning/coreml-conversion) – Converting the model you'll compress
- [coreml-deployment](/skills/machine-learning/coreml) – Running the compressed model in your app
- [coreml-ref](/reference/coreml-ref) – An index of the `coremltools.optimize` APIs

## Resources

**WWDC**: 2024-10159

**Docs**: /coreml
