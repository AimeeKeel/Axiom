---
name: networking-legacy
description: NWConnection patterns for iOS 12–18 with completion handlers, UDP batching, NWListener, and NWBrowser service discovery
---

# Networking Legacy

`NWConnection` patterns for apps that support iOS 12–18 and can't use async/await yet. Covers TLS connections, UDP batching, server listeners, and Bonjour service discovery with the completion-handler APIs.

## When to Use

Use this skill when you're:
- Supporting iOS 12–18 and can't use `NetworkConnection` (iOS 26+)
- Maintaining a codebase that hasn't adopted async/await
- Building a library that needs backward compatibility
- Batching UDP sends for real-time streaming
- Accepting incoming connections with `NWListener`
- Discovering Bonjour services with `NWBrowser`

**Note** If your app targets iOS 26 or later, use the modern `NetworkConnection` API instead; see [network-framework-ref](/reference/network-framework-ref).

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I create a TLS connection with NWConnection for iOS 12+?"
- "How do I batch UDP sends for better CPU performance?"
- "How do I accept incoming connections with NWListener?"
- "How do I discover services on the local network with NWBrowser?"
- "What's the completion handler pattern for NWConnection send/receive?"
- "How do I handle connection state changes with NWConnection?"

## What This Skill Provides

- **TLS connections** – `NWConnection` with completion handlers and the `[weak self]` captures they need
- **UDP batch sending** – About 30% less CPU than individual sends, because a batch costs about one syscall instead of one per datagram
- **`NWListener`** – Accepting incoming connections, with Bonjour advertising and security basics (TLS, client validation, connection limits)
- **`NWBrowser`** – Discovering services on the local network without hardcoded IP addresses
- **Migration pointers** – The iOS 26+ replacements for TLS connections and Bonjour discovery
- **When-to-use guidance** – Real-time streaming, peer-to-peer apps, and backward-compatible libraries

## Key Differences from iOS 26+

| NWConnection (iOS 12–18) | NetworkConnection (iOS 26+) |
|--------------------------|----------------------------|
| Completion handlers | async/await |
| `[weak self]` required | No `[weak self]` needed |
| `stateUpdateHandler` callback | Optional `onStateUpdate` closure; `send` and `receive` wait until ready |
| Manual JSON encode/decode | Built-in `Coder` protocol |

## Documentation Scope

This page documents the `networking-legacy` skill (in the `axiom-networking` suite), which your assistant uses when your app must still support iOS versions before 26.

## Related

- [networking](/skills/integration/networking) – Network architecture decisions and modern patterns
- [networking-migration](/reference/networking-migration) – Step-by-step migration guides from legacy to modern APIs
- [network-framework-ref](/reference/network-framework-ref) – Complete Network.framework API reference, including the iOS 26+ APIs
- [networking-diag](/diagnostic/networking-diag) – Troubleshooting connection failures

## Resources

**WWDC**: 2018-715

**Docs**: /network, /network/nwconnection
