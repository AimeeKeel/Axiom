---
name: spritekit-ref
description: SpriteKit API reference — node types, physics bodies, actions, textures, constraints, particles, SKRenderer
---

# SpriteKit API Reference

A SpriteKit API reference organized by category, from node types and physics through actions, textures, particles, Metal rendering, and SwiftUI embedding. Use it when you know what you want to build and need the exact API.

## When to Use This Reference

Use this reference when:
- Looking up specific SpriteKit API signatures or properties
- Checking which node types exist and how each one performs
- Choosing a physics body creation method
- Finding the right `SKAction` for an animation
- Configuring `SKEmitterNode` particle properties
- Setting up `SKView` debug overlays, scale modes, or transitions
- Looking up `SKConstraint` types
- Writing an `SKShader` or rendering with `SKRenderer`
- Embedding a scene in SwiftUI with `SpriteView`

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I create a physics body from a texture?"
- "What `SKAction` types are available for movement?"
- "What properties does `SKEmitterNode` have?"
- "How do I set up `SKRenderer` for Metal?"
- "What are the `SKView` debug overlay options?"
- "What particle settings create a fire effect?"
- "How do I share game state between SwiftUI and my `SKScene`?"

## What's Covered

### Node Hierarchy
- 16 node types, each with its purpose, whether it batches, and performance notes
- `SKSpriteNode` properties: anchor point, color blend, normal maps and lighting, shaders
- `SKLabelNode` properties: font, alignment, multiline text

### Physics
- Body creation: circle, rectangle, polygon, texture, compound, and edge bodies
- Body properties: bitmasks, mass and density, friction, restitution, damping, velocity
- Forces, impulses, and torque
- `SKPhysicsWorld`: gravity, speed, contact delegate, ray casting
- 5 joint types: pin, fixed, spring, sliding, limit
- Field types: linear gravity, radial gravity, electric, noise, vortex, drag

### Action Catalog
- Movement, rotation, scaling, fading, composition, texture and color, sound, node tree, physics
- Timing modes and `speed`

### Textures and Atlases
- `SKTexture` from an image, an atlas, a subrectangle, or a `CGImage`
- Filtering modes (`.nearest` for pixel art, `.linear` for smooth scaling)
- Texture and atlas preloading, animation from atlas frames

### Constraints
- `SKConstraint` types: orient, position, distance, rotation
- `SKRange` creation patterns
- Constraint ordering and toggling

### Scene Setup
- `SKView` debug overlays and performance settings
- Scale mode matrix
- `SKTransition` types, including custom `CIFilter` transitions

### Particles
- `SKEmitterNode` properties by category (emission, position, movement, appearance, scale, rotation)
- Presets for fire, smoke, sparks, rain, snow, trails, and explosions

### SKRenderer and Shaders
- `SKRenderer` in a Metal render loop
- `SKShader` GLSL ES source with uniforms, attributes, and built-in variables

### SwiftUI Integration
- `SpriteView` with transition, pause, frame rate, options, and debug options
- An `@Observable` model as the bridge between SwiftUI and a scene

## Documentation Scope

This page documents the `spritekit-ref` skill (in the `axiom-games` suite), the API lookup surface for SpriteKit. Architecture patterns and best practices live in the `spritekit` skill, and troubleshooting lives in `spritekit-diag`; both are listed under Related.

## Related

- [SpriteKit](/skills/games/spritekit) – game architecture, physics setup, and the patterns that use these APIs
- [SpriteKit Diagnostics](/diagnostic/spritekit-diag) – troubleshooting physics contacts that never fire, objects tunneling through walls, frame-rate drops, and other SpriteKit symptoms
- [spritekit-auditor](/agents/spritekit-auditor) – scans your game code for bitmask mistakes, draw-call waste, node accumulation, and action leaks

## Resources

**WWDC**: 2014-608, 2016-610, 2017-609

**Docs**: /spritekit/skspritenode, /spritekit/skphysicsbody, /spritekit/skaction, /spritekit/skemitternode, /spritekit/skrenderer
