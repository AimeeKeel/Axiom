# CryptoKit

Guidance for cryptography on Apple platforms: encryption, signing, hashing, key agreement, Secure Enclave keys, post-quantum algorithms, and moving off the legacy CommonCrypto API.

## When to Use

Use this skill when:
- Deciding whether you need CryptoKit at all, or whether TLS, Data Protection, or the keychain already covers you
- Encrypting or decrypting data with AES-GCM or ChaChaPoly
- Signing data or verifying signatures with ECDSA
- Generating or managing keys in the Secure Enclave
- Choosing between CryptoKit algorithm families for a use case
- Migrating from CommonCrypto or Security.framework to CryptoKit
- Evaluating or adopting post-quantum algorithms (ML-KEM, ML-DSA)
- Implementing key agreement (ECDH) or hybrid encryption (HPKE)
- Making signatures and keys work with a server or another platform

## Example Prompts

- "How do I encrypt data with CryptoKit?"
- "Should I use AES-GCM or ChaChaPoly?"
- "How do I create and use a Secure Enclave key?"
- "How do I migrate from CommonCrypto to CryptoKit?"
- "What are the post-quantum options in CryptoKit?"
- "How do I sign data and verify the signature?"
- "My server can't verify signatures from my iOS app."
- "What's the difference between P256 and Curve25519?"

## What This Skill Provides

- A "do you actually need CryptoKit?" decision tree that sends HTTPS, file storage, credentials, and CloudKit cases to the system frameworks first
- The Secure Enclave key lifecycle: creation, biometric gating, constraints, and what doesn't survive a reinstall or restore
- Common workflows: hashing, HMAC, AES-GCM, ECDSA signing, ECDH key agreement, and HPKE
- A quantum-secure migration plan: the quantum-secure TLS that iOS 26 uses by default, post-quantum HPKE, ML-KEM and ML-DSA, and AES-256
- Cross-platform interop: Swift Crypto parity, DER versus raw signatures, key export, and secp256r1 versus secp256k1
- Anti-patterns with security impact: unauthenticated AES-CBC, nonce reuse, private keys in `UserDefaults`, AES-128, and key material left in memory
- Pressure scenarios for common shortcuts: "just encrypt it with whatever", skipping the Secure Enclave for cross-platform parity, and deferring quantum-safe crypto

## Documentation Scope

This page documents the `cryptokit` skill (in the `axiom-security` suite).

## Related

- [CryptoKit Reference](/reference/cryptokit-ref) – all algorithm families, type signatures, and API details
- [Keychain](/skills/security/keychain) – secure storage for the keys and credentials CryptoKit generates
- [File Protection Reference](/reference/file-protection-ref) – Data Protection, the first choice for encrypting files at rest before you reach for CryptoKit
