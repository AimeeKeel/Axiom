---
name: scenekit-ref
description: SceneKit API reference and RealityKit migration mapping — scene graph, materials, lighting, camera, physics, animation, constraints
---

# SceneKit API Reference and Migration Mapping

A SceneKit API reference that maps each major concept to its RealityKit equivalent, for maintaining SceneKit code or planning a move to RealityKit.

## When to Use This Reference

Use this reference when:
- Looking up the RealityKit equivalent of a SceneKit API during a migration
- Checking specific SceneKit class properties or methods
- Planning which SceneKit features have direct RealityKit counterparts
- Understanding how SceneKit's scene graph differs from RealityKit's entity-component-system (ECS) design

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the RealityKit equivalent of `SCNPhysicsBody`?"
- "How do I convert `SCNAction` sequences to RealityKit animations?"
- "What replaces each `SCNLight` type in RealityKit?"
- "How do SceneKit constraints translate to RealityKit?"
- "Which `SCNMaterial` properties map to `PhysicallyBasedMaterial`?"
- "What's the RealityKit replacement for `SCNSceneRendererDelegate`?"

## What's Covered

- **Core architecture mapping** – `SCNScene`, `SCNNode`, and `SCNView` to `RealityViewContent`, `Entity`, and `RealityView`; `SCNRenderer` to `RealityRenderer`; `SCNSceneRendererDelegate` to `System`; `.scn` to `.usdz` with `xcrun scntool`
- **Geometry and rendering mapping** – `SCNGeometry` to `MeshResource`, `SCNMaterial` to `PhysicallyBasedMaterial`, shader modifiers and `SCNProgram` to `ShaderGraphMaterial`/`CustomMaterial`
- **Transform and hierarchy mapping** – position, rotation, scale, and parent-child methods
- **Lighting mapping** – all 7 `SCNLight` types: point, directional, and spot light components; `EnvironmentResource` for ambient and probe; no direct equivalent for area or IES
- **Camera mapping** – `SCNCamera` to `PerspectiveCamera`, field of view, clipping planes, post-processing in place of depth of field and motion blur
- **Physics mapping** – `SCNPhysicsBody` to `PhysicsBodyComponent`, bitmasks to `CollisionGroup`/`CollisionFilter`, the contact delegate to `CollisionEvents` subscriptions
- **Animation mapping** – `SCNAction` to `entity.move(to:relativeTo:duration:)`, `SCNTransaction` (no direct equivalent), `CAAnimation` to `entity.playAnimation()`
- **Interaction and AR mapping** – `hitTest` to `entities(at:)`, gestures to `ManipulationComponent`, `ARSCNView` to `RealityView` with `AnchorEntity`
- **Scene graph API** – `SCNScene` properties, `SCNNode` creation and configuration, hierarchy methods
- **Materials API** – the 6 lighting models (`.physicallyBased`, `.blinn`, `.phong`, `.lambert`, `.constant`, `.shadowOnly`) and material properties
- **Physics API** – body properties, compound and concave shapes, the 4 joint types (hinge, ball socket, slider, cone twist)
- **Animation API** – the `SCNAction` catalog, timing functions, `SCNAnimationPlayer`
- **Constraints** – 7 constraint types (look-at, billboard, distance, replicator, acceleration, slider, IK), and what replaces them in RealityKit, which has no constraint system
- **Scene configuration** – `SCNView` properties (antialiasing, frame rate, camera control, debug options)

## Documentation Scope

This page documents the `scenekit-ref` skill (in the `axiom-graphics` suite), the API lookup half of the SceneKit pair. Development patterns, deprecation context, and the migration decision live in the `scenekit` skill listed under Related.

## Related

- [SceneKit](/skills/games/scenekit) – SceneKit patterns, deprecation context, and migration decision tree
- [RealityKit](/skills/games/realitykit) – ECS architecture of SceneKit's modern replacement
- [RealityKit API Reference](/reference/realitykit-ref) – API details for the RealityKit types you migrate to

## Resources

**Docs**: /scenekit, /scenekit/scnscene, /scenekit/scnnode
