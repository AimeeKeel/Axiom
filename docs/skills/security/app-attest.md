# App Attest

Guidance for verifying app integrity and preventing fraud with Apple's App Attest service (part of the DeviceCheck framework), on every Apple platform including macOS 27. It covers key generation, server-side validation, and the assertions that protect API calls from tampered or re-signed copies of your app.

## When to Use

Use this skill when:
- Protecting server APIs from requests sent by modified or re-signed app binaries
- Implementing app integrity verification with App Attest
- Using DeviceCheck's two bits of per-device state, for example to stop repeat free-trial claims, without identifying users
- Building server-side validation for attestation objects and assertions
- Planning an App Attest rollout that handles unsupported devices gracefully
- Using Apple's fraud metric alongside attestation

## Example Prompts

- "How do I add App Attest to my iOS app?"
- "How do I validate an attestation object on my server?"
- "`isSupported` returns false. Should I block the user?"
- "How do I use assertions to protect individual API calls?"
- "What's the difference between App Attest and DeviceCheck?"
- "We have 2 million daily users. How do I roll out App Attest safely?"
- "Can I use App Attest in my Mac app?"
- "How do I detect a re-signed copy of my app?"

## What This Skill Provides

- The three-step lifecycle: key generation, attestation, and assertion
- Server-side attestation validation: certificate chain, nonce, app identity hash, counter, and receipt
- Assertion validation for sensitive requests, with the strictly increasing counter that stops replay attacks
- A gradual rollout plan sized to your install base, treating unsupported devices as a risk signal rather than a reason to block
- macOS support (macOS 27) and the 27-release tampering signals: authenticator-data extensions (launch validation category, bundle version) and the macOS key access control property
- The fraud metric: redeeming the stored receipt, refresh windows, and treating the count as an investigation signal rather than a block
- DeviceCheck's two bits of per-device state, for flags that don't identify the user
- Anti-patterns with fraud impact: on-device validation, skipped counter checks, assertions on every API call, and discarding keys on `serverUnavailable`
- Pressure scenarios for common shortcuts: blocking every user who fails attestation, and enabling App Attest for everyone at once

## Documentation Scope

This page documents the `app-attest` skill (in the `axiom-security` suite).

## Related

- [Keychain](/skills/security/keychain) – where the attested key ID is stored, one key per user per device
- [CryptoKit](/skills/security/cryptokit) – cryptographic primitives used in attestation and assertion signature verification
- [Agentic Security](/skills/security/agentic-security) – gating the sensitive actions an AI feature can trigger
