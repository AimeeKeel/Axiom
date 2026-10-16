# simulator-tester

Drives the iOS Simulator for you: it sets up a test scenario, captures screenshots, video, and logs, and reports whether your app behaved as expected. Your assistant reads the screenshots itself, so you can check a fix without clicking through the app.

## How to Use This Agent

**Natural language (automatic triggering):** Ask your assistant things like:
- "Can you test my app with location simulation?"
- "Take a screenshot to verify this fix"
- "Check if the push notification handling works"
- "Navigate to Settings and take a screenshot"
- "Record a video of the app running"
- "Test my app's permission dialogs"
- "Validate my VoiceOver announcements on the simulator"
- "Run my Dynamic Type checks on the simulator"

**Explicit command:**
```
/axiom:test-simulator
```

## What It Does

### Testing Capabilities
1. **Screenshot capture** – Visual verification and debugging
2. **Video recording** – Animation issues, multi-step flows, and crash reproduction
3. **Location simulation** – Sets coordinates to test GPS-based features
4. **Push notifications** – Sends a test payload to your app without a push server
5. **Permission management** – Grants, revokes, or resets privacy permissions such as location, photos, and camera
6. **Deep link navigation** – Opens a URL to jump straight to a screen
7. **App lifecycle** – Installs, launches, and terminates your app
8. **UI automation** – Taps by accessibility identifier, types, swipes, and presses hardware buttons through `xcui`, Axiom's bundled simulator UI tool, and AXe, the input engine it builds on
9. **Accessibility validation** – Switches Dynamic Type, Increase Contrast, Reduce Motion, Reduce Transparency, or VoiceOver, then asserts on the accessibility tree
10. **Status bar override** – Sets a clean status bar (9:41, full signal, full battery) for screenshots
11. **Device state via `devicectl`** – Simulates Face ID and Touch ID matches, which `simctl` can't, plus orientation changes and memory warnings
12. **Network conditioning** – Adds latency, caps bandwidth, or injects failures without `sudo`, in-process by default or through toxiproxy if it's installed
13. **Log and crash analysis** – Streams your app's logs, checks for new crash reports, and summarizes any it finds with `xcsym`

## How It Works

The simulator is the agent's way of checking its work, which closes the loop between making a fix and confirming it:

1. Checks simulator state, reuses a simulator saved in `.axiom/preferences.yaml` if there is one, and boots one if needed
2. Confirms AXe is installed with `xcui doctor`, and notes whether toxiproxy is available
3. Sets up the scenario: location, permissions, a deep link, network conditions
4. Launches the app, waits for the UI to settle, and performs the action
5. Captures evidence: screenshots, video, logs
6. Reports expected versus actual behavior with a clear pass or fail
7. Saves a new simulator choice to `.axiom/preferences.yaml` for next time

## Example Usage

### Screenshot Verification

You ask: "Take a screenshot to verify the login button fix". The agent:

1. Checks whether a simulator is booted, and boots one (such as iPhone 16 Pro) if not
2. Navigates to the login screen, if your app has a deep link for it
3. Waits for the UI to render
4. Captures a screenshot
5. Analyzes the image: "The login button appears centered and properly sized"

### Location Testing

You ask: "Test my app with location set to San Francisco". The agent:

1. Sets the location: `xcrun simctl location <UDID> set 37.7749 -122.4194`
2. Grants location permission: `xcrun simctl privacy <UDID> grant location-always <bundle-id>`
3. Launches the app
4. Takes a screenshot of the map view
5. Verifies that the location marker appears at San Francisco's coordinates

### Push Notification Testing

You ask: "Send a test push notification and screenshot the result". The agent:

1. Writes a test payload file
2. Sends the push: `xcrun simctl push <UDID> <bundle-id> payload.json`
3. Waits for the notification to appear
4. Captures a screenshot showing it
5. Checks the logs to confirm your app handled it

In these examples, `<bundle-id>` is your app's bundle identifier, such as `com.example.MyApp`. The agent asks for it if you haven't given it.

## Common Scenarios

| Scenario | Capabilities Used |
|----------|-------------------|
| Visual bug fix | Screenshot, navigation, and analysis |
| Location feature | Location simulation and permissions |
| Push handling | Push notification and log capture |
| Permission dialog | Permission management and screenshot |
| Crash reproduction | App lifecycle, log capture, and crash analysis |
| Accessibility check | Accessibility state toggles and tree assertions |
| Slow-network behavior | Network conditioning and screenshot |
| App Store screenshots | Status bar override and navigation |

## Requirements

- Xcode with the iOS Simulator installed
- Your app built for the simulator
- Optional: AXe for UI automation; `xcui doctor --install` installs it with Homebrew
- Optional: debug-only deep links, so the agent can jump to any screen (see deep-link-debugging below)

## Real-World Impact

A typical visual-fix loop:

- **Before** – Make the fix, rebuild, navigate five screens by hand, and check visually: about 3 minutes
- **After** – Make the fix, rebuild, and let the agent navigate, capture, and verify: about 1 minute

## Related

- [/axiom:screenshot](/commands/testing/screenshot) – One quick screenshot, without a test scenario
- [/axiom:ui](/commands/testing/ui) – Guided `xcui` UI and accessibility testing
- [xcui-ref](/reference/xcui-ref) – Full reference for the `xcui` commands this agent runs
- [device-control-ref](/reference/device-control-ref) – The `devicectl` and `simctl` catalog, including status bar overrides for screenshots
- [deep-link-debugging](/skills/debugging/deep-link-debugging) – Add debug-only deep links so the agent can navigate your app
- [ui-testing](/skills/ui-design/ui-testing) – The in-process network-conditioning harness and UI test patterns
- [accessibility-auditor](/agents/accessibility-auditor) – Scans your source for accessibility issues; this agent validates them live
- [test-runner](/agents/test-runner) – Runs your XCUITest suites and parses the results
- [build-fixer](/agents/build-fixer) – Fixes the build when the app won't compile for the simulator
- [screenshot-validator](/agents/screenshot-validator) – Checks captured App Store screenshots before submission
