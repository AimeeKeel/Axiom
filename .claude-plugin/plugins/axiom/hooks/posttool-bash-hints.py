#!/usr/bin/env python3
"""PostToolUse hook that suggests an Axiom skill based on Bash output.

When the model runs a Bash command, this hook scans the command's output
for known iOS error signatures and prints a short ``💡 Try: skill X``
hint on stdout. Each hint is one line; multiple hints can fire from a
single command. The hook never blocks the tool flow and never exits
non-zero — a broken hook shouldn't get in the way of normal work.

Replaces the inline bash one-liner that previously lived in
``hooks/hooks.json`` (PostToolUse Bash matcher). Extracted so we can:

1. Add unit tests (see ``posttool-bash-hints_test.py``).
2. Use ``duration_ms`` (added to PostToolUse input in CC 2.1.119) for
   duration-aware rules — currently used by the slow-xcodebuild and
   slow-test rules in this script's sibling phase.

Input:

    JSON on stdin (PostToolUse shape, per code.claude.com/docs/en/hooks):

        {
          "session_id": "...",
          "tool_name": "Bash",
          "tool_input": {"command": "...", ...},
          "tool_response": {...},          # Bash response shape undocumented
          "duration_ms": 12345,            # optional, ms
          ...
        }

    Bash output text on the ``CLAUDE_TOOL_OUTPUT`` env var. We read this
    rather than ``tool_response`` because the latter's Bash schema is
    not documented; the env var is proven (used by the previous inline
    hook). If the var is unset, we treat output as empty.

Output:

    Canonical Claude invocations emit zero or more plain-text hint lines.
    Generated invocations set ``AXIOM_HARNESS=codex`` to read terminal text
    from stdin ``tool_response`` (string or explicit ``output`` field) and
    emit one PostToolUse ``hookSpecificOutput.additionalContext`` object.
    Unknown response fields are not scanned; no hints produce no output.
    Claude/Codex completion status is unverified, so truncated-build recovery
    stays silent for those adapters. Error text cannot establish failure.

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

# Pattern hints. Each entry is (compiled_regex, hint_text). Hints are
# kept short — one line, names the skill or command to invoke. Order
# doesn't matter for correctness, but related hints are grouped for
# readability.
_PATTERN_RULES: list[tuple[re.Pattern, str]] = [
    (
        re.compile(r"Unable to simultaneously satisfy constraints"),
        "💡 Auto Layout conflict. Try: skill axiom-uikit",
    ),
    (
        re.compile(r"Actor-isolated|Sendable|data race|@MainActor", re.IGNORECASE),
        "💡 Concurrency issue. Try: skill axiom-concurrency",
    ),
    (
        re.compile(r"no such column|FOREIGN KEY constraint|migration"),
        "💡 Database migration issue. Try: skill axiom-data",
    ),
    (
        re.compile(r"retain cycle|memory leak|deinit.*never called"),
        "💡 Memory issue detected. Try: skill axiom-performance",
    ),
    (
        re.compile(r"CKError|CKRecord.*error"),
        "💡 CloudKit issue. Try: skill axiom-data",
    ),
    (
        re.compile(r"ubiquitous.*error|iCloud Drive|NSFileCoordinator"),
        "💡 iCloud Drive issue. Try: skill axiom-data",
    ),
    (
        re.compile(r"file.*disappeared|file not found|storage.*full"),
        "💡 File storage issue. Try: skill axiom-data",
    ),
    (
        re.compile(r"FileProtection|data protection|file.*locked"),
        "💡 File protection issue. Try: skill axiom-data",
    ),
    (
        re.compile(r"error:.*module.*not found|linker command failed"),
        "💡 Build configuration issue. Try: /axiom:fix-build",
    ),
]


_DIAGNOSTIC_LINE = re.compile(
    r"\b(?:error|warning|failed|failure|detected|unavailable|fatal|exception)\b|"
    r"\b(?:note|reason):|never called|not available|data race|"
    r"Unable to simultaneously satisfy constraints|Leaks:|CKError\s*\d|"
    r"^\s*(?:[\w.]+(?:Error|Exception):|no such column\b|file not found\b|"
    r"CKError(?:Domain)?\b|(?:Application terminated:\s*)?file (?:is )?locked\b)",
    re.IGNORECASE,
)
_LOG_PREFIX = re.compile(
    r"^\s*(?:(?:\[[^\]\n]+\]|[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9:.,+\-]+Z?|"
    r"[0-9]{2}:[0-9]{2}:[0-9]{2}(?:[.,][0-9]+)?|[A-Za-z_][\w.-]*\[[0-9:]+\]:?)\s*)+"
)
_ISSUE_TERMS = r"(?:migration\s+(?:errors?|failures?|issues?|problems?)|memory leaks?|retain cycles?)\b"
_NEGATED_ISSUE = re.compile(
    r"\b(?:no|without)\s+" + _ISSUE_TERMS + r"(?:\s+(?:or|and)\s+" + _ISSUE_TERMS + r")*",
    re.IGNORECASE,
)


def match_patterns(output: str) -> list[str]:
    """Return hints from diagnostic fragments, excluding negated issue reports."""
    if not output:
        return []
    diagnostics = []
    for fragment in re.split(r"[;\n]|(?<=[.!?])\s+", output):
        fragment = _NEGATED_ISSUE.sub("", fragment)
        payload = _LOG_PREFIX.sub("", fragment)
        if _DIAGNOSTIC_LINE.search(fragment) or _DIAGNOSTIC_LINE.search(payload):
            diagnostics.append(payload)
    return [hint for pattern, hint in _PATTERN_RULES
            if any(pattern.search(line) for line in diagnostics)]


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


def _shell_tokens(command: str, allow_incomplete: bool = False) -> list[tuple[str, bool]] | None:
    """Lex words/operators without expansion; mirrored in Pi and tested by one corpus."""
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
                if not allow_incomplete:
                    return None
                word += char
                active = True
                break
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
            operator = re.match(r"&>>|&>|&&|\|\||\|&|>>|<<<?|<>|>&|<&|[;\n&|()<>]", command[i:])
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
    if quote and not allow_incomplete:
        return None
    if active:
        tokens.append((word, False))
    return tokens


class CommandGroup(NamedTuple):
    words: list[str]
    pipeline: bool
    executes_expansion: bool


def _command_groups(command: str, depth: int = 0, allow_incomplete: bool = False) -> list[CommandGroup] | None:
    tokens = _shell_tokens(command, allow_incomplete)
    if tokens is None or depth > 8:
        return None
    groups: list[CommandGroup] = []
    words: list[str] = []
    pipeline = False
    executes_expansion = False
    i = 0
    while i < len(tokens):
        token, operator = tokens[i]
        executes_expansion |= "\0" in token
        if operator and re.fullmatch(r"[0-9]*(?:[<>]+|[<>]&)|&>>?", token):
            if i + 1 >= len(tokens) or tokens[i + 1][1]:
                return None
            executes_expansion |= "\0" in tokens[i + 1][0]
            if re.fullmatch(r"[0-9]*<>?", token):
                words.append(tokens[i + 1][0])
            i += 2
            continue
        if operator:
            groups.append(CommandGroup(words, pipeline, executes_expansion))
            words = []
            executes_expansion = False
            pipeline = token in {"|", "|&"}
        else:
            words.append(token)
        i += 1
    groups.append(CommandGroup(words, pipeline, executes_expansion))
    expanded: list[CommandGroup] = []
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
    for words, pipeline, executes_expansion in groups:
        while words:
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[0]):
                words = words[1:]
            elif os.path.basename(words[0]) in option_arguments:
                prefix = os.path.basename(words[0])
                wrapped_words = words
                words = words[1:]
                lookup = False
                while words and words[0].startswith("-"):
                    option, words = words[0], words[1:]
                    lookup |= ((prefix == "xcrun" and option in {"--find", "-f"})
                               or (prefix == "command" and option in {"-v", "-V"})
                               or (prefix == "env" and ((option.startswith("-")
                                   and not option.startswith("--") and "S" in option)
                                   or option.split("=", 1)[0] == "--split-string")))
                    if words and option in option_arguments[prefix]:
                        words = words[1:]
                if lookup:
                    words = wrapped_words
                    break
            else:
                break
        if words and os.path.basename(words[0]) in {"sh", "bash", "zsh"}:
            index = next((j for j in range(1, len(words))
                          if re.fullmatch(r"-[A-Za-z]*c[A-Za-z]*", words[j])), None)
            if index is not None and index + 1 < len(words):
                nested = _command_groups(words[index + 1], depth + 1, allow_incomplete)
                if nested is None:
                    return None
                expanded.extend(CommandGroup(group.words, group.pipeline or pipeline,
                                             group.executes_expansion or executes_expansion)
                                for group in nested)
                continue
        expanded.append(CommandGroup(words, pipeline, executes_expansion))
    return expanded


def _documentation_operand(word: str) -> bool:
    if any(character in word for character in ("$", "`", "\0")):
        return False
    parts = word.lower().split("/")
    name = parts[-1]
    suffix = name.rsplit(".", 1)[-1] if "." in name else ""
    if suffix in {"", "txt", "json", "jsonl", "ndjson", "out", "err"} and re.search(
        r"(?:^|[-_.])(?:stdout|stderr|output|logs?|results?|traces?|diagnostics|console|captured?)(?:[-_.]|$)", name
    ):
        return False
    suffixes = {"md", "mdx", "rst", "adoc", "swift", "m", "mm", "h", "c", "cc", "cpp",
                "hpp", "js", "ts", "tsx", "jsx", "py", "rs", "go", "java", "kt", "kts",
                "rb", "sh", "bash", "zsh", "json", "yaml", "yml", "toml", "xml", "plist",
                "xcconfig", "pbxproj", "xcproj", "html", "css", "scss", "sql"}
    names = {"readme", "license", "licence", "copying", "notice", "authors", "changelog",
             "contributing", "code_of_conduct", "security", "agents", "claude", "makefile",
             "dockerfile", "gemfile", "podfile", "package.resolved"}
    directories = {"docs", "documentation", "sources", "source", "src", "scripts", "tests",
                   "test", ".claude", ".claude-plugin"}
    return (suffix in suffixes or name in names or name.split(".", 1)[0] in names
            or any(part in directories for part in parts))


def _is_awk_inspection(words: list[str]) -> bool:
    arguments = iter(words[1:])
    for word in arguments:
        if word in {"-F", "-v"}:
            if next(arguments, None) is None:
                return False
        elif word == "--":
            word = next(arguments, "")
            break
        elif word.startswith(("-F", "-v")):
            continue
        elif word.startswith("-"):
            return False
        else:
            break
    else:
        return False
    selector = r"(?:NR|FNR)\s*(?:==|!=|<=|>=|<|>)\s*[0-9]+"
    return (re.fullmatch(
        rf"\s*(?:{selector}(?:\s*(?:&&|\|\|)\s*{selector})*\s*)?"
        r"\{\s*print(?:\s+\$[0-9]+(?:\s*,\s*\$[0-9]+)*)?\s*;?\s*\}\s*",
        word,
    ) is not None and all(not arg.startswith("-") or arg == "-" for arg in arguments))


def _is_sed_inspection(words: list[str]) -> bool:
    arguments = iter(words[1:])
    programs = []
    for word in arguments:
        if word in {"-n", "--quiet", "--silent"}:
            continue
        if word in {"-e", "--expression"}:
            programs.append(next(arguments, ""))
        elif word.startswith("--expression="):
            programs.append(word.split("=", 1)[1])
        elif word.startswith("-e"):
            programs.append(word[2:])
        elif word.startswith("-"):
            return False
        elif not programs:
            programs.append(word)
        elif not _documentation_operand(word):
            return False
    return bool(programs) and all(re.fullmatch(
        r"\s*(?:(?:[0-9]+|\$)(?:\s*,\s*(?:[0-9]+|\$))?\s*)?p\s*"
        r"(?:;\s*(?:(?:[0-9]+|\$)(?:\s*,\s*(?:[0-9]+|\$))?\s*)?p\s*)*;?\s*",
        program,
    ) is not None for program in programs)


def _is_git_inspection(words: list[str]) -> bool:
    arguments = iter(words[1:])
    monitor_disabled = False
    for word in arguments:
        if word in {"-C", "--git-dir", "--work-tree"}:
            if next(arguments, None) is None:
                return False
        elif word == "-c":
            if next(arguments, None) != "core.fsmonitor=false":
                return False
            monitor_disabled = True
        elif word in {"--no-pager", "--no-optional-locks", "--literal-pathspecs"}:
            continue
        elif word.startswith(("--git-dir=", "--work-tree=")):
            continue
        elif word.startswith("-"):
            return False
        else:
            break
    else:
        return False
    subcommand = word
    if subcommand not in {"diff", "show", "status", "log", "blame", "grep", "ls-files", "ls-tree"}:
        return False
    inspection_options = {
        "--no-ext-diff", "--no-textconv", "--stat", "--numstat", "--shortstat",
        "--name-only", "--name-status", "--check", "--raw", "--patch", "-p",
        "--no-patch", "-s", "--cached", "--staged", "--short", "--porcelain",
        "--porcelain=v1", "--porcelain=v2", "--branch", "-b", "--oneline",
        "--no-decorate", "--decorate", "--all", "--no-color", "--color=never",
        "--no-renames", "--no-show-signature",
    }
    options = set()
    operands = []
    for argument in arguments:
        if argument == "--":
            break
        if argument.startswith("-") and argument not in inspection_options:
            return False
        if argument.startswith("-"):
            options.add(argument)
        else:
            operands.append(argument)
    if any(operand.startswith(":") for operand in operands):
        return False
    if subcommand == "ls-tree":
        return True
    if subcommand == "show" and len(operands) == 1 and ":" in operands[0] and not options:
        return True
    if subcommand == "log" and {"--oneline", "--no-show-signature"} <= options and options <= {
        "--oneline", "--no-decorate", "--decorate", "--all", "--no-color",
        "--color=never", "--no-patch", "-s", "--no-show-signature",
    }:
        return True
    # Working-tree queries can run a configured filesystem monitor, even without a diff.
    if not monitor_disabled:
        return False
    if subcommand in {"diff", "show", "log"}:
        return ({"--no-ext-diff", "--no-textconv"} <= options
                and (subcommand == "diff" or {"--oneline", "--no-show-signature"} <= options))
    return subcommand != "blame" or "--no-textconv" in options


def is_documentation_command(command: str) -> bool:
    """Suppress inspection only when no command group produces runtime output."""
    groups = _command_groups(command, allow_incomplete=True)
    if groups is None:
        return False
    searches = {"rg", "grep", "sed", "awk"}
    readers = {"cat", "head", "tail", "nl"}
    inspection = False
    runtime = any(group.executes_expansion for group in groups)
    for words, pipeline, _ in groups:
        if not words:
            continue
        program = os.path.basename(words[0])
        if program in readers | searches:
            if program == "awk" and not _is_awk_inspection(words):
                runtime = True
                continue
            if program == "sed" and not _is_sed_inspection(words):
                runtime = True
                continue
            # First argument proves this is an option, never a pattern or option value.
            if program == "rg" and (words[1:2] != ["--no-config"] or any(
                word.split("=", 1)[0] in {"--pre", "--hostname-bin", "--search-zip"}
                or (word.startswith("-") and not word.startswith("--") and "z" in word)
                for word in words[1:]
            )):
                runtime = True
                continue
            operands: list[str] = []
            pattern_provided = False
            pattern_options = {"-e", "--regexp", "-f", "--file", "--expression"} if program in searches else set()
            paired_options = pattern_options | {"-A", "-B", "-C", "--context", "-g", "--glob"}
            if program in {"head", "tail"}:
                paired_options |= {"-n", "-c", "--lines", "--bytes"}
            if program == "awk":
                paired_options |= {"-F", "-v"}
            arguments = iter(words[1:])
            for word in arguments:
                if word == "--":
                    operands.extend(arguments)
                elif word in paired_options:
                    next(arguments, None)
                    pattern_provided |= word in pattern_options
                elif word.startswith("-") and word != "-":
                    pattern_provided |= any(word.startswith(option + "=") for option in pattern_options)
                    pattern_provided |= program in searches and bool(re.match(r"^-[ef][^-]", word))
                else:
                    operands.append(word)
            if program in searches and not pattern_provided:
                operands = operands[1:]
            if any(word == "-" or word.endswith((".log", ".crash", ".ips")) for word in operands):
                runtime = True
            elif operands:
                if all(_documentation_operand(word) or (program in searches and word in {".", "./"})
                       for word in operands):
                    inspection = True
                else:
                    runtime = True
            elif not pipeline:
                if program == "rg":
                    inspection = True  # With no file operands, ripgrep searches source in cwd.
                else:
                    runtime = True
        elif program == "git":
            if _is_git_inspection(words):
                inspection = True
            else:
                runtime = True
        elif program in {"echo", "printf"}:
            inspection = True
        elif program in {"curl", "wget"} and any(
            word.endswith((".md", ".swift", ".txt", ".rst")) for word in words[1:]
        ):
            inspection = True
        elif program not in {"cd", "pwd", "true", "false", ":", "export"}:
            runtime = True
    return inspection and not runtime


def _is_xcodebuild_command(command: str) -> bool:
    groups = _command_groups(command)
    return groups is not None and any(
        group.words and os.path.basename(group.words[0]) == "xcodebuild" for group in groups
    )


def _is_xcodebuild_test_command(command: str) -> bool:
    groups = _command_groups(command)
    if groups is None:
        return False
    values = {"-scheme", "-project", "-workspace", "-target", "-configuration",
              "-sdk", "-destination", "-derivedDataPath", "-resultBundlePath", "-testPlan"}
    for words, _, _ in groups:
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
    else:
        output = environment_output
    # Neither adapter has a verified native completion-status contract.
    return BuildCompletion(command, output, "unknown")


def _is_unwrapped_build(command: str) -> bool:
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|()")
        lexer.whitespace_split = True
        tokens = list(lexer)
    except ValueError:
        return False
    if not tokens or any(re.fullmatch(r"[;&|()]+", token) for token in tokens):
        return False
    while tokens and (
        tokens[0] in {"env", "command", "exec", "time", "sudo"}
        or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[0])
    ):
        tokens.pop(0)
    if not tokens:
        return False
    program = tokens.pop(0).rsplit("/", 1)[-1]
    if program == "xcrun":
        while tokens and tokens[0].startswith("-"):
            option = tokens.pop(0)
            if option in {"--sdk", "--toolchain"}:
                if not tokens or tokens[0].startswith("-"):
                    return False
                tokens.pop(0)
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
        if not tokens:
            return False
        program = tokens.pop(0).rsplit("/", 1)[-1]
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

    hints = (
        ([] if is_documentation_command(command) else match_patterns(output))
        + duration_hints(command, output, duration_ms)
        + truncated_build_hints(command, output, outcome)
    )
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
    else:
        for hint in hints:
            print(hint)
    return 0


if __name__ == "__main__":
    hook_diagnostics.begin("posttool-bash-hints")
    sys.exit(main())
