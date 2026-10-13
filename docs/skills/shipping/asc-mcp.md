# App Store Connect MCP

Teaches your assistant to use [asc-mcp](https://github.com/zelentsov-dev/asc-mcp), an open-source MCP (Model Context Protocol) server that exposes the App Store Connect API as 502 tools. Submit builds, distribute to TestFlight, read tester feedback, run Xcode Cloud builds, manage subscriptions, and respond to reviews without leaving your coding assistant.

## When to Use

Use this skill when:
- Setting up asc-mcp for the first time, or updating an older installation
- Submitting a version for App Review and managing its release or phased rollout
- Distributing builds to TestFlight groups
- Reading TestFlight crash reports and screenshot feedback from testers
- Starting Xcode Cloud builds and checking their issues and test results
- Submitting in-app purchases and subscriptions for review
- Responding to App Store reviews without opening App Store Connect
- Managing several App Store Connect accounts
- Choosing which `--workers` preset to load

## Example Prompts

- "How do I set up asc-mcp with Claude Code?"
- "Submit build 42 to the App Store."
- "Distribute this build to my beta testers."
- "Show me the TestFlight crash reports and tester comments for the latest build."
- "Start an Xcode Cloud build of the main workflow and tell me whether the tests pass."
- "Submit my new monthly subscription for review."
- "Respond to all 1-star reviews from this week."
- "Switch to my client's App Store Connect account."
- "Which workers should I load for TestFlight distribution?"

## What This Skill Provides

- **Setup guide** – install with Mint, create an App Store Connect team API key, store credentials in `companies.json`, and register the server with Claude Code (`claude mcp add`)
- **Setup verification** – `company_current` confirms which account configuration loaded; it doesn't contact Apple, so a follow-up `apps_list` call proves the key works
- **Worker filtering** – asc-mcp groups its tools into 35 workers. The `company` and `auth` workers always load, and enabling `builds` also loads the build-processing and TestFlight build workers. Presets range from 63 tools for TestFlight through 72 for Release, 78 for Xcode Cloud, and 184 for Monetization (193 with review submission), up to all 502 for Full, the default.
- **Seven workflows** – release pipeline with phased rollout, TestFlight distribution, review management, TestFlight feedback and crash triage, Xcode Cloud builds, in-app purchase and subscription review, and multiple accounts
- **Multi-company configuration** – one `companies.json` entry per team or numbered `ASC_COMPANY_N_*` environment variables, the order asc-mcp checks them in, and switching accounts with `company_switch`
- **Safety rules** – the confirmation parameters that irreversible actions require, `--read-only` mode, and why a failed write must be inspected before it's retried
- **API constraints and gotchas** – no emoji in metadata, editable version states, automatic token refresh, rate limits, exact-match app search, and performance metrics that cover App Store builds only
- **Fallback guidance** – manual workflows for when asc-mcp isn't configured

## Requirements

- **macOS 15.6 or later** recommended; asc-mcp declares macOS 14 as its minimum, but its CI doesn't test 14.0–15.5
- **Xcode 26 or a Swift 6.2+ toolchain**, because Mint builds asc-mcp from source
- **App Store Connect team API key** with the least-privileged role that covers your workflow; App Manager or Admin only for operations that need it
- **Mint** (`brew install mint`)
- **asc-mcp 4.1.6** (`mint install zelentsov-dev/asc-mcp@v4.1.6`)

## Documentation Scope

This page documents the `asc-mcp` skill (in the `axiom-shipping` suite). Its setup steps use Claude Code's `claude mcp add`; other MCP-capable assistants run the same server through their own MCP configuration. The skill covers the workflows and gotchas rather than every tool; the full tool catalog is in the [asc-mcp README](https://github.com/zelentsov-dev/asc-mcp#available-tools).

## Related

- [App Store Submission](/skills/shipping/app-store-submission) – the pre-flight checklist for preparing a submission; asc-mcp carries it out programmatically
- [App Store Connect Reference](/reference/app-store-connect-ref) – navigating App Store Connect by hand for crash data and metrics, for when asc-mcp isn't configured
- [TestFlight Crash Triage](/skills/debugging/testflight-triage) – Xcode Organizer crash investigation; asc-mcp adds programmatic access to TestFlight crash reports and tester feedback
- [analyze-crash](/commands/debugging/analyze-crash) – parses and categorizes the crash logs asc-mcp downloads from TestFlight
- [Xcode MCP Integration](/skills/xcode-mcp/) – the same pattern for Xcode's built-in MCP tools
