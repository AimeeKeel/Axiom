"""Offline tests for posttool-bash-hints hook.

Run with:
    python3 -m unittest hooks/posttool-bash-hints_test.py

Each test feeds a JSON payload on stdin AND a CLAUDE_TOOL_OUTPUT env var
(the actual command output) and inspects the hook's stdout. The hook
never exits non-zero, so we assert on stdout shape + content.
"""

from __future__ import annotations

import json
import os
import subprocess
import unittest

HOOK = os.path.join(os.path.dirname(__file__), "posttool-bash-hints.py")


def run_hook(
    payload: dict, output: str = "", env_override: dict | None = None
) -> tuple[str, int]:
    """Invoke the hook with the given stdin payload + tool output env var."""
    env = dict(os.environ, AXIOM_SESSION_CONTEXT="always", AXIOM_HARNESS="claude")
    env["CLAUDE_TOOL_OUTPUT"] = output
    if env_override:
        env.update(env_override)
    result = subprocess.run(
        ["python3", HOOK],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=5,
        env=env,
    )
    return result.stdout, result.returncode


def bash_payload(command: str = "swift build", duration_ms: int | None = None) -> dict:
    """Canonical PostToolUse/Bash payload. duration_ms optional (per CC schema)."""
    payload: dict = {
        "session_id": "test-session",
        "tool_name": "Bash",
        "tool_input": {"command": command},
        "tool_response": {},
    }
    if duration_ms is not None:
        payload["duration_ms"] = duration_ms
    return payload


class TestMixedChainDurationHints(unittest.TestCase):
    def test_mixed_chains_preserve_duration_hints(self):
        for command in ("git stash && xcodebuild build", "cat Package.swift && xcodebuild build",
                        "bash -lc 'cat Package.swift && xcodebuild build'",
                        "xcodebuild build <>/dev/null"):
            with self.subTest(command=command):
                out, code = run_hook(bash_payload(command, duration_ms=70_000), "error: build failed")
                self.assertEqual(code, 0)
                self.assertIn("Long xcodebuild (70s)", out)

    def test_literal_tests_preserve_duration_with_expansion_arguments_or_later_groups(self):
        for command in ('xcodebuild -scheme App -derivedDataPath "$(mktemp -d)" test',
                        'xcodebuild test; echo "$(date)"'):
            with self.subTest(command=command):
                out, code = run_hook(bash_payload(command, duration_ms=310_000), "error: build failed")
                self.assertEqual(code, 0)
                self.assertIn("Slow test run (310s)", out)

    def test_mixed_chain_preserves_slow_tests(self):
        out, code = run_hook(bash_payload("cat Package.swift && xcodebuild test <>/dev/null", duration_ms=310_000))
        self.assertEqual(code, 0)
        self.assertIn("Slow test run (310s)", out)


class TestSilentNoOps(unittest.TestCase):
    def test_non_bash_tool_emits_nothing(self):
        # Even with matching output, a non-Bash tool shouldn't trigger.
        payload = {
            "session_id": "test",
            "tool_name": "Edit",
            "tool_input": {"file_path": "/tmp/x.swift"},
            "tool_response": {},
        }
        out, code = run_hook(payload, output="data race detected")
        self.assertEqual(code, 0)
        self.assertEqual(out, "")

    def test_error_output_alone_emits_nothing(self):
        # Output is never scanned for error words; only build duration and truncation hint.
        for output in ("hello world\n", "A.swift:3:5: error: data race detected\nld: linker command failed"):
            with self.subTest(output=output):
                self.assertEqual(run_hook(bash_payload(), output=output), ("", 0))

    def test_empty_output_emits_nothing(self):
        out, code = run_hook(bash_payload(), output="")
        self.assertEqual(code, 0)
        self.assertEqual(out, "")

    def test_missing_env_var_emits_nothing(self):
        # If CLAUDE_TOOL_OUTPUT is unset entirely (not just empty), the
        # hook should treat output as empty and emit nothing.
        result = subprocess.run(
            ["python3", HOOK],
            input=json.dumps(bash_payload()),
            capture_output=True,
            text=True,
            timeout=5,
            # Strip the var from env entirely
            env={k: v for k, v in os.environ.items() if k != "CLAUDE_TOOL_OUTPUT"},
        )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_malformed_json_is_silent(self):
        result = subprocess.run(
            ["python3", HOOK],
            input="not json",
            capture_output=True,
            text=True,
            timeout=5,
        )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_missing_tool_name_emits_nothing(self):
        payload = {"session_id": "test", "tool_input": {}}
        out, code = run_hook(payload, output="data race detected")
        self.assertEqual(code, 0)
        self.assertEqual(out, "")


class TestSlowXcodebuildHint(unittest.TestCase):
    """Long xcodebuild + failure output → zombie-process hint."""

    def test_slow_failed_xcodebuild_emits_hint(self):
        out, _ = run_hook(
            bash_payload("xcodebuild -scheme MyApp build", duration_ms=70_000),
            output="error: linker command failed with exit code 1\n** BUILD FAILED **",
        )
        self.assertIn("Long xcodebuild", out)
        self.assertIn("active processes", out)
        self.assertIn("/axiom:fix-build", out)
        # Duration formatted as seconds.
        self.assertIn("70s", out)

    def test_slow_failed_xcodebuild_with_env_prefix(self):
        out, _ = run_hook(
            bash_payload(
                "env DEVELOPER_DIR=/foo xcodebuild build", duration_ms=120_000
            ),
            output="error: something\n** BUILD FAILED **",
        )
        self.assertIn("Long xcodebuild", out)

    def test_slow_failed_xcodebuild_with_absolute_path(self):
        out, _ = run_hook(
            bash_payload(
                "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild build",
                duration_ms=70_000,
            ),
            output="** BUILD FAILED **",
        )
        self.assertIn("Long xcodebuild", out)

    def test_slow_xcodebuild_with_clean_output_no_hint(self):
        # Slow but successful builds are normal — no hint.
        out, _ = run_hook(
            bash_payload("xcodebuild build", duration_ms=70_000),
            output="** BUILD SUCCEEDED **",
        )
        self.assertNotIn("Long xcodebuild", out)
        self.assertNotIn("zombie", out)

    def test_fast_failed_xcodebuild_no_hint(self):
        # Below threshold, no zombie suspicion.
        out, _ = run_hook(
            bash_payload("xcodebuild build", duration_ms=30_000),
            output="** BUILD FAILED **",
        )
        self.assertNotIn("Long xcodebuild", out)

    def test_long_non_xcodebuild_no_hint(self):
        # A 10-minute npm install shouldn't trigger an xcodebuild hint.
        out, _ = run_hook(
            bash_payload("npm install", duration_ms=600_000),
            output="error: ENOENT",
        )
        self.assertNotIn("Long xcodebuild", out)
        self.assertNotIn("zombie", out)

    def test_xcodebuild_mention_in_echo_no_hint(self):
        # `echo "xcodebuild test"` with build-failure-looking text in
        # output shouldn't trigger — the command isn't actually xcodebuild.
        out, _ = run_hook(
            bash_payload('echo "xcodebuild test"', duration_ms=70_000),
            output="** BUILD FAILED **",
        )
        self.assertNotIn("Long xcodebuild", out)

    def test_missing_duration_no_hint(self):
        out, _ = run_hook(
            bash_payload("xcodebuild build"),
            output="** BUILD FAILED **\nlinker command failed",
        )
        self.assertEqual(out, "")


class TestSlowTestHint(unittest.TestCase):
    """Long xcodebuild test → axiom-testing parallelization hint."""

    def test_slow_test_emits_hint(self):
        out, _ = run_hook(
            bash_payload("xcodebuild test -scheme MyApp", duration_ms=360_000),
            output="Test Suite 'All tests' passed.",
        )
        self.assertIn("Slow test run", out)
        self.assertIn("axiom-testing", out)
        self.assertIn("360s", out)

    def test_test_without_building_also_triggers(self):
        out, _ = run_hook(
            bash_payload("xcodebuild test-without-building", duration_ms=400_000),
            output="passed",
        )
        self.assertIn("Slow test run", out)

    def test_fast_test_no_hint(self):
        out, _ = run_hook(
            bash_payload("xcodebuild test", duration_ms=120_000),
            output="passed",
        )
        self.assertNotIn("Slow test run", out)

    def test_slow_test_does_not_double_fire_as_build(self):
        # An xcodebuild test that took 6 minutes shouldn't also trigger
        # the build hint — the test rule and build rule are mutually
        # exclusive.
        out, _ = run_hook(
            bash_payload("xcodebuild test", duration_ms=400_000),
            # Intentionally include `error:` in output to check the
            # build rule doesn't fire on top.
            output="Test failed: error: assertion\n",
        )
        self.assertIn("Slow test run", out)
        self.assertNotIn("Long xcodebuild", out)

class TestCommandHelpers(unittest.TestCase):
    """Direct unit tests for the xcodebuild detection helpers."""

    def setUp(self):
        import importlib.util

        spec = importlib.util.spec_from_file_location("posttool_bash_hints", HOOK)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        self.is_xcb = mod._is_xcodebuild_command
        self.is_xcb_test = mod._is_xcodebuild_test_command

    def test_plain_xcodebuild(self):
        self.assertTrue(self.is_xcb("xcodebuild build"))
        self.assertTrue(self.is_xcb("xcodebuild -scheme Foo build"))

    def test_xcodebuild_with_prefix(self):
        self.assertTrue(self.is_xcb("env DEVELOPER_DIR=/x xcodebuild build"))
        self.assertTrue(self.is_xcb("sudo xcodebuild build"))
        self.assertTrue(self.is_xcb("time xcodebuild build"))

    def test_noninteractive_sudo_preserves_build_detection(self):
        self.assertTrue(self.is_xcb("sudo -n xcodebuild build"))

    def test_executable_lookup_is_not_a_build(self):
        self.assertFalse(self.is_xcb("xcrun --find xcodebuild"))
        self.assertFalse(self.is_xcb("command -v xcodebuild"))

    def test_absolute_path_xcodebuild(self):
        self.assertTrue(self.is_xcb("/usr/bin/xcodebuild build"))

    def test_xcodebuild_in_string_not_matched(self):
        self.assertFalse(self.is_xcb('echo "xcodebuild build"'))
        self.assertFalse(self.is_xcb("echo 'xcodebuild build'"))

    def test_xcodebuild_in_comment_not_matched(self):
        self.assertFalse(self.is_xcb("# xcodebuild build"))
        self.assertFalse(self.is_xcb("ls -la  # xcodebuild templates"))

    def test_xcodebuild_substring_not_matched(self):
        self.assertFalse(self.is_xcb("ls xcodebuild-templates/"))
        self.assertFalse(self.is_xcb("cat xcodebuild.log"))

    def test_test_subcommand(self):
        self.assertTrue(self.is_xcb_test("xcodebuild test"))
        self.assertTrue(
            self.is_xcb_test("xcodebuild -scheme Foo test -destination ...")
        )
        self.assertTrue(self.is_xcb_test("xcodebuild test-without-building"))

    def test_build_subcommand_not_test(self):
        self.assertFalse(self.is_xcb_test("xcodebuild build"))
        self.assertFalse(self.is_xcb_test("xcodebuild clean build"))

    def test_test_named_scheme_is_not_a_test_action(self):
        self.assertFalse(self.is_xcb_test('git pull && xcodebuild -scheme "test" build'))
        self.assertFalse(self.is_xcb_test('xcodebuild -destination test-without-building build'))

    def test_non_xcodebuild_test(self):
        # `swift test` is not xcodebuild test — different command, our
        # rule shouldn't fire.
        self.assertFalse(self.is_xcb_test("swift test"))

    def test_long_commands_of_wrappers_assignments_and_operators_stay_linear(self):
        import time

        # ~400 KB each; copying the remaining command per word made these take tens of seconds.
        for unit in ["env -u x ", "x=1 ", "sudo -u x ", "a;", "a|", "("]:
            command = unit * (400_000 // len(unit) + 1)
            for check in (self.is_xcb, self.is_xcb_test):
                with self.subTest(unit=unit, check=check.__name__):
                    start = time.monotonic()
                    check(command)
                    self.assertLess(time.monotonic() - start, 2.0)


class TestCodexProtocol(unittest.TestCase):
    def test_every_command_a_hint_names_has_a_codex_skill(self):
        # Codex ships no /axiom:* commands, so each one a hint names needs a mapping.
        import importlib.util
        import re

        spec = importlib.util.spec_from_file_location("posttool_bash_hints", HOOK)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        with open(HOOK, encoding="utf-8") as source:
            named = set(re.findall(r"/axiom:[a-z0-9-]+", source.read()))
        self.assertEqual(named - set(mod._CODEX_COMMANDS), set())

    def test_stdin_output_produces_one_structured_context_with_codex_skill_names(self):
        payload = bash_payload("xcodebuild build", duration_ms=70_000)
        payload["tool_response"] = "error: x\n** BUILD FAILED **"
        out, code = run_hook(payload, env_override={"AXIOM_HARNESS": "codex"})
        expected = {"hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "💡 Long xcodebuild (70s) produced error-like output. Check active processes: `pgrep -lx xcodebuild` (exit 1 means none). Try: skill axiom-fix-build",
        }}
        self.assertEqual((out, code), (json.dumps(expected, ensure_ascii=False) + "\n", 0))

    def test_codex_does_not_read_claude_environment_output(self):
        payload = bash_payload("xcodebuild build", duration_ms=70_000)
        payload["tool_response"] = "Build succeeded"
        self.assertEqual(
            run_hook(payload, output="** BUILD FAILED **", env_override={"AXIOM_HARNESS": "codex"}),
            ("", 0),
        )

    def test_claude_retains_plain_text_environment_output(self):
        payload = bash_payload("xcodebuild build", duration_ms=70_000)
        payload["tool_response"] = "Build succeeded"
        self.assertEqual(
            run_hook(payload, output="** BUILD FAILED **", env_override={"AXIOM_HARNESS": "claude"}),
            ("💡 Long xcodebuild (70s) produced error-like output. Check active processes: `pgrep -lx xcodebuild` (exit 1 means none). Try: /axiom:fix-build\n", 0),
        )

    def test_codex_output_object_reads_only_output_text(self):
        for response, hinted in (({"output": "** BUILD FAILED **", "metadata": "ok"}, True),
                                 ({"output": "ok", "metadata": "** BUILD FAILED **"}, False)):
            with self.subTest(response=response):
                payload = bash_payload("xcodebuild build", duration_ms=70_000)
                payload["tool_response"] = response
                out, code = run_hook(payload, env_override={"AXIOM_HARNESS": "codex"})
                self.assertEqual((code, "Long xcodebuild" in out), (0, hinted))

    def test_codex_missing_or_malformed_output_is_a_no_op(self):
        for response in (None, {}, [], 123, {"output": 123}, {"metadata": "data race"}):
            with self.subTest(response=response):
                payload = bash_payload("xcodebuild test", duration_ms=300_001)
                payload["tool_response"] = response
                self.assertEqual(
                    run_hook(payload, env_override={"AXIOM_HARNESS": "codex"}), ("", 0)
                )

    def test_codex_malformed_command_does_not_crash(self):
        payload = bash_payload(duration_ms=300_001)
        payload["tool_input"] = {"command": 123}
        payload["tool_response"] = "Build succeeded"
        self.assertEqual(
            run_hook(payload, env_override={"AXIOM_HARNESS": "codex"}), ("", 0)
        )

    def test_codex_non_terminal_tools_are_a_no_op(self):
        for name in ("apply_patch", "mcp__example__read", "spawn_agent"):
            with self.subTest(name=name):
                payload = bash_payload("xcodebuild test", duration_ms=300_001)
                payload.update(tool_name=name, tool_response="Test passed")
                self.assertEqual(
                    run_hook(payload, env_override={"AXIOM_HARNESS": "codex"}), ("", 0)
                )

    def test_codex_preserves_slow_test_threshold(self):
        for duration, expected in (
            (300_000, ""),
            (
                300_001,
                "💡 Slow test run (300s). Try: skill axiom-testing for parallelization, simulator reuse, .serialized traits",
            ),
        ):
            with self.subTest(duration=duration):
                payload = bash_payload("xcodebuild test", duration_ms=duration)
                payload["tool_response"] = "Test passed"
                out, code = run_hook(payload, env_override={"AXIOM_HARNESS": "codex"})
                want = (
                    json.dumps(
                        {
                            "hookSpecificOutput": {
                                "hookEventName": "PostToolUse",
                                "additionalContext": expected,
                            }
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                    if expected
                    else ""
                )
                self.assertEqual((out, code), (want, 0))


class TestTruncatedBuildRecovery(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import importlib.util

        spec = importlib.util.spec_from_file_location("axiom_bash_hints", HOOK)
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    def test_known_failure_success_and_unknown_have_distinct_results(self):
        output = "error: expected test output\n** BUILD FAILED **\n[20013 characters truncated]"
        expected = {"failed": 1, "succeeded": 0, "unknown": 0}
        for outcome, count in expected.items():
            with self.subTest(outcome=outcome):
                hints = self.module.truncated_build_hints(
                    "xcodebuild build", output, outcome
                )
                self.assertEqual(len(hints), count)
                if count:
                    self.assertIn("was truncated", hints[0])
                    self.assertIn("next necessary", hints[0])
                    self.assertIn("axbuild", hints[0])

    def test_length_heuristic_is_distinct_and_short_failures_are_silent(self):
        long = self.module.truncated_build_hints("swift test", "x" * 30000, "failed")
        self.assertEqual(len(long), 1)
        self.assertIn("may be truncated", long[0])
        self.assertEqual(
            self.module.truncated_build_hints("swift test", "error: short", "failed"),
            [],
        )

    def test_long_commands_skip_the_shlex_check_in_bounded_time(self):
        import time

        # shlex is quadratic in token length; commands past the cap are never single builds.
        for unit in ["(", "a", ";"]:
            with self.subTest(unit=unit):
                start = time.monotonic()
                self.module.truncated_build_hints(unit * 400_000, "x" * 30000, "failed")
                self.assertLess(time.monotonic() - start, 2.0)

    def test_only_unwrapped_build_commands_are_eligible(self):
        allowed = [
            "xcodebuild -scheme App",
            "swift build",
            "swift test",
            "xcrun --sdk macosx xcodebuild test",
            "env VALUE=literal xcrun --toolchain swift swift test",
        ]
        refused = [
            'echo "xcodebuild build"',
            "axbuild xcodebuild build",
            '"/plugin/tools/axbuild" swift test',
            "xcodebuild build; echo done",
            "xcodebuild build && echo done",
            "xcodebuild build || true",
            "xcodebuild build &",
            "swift run",
            "swift test --help",
            "xcodebuild clean",
            "xcodebuild -list",
            "xcrun --find xcodebuild",
        ]
        output = "x" * 30000
        for command in allowed + refused:
            with self.subTest(command=command):
                self.assertEqual(
                    len(self.module.truncated_build_hints(command, output, "failed")),
                    int(command in allowed),
                )

    def test_unverified_native_status_fields_never_establish_failure(self):
        output = "error: fixture\n** BUILD FAILED **\n[20013 characters truncated]"
        for response in [
            {"exit_code": 65},
            {"exitCode": 65},
            {"status": "failed"},
            {"status": "running"},
            {"output": output, "exit_code": 65},
            {"stdout": output, "success": False},
        ]:
            for harness in ["claude", "codex"]:
                with self.subTest(response=response, harness=harness):
                    payload = bash_payload("xcodebuild build")
                    payload["tool_response"] = response
                    out, code = run_hook(payload, output, {"AXIOM_HARNESS": harness})
                    self.assertEqual(code, 0)
                    self.assertNotIn("axbuild", out)


class TestClaudeCodeNativePayloads(unittest.TestCase):
    """Payload shapes captured from Claude Code 2.1.312: no output env var; success
    output in tool_response, failure output in a separate PostToolUseFailure event."""

    BUILD_FAILURE = "error: x\n** BUILD FAILED **"
    TRUNCATED_FAILURE = "Exit code 65\nerror: fixture\n... [20013 characters truncated] ..."

    def run_native(self, payload: dict) -> str:
        """Return the context Claude Code would add. Plain stdout from these events
        never reaches the model, so anything but additionalContext JSON fails."""
        env = {k: v for k, v in os.environ.items() if k != "CLAUDE_TOOL_OUTPUT"}
        env.update(AXIOM_SESSION_CONTEXT="always", AXIOM_HARNESS="claude")
        result = subprocess.run(
            ["python3", HOOK], input=json.dumps(payload), capture_output=True, text=True,
            timeout=5, env=env,
        )
        self.assertEqual(result.returncode, 0)
        if not result.stdout.strip():
            return ""
        output = json.loads(result.stdout)["hookSpecificOutput"]
        self.assertEqual(output["hookEventName"], payload["hook_event_name"])
        return output["additionalContext"]

    def success(self, command: str, **response) -> dict:
        tool_response = {"stdout": "", "stderr": "", "interrupted": False, "isImage": False,
                         "noOutputExpected": False, **response}
        return {"hook_event_name": "PostToolUse", "tool_name": "Bash",
                "tool_input": {"command": command}, "tool_response": tool_response}

    def failure(self, command: str, error: str, is_interrupt: bool = False) -> dict:
        return {"hook_event_name": "PostToolUseFailure", "tool_name": "Bash",
                "tool_input": {"command": command}, "error": error,
                "is_interrupt": is_interrupt}

    def test_success_output_in_tool_response_is_read(self):
        for field in ["stdout", "stderr"]:
            with self.subTest(field=field):
                payload = self.success("xcodebuild build", **{field: self.BUILD_FAILURE})
                payload["duration_ms"] = 90_000
                self.assertIn("Long xcodebuild (90s)", self.run_native(payload))

    def test_truncated_failing_build_gets_the_recovery_hint(self):
        out = self.run_native(self.failure("xcodebuild build", self.TRUNCATED_FAILURE))
        self.assertIn("was truncated", out)
        self.assertIn("axbuild", out)

    def test_only_an_uninterrupted_failure_event_claims_failure(self):
        cases = {
            "interrupted failure": self.failure(
                "xcodebuild build", self.TRUNCATED_FAILURE, is_interrupt=True),
            "success with failure text": self.success(
                "xcodebuild build", stdout=self.TRUNCATED_FAILURE),
            "backgrounded success": self.success(
                "xcodebuild build", stdout=self.TRUNCATED_FAILURE,
                backgroundTaskId="b1", timedOutAfterMs=2000),
        }
        for name, payload in cases.items():
            with self.subTest(case=name):
                self.assertNotIn("axbuild", self.run_native(payload))

    def test_slow_failing_build_on_the_failure_event_gets_the_duration_hint(self):
        payload = self.failure(
            "xcodebuild build -scheme App", "Exit code 65\nerror: x\n** BUILD FAILED **")
        payload["duration_ms"] = 90_000
        self.assertIn("Long xcodebuild (90s)", self.run_native(payload))


if __name__ == "__main__":
    unittest.main()
