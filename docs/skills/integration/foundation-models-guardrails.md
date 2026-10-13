---
name: foundation-models-guardrails
description: Deciding when to relax Foundation Models guardrails with permissive content transformations, telling a correct refusal from a false positive, and proving the choice is safe before shipping
---

# Foundation Models Guardrails

How to decide whether a Foundation Models feature should keep Apple's default content guardrails or relax them for transforming text the user already has, and how to show that the choice is safe before you ship it.

## When to Use

Use this skill when:
- A legitimate prompt is refused with a guardrail violation and you're considering permissive mode
- You're deciding whether `permissiveContentTransformations` suits your feature
- You need evidence that a permissive-mode feature is safe to ship
- You trained a custom adapter and want to know whether it weakened the model's safety

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "My app summarizes news articles and the model keeps refusing. What should I do?"
- "Should I turn on permissive content transformations?"
- "Why does permissive mode do nothing for my `@Generable` output?"
- "How do I test that permissive mode is safe for my feature?"
- "Does training a custom adapter affect the model's guardrails?"

## What This Skill Provides

- **How guardrails work** – Apple's layered safety model, and which layer permissive mode relaxes
- **The guardrails API** – Setting guardrails on the model rather than the session, the only two settings available, and platform availability
- **The string-only rule** – Why guided generation with `@Generable` always uses the default guardrails, whatever you set
- **Default or permissive** – Which features suit permissive mode (faithfully transforming existing text) and which don't
- **False-positive triage** – A decision tree for telling a correct refusal from an over-restrictive one, and reporting genuine false positives through Feedback Assistant
- **A safety evaluation** – Building a red-team prompt set, comparing default and permissive behavior, covering your locales, and re-running after model updates
- **Adapters and safety** – Why a trained adapter can weaken guardrails on nearby topics, and how to check

## Documentation Scope

This page documents the `foundation-models-guardrails` skill (in the `axiom-ai` suite), which your assistant loads when you decide how strict a Foundation Models feature's content guardrails should be. What to show the user after a guardrail fires is troubleshooting, covered by [Foundation Models Diagnostics](/diagnostic/foundation-models-diag).

## Related

- [foundation-models](/skills/integration/foundation-models) – Building Foundation Models features, including how to present a refusal to the user
- [foundation-models-adapters](/skills/integration/foundation-models-adapters) – Training custom adapters, where safety is one of the evaluation axes
- [foundation-models-ref](/reference/foundation-models-ref) – The `LanguageModelError` cases, including guardrail violations and refusals
- [foundation-models-auditor](/agents/foundation-models-auditor) – Scans your code for missing guardrail and refusal handling

## Resources

**WWDC**: 2025-248

**Docs**: /foundationmodels/systemlanguagemodel/guardrails, /foundationmodels/improving-the-safety-of-generative-model-output
