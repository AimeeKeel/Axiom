---
name: audit-foundation-models
description: Scan Foundation Models / Apple Intelligence code for missing availability checks, concurrent requests, manual JSON parsing, guardrail handling
---

# audit-foundation-models

Scan Foundation Models / Apple Intelligence integration code for issues that crash on unsupported devices, freeze the UI, or mishandle guardrail responses.

## What This Command Does

Launches the **foundation-models-auditor** agent to flag the most common mistakes when integrating on-device language models — missing availability gates, a second request started while one is running, and brittle parsing of structured output.

## What It Checks

1. **Missing availability checks** – `LanguageModelSession` use without `isAvailable` or device-capability gating
2. **Concurrent requests** – a button or action that can start a request while the session `isResponding`, which throws `concurrentRequests`
3. **Manual JSON parsing** – `JSONDecoder` against model output where `@Generable` would give compiler-checked structure
4. **Missing error handling** – no recovery for `guardrailViolation`, `unsupportedLanguageOrLocale`, `assetsUnavailable`
5. **Session lifecycle** – sessions created per-message instead of reused, or held across app states without checkpointing

## Related Agent

- [foundation-models-auditor](/agents/foundation-models-auditor) – The agent that powers this command
- [foundation-models-ref](/reference/foundation-models-ref) – Foundation Models reference
