# /axiom:screenshot

Captures a screenshot of the booted iOS Simulator and hands it to your assistant to look at.

## What It Does

Takes a screenshot of the simulator that's running now, shows it to your assistant, and returns the file path. Because your assistant can read images, you can ask about what's on screen right away.

## Usage

```
/axiom:screenshot
```

## How It Works

1. Checks whether a simulator is booted, and boots one if none is
2. Saves the screenshot to a timestamped file: `/tmp/axiom-screenshot-<timestamp>.png`
3. Returns the file path
4. Your assistant reads the screenshot and describes what it sees

## Common Use Cases

Run `/axiom:screenshot`, then ask a follow-up question:

- **Debug a visual issue** – "Does the login button look centered?"
- **Verify a fix** – After making a change: "Is the text still clipped?"
- **Document the current state** – Your assistant describes the UI as it is now

## Example

```
You: /axiom:screenshot

Your assistant: Screenshot captured: /tmp/axiom-screenshot-2025-12-08-14-30-45.png

Looking at the screenshot, I can see the login screen with the email and password
fields. The "Sign In" button appears centered and properly sized. The logo at the
top is correctly positioned with adequate spacing.
```

## Prerequisites

- Xcode with the iOS Simulator installed
- No simulator running? The command boots one first.

## Physical Devices and Scriptable Recording

`/axiom:screenshot` captures the **simulator** with `simctl`. To capture a **physical device**, or to record video that stops on its own instead of waiting for Ctrl+C, use `devicectl device capture`. Its `-d <udid>` selector works for both a simulator and a device (Xcode 26.6 or later); `<udid>` is the device's identifier.

```bash
xcrun devicectl device capture screenshot   -d <udid> --destination shot.png    # .png required
xcrun devicectl device capture screen-record -d <udid> --destination clip.mp4 --duration 5
```

The Screen capture section of [device-control-ref](/reference/device-control-ref) covers codecs, mask policy, and the `simctl` and `axe` fallbacks.

## Related

- [/axiom:test-simulator](/commands/testing/test-simulator) – Full simulator testing: location, push notifications, permissions, and video
- [simulator-tester](/agents/simulator-tester) – The agent behind `/axiom:test-simulator`; ask your assistant to "test my app with location simulation" and it starts on its own
- [deep-link-debugging](/skills/debugging/deep-link-debugging) – Add debug-only deep links so you can open the exact screen to capture
