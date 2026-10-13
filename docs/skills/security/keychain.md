# Keychain

Guidance for secure credential storage on Apple platforms with Keychain Services: the SecItem mental model, the common SecItem errors, and storage that survives app updates, device migrations, and backup restores.

## When to Use

Use this skill when:
- Storing passwords, tokens, or other credentials in the keychain
- Debugging `errSecDuplicateItem`, `errSecItemNotFound`, or other SecItem errors
- Reading keychain items from background work without hitting `errSecInteractionNotAllowed`
- Configuring keychain access groups for app extensions or multi-app sharing
- Choosing the right `kSecAttrAccessible` level for your data
- Adding biometric protection (Face ID or Touch ID) to keychain items
- Migrating credentials from `UserDefaults` or plain files to the keychain
- Using the keychain on macOS, where the file-based and data protection keychains differ

## Example Prompts

- "How do I store an API token in the keychain?"
- "I'm getting `errSecDuplicateItem` when saving credentials, but the item doesn't exist."
- "What accessibility level should I use for keychain items?"
- "How do I share keychain items between my app and its widget?"
- "How do I add Face ID protection to a keychain item?"
- "Why does my biometric-gated keychain item fail in iPhone Mirroring?"
- "My keychain read fails during background refresh."

## What This Skill Provides

- The four-function mental model from Quinn "The Eskimo!" on the Apple Developer Forums: `SecItemAdd`, `SecItemCopyMatching`, `SecItemUpdate`, and `SecItemDelete` map to SQL `INSERT`, `SELECT`, `UPDATE`, and `DELETE`
- The uniqueness rules behind `errSecDuplicateItem`, and a safe add-or-update pattern
- Accessibility levels mapped to real use cases, including the background-execution trap
- Biometric and passcode access control, `LAContext` reuse, and the iPhone Mirroring caveat
- Access groups for app extensions and multi-app sharing, and the Team ID prefix traps
- Mac keychain differences, and why to use the data protection keychain
- Anti-patterns with time costs: tokens in `UserDefaults`, wrapper libraries, delete-then-re-add, `WhenUnlocked` for background reads, and trusting the Simulator
- Pressure scenarios for common deadline shortcuts: "store it in UserDefaults for now", deleting the item on any error, and adopting a wrapper library

## Documentation Scope

This page documents the `keychain` skill (in the `axiom-security` suite).

## Related

- [Keychain Diagnostics](/diagnostic/keychain-diag) – troubleshoot specific SecItem error codes and lost-item scenarios
- [Keychain Reference](/reference/keychain-ref) – SecItem function signatures, attribute constants, accessibility levels
- [CryptoKit](/skills/security/cryptokit) – encryption and signing for data that goes beyond credential storage
- [File Protection Reference](/reference/file-protection-ref) – Data Protection classes for files stored outside the keychain
