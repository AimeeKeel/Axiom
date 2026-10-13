---
name: accessibility-diag
description: VoiceOver, Dynamic Type, color contrast, touch targets — systematic accessibility diagnosis for WCAG compliance and Accessibility Nutrition Labels
---

# Accessibility Diagnostics

Systematic diagnosis and repair for the accessibility issues users hit most often, from missing VoiceOver labels to text that doesn't scale. It also covers custom controls, long-form reading, video captions, resizable windows, and Assistive Access.

## Symptoms This Diagnoses

Use when you're experiencing:
- Complaints from VoiceOver users, or features you can't yet declare in your Accessibility Nutrition Labels
- VoiceOver reads "Button" or a symbol name instead of what a control does, or moves through the screen in the wrong order
- Text that doesn't grow with Dynamic Type, or that clips or truncates at large sizes
- Text that is hard to read against its background in light or dark mode, or status shown by color alone
- Touch targets smaller than 44×44 points, or crowded too close together
- Custom controls, such as sliders or drag surfaces, that VoiceOver, Switch Control, or Voice Control users can't operate
- New content that VoiceOver announces but can't reach, or announcements that stutter during a drag
- Features that need touch and can't be reached with a keyboard, Full Keyboard Access, or Switch Control
- Animations that ignore Reduce Motion
- An app missing from Assistive Access, or showing its full interface there
- VoiceOver or Speak Screen stopping at every paragraph or page in a reading app
- Generated subtitles that never appear in your video player, or no way to restyle captions
- Reading order, table navigation, or toolbar labels that break when a window resizes
- Custom controls that ignore Button Shapes, or custom tab bars and toolbars without the Large Content Viewer
- Text that doesn't scale on Apple TV, now that tvOS 27 adds Large Text

## Example Prompts

- "Can we claim VoiceOver support in our Accessibility Nutrition Labels? What has to work first?"
- "How do I test my app with VoiceOver before I submit it?"
- "My layout breaks at the largest Dynamic Type size. How do I make it adapt?"
- "What contrast ratio do I need to pass WCAG AA?"
- "How do I make my custom slider work with VoiceOver?"
- "How do I add generated subtitles and subtitle styling to my video player?"
- "What goes in the Accessibility Nutrition Labels, and how do I declare them?"

## Diagnostic Workflow

Your assistant guides you through three steps.

### Step 1: Fix the Critical Issues

The skill rates seven core issues by severity, with missing VoiceOver labels the most severe:
- **VoiceOver labels and hints** – descriptive labels, hints only where the action isn't obvious, and hidden decorative images (WCAG 4.1.2)
- **Dynamic Type** – semantic text styles, `Font.custom(_:size:relativeTo:)` or `@ScaledMetric` for custom sizes, and layouts that reflow instead of clipping (WCAG 1.4.4)
- **Color contrast** – 4.5:1 for normal text and 3:1 for large text at Level AA, 7:1 at Level AAA, measured rather than judged by eye, and status that doesn't rely on color alone (WCAG 1.4.3 and 1.4.6)
- **Touch targets** – hit regions of at least 44×44 points, as Apple's guidelines and WCAG 2.5.5 ask, with room between targets
- **Keyboard navigation** – focus support and keyboard shortcuts on iPadOS and macOS (WCAG 2.1.1)
- **Reduce Motion** – simpler animation, or none, when the setting is on (WCAG 2.3.3)
- **Common violations** – unlabeled images, custom buttons without the button trait, custom controls VoiceOver can't adjust, and state changes VoiceOver never announces

### Step 2: Cover the Areas Your App Uses

- **Custom controls** – choosing among adjustable actions, passthrough gestures, direct touch, and custom actions, with custom actions as the fallback for Switch Control and Voice Control
- **Announcements** – when to post `.announcement`, `.layoutChanged`, or `.screenChanged`, how to throttle announcements during a drag, and how to set priority for a message that must not be interrupted
- **Assistive Access** – the Info.plist opt-in (iOS 17+), runtime detection (iOS 18+), and a dedicated `AssistiveAccess` scene (iOS 26+)
- **Continuous reading** – linking text elements so VoiceOver keeps going across paragraphs, automatic page turns for read-all, and `UITextInput` for custom-rendered text
- **Captions and subtitles** – a subtitle-selection UI so generated subtitles (new in the 27 releases) reach users, and live subtitle style preview (iOS 26.4+)
- **Resizable windows** – reading order after layout changes, table and grid navigation, labels for items in the toolbar overflow menu, Button Shapes, the Large Content Viewer, and testing with Full Keyboard Access and Switch Control
- **tvOS Large Text** – tvOS 27 brings system-wide text scaling to Apple TV, including shelf layouts that show fewer items at accessibility sizes

### Step 3: Verify with Tools

- **Accessibility Inspector** – inspect each element's label, value, traits, and hierarchy, then run an audit for contrast, hit region, clipped text, element description, and trait issues
- **VoiceOver checklist** – navigation, interaction, and content checks with VoiceOver on, which needs a physical device because VoiceOver isn't available in Simulator
- **System settings** – Larger Text, Increase Contrast, and Reduce Motion, checked in both light and dark mode
- **Digital Color Meter** – sample exact colors when adjusting brand colors to meet a contrast ratio

## Documentation Scope

This page documents the `accessibility-diag` skill (in the `axiom-accessibility` suite), which your assistant loads when you fix accessibility issues or prepare your Accessibility Nutrition Labels. To scan your code for these issues, run `/axiom:audit accessibility`, which launches the accessibility-auditor agent; to check computed VoiceOver announcements (derived from the accessibility tree) and Dynamic Type in a running app, use the simulator-tester agent. The skill file also explains Accessibility Nutrition Labels (what each claim requires, and why no App Store guideline requires accessibility) and summarizes WCAG levels A, AA, and AAA. When a design request would remove labels, lock font sizes, lower contrast, or shrink touch targets, it suggests how to respond: show the stakes, demonstrate the problem, offer an alternative that keeps the look, and record the decision.

## Related

- [accessibility-auditor](/agents/accessibility-auditor) – Scans your code for missing labels, fixed font sizes, contrast failures, and small touch targets
- [audit-accessibility](/commands/accessibility/audit-accessibility) – The command that runs the accessibility auditor
- [simulator-tester](/agents/simulator-tester) – Checks the VoiceOver announcements computed from the accessibility tree, and Dynamic Type, in a running Simulator
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) – The success criteria the skill cites
- [Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) – Apple's accessibility design guidance, including minimum target sizes

## Resources

**WWDC**: 2026-219, 2026-220, 2026-221, 2026-256
