---
name: axiom-ui
description: "Drive simulator UI with Axiom xcui or compatible AXe input verbs"
---

# Drive and Validate Simulator UI

`xcui` is Axiom's own tool, distributed separately from the Cursor plugin; it has no Axiom MCP wrapper. Before UI automation, check `command -v xcui`. If absent, use a stable Axiom repository checkout and locate `<axiom-checkout>/.claude-plugin/plugins/axiom/tools/xcui`, where `<axiom-checkout>` is that checkout's absolute root. Before using either discovered executable, verify it is executable and run `--help`; substitute that verified absolute path for every `xcui` command, then run `doctor`. Do not use the cached `axiom-cursor/` plugin directory as the checkout root.

1. Resolve and verify `xcui` as above before any UI automation.
2. If `xcui` is absent, AXe may be used only for compatible pass-through verbs: `tap`, `slider`, `type`, `swipe`, `drag`, `touch`, `gesture`, `button`, `key`, `key-sequence`, `key-combo`, and `screenshot`. Check `command -v axe` before using one of those verbs, use that verb's documented AXe arguments, add `--tap-style physical` to every `axe tap`, and handle `DEVELOPER_DIR` explicitly if AXe reports a SimulatorKit loading error; wrapper-only device auto-resolution is unavailable.
3. The `wait`, `assert`, `a11y`, `dialog`, `voiceover`, and `resize` capabilities require `xcui`. If `xcui` is unavailable for one of these capabilities, stop that UI step and report that Axiom’s `xcui` is required; do not substitute AXe or timing guesses.
4. If neither tool is available, stop UI automation and give the user setup guidance for an Axiom checkout or AXe installation. Do not claim the Cursor plugin installed either tool.
5. When UI automation is unavailable, continue with non-UI simulator and log checks that still answer the request, and label that result as degraded coverage.
6. Treat simulator erase, delete, shutdown, and boot operations as state-changing actions and preserve the user's authorization boundary.
