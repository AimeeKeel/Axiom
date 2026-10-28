#!/usr/bin/env python3
"""PostToolUse hook that adds build and test hints after Bash commands.

Three hints, each one line, and only for xcodebuild/swift invocations:
a long xcodebuild that produced error-like output (check for zombie
processes, try /axiom:fix-build), a slow xcodebuild test run (try
axiom-testing), and a failed build whose output was truncated (read the
retained log, use axbuild). It does not scan output for error words:
that matcher fired mostly on source, docs and listings, so it was removed.
The hook never blocks the tool flow and never exits non-zero.

Tests: ``posttool-bash-hints_test.py``. ``duration_ms`` arrives in the
PostToolUse input from Claude Code 2.1.119.

Input:

    JSON on stdin (PostToolUse shape, per code.claude.com/docs/en/hooks):

        {
          "session_id": "...",
          "tool_name": "Bash",
          "tool_input": {"command": "...", ...},
          "tool_response": {"stdout": "...", "stderr": "...", ...},
          "duration_ms": 12345,            # optional, ms
          ...
        }

    Claude Code (captured on 2.1.312) sends output only on stdin: PostToolUse
    carries ``tool_response.stdout``/``stderr``, and a failing command fires
    PostToolUseFailure with the output in ``error``. Claude Code never set the
    tool-output environment variable this hook once relied on; Cursor's adapter
    does, so a payload without those stdin fields falls back to it.

Output:

    Claude Code payloads (PostToolUse / PostToolUseFailure) get one
    ``hookSpecificOutput.additionalContext`` object, the channel that reaches the
    model; payloads without an event name (Cursor's adapter, tests) get plain-text
    hint lines. Generated invocations set ``AXIOM_HARNESS=codex`` to read terminal text
    from stdin ``tool_response`` (string or explicit ``output`` field) and
    emit one PostToolUse ``hookSpecificOutput.additionalContext`` object.
    Unknown response fields are not scanned; no hints produce no output.
    Only Claude Code's PostToolUseFailure event establishes failure; Codex and
    Cursor status is unverified, so truncated-build recovery stays silent there.
    Error text never establishes failure.

Exit code: always 0.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import sys
from typing import NamedTuple, Literal

# fmt: off
try:
    import hook_diagnostics
except ImportError:  # Diagnostics are optional; a missing module must not break the hook.
    import os as _os
    from types import SimpleNamespace

    def _diagnostics_unavailable(*_):
        # Requested but unavailable: the same fixed notice as an unwritable journal.
        if _os.environ.get("AXIOM_HOOK_DIAGNOSTICS_DIR"):
            try:
                _os.write(2, b"Axiom hook diagnostics unavailable.\n")
            except OSError:
                pass

    hook_diagnostics = SimpleNamespace(
        begin=_diagnostics_unavailable,
        record_exception=lambda *_: None,
        record_exit=lambda *_: None,
    )
# fmt: on

def _expansion_end(command: str, start: int) -> int | None:
    backtick = command[start] == "`"
    depth = 1
    quote = ""
    i = start + (1 if backtick else 2)
    while i < len(command):
        char = command[i]
        if char == "\\" and quote != "'":
            i += 2
            continue
        if backtick:
            if char == "`":
                return i + 1
        elif quote:
            if char == quote:
                quote = ""
        elif char in "'\"":
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return None


# Matched in place (pos=i) rather than on a copy of the rest of the command.
_SHELL_OPERATOR = re.compile(r"&>>|&>|&&|\|\||\|&|>>|<<<?|<>|>&|<&|[;\n&|()<>]")


def _shell_tokens(command: str) -> list[tuple[str, bool]] | None:
    """Lex words/operators without expansion."""
    tokens: list[tuple[str, bool]] = []
    word = ""
    active = False
    quoted = False
    quote = ""
    i = 0
    while i < len(command):
        char = command[i]
        if char == "\\" and quote != "'":
            if i + 1 == len(command):
                return None
            following = command[i + 1]
            if not quote or following in '\\"$`\n':
                if following != "\n":
                    word += following
                    active = True
                i += 2
                continue
        if quote != "'" and (command.startswith("$(", i) or char == "`"
                             or (not quote and command[i:i + 2] in {"<(", ">("})):
            end = _expansion_end(command, i)
            if end is None:
                return None
            word += "\0"  # Opaque argument: can execute commands, never a literal action/path.
            active = True
            i = end
            continue
        if quote:
            if char == quote:
                quote = ""
            else:
                word += char
            i += 1
            continue
        if char in "'\"":
            quote = char
            active = quoted = True
            i += 1
            continue
        if char == "#" and not active:
            while i < len(command) and command[i] != "\n":
                i += 1
            continue
        if char in " \t\r\n;&|()<>":
            operator = _SHELL_OPERATOR.match(command, i)
            descriptor = ""
            if active:
                if operator and char in "<>" and word.isascii() and word.isdigit() and not quoted:
                    descriptor = word
                else:
                    tokens.append((word, False))
                word, active, quoted = "", False, False
            if operator:
                tokens.append((descriptor + operator[0], True))
                i += len(operator[0])
            else:
                i += 1
            continue
        word += char
        active = True
        i += 1
    if quote:
        return None
    if active:
        tokens.append((word, False))
    return tokens


def _command_groups(command: str, depth: int = 0) -> list[list[str]] | None:
    """Split a command into the words of each simple command, wrappers stripped."""
    tokens = _shell_tokens(command)
    if tokens is None or depth > 8:
        return None
    groups: list[list[str]] = []
    words: list[str] = []
    i = 0
    while i < len(tokens):
        token, operator = tokens[i]
        if operator and re.fullmatch(r"[0-9]*(?:[<>]+|[<>]&)|&>>?", token):
            if i + 1 >= len(tokens) or tokens[i + 1][1]:
                return None
            if re.fullmatch(r"[0-9]*<>?", token):
                words.append(tokens[i + 1][0])
            i += 2
            continue
        if operator:
            groups.append(words)
            words = []
        else:
            words.append(token)
        i += 1
    groups.append(words)
    expanded: list[list[str]] = []
    option_arguments = {
        "env": {"-u", "--unset", "-C", "--chdir", "-S", "--split-string"},
        "sudo": {"-u", "--user", "-g", "--group", "-h", "--host", "-p", "--prompt",
                 "-C", "--close-from", "-T", "--command-timeout", "-R", "--chroot",
                 "-D", "--chdir", "-r", "--role", "-t", "--type", "-a", "--auth-type"},
        "nice": {"-n", "--adjustment"},
        "time": {"-f", "--format", "-o", "--output"},
        "command": set(),
        "exec": {"-a"},
        "xcrun": {"--sdk", "--toolchain"},
    }
    for words in groups:
        # Skip assignments and wrappers by index; copying the rest per word is quadratic.
        start = 0
        while start < len(words):
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[start]):
                start += 1
            elif os.path.basename(words[start]) in option_arguments:
                prefix = os.path.basename(words[start])
                wrapped = start
                start += 1
                lookup = False
                while start < len(words) and words[start].startswith("-"):
                    option = words[start]
                    start += 1
                    lookup |= ((prefix == "xcrun" and option in {"--find", "-f"})
                               or (prefix == "command" and option in {"-v", "-V"})
                               or (prefix == "env" and ((option.startswith("-")
                                   and not option.startswith("--") and "S" in option)
                                   or option.split("=", 1)[0] == "--split-string")))
                    if start < len(words) and option in option_arguments[prefix]:
                        start += 1
                if lookup:
                    start = wrapped
                    break
            else:
                break
        words = words[start:]
        if words and os.path.basename(words[0]) in {"sh", "bash", "zsh"}:
            index = next((j for j in range(1, len(words))
                          if re.fullmatch(r"-[A-Za-z]*c[A-Za-z]*", words[j])), None)
            if index is not None and index + 1 < len(words):
                nested = _command_groups(words[index + 1], depth + 1)
                if nested is None:
                    return None
                expanded.extend(nested)
                continue
        expanded.append(words)
    return expanded


def _is_xcodebuild_command(command: str) -> bool:
    groups = _command_groups(command)
    return groups is not None and any(
        words and os.path.basename(words[0]) == "xcodebuild" for words in groups
    )


def _is_xcodebuild_test_command(command: str) -> bool:
    groups = _command_groups(command)
    if groups is None:
        return False
    values = {"-scheme", "-project", "-workspace", "-target", "-configuration",
              "-sdk", "-destination", "-derivedDataPath", "-resultBundlePath", "-testPlan"}
    for words in groups:
        if not words or os.path.basename(words[0]) != "xcodebuild":
            continue
        arguments = iter(words[1:])
        for word in arguments:
            if word in values:
                next(arguments, None)
            elif word in {"test", "test-without-building"}:
                return True
    return False


# Output signatures that suggest an xcodebuild call ended in failure
# rather than just being slow. The slow-build hint is only useful when
# something actually went wrong — slow successful builds are normal on
# clean checkouts.
_BUILD_FAILURE_RE = re.compile(
    r"BUILD FAILED|\*\* BUILD FAILED \*\*|error:|linker command failed",
    re.IGNORECASE,
)


# Thresholds in milliseconds. Tunable. First-pass values:
#   Build: 60s — anything over a minute that *also* failed is worth
#          flagging; zombie xcodebuilds typically run 5-30+ minutes.
#   Test:  5min — common test suites finish in <2min; >5min usually
#          indicates parallelization opportunity.
_SLOW_BUILD_MS = 60_000

# Codex ships no /axiom:* commands; build-codex.ts maps each to the skill it emits.
_CODEX_COMMANDS = {"/axiom:fix-build": "skill axiom-fix-build"}
_SLOW_TEST_MS = 300_000


def duration_hints(command: str, output: str, duration_ms: int | None) -> list[str]:
    """Return duration-aware hints for a Bash command.

    Both rules are conservative: they require the command to actually
    be `xcodebuild` (not just any slow Bash call), and the build rule
    additionally requires failure-looking output.
    """
    if duration_ms is None or duration_ms <= 0:
        return []
    hints: list[str] = []
    seconds = duration_ms // 1000
    is_test = _is_xcodebuild_test_command(command)
    if is_test and duration_ms > _SLOW_TEST_MS:
        hints.append(
            f"💡 Slow test run ({seconds}s). Try: skill axiom-testing for "
            "parallelization, simulator reuse, .serialized traits"
        )
    elif (
        not is_test
        and _is_xcodebuild_command(command)
        and duration_ms > _SLOW_BUILD_MS
        and _BUILD_FAILURE_RE.search(output or "")
    ):
        hints.append(
            f"💡 Long xcodebuild ({seconds}s) produced error-like output. Check "
            "active processes: `pgrep -lx xcodebuild` (exit 1 means none). "
            "Try: /axiom:fix-build"
        )
    return hints


class BuildCompletion(NamedTuple):
    command: str
    output: str
    outcome: Literal["succeeded", "failed", "unknown"]


def normalize_build_completion(
    data: dict, codex: bool, environment_output: str
) -> BuildCompletion | None:
    tool_input = data.get("tool_input")
    command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""
    if not isinstance(command, str):
        command = ""
    if codex:
        response = data.get("tool_response")
        output = response.get("output") if isinstance(response, dict) else response
        if not isinstance(output, str):
            return None
        # Codex has no verified native completion-status contract.
        return BuildCompletion(command, output, "unknown")
    # Claude Code (verified on 2.1.312) sets no output env var: success output is in
    # tool_response, and a failing command fires PostToolUseFailure with its output in
    # `error`. The event, not the text, establishes failure (it may also cover a
    # spawn error, but recovery needs truncation evidence too). Cursor's adapter sends
    # neither and passes output through the environment.
    event = data.get("hook_event_name")
    response = data.get("tool_response")
    if event == "PostToolUseFailure" and isinstance(data.get("error"), str):
        outcome = "unknown" if data.get("is_interrupt") is True else "failed"
        return BuildCompletion(command, data["error"], outcome)
    streams = [response.get(key) for key in ("stdout", "stderr")] if isinstance(response, dict) else []
    if not any(isinstance(stream, str) for stream in streams):
        return BuildCompletion(command, environment_output, "unknown")
    output = "\n".join(stream for stream in streams if isinstance(stream, str) and stream)
    return BuildCompletion(command, output, "unknown")


# shlex grows each token by attribute concatenation, which is quadratic in token length;
# a single xcodebuild/swift invocation is far shorter than this, so longer commands skip it.
_MAX_BUILD_COMMAND = 65_536


def _is_unwrapped_build(command: str) -> bool:
    if len(command) > _MAX_BUILD_COMMAND:
        return False
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
        lexer.whitespace_split = True
        tokens = list(lexer)
    except ValueError:
        return False
    if not tokens or any(re.fullmatch(r"[;&|()]+", token) for token in tokens):
        return False
    # Advance an index; list.pop(0) per token is quadratic.
    start = 0
    while start < len(tokens) and (
        tokens[start] in {"env", "command", "exec", "time", "sudo"}
        or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[start])
    ):
        start += 1
    if start == len(tokens):
        return False
    program = tokens[start].rsplit("/", 1)[-1]
    start += 1
    if program == "xcrun":
        while start < len(tokens) and tokens[start].startswith("-"):
            option = tokens[start]
            start += 1
            if option in {"--sdk", "--toolchain"}:
                if start == len(tokens) or tokens[start].startswith("-"):
                    return False
                start += 1
            elif option not in {
                "-v",
                "--verbose",
                "-l",
                "--log",
                "-r",
                "--run",
                "-n",
                "--no-cache",
                "-k",
                "--kill-cache",
            }:
                return False
        if start == len(tokens):
            return False
        program = tokens[start].rsplit("/", 1)[-1]
        start += 1
    tokens = tokens[start:]
    if program == "swift":
        return bool(
            tokens
            and tokens[0] in {"build", "test"}
            and not any(
                t in {"--help", "-h", "--help-hidden", "--version"} for t in tokens
            )
        )
    if program != "xcodebuild":
        return False
    actions = []
    values = {
        "-scheme",
        "-project",
        "-workspace",
        "-target",
        "-configuration",
        "-sdk",
        "-destination",
        "-derivedDataPath",
        "-resultBundlePath",
        "-testPlan",
    }
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token in values:
            if i + 1 == len(tokens):
                return False
            i += 2
            continue
        if token in {
            "-help",
            "-list",
            "-version",
            "-showsdks",
            "-showBuildSettings",
            "-showdestinations",
            "-showTestPlans",
        }:
            return False
        if token in {
            "build",
            "test",
            "build-for-testing",
            "test-without-building",
            "archive",
            "install",
            "analyze",
            "clean",
        }:
            actions.append(token)
        i += 1
    return not actions or any(action != "clean" for action in actions)


def truncated_build_hints(command: str, output: str, outcome: str) -> list[str]:
    if outcome != "failed" or not _is_unwrapped_build(command):
        return []
    observed = (
        re.search(r"\[(?:[0-9]+ (?:characters|lines|tokens) )?truncated\]", output)
        is not None
    )
    if not observed and len(output) < 30000:
        return []
    evidence = (
        "was truncated" if observed else "may be truncated (output-length heuristic)"
    )
    return [
        f"💡 Build output {evidence}. Read the retained log if available; use axbuild for the next necessary build/test."
    ]


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception as error:
        hook_diagnostics.record_exception(error)
        return 0  # malformed input → silent no-op
    if not isinstance(data, dict):
        return 0
    if data.get("tool_name") != "Bash":
        return 0

    try:
        from project_detect import resolve_context_decision, session_cwd

        if not resolve_context_decision(
            session_cwd(hook_diagnostics.record_exception), os.environ.get("AXIOM_SESSION_CONTEXT")
        ):
            return 0
    except Exception as error:
        hook_diagnostics.record_exception(error)

    codex = os.environ.get("AXIOM_HARNESS") == "codex"
    completion = normalize_build_completion(
        data, codex, os.environ.get("CLAUDE_TOOL_OUTPUT", "")
    )
    if completion is None:
        return 0
    command, output, outcome = completion
    duration_ms = data.get("duration_ms")
    if not isinstance(duration_ms, int):
        duration_ms = None

    hints = duration_hints(command, output, duration_ms) + truncated_build_hints(command, output, outcome)
    if codex:
        if hints:
            context = "\n".join(hints)
            for command, skill in _CODEX_COMMANDS.items():
                context = context.replace(command, skill)
            print(
                json.dumps(
                    {
                        "hookSpecificOutput": {
                            "hookEventName": "PostToolUse",
                            "additionalContext": context,
                        }
                    },
                    ensure_ascii=False,
                )
            )
    elif data.get("hook_event_name") in ("PostToolUse", "PostToolUseFailure"):
        # Claude Code shows a PostToolUse hook's plain stdout only in the transcript;
        # additionalContext is what reaches the model.
        if hints:
            print(
                json.dumps(
                    {
                        "hookSpecificOutput": {
                            "hookEventName": data["hook_event_name"],
                            "additionalContext": "\n".join(hints),
                        }
                    },
                    ensure_ascii=False,
                )
            )
    else:
        for hint in hints:
            print(hint)
    return 0


if __name__ == "__main__":
    hook_diagnostics.begin("posttool-bash-hints")
    sys.exit(main())
