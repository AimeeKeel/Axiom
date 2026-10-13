# Code Signing

Workflows and discipline for iOS and macOS code signing: certificates, provisioning profiles, entitlements, CI/CD signing, and preparing a distribution build.

## When to Use

Use this skill when:
- Setting up code signing for a new project or CI/CD pipeline
- Debugging certificate, profile, or entitlement errors
- Configuring signing for App Store, TestFlight, or Ad Hoc distribution
- Managing certificates across a team with fastlane match
- Choosing between automatic and manual signing
- Adding a capability that changes your entitlements
- Fixing CI signing failures, such as `errSecInternalComponent` or a locked keychain

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I set up code signing for my iOS app?"
- "Should I use automatic or manual signing?"
- "How do I set up fastlane match for my team?"
- "How do I configure code signing for GitHub Actions?"
- "Why does code signing work locally but fail in CI?"
- "My provisioning profile expired. What do I do?"
- "How do I add push notification entitlements to my profile?"

## What This Skill Provides

- Red flags that make signing harder than it needs to be, such as sharing `.p12` files in chat or setting `CODE_SIGN_IDENTITY = ""`
- Four mandatory first steps: list signing identities, decode the provisioning profile, extract the binary's entitlements, and confirm the certificate is in the profile
- A decision tree for automatic or manual signing
- Certificate types, lifecycle, and renewal workflow
- Provisioning profile patterns (Development, Ad Hoc, App Store, Enterprise)
- Entitlements configuration, a capability-to-entitlement map, and multi-target entitlements
- CI/CD signing setup (raw scripts, fastlane match, Xcode Cloud)
- Four anti-patterns with wrong and right code and their time costs
- Three pressure scenarios (disabling signing, a personal certificate for the team, committing a `.p12` to the repo)
- A pre-archive signing checklist

## Documentation Scope

This page documents the `code-signing` skill in the `axiom-security` suite. It covers setting signing up correctly; for a specific error message, the diagnostics page below is faster.

## Related

- [Code Signing Diagnostics](/diagnostic/code-signing-diag) – Six decision trees for specific signing errors
- [Code Signing Reference](/reference/code-signing-ref) – Command-line tools, Xcode build settings, and error codes
- [Xcode Debugging](/skills/debugging/xcode-debugging) – Environment-first checks when signing errors come with build failures
- [App Store Submission](/skills/shipping/app-store-submission) – The pre-submission checklist, including signing verification
