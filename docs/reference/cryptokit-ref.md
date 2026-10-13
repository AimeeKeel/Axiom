# CryptoKit Reference

API reference for Apple's CryptoKit framework, covering every algorithm family with its type signatures and usage patterns. It's for developers who already know which algorithm they want and need the exact API.

## When to Use This Reference

Use this reference when:
- Looking up specific CryptoKit type signatures or method parameters
- Checking which algorithms each cryptographic family offers
- Understanding how key types, sealed boxes, and signatures relate
- Finding the correct type for Secure Enclave operations
- Reviewing post-quantum APIs (ML-KEM, ML-DSA, X-Wing)
- Porting CryptoKit code to Linux or Windows with Swift Crypto

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the API for `AES.GCM.seal`?"
- "What Secure Enclave key types does CryptoKit support?"
- "How do I use HPKE for hybrid encryption?"
- "What's the difference between the P256, P384, and P521 curves?"
- "What are the ML-KEM key encapsulation APIs?"
- "How do I encrypt in place without copying the plaintext on iOS 27?"

## What's Covered

### Hashing and Authentication
- SHA256, SHA384, SHA512, SHA3_256, SHA3_384, SHA3_512, `Insecure.MD5`, `Insecure.SHA1`
- Single-call and streaming hashing, the `HashFunction` protocol
- `SymmetricKey` and HMAC, including iterative HMAC

### Symmetric Encryption
- AES-GCM and ChaChaPoly sealed boxes and nonces
- In-place AEAD and span APIs (iOS 27), and which of them need an availability check
- AES key wrapping (RFC 3394)

### Key Agreement and Signatures
- ECDH with Curve25519 (X25519), P256, P384, and P521
- ECDSA with P256, P384, and P521, and EdDSA with Curve25519 (Ed25519)
- Key representations (raw, x963, PEM, DER) and DER vs. raw signatures for cross-platform interop

### Post-Quantum Cryptography (iOS 26+)
- ML-KEM (`MLKEM768`, `MLKEM1024`) key encapsulation, and one-time decapsulation keys (iOS 27)
- ML-DSA (`MLDSA65`, `MLDSA87`) signatures
- X-Wing hybrid KEM (`XWingMLKEM768X25519`)

### HPKE
- Predefined and custom ciphersuites, including X-Wing (iOS 26+)
- Sender and recipient APIs, additional modes, HPKE errors

### Secure Enclave
- `SecureEnclave.isAvailable`
- P256 signing and key agreement, ML-KEM and ML-DSA keys (iOS 26+)
- Key creation, persistence, and usage

### Key Derivation and Errors
- HKDF one-step and two-step (extract and expand)
- `CryptoKitError`, `CryptoKitASN1Error`, HPKE and KEM errors

### Swift Crypto
- `#if canImport(CryptoKit)` imports and 1:1 API parity on other platforms, except `SecureEnclave`

## Documentation Scope

This page documents the `cryptokit-ref` skill (in the `axiom-security` suite), which gives your assistant API-level detail once you know which algorithm to use. For choosing an algorithm, see the CryptoKit skill under Related.

## Related

- [CryptoKit](/skills/security/cryptokit) – Algorithm decision trees, workflows, and migration guidance, for deciding what to use before looking up how
- [Keychain Reference](/reference/keychain-ref) – Storing the keys you generate here
- [security-privacy-scanner](/agents/security-privacy-scanner) – Agent that scans for hardcoded keys, insecure storage, and missing export compliance declarations

## Resources

**WWDC**: 2019-709, 2024-10120

**Docs**: /cryptokit, /cryptokit/performing-common-cryptographic-operations
