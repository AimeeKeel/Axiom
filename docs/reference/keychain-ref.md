# Keychain Reference

API reference for Keychain Services on Apple platforms: the `SecItem` functions, item classes, query attributes, accessibility levels, access control flags, and error codes. Use it when you need an exact signature or constant rather than guidance on how to approach the keychain.

## When to Use This Reference

Use this reference when:
- Looking up `SecItem` function signatures or return types
- Finding the correct `kSecAttr*` constant for a query dictionary
- Choosing between `kSecAttrAccessible` levels
- Configuring `SecAccessControl` flags for biometric or passcode protection
- Understanding the differences between item classes: generic password, internet password, certificate, key, and identity
- Checking which attributes make an item unique, and why `SecItemAdd` returns a duplicate-item error
- Decoding an `OSStatus` keychain error

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What attributes does `SecItemAdd` require for a generic password?"
- "What's the difference between `kSecAttrAccessibleWhenUnlocked` and `kSecAttrAccessibleAfterFirstUnlock`?"
- "How do I create a `SecAccessControl` with biometry and a device passcode fallback?"
- "What's the query format for `SecItemCopyMatching` with multiple results?"
- "Which `kSecClass` should I use for an OAuth token?"
- "Why does my unit test fail with error -34018?"

## What's Covered

### SecItem Functions
- `SecItemAdd`, `SecItemCopyMatching`, `SecItemUpdate`, `SecItemDelete`

### Item Classes
- `kSecClassGenericPassword`, `kSecClassInternetPassword`, `kSecClassCertificate`, `kSecClassKey`, `kSecClassIdentity`
- Uniqueness constraints per class

### Attributes and Query Properties
- Identity, security, token, and key metadata attributes
- Search properties and `kSecMatchLimit` defaults
- Return type properties, behavior per class, and multiple return types
- Value type properties and their behavior per operation

### Access Protection
- `kSecAttrAccessible` levels: when each is readable, whether it survives backup, and whether it syncs
- `SecAccessControlCreateFlags`: every flag, creating access control, flag combinations
- LocalAuthentication integration: `LAContext`, `LAPolicy`, biometry type detection, `LAError` codes

### Errors
- `OSStatus` error codes and how to interpret them in Swift
- -34018 on test targets

### Sharing and Sync
- Access groups for sharing between apps and extensions
- iCloud Keychain sync with `kSecAttrSynchronizable`
- Payment-related certificates stored in the keychain

## Documentation Scope

This page documents the `keychain-ref` skill (in the `axiom-security` suite). It gives API-level detail to developers who already understand keychain concepts.

## Related

- [Keychain](/skills/security/keychain) – Discipline skill with workflows, anti-patterns, and decision guidance
- [Keychain Diagnostics](/diagnostic/keychain-diag) – Error triage and root-cause analysis for `SecItem` failures
- [CryptoKit](/skills/security/cryptokit) – Encrypting data and generating the keys you store here
- [Code Signing Reference](/reference/code-signing-ref) – Signing certificates in the keychain, entitlements, and CI keychain setup

## Resources

**WWDC**: 2013-709, 2014-711, 2020-10147

**Docs**: /localauthentication, /security/secaccesscontrolcreateflags, /security/secitemadd(_:_:)
