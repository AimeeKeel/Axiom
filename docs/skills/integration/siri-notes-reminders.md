---
name: siri-notes-reminders
description: Move a notes, list, or to-do app's Siri support from the deprecated SiriKit Lists and Notes intents to the Notes and Reminders schema domains
skill_type: skill
version: 1.0
apple_platforms: iOS 27+, macOS 27+, visionOS 27+ (Notes and Reminders schema domains, not watchOS or tvOS); iOS and watchOS (SiriKit Lists and Notes, deprecated, not macOS)
---

# Siri for Notes, Lists, and Reminders Apps

This skill helps your assistant move a note-taking, list, or to-do app's Siri support into iOS 27. The iOS 27 SDK deprecates SiriKit's Lists and Notes intents, such as `INAddTasksIntent` and `INCreateNoteIntent`, and tells you to adopt the Notes or Reminders schema domain instead. Those domains reach Siri AI, the new Siri built on Apple Intelligence. They don't exist on Apple Watch, and they don't match the old intents one for one. The skill covers what to adopt, what to keep, and how the old intents map to the new schemas.

Part of the **axiom-integration** suite (`skills/siri-notes-reminders.md`).

## When to Use

Use this skill when you're:
- Seeing deprecation warnings for `INAddTasksIntent`, `INSetTaskAttributeIntent`, `INSnoozeTasksIntent`, `INCreateNoteIntent`, or `INSearchForNotebookItemsIntent`
- Adding "create a reminder", "mark this as done", or "add to my note" to a notes, list, or task app
- Adopting a `.notes.*` or `.reminders.*` schema
- Deciding what to do about Apple Watch, or about users still on iOS 26

## Example Prompts

- "SiriKit Lists is deprecated in iOS 27. What do I replace `INAddTasksIntent` with?"
- "Can I delete my Intents extension now that I've adopted the Reminders schemas?"
- "How do I snooze a reminder with the new schemas?"
- "Why does my build say `Missing required parameter 'images'` for `createReminder`?"
- "Does Siri still work with my to-do app on Apple Watch in watchOS 27?"

## What This Skill Provides

- **What the SDK says** – Which SiriKit Lists and Notes classes the iOS 27 SDK deprecates, which were already deprecated in iOS 15 with no replacement, and that none of them exist on macOS or tvOS
- **What to keep** – Why the SiriKit Intents extension still matters for three groups (Apple Watch, iOS 26 users, and classic Siri, the Siri on devices without Apple Intelligence), what to test before removing any of it, and where App Shortcuts fit
- **A capability mapping** – Each SiriKit intent and its closest schema, field by field, including due dates, recurrence, location triggers and flags, and what has no counterpart: snoozing, note search, deleting a whole list, and creating a list with tasks in one step
- **Build order** – Schema entities first, then one intent at a time, gated for older deployment targets without breaking an Apple Watch or Apple TV build
- **Common build failures** – Required parameters your app may not support, file parameters that need content types, entities Siri can't look up, and required return values

## Related

- [app-schemas-ref](/reference/app-schemas-ref) – The exact required parameters, properties, enum cases, and return types for every Notes and Reminders schema this skill tells you to adopt
- [siri-audio](/skills/integration/siri-audio) – The same Siri AI and classic Siri split, worked through for audio apps
- [app-shortcuts-ref](/reference/app-shortcuts-ref) – App Shortcuts, the fixed-phrase Siri path that works on Apple Watch and in every Siri
- [app-intents-ref](/reference/app-intents-ref) – The App Intents framework the schemas build on
- [eventkit-contacts](/skills/integration/eventkit-contacts) – Reading and writing the system Reminders store, which is separate from your own app's reminders

## Resources

**WWDC**: 2026-240, 2026-343, 2026-344, 2026-295

**Docs**: /appintents/app-schema-domain-notes, /appintents/app-schema-domain-reminders, /appintents/app-schema-domains
