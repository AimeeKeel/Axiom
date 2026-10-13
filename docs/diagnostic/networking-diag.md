---
name: networking-diag
description: Connection timeouts, TLS failures, data that never arrives — systematic Network.framework and URLSession diagnostics
---

# Networking Diagnostics

Systematic troubleshooting for Network.framework connections that time out, fail TLS, or lose data, and for `URLSession` requests that fail after the app returns from the background. Most failures come from misread connection states, unhandled network transitions, or missing error handling, not from the framework itself.

## Symptoms This Diagnoses

Use when you're experiencing:
- A connection times out after 60 seconds with no clear error
- A connection stays in `.preparing` for more than 5 seconds, or moves straight to `.waiting`
- A connection fails with POSIX error 61 (connection refused) or 50 (network down)
- TLS fails with `-9806` (invalid certificate), `-9807` (expired certificate), or `-9801` (protocol version)
- `send` succeeds, but the receiver never gets the data or gets only part of a message
- Latency grows over time, throughput drops, CPU use is high, or memory keeps growing during a connection
- The app works on Wi-Fi but fails on cellular, or fails only while a VPN is active
- A connection drops when the device switches from Wi-Fi to cellular
- The app works in the Simulator but fails on a real device
- `URLSession` fails with `URLError(-1005)`, "The network connection was lost", on the first request after the app returns from the background
- App Transport Security blocks an HTTP request, or HTTPS fails with "An SSL error has occurred"

## Example Prompts

- "My NWConnection is stuck in the preparing state. What's wrong?"
- "Why does my connection fail with TLS error -9806?"
- "Messages I send over TCP arrive merged or split on the other side."
- "My app works on Wi-Fi but fails on cellular."
- "The first request after my app comes back from the background fails with -1005."
- "URLSession fails against my server, but NWConnection works. Why?"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Gather Evidence

Before changing code:
1. Turn on Network.framework logging with the `-NWLoggingEnabled 1` and `-NWConnectionLoggingEnabled 1` launch arguments
2. Log every connection state change with a timestamp
3. Check any custom TLS settings, such as the minimum TLS version
4. Capture the traffic with a proxy such as Charles Proxy or Wireshark
5. Test on Wi-Fi, on cellular alone, after toggling Airplane Mode, with a VPN active, and on an IPv6-only network

The Simulator uses the Mac's networking stack and hides cellular and IPv6-only problems, so the skill has you test on a real device.

### Step 2: Match the Symptom to a Cause

| What you see | Likely cause |
|--------------|--------------|
| Stuck in `.preparing` for more than 5 seconds | DNS failure or network down |
| Moves to `.waiting` immediately | No connectivity, or cellular blocked by the connection's parameters |
| `.failed` with POSIX error 61 | Connection refused: the server isn't listening |
| `.failed` with POSIX error 50 | Network down: the interface is disabled |
| `.ready`, then an immediate `.failed` | TLS handshake failure |
| `.ready`, `send` succeeds, no data arrives | Missing message framing, or a receiver that isn't reading |
| Works on Wi-Fi, fails on cellular | IPv6-only network and a hardcoded IPv4 address |
| Works without a VPN, fails with one | Proxy interference or a DNS override |
| `URLSession` fails, `NWConnection` works | App Transport Security |
| `-1005` on the first request after backgrounding | A stale `URLSession` connection pool |

Command-line checks confirm a cause outside your app: `nslookup` or `dig` for DNS, `openssl s_client` for certificates, and `nscurl --ats-diagnostics` for App Transport Security.

### Step 3: Apply One Fix at a Time

Your assistant applies the fix for your symptom, tests it, and tries the next one only if the problem remains, because changing several things at once hides which change worked:
- **DNS and connectivity** – DNS failures, no connectivity, refused connections, and a disabled network interface
- **TLS** – fixing the certificate on the server instead of disabling validation, and pinning either the certificate or the public key, never a mix of the two
- **Data delivery** – message framing with TLV (iOS 26+) or a length prefix, receive sizes, and race conditions
- **Performance** – pacing sends with the `contentProcessed` callback or async `send`, batching, and connection leaks
- **Network-specific failures** – IPv6-only cellular networks, VPNs and proxies, firewalls, and peer-to-peer NAT traversal
- **App Transport Security** – a domain-specific exception for a blocked HTTP load, a server upgrade for an old TLS version, and never `NSAllowsArbitraryLoads`
- **Stale connection pool** – confirming reuse with `isReusedConnection`, recycling the session when the app becomes active, and retrying only requests that are safe to repeat

The skill steers away from disabling TLS, switching to raw sockets, or adding timeouts and retries before the cause is known.

## Documentation Scope

This page documents the `networking-diag` skill (in the `axiom-networking` suite), which your assistant loads when a network connection fails, stalls, or loses data. To scan your code for deprecated networking APIs and anti-patterns instead, run `/axiom:audit networking`, which launches the networking-auditor agent. The skill file also holds a quick-reference table with fix-time estimates and common debugging mistakes. A worked outage follows an app update that required TLS 1.3 and broke connections for users behind servers and proxies that support only TLS 1.2, with the diagnosis steps and the status updates sent to leadership, engineering, and support.

## Related

- [networking](/skills/integration/networking) – Network.framework connection patterns that prevent these failures
- [network-framework-ref](/reference/network-framework-ref) – `NWConnection` and `NetworkConnection` API reference, including TLV framing and listeners
- [networking-auditor](/agents/networking-auditor) – Scans your code for deprecated networking APIs and anti-patterns
- [audit-networking](/commands/integration/audit-networking) – The command that runs the networking auditor
