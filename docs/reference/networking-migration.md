---
name: networking-migration
description: Migration guides from BSD sockets to NWConnection, NWConnection to NetworkConnection (iOS 26+), and URLSession StreamTask to NetworkConnection
---

# Networking Migration Reference

Step-by-step guides for moving between networking APIs. It starts with a decision tree for whether to migrate at all, then covers three migration paths with before/after code, mapping tables, and the benefits of each.

## When to Use This Reference

Use this reference when you need to:
- Decide whether to migrate or stay with your current API
- Migrate from BSD sockets, `CFSocket`, or `NSStream` to `NWConnection`
- Replace `SCNetworkReachability` with `NWPathMonitor`
- Upgrade from `NWConnection` to `NetworkConnection` (iOS 26+)
- Replace a URLSession stream task with `NetworkConnection`
- Understand the mapping between old and new APIs

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I migrate from BSD sockets to `NWConnection`?"
- "What's the equivalent of `NWConnection`'s `stateUpdateHandler` in `NetworkConnection`?"
- "How do I replace completion handlers with async/await for networking?"
- "Should I migrate from a URLSession stream task to `NetworkConnection`?"
- "What are the benefits of moving to `NetworkConnection` on iOS 26?"
- "How do I replace `[weak self]` patterns when migrating to async/await?"
- "Is `NWConnection` deprecated?"

## What's Covered

- **Do I need to migrate?** – A decision tree by current API: URLSession for HTTP stays, BSD sockets and `CFSocket`/`NSStream` move to `NWConnection`, `SCNetworkReachability` moves to `NWPathMonitor`, and working `NWConnection` code can stay because it isn't deprecated
- **BSD sockets to NWConnection** – Mapping table for `socket`/`connect`/`send`/`recv`/`bind`/`listen`/`accept` and their `NWConnection` equivalents, with complete before/after code
- **NWConnection to NetworkConnection** – Completion handlers to async/await, `stateUpdateHandler` to the `onStateUpdate` closure, manual JSON to the built-in `Coder` protocol, custom framers to built-in TLV
- **URLSession stream task to NetworkConnection** – When to migrate (UDP, custom protocols, low-level control) and when to stay (HTTP, WebSocket, caching)
- **Line count reductions** – 20 to 10 lines and 30 to 15 lines in the examples
- **Memory management changes** – Why async/await removes the need for `[weak self]`

## Documentation Scope

This page documents the `networking-migration` skill (in the `axiom-networking` suite), the migration guides your assistant uses when helping you move between networking API generations. The skill contains complete before/after examples for each migration path.

## Related

- [networking](/skills/integration/networking) – Modern networking patterns and architecture decisions
- [networking-legacy](/skills/integration/networking-legacy) – `NWConnection` patterns for apps that support iOS 12–18
- [network-framework-ref](/reference/network-framework-ref) – Complete Network.framework API reference
- [networking-diag](/diagnostic/networking-diag) – Troubleshooting connection failures

## Resources

**WWDC**: 2018-715, 2025-250

**Docs**: /network, /network/nwconnection
