# Foundation Models Evaluations Reference

This reference covers Apple's **Evaluations** framework, which measures the quality of a generative-AI feature as you iterate, so you stop eyeballing a few outputs and hoping. Evaluations is new in the 27 releases, ships on every Apple platform except tvOS, and links into your test target rather than your app.

## When to Use This Reference

Use this reference when:

- You changed a prompt, instruction, schema, or model and want to know whether your AI feature got better or quietly regressed
- You want a regression suite for an AI feature that runs in CI from Swift Testing
- The output is open-ended, such as a summary or a rewrite, so pass/fail isn't mechanical and you need a model to grade it
- Your feature is agentic and you need to check that it calls the right tools, in the right order, with the right arguments
- You have a handful of test cases and want to synthesize a larger evaluation dataset
- You need to find which samples failed, and why

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I write an evaluation that checks my book-tagging feature returns 3–8 tags?"
- "How do I measure whether my prompt change improved summary quality?"
- "How do I set up a model-as-judge to score helpfulness?"
- "How do I check that my agent called the search tool with the right query?"
- "Can I generate 100 synthetic test samples from my 5 seed examples?"
- "Why does my eval crash when I reload a saved result?"

## What's Covered

An index of the Evaluations API this reference documents. The skill holds the signatures, code, and caveats.

### Defining an evaluation
`Evaluation` protocol · `Metric` · `Evaluator` / `EvaluatorsBuilder` · `ModelSubject`

### Datasets
`ModelSample` · `ArrayLoader` · `JSONLoader` · `StreamLoader` · `Loader` · `makeSamples` · `SampleGenerator` · `SamplingStrategy`

### Running & aggregating
`.evaluates` Swift Testing trait · `EvaluationContext` · `EvaluationResult.aggregateValue` · `MetricsAggregator` · `AggregationOperation`

### Model-as-judge
`ModelJudgeEvaluator` · `ScoringScale` (`.numeric` / `.passFail` / `.custom`) · `ScoreDimension` · `ScoringMode` · `ModelJudgePrompt`

### Agentic / tool-call evaluation
`ToolCallEvaluator` · `TrajectoryExpectation` · `ToolExpectation` · `ArgumentMatcher`

### Inspecting results
`EvaluationResult` (`summary` / `detailed` / `groupedSummary`) · `ResultColumn` · `inputColumn` / `responseColumn` / `expectedColumn` · `DataFrame[column:]` / `DataFrame[metric:]` · triaging failures

### Errors
`EvaluationError` · `SubjectInferenceError` · `EvaluatorError` · `EvaluationResultsError` · `ModelJudgeError`

### Determinism and where it runs
`GenerationOptions(samplingMode: .greedy)` · why the judge cannot be pinned · device / Simulator / hosted-CI availability · the `PrivateCloudComputeLanguageModel` entitlement requirement

### Persistence
`saveJSON` / `loadJSON` / `saveJSONLines` / `loadJSONLines` · the lossy-reload trap

## Documentation Scope

This page documents the `foundation-models-evaluations-ref` skill (in the `axiom-ai` suite), which your assistant draws on when you ask about measuring or testing a Foundation Models feature. This page is the API; two companion skills hold the rest:

- For the discipline of designing a dataset, calibrating a judge, and raising scores without fooling yourself, see [foundation-models-evaluations](/skills/integration/foundation-models-evaluations).
- When the suite itself misbehaves, with a metric reading `-1`, a crash after `loadJSON`, or a green run that measured nothing, see [foundation-models-evaluations-diag](/diagnostic/foundation-models-evaluations-diag).

## Related

- [foundation-models](/skills/integration/foundation-models) – Building the Foundation Models feature you evaluate
- [foundation-models-ref](/reference/foundation-models-ref) – Core Foundation Models API, including the `GenerationOptions` you pin for repeatable runs
- [foundation-models-adapters](/skills/integration/foundation-models-adapters) – The four-axis eval discipline for custom adapters; on the 27 releases, express those axes as metrics here

## Resources

**WWDC**: 2026-298, 2026-299, 2026-335, 2026-246

**Docs**: /evaluations, /evaluations/designing-effective-evaluations, /evaluations/evaluating-tool-calling-behavior, /evaluations/generating-synthetic-evaluation-datasets, /foundationmodels/generationoptions
