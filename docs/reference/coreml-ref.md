---
name: coreml-ref
description: Core ML API reference — MLModel loading and configuration, compute devices, prediction APIs and Sendability, MLState, MLTensor, MLComputePlan, deployment targets, and an index of the coremltools conversion and compression APIs
---

# Core ML Reference

A lookup reference for Core ML's Swift API, checked against the iOS 27.1 SDK, plus an index of the `coremltools` Python APIs for conversion, compression, and multifunction models. It's for developers who know what they want to do and need the exact API, its availability, or whether a type can cross concurrency boundaries.

## When to Use This Reference

Use this reference when you need:
- The exact signature or availability of an `MLModel`, `MLModelAsset`, or `MLModelConfiguration` API
- Which compute devices a device offers, and how to check them in code
- Which prediction overload to call, and which Core ML types are Sendable under Swift 6
- `MLState` and `MLTensor` operations
- `MLComputePlan` for per-operation device placement
- Which deployment target an API or `coremltools` feature requires
- The right `coremltools` function or config class for a conversion or compression step

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the signature of MLModel.load, and which URL does it expect?"
- "Is MLModel Sendable? What about MLTensor and MLState?"
- "How do I get the top-k values from an MLTensor?"
- "How do I read which device each operation runs on with MLComputePlan?"
- "Which coremltools config class does 4-bit per-block quantization?"
- "What do I need for a multifunction model, and which iOS version?"

## What's Covered

### Model Lifecycle
`MLModel.load`, `MLModel.compileModel(at:)`, `.mlpackage` / `.mlmodelc`, `MLModelAsset(url:)`, `MLModelAsset(specification:)`, `modelDescription(of:)`, `MLModelConfiguration`, `computeUnits`, `functionName`, `modelDisplayName`, `optimizationHints`, `reshapeFrequency`, `specializationStrategy`

### Compute Availability
`MLModel.availableComputeDevices`, `MLComputeDevice`, `MLCPUComputeDevice`, `MLGPUComputeDevice`, `MLNeuralEngineComputeDevice`, `totalCoreCount`, `preferredMetalDevice`

### Prediction
`prediction(from:)` (sync and async), `prediction(from:options:)`, `predictions(from:options:)`, `MLPredictionOptions`, `outputBackings`, cancellation, Sendability of `MLModel`, `MLFeatureProvider`, `MLState`, `MLTensor`, `MLShapedArray`, `MLSendableFeatureValue`

### State
`MLState`, `makeState()`, `withMultiArray(for:_:)`, `stateDescriptionsByName`

### MLTensor
Creating tensors, shape and scalar type, math (`softmax(alongAxis:)`, `squareRoot`, `pointwiseMin`, `pointwiseMax`, `topK`), reshaping (`reshaped(to:)`, `transposed(permutation:)`, `squeezingShape()`, `tiled(multiples:)`, `split`), indexing, `replacing(with:where:)`, `resized(to:method:)`, materializing with `shapedArray(of:)`, `withMLTensorComputePolicy(_:_:)`, `MLComputePolicy`

### coremltools Conversion
`ct.convert`, `minimum_deployment_target`, `compute_precision`, input and output types, flexible shapes, `ct.StateType`

### coremltools Compression
`coremltools.optimize.coreml` (`OpLinearQuantizerConfig`, `OpPalettizerConfig`, `OpThresholdPrunerConfig`, `per_grouped_channel`, `per_block`), `coremltools.optimize.torch` (`PostTrainingQuantizer`, `PostTrainingPalettizer`, `SKMPalettizer`, `DKMPalettizer`, `LayerwiseCompressor`, `SparseGPT`)

### Multifunction Models
`ct.utils.MultiFunctionDescriptor`, `add_function`, `default_function_name`, `ct.utils.save_multifunction`, `functionName`

### Profiling
`MLComputePlan`, `MLModelStructure`, `deviceUsage(for:)`, `estimatedCost(of:)`, the Xcode Core ML performance report, the Core ML instrument

### Deployment Targets and Conversion Passes
The per-OS matrix of Core ML APIs and `coremltools` features, and conversion pass pipelines

## Documentation Scope

This page documents the `coreml-ref` skill (in the `axiom-ai` suite). Your assistant uses it to look up exact APIs. Its sibling skills cover when and how to use them: deployment patterns, conversion, compression, and diagnostics.

## Related

- [coreml-deployment](/skills/machine-learning/coreml) – How to use these APIs in an app under Swift 6
- [coreml-conversion](/skills/machine-learning/coreml-conversion) – Conversion decisions behind the `coremltools` APIs
- [coreml-compression](/skills/machine-learning/coreml-compression) – Compression decisions behind the `coremltools.optimize` APIs
- [coreml-diag](/diagnostic/coreml-diag) – Troubleshooting load failures, slowness, and accuracy loss
- [core-ai](/skills/machine-learning/core-ai) – The iOS 27 runtime for language-model-scale models

## Resources

**WWDC**: 2023-10049, 2024-10161, 2024-10159

**Docs**: /coreml/mlmodel, /coreml/mlmodelconfiguration, /coreml/mlmodelasset, /coreml/mlstate, /coreml/mltensor, /coreml/mlcomputedevice, /coreml/mlsendablefeaturevalue, /coreml/mlpredictionoptions
