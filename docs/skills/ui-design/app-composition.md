---
name: app-composition
description: App-level composition patterns for @main, authentication flows, scene lifecycle, and document-based apps
skill_type: discipline
version: 1.0
apple_platforms: iOS 26+
---

# App Composition

Patterns for structuring an app at the top level: the `@main` entry point, app-wide states such as loading and signed in, switching the root view between them, scene lifecycle, multiple windows, and document-based apps.

## When to Use

Use this skill when you're:
- Structuring your `@main` entry point and root view
- Managing authentication state (login → onboarding → main)
- Switching between app-level states without flicker
- Handling scene lifecycle events (`scenePhase`)
- Restoring app state after the system terminates your app
- Deciding when to split your app into feature modules
- Coordinating multiple windows on iPad or visionOS
- Building a document-based app with the `@Observable` document model (iOS 27)

**Core principle:** Apps have discrete states. Model them with an enum, not scattered booleans.

## Example Prompts

Questions you can ask your assistant that will draw from this skill:

- "How do I switch between login and main screens?"
- "My app flickers when switching from splash to main."
- "Where should auth state live?"
- "How do I handle my app going to the background?"
- "How do I restore state after my app is killed?"
- "When should I split my app into modules?"
- "How do I build a document-based app with the new `@Observable` document model?" (iOS 27)
- "How do I show a New Window button only when the device supports multiple windows?"

## What This Skill Provides

### App-Level State Machines
- The `AppState` enum pattern (loading, unauthenticated, onboarding, authenticated, error) in place of "boolean soup" such as `isLoading`, `isLoggedIn`, and `hasError`
- Validated transitions in a central `AppStateController`, testable without UI
- The state-as-bridge pattern: synchronous state changes drive the UI, and async work lives in the model

### Root View Switching
- A thin `@main` that hands off to a root view
- Animated transitions and a minimum loading duration that prevent flicker on launch
- Coordinator integration at the root

### Scene Lifecycle and Windows
- `scenePhase` handling, and why the value differs when read from a view or from the app
- Session validation on activation and resource cleanup in the background
- `SceneStorage` state restoration, with validation of restored state
- Multi-window coordination on iPad and visionOS, including when to show a New Window button

### Document-Based Apps (iOS 27)
- An `@Observable` document class (`ReadableDocument`, `WritableDocument`) with async reading and writing and progress reporting
- The new `DocumentGroup` initializers for viewers and editors, and when to keep `FileDocument`

### Modularization
- A decision tree for when to split
- Module boundaries, dependency injection, and navigation between modules

### Migration and Review
- Incremental SwiftUI adoption in a UIKit app (`UIHostingController`, `UIViewControllerRepresentable`, an `AppDelegate` alongside `@main`)
- Anti-patterns, pressure scenarios, and a code review checklist

## Key Patterns

### AppState Enum Pattern

```swift
// ❌ Boolean soup — impossible to validate
class AppState {
    var isLoading = true
    var isLoggedIn = false
    var hasCompletedOnboarding = false
    var hasError = false
}
// What if isLoading && isLoggedIn && hasError are all true?

// ✅ Explicit states — compiler prevents invalid combinations
enum AppState: Equatable {
    case loading
    case unauthenticated
    case onboarding(OnboardingStep)
    case authenticated(User)
    case error(AppError)
}

@Observable
@MainActor
class AppStateController {
    private(set) var state: AppState = .loading

    func transition(to newState: AppState) {
        // isValidTransition(from:to:) lists every legal transition
        guard isValidTransition(from: state, to: newState) else {
            assertionFailure("Invalid transition: \(state) → \(newState)")
            return
        }
        state = newState
    }
}
```

### Thin @main and Root View

```swift
@main
struct MyApp: App {
    @State private var appState = AppStateController()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .task { await appState.initialize() }
        }
    }
}

struct RootView: View {
    @Environment(AppStateController.self) private var appState

    var body: some View {
        ZStack {
            switch appState.state {
            case .loading:
                LaunchView().transition(.opacity)
            case .unauthenticated:
                AuthenticationFlow().transition(.opacity)
            case .onboarding(let step):
                OnboardingFlow(step: step).transition(.opacity)
            case .authenticated(let user):
                MainTabView(user: user).transition(.opacity)
            case .error(let error):
                ErrorRecoveryView(error: error).transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.state)
    }
}
```

### Scene Lifecycle

Read at the app level, `scenePhase` is an aggregate: `.active` means any scene is active, and `.background` means every scene is in the background.

```swift
@main
struct MyApp: App {
    @State private var appState = AppStateController()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
        }
        .onChange(of: scenePhase) { _, newPhase in
            switch newPhase {
            case .active:
                Task { await appState.validateSession() }
            case .inactive:
                appState.prepareForBackground()
            case .background:
                appState.releaseResources()
            @unknown default:
                break
            }
        }
    }
}
```

## Documentation Scope

This page documents the `app-composition` skill (in the `axiom-design` suite), which your assistant draws on when you structure `@main`, manage authentication flows, or handle scene lifecycle.

- For UIKit scene delegates and the iOS 27 scene-lifecycle requirement, see [uikit-modernization](/skills/ui-design/uikit-modernization)
- For the Mac document-app shell (File menu, document tabs, and restoration), see [windows](/skills/macos/windows)

## Related

- [swiftui-architecture](/skills/ui-design/swiftui-architecture) – Feature-level architecture (MVVM, TCA, coordinators) beneath the app level
- [swiftui-nav](/skills/ui-design/swiftui-nav) – Navigation inside each app state, including deep links and state restoration
- [swift-concurrency](/skills/concurrency/swift-concurrency) – Async patterns behind session validation and loading
- [swift-testing](/skills/testing/swift-testing) – Moving app logic into a Swift package so `swift test` runs it without a simulator
- [iphone-duo](/skills/ui-design/iphone-duo) – Why the outer display can't open windows, and how to gate the New Window button

## Resources

**WWDC**: 2022-10054, 2023-10149, 2024-10150, 2025-256, 2025-266

**Docs**: /swiftui/scenephase, /swiftui/scene, /swiftui/scenestorage, /swiftui/windowgroup, /observation/observable(), /swiftui/documentgroup, /swiftui/readabledocument, /swiftui/writabledocument
