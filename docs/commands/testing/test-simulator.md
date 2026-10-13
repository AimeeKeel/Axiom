# /axiom:test-simulator

Launches the simulator-tester agent, which sets up test scenarios in the iOS Simulator and verifies the results visually.

## What It Does

The agent:

1. Checks simulator state and boots a simulator if needed
2. Sets up the test scenario: location, permissions, push notifications
3. Captures screenshots, video, and logs
4. Watches the logs for crashes and errors
5. Analyzes the results and reports a clear pass or fail

Along the way it can:

- **Capture screenshots** – Your assistant reads each one to check the fix
- **Record video** – For multi-step flows and animation issues
- **Simulate location** – Sets coordinates to test GPS-based features
- **Send push notifications** – Tests notification handling without a push server
- **Manage permissions** – Grants, revokes, or resets them without tapping through dialogs
- **Follow deep links** – Jumps straight to a specific screen
- **Override the status bar** – Clean screenshots for documentation or the App Store
- **Analyze logs** – Detects crashes and errors

The agent also handles UI automation, accessibility checks, and network conditioning; its page, linked under Related, lists everything.

## Usage

```
/axiom:test-simulator
```

Then describe what you want to test:

| You ask | The agent |
|---------|-----------|
| "Take a screenshot to verify the login button fix" | Boots a simulator if needed, navigates to the login screen if a deep link exists, captures a screenshot, and describes what it sees: "The login button appears centered…" |
| "Set location to San Francisco and test the map feature" | Sets the location to `37.7749, -122.4194`, grants location permission, launches the app, and checks that the map marker appears there |
| "Send a test push notification and screenshot the result" | Writes a test payload, sends it, waits for the notification, captures it, and checks the logs to confirm your app handled it |
| "Test the camera permission dialog" | Resets permissions, launches the app, captures the dialog, grants permission, and captures the granted state |

## Prefer Natural Language?

You don't need the command. Ask your assistant directly, and the simulator-tester agent starts on its own:

- "Can you take a screenshot of the app?"
- "Test my app with location simulation"
- "Check if the push notification handling works"
- "Navigate to Settings and take a screenshot"
- "Record a video of the app running"

## Prerequisites

- Xcode with the iOS Simulator installed
- Your app built for the simulator
- Optional: debug-only deep links, so the agent can navigate your app (see deep-link-debugging below)

## Related

- [simulator-tester](/agents/simulator-tester) – The agent this command launches, with its full capability list
- [/axiom:screenshot](/commands/testing/screenshot) – One quick screenshot, without a test scenario
- [/axiom:ui](/commands/testing/ui) – Guided `xcui` UI and accessibility testing on the simulator
- [deep-link-debugging](/skills/debugging/deep-link-debugging) – Add debug-only deep links so the agent can reach any screen
- [xcode-debugging](/skills/debugging/xcode-debugging) – Environment-first fixes when the simulator won't boot or the build is stale
- [swiftui-debugging](/skills/ui-design/swiftui-debugging) – Diagnose the SwiftUI view problems a screenshot reveals
