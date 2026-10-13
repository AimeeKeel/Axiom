---
name: scenekit
description: SceneKit development — scene graph, materials, physics, animation, SwiftUI bridge, RealityKit migration planning
---

# SceneKit

Helps you maintain existing SceneKit code and plan its migration to RealityKit. SceneKit is soft-deprecated as of iOS 26: existing apps keep working, but it gets no new features, only critical security patches.

## When to Use

Use this skill when:
- Maintaining existing SceneKit code
- Building a SceneKit prototype (with awareness of deprecation)
- Planning migration from SceneKit to RealityKit
- Debugging SceneKit rendering, physics, or animation issues
- Integrating SceneKit content with SwiftUI
- Loading 3D models via Model I/O or `SCNSceneSource`

For new 3D projects, AR experiences, or visionOS, use RealityKit instead.

## Example Prompts

- "Should I start a new 3D project in SceneKit or RealityKit?"
- "How do I integrate SceneKit with SwiftUI — should I still use SceneView or move to RealityView?"
- "What's the best way to migrate our SceneKit app to RealityKit?"
- "How do I set up PBR materials in SceneKit?"
- "Why aren't my SceneKit physics contacts firing?"
- "How do I convert .scn files to USDZ for RealityKit?"

## What This Skill Provides

Every section notes the RealityKit equivalent, so the guidance doubles as a migration map.

### Deprecation Context
- SceneKit is soft-deprecated as of iOS 26, and existing apps continue to work
- `SceneView` (SwiftUI) raises no deprecation warning but wraps legacy SceneKit; prefer `RealityView` for new code, or wrap `SCNView` in a `UIViewRepresentable`
- Apple's forward path is RealityKit

### Scene Graph and Setup
- Right-handed, Y-up coordinate system
- Transform hierarchy (parent-to-child cascading)
- `SCNView` in UIKit, and the `UIViewRepresentable` replacement for SwiftUI

### Geometry and Materials
- Built-in geometry types (box, sphere, cylinder, plane, torus, capsule, cone, tube, text)
- PBR materials (diffuse, metalness, roughness, normal, ambient occlusion)
- Shader modifiers at four entry points (geometry, surface, lightingModel, fragment)

### Lighting
- Light types (omni, directional, spot, area, IES, ambient, probe) and which cast shadows

### Animation
- `SCNAction` (declarative sequences, groups, repeats)
- Implicit animation (`SCNTransaction`)
- Explicit animation (`CAAnimation` bridge)
- Loading animations from files

### Physics and Interaction
- Body types (dynamic, static, kinematic)
- Category, collision, and contact-test bitmasks
- The contact delegate
- Hit testing, and `ARSCNView` as the legacy AR path

### Asset Pipeline
- Supported formats (USDZ preferred, DAE, SCN, OBJ, Alembic)
- Loading models from the bundle, a URL, or Model I/O
- Converting .scn to USDZ via `xcrun scntool`

### Migration Decision Tree
- Whether to migrate, by situation: a new project, AR features, a visionOS target, heavy SceneKit investment, performance needs, or maintenance mode

### Anti-Patterns
- Starting new projects in SceneKit
- Using .scn files without USDZ conversion
- Deep shader modifier customization (zero portability to RealityKit)
- Relying on `SCNRenderer` for custom pipelines
- Ignoring SceneKit's deprecation because `SceneView` raises no compiler warning
- Creating hundreds of nodes in a loop instead of using particles or flattened geometry

### Pressure Scenarios
- Push-back wording for "just use SceneKit", "we don't have time to learn RealityKit", and "port everything at once"
- A code review checklist for SceneKit changes

## Documentation Scope

This page documents the `scenekit` skill (in the `axiom-graphics` suite).

- For the complete SceneKit API and its RealityKit mapping for every major concept, see [SceneKit API Reference](/reference/scenekit-ref)

## Related

- [RealityKit](/skills/games/realitykit) – The migration target: Apple's recommended 3D framework, built on an entity-component-system (ECS) architecture
- [RealityKit API Reference](/reference/realitykit-ref) – RealityKit API details for the code you migrate to
- [Metal Migration Reference](/reference/metal-migration-ref) – For custom render pipelines and shaders, which SceneKit shader modifiers can't carry over
- [SpriteKit](/skills/games/spritekit) – For 2D games, which this skill doesn't cover
