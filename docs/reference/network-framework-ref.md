---
name: network-framework-ref
description: NWConnection (iOS 12+), NetworkConnection (iOS 26+), TLV framing, Coder protocol, listeners, Wi-Fi Aware
---

# Network.framework Reference

API reference for Network.framework: `NWConnection` (iOS 12+), `NetworkConnection` (iOS 26+) with structured concurrency, TLV framing, the `Coder` protocol, listeners and discovery, and migration patterns. `NWConnection` is still available and not deprecated, so the reference covers both generations.

## When to Use This Reference

Use this reference when you need:
- `NWConnection` state machine and patterns
- `NetworkConnection` async/await APIs (iOS 26+)
- TLV (Type-Length-Value) message framing
- The `Coder` protocol for sending and receiving `Codable` values
- `NetworkListener` and `NetworkBrowser` patterns, including Wi-Fi Aware
- Path and viability monitoring with `onPathUpdate`/`onViabilityUpdate`/`onBetterPathUpdate`, which iOS 27 extends to QUIC streams
- TLS, certificate pinning, or performance tuning
- Migration from BSD sockets, URLSession stream tasks, or `NWConnection`

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I monitor path changes on a QUIC connection in iOS 27?"
- "How do I create a TLS connection with `NWConnection`?"
- "How do I use `NetworkConnection` with async/await in iOS 26?"
- "How do I implement TLV framing for message boundaries?"
- "How do I use the `Coder` protocol to send `Codable` objects?"
- "When should I use Network.framework vs. URLSession?"
- "How do I set up a `NetworkListener` for incoming connections?"
- "How do I pin a server certificate with Network.framework?"

## What's Covered

### NetworkConnection (iOS 26+)
- Creating connections, endpoint types, protocol stack composition
- State machine and state observation
- Path, viability, and better-path monitoring (iOS 27: multiplexed connections and QUIC streams)
- async/await send and receive
- Built-in TLV framing
- `Coder` protocol for `Codable`

### NWConnection (iOS 12+)
- Connection creation with endpoints and custom parameters
- State machine and `stateUpdateHandler`
- Completion-based send and receive, with pacing
- UDP batching

### Listeners and Discovery
- `NetworkListener` (iOS 26+) and `NWListener` (iOS 12+)
- `NetworkBrowser` with Wi-Fi Aware peer-to-peer, including the iOS 27 performance forecast
- `NWBrowser` for Bonjour discovery

### Mobility
- Connection viability and better-path migration
- Multipath TCP
- `NWPathMonitor`

### Security
- TLS version, certificate pinning (including behind corporate proxies), cipher suites

### Performance
- Smart connection establishment (Happy Eyeballs)
- User-space networking, ECN for UDP, service classes, TCP Fast Open

### Migration and Testing
- From BSD sockets, URLSession stream tasks, and `NWConnection` to `NetworkConnection`
- Testing checklist for devices, network conditions, and error handling

## Key Pattern

### iOS 26+ NetworkConnection

```swift
// TLS connection with Coder
let connection = NetworkConnection(
    to: .hostPort(host: "www.example.com", port: 1029)
) {
    Coder(GameMessage.self, using: .json) {
        TLS()
    }
}

// Send Codable directly
try await connection.send(GameMessage(type: .move, data: moveData))

// Receive Codable
for try await (message, _) in connection.messages {
    handleMessage(message)
}
```

### iOS 12+ NWConnection

```swift
let connection = NWConnection(
    to: .hostPort(host: "www.example.com", port: 1029),
    using: .tls
)
connection.stateUpdateHandler = { state in
    switch state {
    case .ready:
        print("Connected")
    case .failed(let error):
        print("Connection failed: \(error)")
    default: break
    }
}
connection.start(queue: .main)
```

## Documentation Scope

This page documents the `network-framework-ref` skill (in the `axiom-networking` suite), the API coverage your assistant uses when you need specific Network.framework APIs or implementation patterns.

## Related

- [networking](/skills/integration/networking) – Network architecture decisions and anti-patterns
- [networking-diag](/diagnostic/networking-diag) – Troubleshooting connection failures
- [networking-migration](/reference/networking-migration) – Step-by-step guides for moving between networking API generations
- [networking-auditor](/agents/networking-auditor) – Scans your code for deprecated networking APIs

## Resources

**WWDC**: 2018-715 (NWConnection), 2025-250 (NetworkConnection)

**Docs**: /network, /network/nwconnection, /network/networkconnection
