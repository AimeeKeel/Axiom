---
name: realitykit-ref
description: RealityKit API reference — Entity, Component, System, RealityView, Model3D, materials, physics, animation, audio
---

# RealityKit API Reference

API reference for RealityKit, organized by category: the `Entity` hierarchy, built-in components, the `System` protocol, the SwiftUI views (`RealityView`, `Model3D`), materials, physics, animation, audio, Metal integration, and the 27-release additions.

## When to Use This Reference

Use this reference when:
- Looking up specific RealityKit API signatures or properties
- Checking which component types are available
- Finding the right anchor type for an AR experience
- Browsing material properties and options
- Setting up physics body parameters
- Looking up animation or audio API details
- Checking platform availability for specific APIs
- Browsing the 27-release additions (navigation mesh, level of detail, soft shadows, Gaussian splats, reverb, cloth, ComputeGraph, the low-level renderer)

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What properties does `PhysicallyBasedMaterial` have?"
- "How do I create a `RealityView` with attachments?"
- "What are the `ShapeResource` types for collision?"
- "What events can I subscribe to in RealityKit?"
- "How do I set up spatial audio on an entity?"
- "What `Entity` subclasses are available?"
- "How do I render RealityKit content from my own Metal command buffer?"
- "Can I build a shader graph in Swift instead of Reality Composer Pro?"
- "How do I generate an image-based light at runtime from an HDR?"
- "Why won't `import RealityCoreRenderer` compile?"

## What's Covered

- **Entity API** – Creation, properties (`isEnabled`, `isAnchored`, `scene`), hierarchy methods, and nine `Entity` subclasses (`ModelEntity`, `AnchorEntity`, `PerspectiveCamera`, lights, `TriggerVolume`, `ViewAttachmentEntity`, `BodyTrackedEntity`)
- **Component catalog** – Built-in components including `Transform`, `ModelComponent`, `CollisionComponent`, `PhysicsBodyComponent`, `PhysicsMotionComponent`, `CharacterControllerComponent`, `AnchoringComponent`, light components, `AccessibilityComponent`, and `InputTargetComponent`; shape resources and plane classification
- **MeshResource generators** – Box, sphere, plane, cylinder, cone, text
- **System protocol** – `SceneUpdateContext`, `EntityQuery` (has/and/not), and eight event types (scene, collision, and animation events)
- **RealityView API** – Initializers (basic, update, placeholder, attachments), `RealityViewContent`, gesture integration (tap, drag, rotate, magnify)
- **Model3D API** – Simple display, phase handling, URL loading
- **Material system** – `SimpleMaterial`, `PhysicallyBasedMaterial` (full PBR), `UnlitMaterial`, `OcclusionMaterial`, `VideoMaterial`, `TextureResource` loading
- **Animation** – Transform animation with timing functions, USD animation playback, `AnimationPlaybackController`
- **Audio** – `AudioFileResource`, `SpatialAudioComponent`, `AmbientAudioComponent`, `ChannelAudioComponent`, playback control
- **RealityRenderer** – Rendering a RealityKit scene into Metal textures
- **RealityKit 27 additions** – Navigation mesh pathfinding, level of detail, soft shadows, projective textures, physical space lighting (visionOS and macOS), lightmaps, Gaussian splats, custom reverb meshes, ARKit object tracking (iOS), cloth simulation (`ClothBodyComponent`; iOS, macOS, and visionOS), and the ComputeGraph framework for building compute node graphs in code
- **More 27 components** – Bloom, tone mapping, clipping, PBR decals, occlusion culling, render layers, lighting models (including hair), subsurface scattering, mesh deformers, skeletal retargeting and IK, animation graphs, behavior trees, diffuse light probes, `USDStageComponent`

### Renderer Submodules (27 Releases)

The low-level renderer drives RealityKit's shading from your own `MTLCommandBuffer`, with no entities. It and the ShaderGraph, deformation, and texture-processing submodules are reached through `import RealityKit`; none of them can be imported directly.

- **Frame loop** – `LowLevelRenderer` (`output`, `cameras`, `time`, `colorMatch`, `render(using:_:)`), `Configuration`, `Camera` / `CameraArray`, `RenderState`
- **Resource context** – `LowLevelRenderContext`, `…Standalone`, `…Lighting`, `…ShaderGraph`
- **Resources** – `LowLevelMeshResource`, `LowLevelTextureResource`, `LowLevelBufferResource`, `LowLevelInstanceTransformResource`
- **Materials and pipeline** – `LowLevelMaterialResource`, `LowLevelArgumentTable`, `LowLevelRenderPipelineState`, `LowLevelRenderTarget.Descriptor`
- **Draw, cull, sort** – `LowLevelMeshPart`, `LowLevelMeshInstance`, `LowLevelMeshInstanceArray`, `cullMeshInstances`, `sortMeshInstances`
- **Name-collision table** – the 26-era `LowLevelMesh` / `LowLevelTexture` / `LowLevelBuffer` / `LowLevelInstanceData` versus their 27 `*Resource` counterparts
- **ShaderGraph in Swift** – `ShaderGraph`, `NodeLibrary`, `NodeDefinition`, `Node`, `Edge`, `ShaderGraphMaterial.Program` / `Program.Descriptor`
- **GPU mesh deformation** – `LowLevelDeformationContext`, `LowLevelDeformation`
- **Runtime skybox and IBL** – `SkyboxGenerator`, `ImageBasedLightTextureGenerator`, `TextureSamplingQuality`

## Documentation Scope

This page documents the `realitykit-ref` skill (in the `axiom-graphics` suite). Rendering a USDKit stage with `USDStageComponent` is covered in depth in [USDKit](/skills/games/usdkit).

## Related

- [RealityKit](/skills/games/realitykit) – Entity-component-system (ECS) architecture patterns and best practices
- [RealityKit Diagnostics](/diagnostic/realitykit-diag) – Troubleshooting invisible entities, physics, and rendering
- [SceneKit API Reference](/reference/scenekit-ref) – SceneKit equivalents for migration reference
- [SpriteKit API Reference](/reference/spritekit-ref) – 2D game framework (complements RealityKit's 3D)

## Resources

**WWDC**: 2019-603, 2019-605, 2021-10074, 2022-10074, 2023-10080, 2024-10103, 2024-10153, 2026-279

**Docs**: /realitykit, /realitykit/entity, /realitykit/component, /realitykit/system, /realitykit/realityview, /realitykit/model3d, /realitykit/modelentity, /realitykit/anchorentity, /realitykit/physicallybasedmaterial, /computegraph
