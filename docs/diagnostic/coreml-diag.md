---
name: coreml-diag
description: Diagnosing Core ML models that fail to load, run slowly, grow memory, behave differently on a device or in Simulator, or lose accuracy after compression
---

# Core ML Diagnostics

Symptom-first troubleshooting for your own Core ML models: the error messages Core ML actually prints when a model won't load, and how to find the cause of slowness, memory growth, and accuracy loss.

## Symptoms This Diagnoses

Use when you're experiencing:
- A load error such as "The model specification version (N) is greater than the maximum supported version (M)" or "Failed to build the model execution plan … with error code: N"
- "Unable to load model … Compile the model with Xcode or `MLModel.compileModel(at:)`"
- A first prediction that takes seconds, or every prediction being slow
- A model that's fast on your Mac but slow on iPhone, or behaves differently in Simulator
- Memory that grows with each prediction, or spikes when the model loads
- Output that's wrong on one compute unit, or accuracy lost after compression

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My model fails to load with 'specification version is greater than the maximum supported version'. Why?"
- "Why is my first Core ML prediction so slow?"
- "Why doesn't my model use the Neural Engine?"
- "Memory keeps growing every time I run a prediction. What's leaking?"
- "My model is accurate on the Mac but wrong on the Neural Engine. How do I find the bad layer?"
- "Accuracy dropped after I palettized my model. Which layer caused it?"

## Diagnostic Workflow

1. **Read the real error** – Core ML reports most load failures with a generic error code, so the cause is in the error's description. The skill matches each message to its cause and fix.
2. **Profile on a device** – Simulator has no Neural Engine, so timing and placement only mean something on real hardware. Record with the Core ML instrument and separate load time from prediction time.
3. **Check where each operation runs** – Use the compute plan to see which unit Core ML prefers for each operation, rather than assuming the Neural Engine.
4. **Find the layer that broke** – For wrong output or accuracy loss, compare the model layer by layer against a reference.
5. **Apply the fix where it lives** – Deployment, conversion, or compression, each covered by its own skill.

## Documentation Scope

This page documents the `coreml-diag` skill (in the `axiom-ai` suite), which your assistant loads when a Core ML model misbehaves at runtime. Problems while converting a model are covered by [Core ML Conversion](/skills/machine-learning/coreml-conversion).

## Related

- [coreml-deployment](/skills/machine-learning/coreml) – Fixes for loading, pre-warming, and running predictions safely
- [coreml-compression](/skills/machine-learning/coreml-compression) – Recovering accuracy lost to compression
- [coreml-ref](/reference/coreml-ref) – API details for the compute plan and model configuration
- [performance-profiling](/skills/debugging/performance-profiling) – Recording and reading Instruments traces

## Resources

**WWDC**: 2022-10027, 2023-10047, 2023-10049, 2024-10159, 2024-10161

**Docs**: /coreml/mlmodel, /coreml/mlmodelconfiguration
