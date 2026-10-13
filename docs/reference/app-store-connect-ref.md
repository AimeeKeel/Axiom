---
name: app-store-connect-ref
description: Use when navigating App Store Connect to find crash data, read TestFlight feedback, interpret metrics dashboards, or export diagnostic logs
---

# App Store Connect Reference

A guide to finding crash reports, TestFlight feedback, and performance metrics in App Store Connect (ASC), and exporting them for analysis. It's for developers triaging crashes and regressions in TestFlight and App Store builds.

## When to Use This Reference

Use this reference when:
- Triaging crash reports in App Store Connect
- Reviewing TestFlight feedback from beta testers
- Monitoring performance metrics across app versions
- Exporting crash logs or metrics through the App Store Connect API
- Deciding between App Store Connect and Xcode Organizer for crash analysis

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I find crash reports in App Store Connect?"
- "Where do I see TestFlight feedback screenshots?"
- "How do I compare crash rates between app versions?"
- "Why don't I see crashes in App Store Connect?"
- "Why are my App Store Connect crash logs unsymbolicated?"
- "How do I export crash data from the App Store Connect API?"
- "What's the difference between ASC and Xcode Organizer for crash triage?"

## What's Covered

### Crashes
- Dashboard navigation and filters: platform, version, date range, compare, device, OS version
- Key metrics: crash-free users, crash count, crash rate, affected devices, crash signatures
- Crash signature detail: exception information, crashed thread, distribution
- Downloading crash logs (`.ips` and `.crash`)

### TestFlight Feedback
- Feedback entry contents: screenshot, comment, device, OS, battery, disk, network, locale
- Filtering by build, date, and screenshot
- The one-way limitation, and how to follow up with testers

### Metrics
- Hang rate, disk writes, launch time, memory, battery, scrolling
- Terminations that produce no crash report: memory limit (jetsam), background CPU limit, launch timeout, background task timeout
- Comparing versions

### Exporting Data
- Manual export
- App Store Connect API: `perfPowerMetrics`, `diagnosticSignatures`, `diagnosticLogs`, `betaTesters`, `betaFeedbackCrashSubmissions`, `betaFeedbackScreenshotSubmissions`
- asc-mcp tool equivalents for manual ASC actions
- Xcode Cloud crash data

### Best Practices and Common Questions
- Daily monitoring, crash triage priority (P0–P3), correlating crashes with releases
- Missing crashes, dSYM checks and manual symbolication with `atos`, ASC vs. Organizer

## Documentation Scope

This page documents the `app-store-connect-ref` skill (in the `axiom-shipping` suite), the guide your assistant uses to find crash and performance data in App Store Connect. To parse crash logs you've downloaded, use the [analyze-crash](/commands/debugging/analyze-crash) command.

## Related

- [testflight-triage](/skills/debugging/testflight-triage) – The same crashes and feedback through Xcode Organizer, which links stack frames to your code
- [asc-mcp](/skills/shipping/asc-mcp) – Reach this ASC data from your assistant through asc-mcp's MCP tools
- [metrickit-ref](/reference/metrickit-ref) – Per-device diagnostics, hang call stacks, and custom telemetry beyond ASC's aggregated dashboards
- [xctrace-ref](/reference/xctrace-ref) – Profile locally from the command line once Metrics shows a launch-time or hang regression

## Resources

**WWDC**: 2020-10076, 2020-10078, 2021-10203, 2021-10258

**Docs**: /app-store-connect/api, /xcode/diagnosing-issues-using-crash-reports-and-device-logs
