---
name: networking
description: Network.framework patterns for UDP/TCP with NWConnection (iOS 12–18) and NetworkConnection (iOS 26+) with structured concurrency; gRPC Swift v2 for typed RPC/streaming
---

# Networking

Network.framework patterns for UDP and TCP connections, from `NWConnection` (iOS 12–18) to `NetworkConnection` (iOS 26+) with structured concurrency. The suite also diagnoses connection failures and covers gRPC Swift for typed RPC.

## When to Use

Use this skill when you're:
- Implementing UDP or TCP connections
- Migrating from deprecated APIs (`SCNetworkReachability`, `CFSocket`, `NSStream`)
- Adding TLS to a connection
- Discovering services or accepting incoming connections
- Adopting async/await networking (iOS 26+)
- Choosing between URLSession, Network.framework, and gRPC Swift v2 for a service you control
- Debugging connection timeouts, TLS failures, or App Transport Security rejections

**Note** For HTTP, HTTPS, and WebSocket traffic the skill steers you to URLSession; Network.framework is for custom protocols over raw TCP, UDP, and QUIC.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I create a TCP connection with Network.framework?"
- "What's the modern replacement for SCNetworkReachability?"
- "How do I implement UDP with batching for better performance?"
- "I need to add TLS to my connection. How do I configure it?"
- "How do I use the new NetworkConnection API in iOS 26?"
- "My connection keeps failing on network transitions. How do I handle this?"
- "How do I implement a server listener for incoming connections?"
- "Should I use gRPC Swift or Network.framework for a streaming API?"

## What This Skill Provides

### Anti-Patterns Prevented
- Reachability checks before connecting (`SCNetworkReachability` is racy and deprecated)
- Deprecated socket and discovery APIs: `CFSocket`, `NSStream`, `CFStream`, `NSNetService`
- Blocking socket calls on the main thread
- Manual DNS resolution with `getaddrinfo`
- Hardcoded IP addresses
- Ignoring the waiting state, and dropping connections during Wi-Fi-to-cellular transitions
- Missing `[weak self]` in `NWConnection` completion handlers

### NWConnection (iOS 12–18)
- TCP and UDP connections
- TLS with `stateUpdateHandler`
- UDP batch sending (about 30% less CPU)
- Network transition handling

### NetworkConnection (iOS 26+)
- Async/await sends and receives
- Declarative protocol stacks (TLS, QUIC, UDP)
- UDP datagrams with batching
- TLV framing for message boundaries
- The `Coder` protocol for sending `Codable` values

### gRPC Swift v2
- Typed RPC and bidirectional streaming over HTTP/2
- SPM packages: `grpc-swift-nio-transport`, `grpc-swift-protobuf`; `.proto` codegen via the `GRPCProtobufGenerator` build plugin
- Shown at WWDC 2026, but it's a Swift package rather than an OS framework, so it needs no particular OS version

### Listening & Discovery
- `NWListener` for incoming connections
- `NWBrowser` for Bonjour service discovery
- `NetworkListener`, `NetworkBrowser`, and Wi-Fi Aware (iOS 26+)

### Diagnostics and Migration
- DNS failures, TLS certificate errors, message framing, and IPv6-only cellular networks
- App Transport Security failures and App Store rejections
- Migrating from BSD sockets to `NWConnection`, and from `NWConnection` or URLSession stream tasks to `NetworkConnection`

## Key Pattern

### Modern TLS Connection (iOS 26+)

```swift
// iOS 26+: declarative protocol stack with async/await
let connection = NetworkConnection(
    to: .hostPort(host: "example.com", port: 443)
) {
    TLS()  // TCP and IP are inferred
}

// No start() call: the first send or receive opens the connection
try await connection.send(Data("Hello".utf8))
let reply = try await connection.receive(exactly: 98).content
```

### Legacy TLS Connection (iOS 12–18)

```swift
// iOS 12–18: completion handlers with NWConnection
let connection = NWConnection(
    host: "example.com",
    port: 443,
    using: .tls
)

connection.stateUpdateHandler = { [weak self] state in
    switch state {
    case .ready:
        self?.sendGreeting()
    case .failed(let error):
        self?.handleError(error)
    default:
        break
    }
}

connection.start(queue: .main)
```

## Documentation Scope

This page documents the `axiom-networking` skill, the router for the networking suite. Your assistant uses it to pick the right networking guidance: connection patterns, TLS configuration, diagnostics, and migration from deprecated APIs.

## Related

- [networking-legacy](/skills/integration/networking-legacy) – `NWConnection`, `NWListener`, and `NWBrowser` patterns for apps that support iOS 12–18
- [networking-migration](/reference/networking-migration) – Step-by-step migration from sockets and `NWConnection`
- [networking-diag](/diagnostic/networking-diag) – Diagnosing and debugging connection failures
- [network-framework-ref](/reference/network-framework-ref) – Complete Network.framework API reference
- [networking-auditor](/agents/networking-auditor) – Agent that scans your code for deprecated APIs and anti-patterns
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Async/await patterns for iOS 26+

## Resources

**WWDC**: 2018-715, 2025-250, 2026-265

**Docs**: /network, /network/nwconnection
