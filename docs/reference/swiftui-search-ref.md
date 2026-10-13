---
name: swiftui-search-ref
description: SwiftUI search API reference — searchable, suggestions, scopes, tokens, and programmatic focus from iOS 15 through iOS 18
skill_type: reference
---

# SwiftUI Search API Reference

A reference for SwiftUI's search APIs, from the `.searchable` modifier (iOS 15) through search tokens and programmatic focus control (iOS 18). It covers the foundation that the iOS 26 search refinements build on.

## When to Use This Reference

Use this reference when:
- Adding search to a SwiftUI list or collection
- Implementing filter-as-you-type or submit-based search
- Adding search suggestions with auto-completion
- Using search scopes to narrow results by category
- Using search tokens for structured queries
- Controlling search focus programmatically
- Debugging a search field that doesn't appear

## Example Prompts

Questions you can ask your assistant that will draw from this reference:

- "How do I add search to my SwiftUI list?"
- "Why isn't my search field showing up?"
- "How do I add search suggestions with auto-completion?"
- "What's the difference between filter-as-you-type and `onSubmit` search?"
- "How do I add search scopes like Mail's inbox/sent/all filter?"
- "How do I use search tokens in SwiftUI?"
- "How do I programmatically open the search field?"

## What's Covered

### The searchable Modifier
- `.searchable(text:placement:prompt:)`, and why a navigation container renders the field
- `SearchFieldPlacement` options
- Column association in `NavigationSplitView`

### Search Results
- `isSearching` and `dismissSearch` environment values
- The results-overlay pattern

### Suggestions and Submission
- The suggestions closure and `.searchCompletion(_:)` for auto-fill
- `onSubmit(of: .search)`, and when to filter vs submit

### Scopes (iOS 16+)
- `.searchScopes(_:_:)`
- `SearchScopeActivation`: `.automatic`, `.onTextEntry`, `.onSearchPresentation` (iOS 16.4+)

### Tokens (iOS 16+)
- `.searchable(text:tokens:token:)` and suggested tokens
- The `isPresented` parameter (iOS 17+)
- Combining tokens with text filtering

### Programmatic Control (iOS 18+)
- `.searchFocused(_:)` and `.searchFocused(_:equals:)`
- `searchFocused` vs `dismissSearch`

### Platform Behavior
- iOS (bottom-aligned from iOS 26), iPadOS, macOS, watchOS, tvOS
- `.searchPresentationToolbarBehavior(.avoidHidingContent)` (iOS 17.1+)

### Common Gotchas
- Search field doesn't appear
- `isSearching` always returns false
- Suggestions don't fill the search field
- Search placed on the wrong navigation level
- Search scopes don't appear

### API Quick Reference
- Every search modifier, environment value, and type, with the iOS version that introduced it

## Key Patterns

### Filter-as-you-type

```swift
NavigationStack {
    List(filteredRecipes) { recipe in
        RecipeRow(recipe: recipe)
    }
    .navigationTitle("Recipes")
    .searchable(text: $searchText, prompt: "Find a recipe")
}

var filteredRecipes: [Recipe] {
    if searchText.isEmpty { return recipes }
    return recipes.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
}
```

### Suggestions with auto-completion

```swift
.searchable(text: $searchText, prompt: "Search colors") {
    ForEach(suggestedColors) { color in
        Label(color.name, systemImage: "paintpalette")
            .searchCompletion(color.name)  // Required for auto-fill
    }
}
```

## Documentation Scope

This page documents the `search-ref` skill (in the `axiom-swiftui` suite), which covers the foundational search APIs from iOS 15 to iOS 18.

## Related

- [swiftui-26-ref](/reference/swiftui-26-ref) – The iOS 26 refinements that build on these APIs: bottom-aligned search, `.searchToolbarBehavior(.minimize)`, and `DefaultToolbarItem(kind: .search)`
- [swiftui-nav-ref](/reference/swiftui-nav-ref) – The navigation containers that render search fields, and the `Tab(role: .search)` search tab
- [swiftui-nav](/skills/ui-design/swiftui-nav) – Navigation anti-patterns, including where search belongs in the hierarchy
- [swiftui-nav-auditor](/agents/swiftui-nav-auditor) – Scans the navigation structure that search depends on

## Resources

**WWDC**: 2021-10176, 2022-10052

**Docs**: /swiftui/view/searchable(text:placement:prompt:), /swiftui/environmentvalues/issearching, /swiftui/view/searchscopes(_:activation:_:), /swiftui/view/searchfocused(_:), /swiftui/searchfieldplacement
