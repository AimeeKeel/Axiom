---
name: deep-link-debugging
description: Debug-only deep links for automated testing and simulator verification
skill_type: discipline
version: 1.0.0
---

# Deep Link Debugging

Debug-only deep links for automated testing and checking your work in the simulator. They let you or your assistant jump straight to a screen, in a chosen state, without building production deep linking.

## When to Use

Use this skill when you're:
- Adding debug-only deep links for simulator testing
- Enabling automated navigation to specific screens for screenshots or tests
- Working with the simulator-tester agent or the `/axiom:screenshot` command
- Testing navigation flows without tapping through them by hand
- Navigating programmatically without a production deep link implementation

**Not for** production deep linking (use [swiftui-nav](/skills/ui-design/swiftui-nav) instead), universal links, App Clips, or complex routing architectures.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I add a debug-only deep link to navigate to settings?"
- "I want to test a specific screen without manually tapping through the app."
- "How do I navigate programmatically from the simulator command line?"
- "I need to verify a fix with screenshots but don't want to tap through navigation."
- "Why does `simctl openurl` succeed but my app never navigates?"

## What This Skill Provides

### Debug URL Scheme Setup
- A SwiftUI `.onOpenURL` handler wrapped in `#if DEBUG`
- URL parsing, routing, and parameter validation
- `NavigationPath` integration (iOS 16+), plus approaches for coordinator and custom routing
- State configuration links that set up error, empty, or premium states
- Registering the scheme in Info.plist and stripping it from Release builds

### Simulator Integration
- `xcrun simctl openurl` commands with query parameters
- First-run approval: the first `openurl` for a scheme shows an `Open in "<YourApp>"?` alert and delivers nothing until it's accepted, and how to pre-approve the scheme
- Screenshot capture with `/axiom:screenshot` and the simulator-tester agent

### Time Savings
- Without debug links: 2–3 minutes per test iteration
- With debug links: about 45 seconds per iteration (60–75% faster)

## Key Pattern

### Add a Debug URL Scheme (SwiftUI)

```swift
import SwiftUI

struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                #if DEBUG
                .onOpenURL { url in
                    handleDebugURL(url)
                }
                #endif
        }
    }

    #if DEBUG
    private func handleDebugURL(_ url: URL) {
        guard url.scheme == "debug" else { return }

        switch url.host {
        case "settings":
            NotificationCenter.default.post(name: .navigateToSettings, object: nil)

        case "profile":
            let userID = url.queryItems?["id"] ?? "current"
            NotificationCenter.default.post(name: .navigateToProfile, object: userID)

        default:
            print("⚠️ Unknown debug URL: \(url)")
        }
    }
    #endif
}

#if DEBUG
extension Notification.Name {
    static let navigateToSettings = Notification.Name("navigateToSettings")
    static let navigateToProfile = Notification.Name("navigateToProfile")
}

extension URL {
    var queryItems: [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: false),
              let items = components.queryItems else {
            return nil
        }
        return Dictionary(
            items.map { ($0.name, $0.value ?? "") },
            uniquingKeysWith: { _, last in last }
        )
    }
}
#endif
```

### Navigate from the Simulator

```bash
# Navigate to settings
xcrun simctl openurl booted "debug://settings"

# Navigate to a profile with a parameter
xcrun simctl openurl booted "debug://profile?id=12345"
```

The first time you open a `debug://` URL on a simulator, an alert asks to open it in your app. `openurl` still exits 0 while the alert is up, so tap **Open** once by hand, or ask your assistant to pre-approve the scheme.

### Add the URL Scheme to Info.plist

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>debug</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.example.debug</string>
    </dict>
</array>
```

Remove the scheme from Release builds with a Run Script build phase, or use a separate Info.plist for the Debug configuration.

## Documentation Scope

This page documents the `deep-link-debugging` skill in the `axiom-swift` suite. Your assistant uses its debug-only deep link patterns for automated testing and simulator verification.

## Related

- [swiftui-nav](/skills/ui-design/swiftui-nav) – Production navigation and deep linking
- [ui-testing](/skills/ui-design/ui-testing) – UI testing patterns that can start from a deep-linked screen
- [simulator-tester](/agents/simulator-tester) – The agent that navigates with your debug links and checks the result
- [/axiom:screenshot](/commands/testing/screenshot) – Captures the simulator screen after a deep link lands
- [xcode-debugging](/skills/debugging/xcode-debugging) – Environment checks when the simulator or build misbehaves

## Resources

**WWDC**: 2022-10054 (The SwiftUI cookbook for navigation)

**Docs**: /swiftui/view/onopenurl(perform:)
