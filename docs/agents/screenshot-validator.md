# screenshot-validator

Visually inspects your App Store screenshots, one at a time, and reports content, dimension, and quality problems that could get your submission rejected.

## How to Use This Agent

**Natural language (automatic triggering):** Ask your assistant things like:
- "Can you check my App Store screenshots for issues?"
- "Validate my screenshots before I submit to the App Store"
- "Are my screenshots the right dimensions?"
- "Check my marketing screenshots for problems"
- "Review screenshots in ~/Desktop/AppScreenshots"

**Explicit command:**
```
/axiom:audit screenshots
```

## What It Does

### Visual Content Analysis
1. **Dimension validation** – Checks every screenshot's pixel size against the App Store device sizes below; App Store Connect accepts only exact matches
2. **Placeholder detection** – Finds "Lorem ipsum", "TODO", "Sample", "John Doe", sample phone numbers, and example email addresses
3. **Debug artifact scanning** – Catches "STAGING" and "DEBUG" banners, FPS overlays, console output, and Xcode debug bars
4. **Competitor and platform check** – Flags other apps' names, brand logos, and trademarked terms (Guidelines 2.3.7 and 5.2.1), and imagery of other mobile platforms (Guideline 2.3.10)
5. **Status bar and pricing check** – Flags a missing status bar, a "Carrier" placeholder, and region-specific prices such as "Only $0.99!", which Guideline 2.3.7 keeps out of screenshots
6. **UI completeness** – Detects loading spinners, permission dialogs, broken images, truncated text, and empty states that look like errors
7. **Consistency review** – Checks for mixed light and dark themes, mismatched device frames, a device in the wrong frame, and mixed orientations within one device set

### Device Coverage Tracking

The agent matches each screenshot against the sizes App Store Connect accepts (portrait shown; landscape swaps the numbers) and reports which display sizes have no screenshots:

| Display | Portrait sizes (pixels) |
|---------|-------------------------|
| iPhone 6.9-inch | 1260 × 2736, 1290 × 2796, 1320 × 2868 |
| iPhone 6.5-inch | 1284 × 2778, 1242 × 2688 |
| iPhone 6.3-inch | 1179 × 2556, 1206 × 2622 |
| iPhone 6.1-inch | 1170 × 2532, 1125 × 2436, 1080 × 2340 |
| iPhone 5.5-inch | 1242 × 2208 |
| iPhone 4.7-inch | 750 × 1334 |
| iPhone Duo inner display | 2007 × 2853 |
| iPhone Duo outer display | 1398 × 2034 |
| iPad 13-inch | 2064 × 2752, 2048 × 2732 |
| iPad 11-inch | 1488 × 2266, 1668 × 2420, 1668 × 2388, 1640 × 2360 |
| iPad 10.5-inch | 1668 × 2224 |

Apple's screenshot specifications disagree with themselves about which iPhone size is required. The "Required device sizes" list asks for the 6.3-inch class (iPhone with Dynamic Island, medium display) and, for an app that runs on iPad, the 13-inch class, while the per-size notes still treat 6.9 inches (or 6.5) as the required iPhone set. The agent reports a missing class as something to verify in App Store Connect rather than a certain rejection. Starting in April 2027, Apple will also require iPhone Duo screenshots for apps using the iOS 27.1 SDK or later.

## How It Works

The agent uses your assistant's ability to read images, so it judges each screenshot by what's on screen, not by its file name.

1. Asks for the screenshot folder if you didn't name one
2. Finds every PNG and JPEG in the folder; if there are more than 20, it checks the first 20 and offers to focus on one device size or locale
3. Reads each file's pixel dimensions with macOS's `sips` tool
4. Inspects each screenshot visually
5. Writes a report that rates each issue CRITICAL, HIGH, or MEDIUM and summarizes device coverage

It doesn't flag the "9:41" status bar time, marketing text overlays, intentional blur or redaction, stylized device frames and backgrounds, or realistic demo content.

## Common Scenarios

| Scenario | What It Catches |
|----------|-----------------|
| Pre-submission review | Placeholder text, wrong dimensions, debug artifacts |
| Rejection follow-up | Screenshots likely to have caused a Guideline 2.3 rejection |
| One locale's screenshots | Placeholder text, debug artifacts, and inconsistencies within that locale's set |
| Device size audit | Missing device sizes and dimension mismatches |

## Requirements

- Screenshots saved as PNG or JPEG files in a local folder
- No App Store Connect access; the agent works entirely on local files

## Related

- [app-store-submission](/skills/shipping/app-store-submission) – The pre-submission checklist that covers screenshots along with the rest of your submission
- [app-store-ref](/reference/app-store-ref) – Screenshot specifications, metadata fields, and App Review Guideline details
- [audit-screenshots](/commands/shipping/audit-screenshots) – The command page for `/axiom:audit screenshots`
- [simulator-tester](/agents/simulator-tester) – Captures screenshots from the iOS Simulator for you to validate
- [security-privacy-scanner](/agents/security-privacy-scanner) – Code-level security and privacy checks for the same submission
