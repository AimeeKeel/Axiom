---
name: code-signing-diag
description: Systematic troubleshooting for code signing failures — missing certificates, provisioning profile mismatches, Keychain issues in CI, entitlement conflicts, and App Store upload rejections
---

# Code Signing Diagnostics

Systematic troubleshooting for code signing failures: missing certificates, provisioning profile mismatches, Keychain issues in CI, entitlement conflicts, and App Store upload rejections.

## Symptoms This Diagnoses

Use when you're experiencing:
- "No signing certificate found" during build or archive
- "Provisioning profile doesn't include signing certificate"
- "Profile doesn't match bundle ID"
- ITMS-90035 Invalid Signature when uploading to the App Store
- ITMS-90161 Invalid Provisioning Profile
- ITMS-90046 Invalid Entitlements
- `errSecInternalComponent` in CI (GitHub Actions, Bitrise, and others)
- A "codesign wants to access key" dialog
- Ambiguous identity, where multiple certificates match
- Entitlement mismatch or missing capability errors
- App extension signing failures
- Code signing that works locally but fails in CI
- Archive succeeds, but export or upload fails

## Example Prompts

- "My build fails with 'No signing certificate found'"
- "ITMS-90035 when I try to upload to App Store Connect"
- "errSecInternalComponent in my GitHub Actions workflow"
- "Code signing works on my machine but fails in CI"
- "Multiple certificates match — ambiguous identity"
- "Entitlement not allowed by provisioning profile"

## Diagnostic Workflow

Code signing errors are configuration problems, never code bugs. The skill runs four mandatory diagnostic steps before any fix:

1. **Check signing identities** – `security find-identity -v -p codesigning`
2. **Decode the provisioning profile** – `security cms -D -i embedded.mobileprovision`
3. **Extract and compare entitlements** – A three-way comparison of the built binary, the profile, and your `.entitlements` file
4. **Verify the certificate is in the profile** – Match the certificate's SHA-1 hash in your keychain against the profile

Six decision trees then map specific errors to root causes: certificate not found, profile mismatch, ITMS upload errors, Keychain issues in CI, ambiguous identity, and entitlement mismatch.

Diagnose before you regenerate anything. Revoking a distribution certificate invalidates every provisioning profile that uses it, breaking signing for your whole team and every CI pipeline, while most failures are a single expired or mismatched component.

## Documentation Scope

This page documents the `code-signing-diag` diagnostic skill (in the `axiom-security` suite). The skill file holds the full decision trees, a quick-reference table of symptoms and fixes, and pressure scenarios such as "just regenerate everything" and "roll back Xcode". Your assistant loads it automatically when you describe a signing error.

## Related

- [Code Signing](/skills/debugging/code-signing) – Workflows, anti-patterns, and setup guidance
- [Code Signing Reference](/reference/code-signing-ref) – CLI commands, error codes, and fastlane match setup
- [Xcode Debugging](/skills/debugging/xcode-debugging) – Environment-first diagnostics for build failures
- [App Store Diagnostics](/diagnostic/app-store-diag) – Troubleshooting App Review rejections that aren't about signing
