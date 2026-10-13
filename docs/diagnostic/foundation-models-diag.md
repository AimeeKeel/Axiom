---
name: foundation-models-diag
description: Unavailable model, context exceeded, guardrail violations, slow generation — systematic Foundation Models diagnostics
---

# Foundation Models Diagnostics

Systematic troubleshooting for Apple's Foundation Models framework: an unavailable model, context and guardrail errors, wrong or inconsistent output, slow generation, and a frozen UI. Most problems come from asking a 3-billion-parameter, device-scale model for world knowledge, from its context limit, or from availability requirements, not from framework bugs.

## Symptoms This Diagnoses

Use when you're experiencing:
- `SystemLanguageModel.default.availability` reports `.unavailable`
- Generation fails with `LanguageModelError.contextSizeExceeded`
- Generation fails with `.guardrailViolation`, or the model declines with `.refusal`
- Generation fails with `.unsupportedLanguageOrLocale`
- The model makes up facts or gives wrong answers
- Manually parsed JSON output fails to decode
- `@Generable` won't resolve in Swift Playgrounds, a recursive `@Generable` type crashes, or a dynamic schema throws `SchemaError.undefinedReferences`
- Output differs on every run when you need it to be consistent
- The first request is slow, or users wait seconds before anything appears
- The UI freezes while the model generates
- Error alerts lost their recovery text after you moved to the 27 SDK's error types
- A feature that worked in testing fails for a large share of users after launch

## Example Prompts

- "Why does my LanguageModelSession fail with contextSizeExceeded?"
- "Foundation Models says it's unavailable on my test device. Why?"
- "How should I handle guardrail violations in my app?"
- "The model makes up facts. How do I get accurate answers?"
- "My UI freezes while the model is generating."
- "20% of users see errors after we launched our AI feature. Where do I start?"
- "My recursive @Generable type crashes. What's wrong?"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Gather Evidence

Before changing code, your assistant checks:
1. Availability, and the reason when the model is unavailable
2. Whether the current language is in `supportedLanguages`
3. How much of the context window the transcript uses, against the limit in `SystemLanguageModel.default.contextSize` (8,192 tokens for the 27 on-device model, 4,096 for 26)
4. Load time, token counts, and generation time in the Instruments Foundation Models template
5. The transcript itself, for unusual or repeated entries

### Step 2: Identify the Problem Category

| Symptom | Likely cause |
|---------|--------------|
| `.unavailable(.deviceNotEligible)` | The device can't run Apple Intelligence |
| `.unavailable(.appleIntelligenceNotEnabled)` | Apple Intelligence is turned off in Settings |
| `.unavailable(.modelNotReady)` | The model is still downloading; retry later |
| `contextSizeExceeded` | A long conversation or verbose prompts |
| `guardrailViolation` or `refusal` | A safety guardrail tripped, or the model itself declined |
| `unsupportedLanguageOrLocale` | A language the model doesn't support |
| Made-up facts | Asking for world knowledge the model doesn't have |
| Slow first request | The model loading on first use |
| UI frozen | Synchronous work on the main actor around generation, not the `await` itself |

### Step 3: Apply the Targeted Pattern

- **Availability** – a fallback UI for each unavailable reason, a retry for `.modelNotReady`, and a link to Settings for `.appleIntelligenceNotEnabled`
- **Errors** – condensing the transcript when the context fills, separate handling for guardrail violations and refusals, a language check, and catching every error case after the 27 SDK replaced `LanguageModelSession.GenerationError`
- **Output quality** – tool calling for external data, `@Generable` instead of manual JSON parsing, and greedy sampling or a lower temperature for consistent output
- **Performance** – prewarming the session, streaming partial results, `includeSchemaInPrompt: false` for repeat requests, and splitting a complex prompt into steps
- **Frozen UI** – find the synchronous main-actor work with the Hangs instrument and move it off the main actor
- **Schemas** – `DynamicGenerationSchema` for Swift Playgrounds and recursive types, and declaring every referenced schema in `dependencies`

## Documentation Scope

This page documents the `foundation-models-diag` skill (in the `axiom-ai` suite), which your assistant loads when a Foundation Models feature fails, refuses, runs slowly, or returns wrong output. To scan your code for missing availability checks, concurrent requests on one session, and manual JSON parsing, run `/axiom:audit foundation-models`, which launches the foundation-models-auditor agent. When a guardrail blocks content you believe is legitimate, the skill hands off to the `foundation-models-guardrails` skill. The skill file also holds a quick-reference table with fix-time estimates and a worked launch incident: 20% of users see errors because their devices can't run Apple Intelligence, fixed with an availability check, a fallback UI, and Xcode's scheme override for testing each unavailable reason.

## Related

- [foundation-models](/skills/integration/foundation-models) – Patterns that prevent these problems, such as availability checks, streaming, `@Generable`, and tool calling
- [foundation-models-ref](/reference/foundation-models-ref) – Complete API reference, including the error types and token sizing
- [foundation-models-auditor](/agents/foundation-models-auditor) – Scans your code for missing availability checks, concurrent requests on one session, and manual JSON parsing
- [audit-foundation-models](/commands/integration/audit-foundation-models) – The command that runs the Foundation Models auditor

## Resources

**WWDC**: 2025-286, 2025-301
