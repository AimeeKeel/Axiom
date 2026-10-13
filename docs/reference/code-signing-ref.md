# Code Signing Reference

Command-line and API reference for iOS and macOS code signing: certificates, provisioning profiles, entitlements, keychains, `codesign` verification, fastlane match, and Xcode build settings. Use it when you need the exact command, setting, or error code.

## When to Use This Reference

Use this reference when:
- Running CLI commands to inspect certificates, profiles, or entitlements
- Setting up keychain management scripts for CI
- Configuring fastlane match for team certificate management
- Looking up Xcode build settings for signing
- Checking ITMS error codes and their causes
- Deciding between .p8 and .p12 for APNs authentication
- Writing `ExportOptions.plist` for `xcodebuild` exports

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "What's the command to list my signing certificates?"
- "How do I decode a provisioning profile from the command line?"
- "What does ITMS-90035 mean?"
- "How do I set up a CI keychain for code signing?"
- "What are the Xcode build settings for manual signing?"
- "Should I use .p8 or .p12 for push notifications?"

## What's Covered

### Certificates
- Certificate types, validity, and per-account limits
- CSR generation
- Inspection and installation (`security find-identity`, `find-certificate`, `import`, `export`)

### Provisioning Profiles
- Profile types: Development, Ad Hoc, App Store, Enterprise
- Profile contents, decoding with `security cms -D`, installation paths

### Entitlements
- Common entitlement keys and values, and the `.plist` format
- Extraction and comparison (`codesign -d --entitlements`)

### Command Reference
- `security`: identities, import and export, profile decoding, keychain management (`create-keychain`, `unlock-keychain`, `set-key-partition-list`)
- `codesign`: signing, timestamps, deep signing, verification
- `openssl`: certificate inspection and .p12 handling

### Xcode and Export
- Signing build settings (`CODE_SIGN_IDENTITY`, `CODE_SIGN_STYLE`, and more)
- `xcodebuild` signing overrides for archive and export
- `ExportOptions.plist` format and export methods

### fastlane match and CI
- match setup, `Matchfile`, read-only CI mode, environment variables, a CI `Fastfile`
- Complete CI keychain setup and cleanup scripts, with a GitHub Actions example
- Xcode Cloud's managed signing

### APNs and Error Codes
- APNs .p8 vs .p12 comparison
- Error codes for `security`, `codesign`, and ITMS uploads

## Documentation Scope

This page documents the `code-signing-ref` skill (in the `axiom-security` suite). The full command reference, error codes, and CI scripts live in the skill, which your assistant reads when you ask a signing question.

## Related

- [Code Signing](/skills/debugging/code-signing) – Signing workflows, decision trees, and anti-patterns that put these commands to use
- [Code Signing Diagnostics](/diagnostic/code-signing-diag) – Troubleshooting a specific signing error, symptom by symptom
- [App Store Submission Reference](/reference/app-store-ref) – Build upload, processing, and the rest of the submission requirements
- [Push Notifications Reference](/reference/push-notifications-ref) – Sending pushes with the .p8 key or .p12 certificate compared here
- [Direct Distribution](/skills/macos/direct-distribution) – Developer ID signing and notarization for Mac apps distributed outside the App Store

## Resources

**WWDC**: 2021-10204, 2022-110353

**Docs**: /security, /bundleresources/entitlements
