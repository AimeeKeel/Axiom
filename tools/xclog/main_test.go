package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"regexp"
	"strings"
	"testing"
	"time"
)

func TestLogCommandScopesSimulator(t *testing.T) {
	for _, test := range []struct {
		name string
		cfg  Config
		args []string
		want []string
	}{
		{"selected stream", Config{Device: "fixture-udid"}, []string{"stream", "--predicate", "processIdentifier == 123"}, []string{"xcrun", "simctl", "spawn", "fixture-udid", "log", "stream", "--predicate", "processIdentifier == 123"}},
		{"default history", Config{Device: "booted"}, []string{"show", "--last", "5m"}, []string{"xcrun", "simctl", "spawn", "booted", "log", "show", "--last", "5m"}},
		{"physical archive", Config{DeviceUDID: "physical-device"}, []string{"show", "/fixture/device.logarchive"}, []string{"log", "show", "/fixture/device.logarchive"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := logCommand(context.Background(), &test.cfg, test.args...).Args; !reflect.DeepEqual(got, test.want) {
				t.Fatalf("command = %q, want %q", got, test.want)
			}
		})
	}
}

func TestLaunchCommandUnbuffersConsole(t *testing.T) {
	t.Setenv("SIMCTL_CHILD_NSUnbufferedIO", "NO")
	t.Setenv("AXIOM_FIXTURE_ENV", "preserved")
	cmd := launchCommand(context.Background(), "org.example.fixture", &Config{Device: "fixture-udid"})
	want := []string{"xcrun", "simctl", "launch", "--console", "--terminate-running-process", "fixture-udid", "org.example.fixture"}
	if !reflect.DeepEqual(cmd.Args, want) {
		t.Fatalf("command = %q, want %q", cmd.Args, want)
	}
	env := map[string]string{}
	for _, value := range cmd.Env {
		key, value, found := strings.Cut(value, "=")
		if found {
			env[key] = value
		}
	}
	got := []string{env["SIMCTL_CHILD_NSUnbufferedIO"], env["AXIOM_FIXTURE_ENV"]}
	if want := []string{"YES", "preserved"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("launch environment = %q, want %q", got, want)
	}
}

func TestShowReportsLogFailure(t *testing.T) {
	dir := t.TempDir()
	script := `#!/bin/sh
if [ "$1 $2 $3 $4" = "simctl list devices -j" ]; then
    echo '{"devices":{"fixture-runtime":[{"udid":"fixture-udid","state":"Booted"}]}}'
    exit 0
fi
echo fixture-log-query-failed >&2
exit 23
`
	for _, name := range []string{"xcrun", "log"} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(script), 0755); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
	t.Setenv("AXIOM_XCLOG_TEST_CLI", "1")
	cmd := exec.Command(os.Args[0], "-test.run=^TestXclogCLIHelper$")
	output, err := cmd.CombinedOutput()
	exit, ok := err.(*exec.ExitError)
	if !ok || exit.ExitCode() != 1 || !strings.Contains(string(output), "fixture-log-query-failed") {
		t.Fatalf("failed log query returned error %v and output %q; want exit 1 and contextual log error", err, output)
	}
}

func TestXclogCLIHelper(t *testing.T) {
	if os.Getenv("AXIOM_XCLOG_TEST_CLI") != "1" {
		return
	}
	os.Args = []string{"xclog", "show", "Fixture", "--device", "fixture-udid"}
	if value := os.Getenv("AXIOM_XCLOG_TEST_ARGS"); value != "" {
		var args []string
		if err := json.Unmarshal([]byte(value), &args); err != nil {
			t.Fatal(err)
		}
		os.Args = append([]string{"xclog"}, args...)
	}
	main()
	os.Exit(0)
}

func TestShowFailureRemovesPhysicalArchive(t *testing.T) {
	dir := t.TempDir()
	bin := filepath.Join(dir, "bin")
	if err := os.Mkdir(bin, 0755); err != nil {
		t.Fatal(err)
	}
	script := `#!/bin/sh
if [ "$1" = collect ]; then
    while [ "$#" -gt 0 ]; do
        if [ "$1" = --output ]; then mkdir "$2"; exit 0; fi
        shift
    done
fi
echo fixture-log-query-failed >&2
exit 23
`
	if err := os.WriteFile(filepath.Join(bin, "log"), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin+string(os.PathListSeparator)+os.Getenv("PATH"))
	t.Setenv("TMPDIR", dir)
	t.Setenv("AXIOM_XCLOG_TEST_CLI", "1")
	t.Setenv("AXIOM_XCLOG_TEST_ARGS", `["show","Fixture","--device-udid","00008101-000A1234AB1234CD"]`)
	cmd := exec.Command(os.Args[0], "-test.run=^TestXclogCLIHelper$")
	output, err := cmd.CombinedOutput()
	exit, ok := err.(*exec.ExitError)
	if !ok || exit.ExitCode() != 1 || !strings.Contains(string(output), "fixture-log-query-failed") {
		t.Fatalf("expected failed history query: error %v, output %q", err, output)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, entry := range entries {
		names = append(names, entry.Name())
	}
	if want := []string{"bin"}; !reflect.DeepEqual(names, want) {
		t.Fatalf("remaining temporary files = %q, want %q", names, want)
	}
}

// Argument-order independence (axiom-v9in): launch/attach/show must accept flags
// before or after the target, with identical results. xclog historically forced
// the target first (os.Args[2]); this guards the fix.
func TestParseTargetCommandOrderIndependent(t *testing.T) {
	before := []string{"--max-lines", "50", "com.example.app"}
	after := []string{"com.example.app", "--max-lines", "50"}
	tb, cb, codeb := parseTargetCommand("launch", before)
	ta, ca, codea := parseTargetCommand("launch", after)
	if codeb != 0 || codea != 0 {
		t.Fatalf("both orders must succeed: before=%d after=%d", codeb, codea)
	}
	if tb != ta || cb.MaxLines != ca.MaxLines {
		t.Errorf("order changed result: before(target=%q max=%d) != after(target=%q max=%d)", tb, cb.MaxLines, ta, ca.MaxLines)
	}
	if ta != "com.example.app" || ca.MaxLines != 50 {
		t.Errorf("unexpected parse: target=%q max-lines=%d", ta, ca.MaxLines)
	}
}

func TestParseTargetCommandMissingTarget(t *testing.T) {
	old := os.Stderr
	r, w, _ := os.Pipe()
	os.Stderr = w
	t.Cleanup(func() { os.Stderr = old; w.Close(); r.Close() })
	if _, _, code := parseTargetCommand("launch", []string{"--max-lines", "50"}); code != 1 {
		t.Errorf("expected usage error (1) when target missing, got %d", code)
	}
}

func TestFormatJSON(t *testing.T) {
	line := LogLine{
		Time:   time.Date(2025, 3, 15, 10, 30, 45, 123000000, time.UTC),
		Source: SourceStdout,
		Text:   "Hello world",
	}

	got := string(formatJSON(line))
	want := `{"time":"10:30:45.123","source":"print","text":"Hello world"}` + "\n"
	if got != want {
		t.Errorf("formatJSON() = %q, want %q", got, want)
	}
}

func TestFormatJSONEscaping(t *testing.T) {
	line := LogLine{
		Time:   time.Date(2025, 3, 15, 10, 0, 0, 0, time.UTC),
		Source: SourceOSLog,
		Text:   `key: "value" with \backslash and	tab`,
	}

	got := string(formatJSON(line))
	want := `{"time":"10:00:00.000","source":"os_log","text":"key: \"value\" with \\backslash and\ttab"}` + "\n"
	if got != want {
		t.Errorf("formatJSON() = %q, want %q", got, want)
	}
}

func TestFormatJSONRichFields(t *testing.T) {
	line := LogLine{
		Time:      time.Date(2025, 3, 15, 10, 30, 0, 0, time.UTC),
		Source:    SourceOSLog,
		Level:     "Error",
		Subsystem: "com.example.MyApp",
		Category:  "networking",
		Process:   "MyApp",
		PID:       12345,
		Text:      "Connection failed",
	}

	got := string(formatJSON(line))

	var parsed jsonOutputLine
	if err := json.Unmarshal([]byte(got), &parsed); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}

	if parsed.Level != "error" {
		t.Errorf("level = %q, want %q", parsed.Level, "error")
	}
	if parsed.Subsystem != "com.example.MyApp" {
		t.Errorf("subsystem = %q, want %q", parsed.Subsystem, "com.example.MyApp")
	}
	if parsed.Category != "networking" {
		t.Errorf("category = %q, want %q", parsed.Category, "networking")
	}
	if parsed.Process != "MyApp" {
		t.Errorf("process = %q, want %q", parsed.Process, "MyApp")
	}
	if parsed.PID != 12345 {
		t.Errorf("pid = %d, want %d", parsed.PID, 12345)
	}
}

func TestFormatJSONOmitsEmpty(t *testing.T) {
	line := LogLine{
		Time:   time.Date(2025, 3, 15, 10, 0, 0, 0, time.UTC),
		Source: SourceStdout,
		Text:   "Hello from print",
	}

	got := string(formatJSON(line))

	if strings.Contains(got, `"level"`) {
		t.Errorf("stdout line should omit level, got: %s", got)
	}
	if strings.Contains(got, `"subsystem"`) {
		t.Errorf("stdout line should omit subsystem, got: %s", got)
	}
	if strings.Contains(got, `"pid"`) {
		t.Errorf("stdout line should omit pid, got: %s", got)
	}
}

func TestFormatJSONSources(t *testing.T) {
	tests := []struct {
		source Source
		tag    string
	}{
		{SourceStdout, "print"},
		{SourceStderr, "stderr"},
		{SourceOSLog, "os_log"},
	}

	for _, tt := range tests {
		t.Run(tt.tag, func(t *testing.T) {
			line := LogLine{
				Time:   time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC),
				Source: tt.source,
				Text:   "test",
			}
			got := string(formatJSON(line))
			if !strings.Contains(got, `"source":"`+tt.tag+`"`) {
				t.Errorf("expected source %q in %s", tt.tag, got)
			}
		})
	}
}

func TestMatchesFilter(t *testing.T) {
	tests := []struct {
		text    string
		pattern string
		want    bool
	}{
		{"CoverSheet activated", "CoverSheet", true},
		{"SpringBoard loaded", "CoverSheet", false},
		{"Error: connection failed", "(?i)error", true},
		{"everything is fine", "(?i)error", false},
		{"any line", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.text+"_"+tt.pattern, func(t *testing.T) {
			var cfg Config
			if tt.pattern != "" {
				cfg.filterRe = regexp.MustCompile(tt.pattern)
			}
			got := matchesFilter(tt.text, &cfg)
			if got != tt.want {
				t.Errorf("matchesFilter(%q, %q) = %v, want %v", tt.text, tt.pattern, got, tt.want)
			}
		})
	}
}

func TestMatchesFilterNilRegex(t *testing.T) {
	cfg := Config{}
	if !matchesFilter("anything", &cfg) {
		t.Error("nil filterRe should match everything")
	}
}

func TestMatchesFilterPreCompiled(t *testing.T) {
	cfg := Config{filterRe: regexp.MustCompile("hello")}
	if !matchesFilter("hello world", &cfg) {
		t.Error("should match")
	}
	if matchesFilter("goodbye world", &cfg) {
		t.Error("should not match")
	}
}

func TestSubsystemValidation(t *testing.T) {
	valid := []string{"com.example.MyApp", "MyApp", "com.apple.UIKit", "my_app.v2"}
	for _, s := range valid {
		if !subsystemRe.MatchString(s) {
			t.Errorf("subsystemRe should accept %q", s)
		}
	}

	invalid := []string{"' OR 1==1", "foo bar", "a;b", "x'y"}
	for _, s := range invalid {
		if subsystemRe.MatchString(s) {
			t.Errorf("subsystemRe should reject %q", s)
		}
	}
}

func TestProcessName(t *testing.T) {
	tests := []struct {
		path string
		want string
	}{
		{"/usr/libexec/SpringBoard", "SpringBoard"},
		{"/Applications/MyApp.app/MyApp", "MyApp"},
		{"/kernel", "kernel"},
		{"MyApp", "MyApp"},
		{"", ""},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := processName(tt.path)
			if got != tt.want {
				t.Errorf("processName(%q) = %q, want %q", tt.path, got, tt.want)
			}
		})
	}
}

func TestStreamOSLogNDJSON(t *testing.T) {
	input := `Filtering the log data using "processIdentifier == 123"
{"timestamp":"2025-03-15 10:30:45.123456-0700","eventMessage":"Hello from Logger","messageType":"Default","subsystem":"com.example.MyApp","category":"general","processID":123,"processImagePath":"/Applications/MyApp.app/MyApp"}
{"timestamp":"2025-03-15 10:30:46.000000-0700","eventMessage":"Error occurred","messageType":"Error","subsystem":"com.example.MyApp","category":"networking","processID":123,"processImagePath":"/Applications/MyApp.app/MyApp"}
`

	lines := make(chan LogLine, 10)
	cfg := &Config{}

	go func() {
		streamOSLogNDJSON(strings.NewReader(input), lines, cfg)
		close(lines)
	}()

	var results []LogLine
	for line := range lines {
		results = append(results, line)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 lines, got %d", len(results))
	}

	first := results[0]
	if first.Text != "Hello from Logger" {
		t.Errorf("text = %q, want %q", first.Text, "Hello from Logger")
	}
	if first.Level != "Default" {
		t.Errorf("level = %q, want %q", first.Level, "Default")
	}
	if first.Subsystem != "com.example.MyApp" {
		t.Errorf("subsystem = %q, want %q", first.Subsystem, "com.example.MyApp")
	}
	if first.Process != "MyApp" {
		t.Errorf("process = %q, want %q", first.Process, "MyApp")
	}
	if first.PID != 123 {
		t.Errorf("pid = %d, want %d", first.PID, 123)
	}
	if first.Time.Hour() != 10 || first.Time.Minute() != 30 {
		t.Errorf("time = %v, want 10:30", first.Time.Format("15:04"))
	}

	if results[1].Level != "Error" {
		t.Errorf("second level = %q, want %q", results[1].Level, "Error")
	}
}

func TestStreamOSLogNDJSONWithFilter(t *testing.T) {
	input := `{"timestamp":"2025-03-15 10:00:00.000000-0700","eventMessage":"keep this","messageType":"Default","subsystem":"","category":"","processID":1,"processImagePath":"/bin/test"}
{"timestamp":"2025-03-15 10:00:01.000000-0700","eventMessage":"drop this","messageType":"Default","subsystem":"","category":"","processID":1,"processImagePath":"/bin/test"}
`
	lines := make(chan LogLine, 10)
	cfg := &Config{filterRe: regexp.MustCompile("keep")}

	go func() {
		streamOSLogNDJSON(strings.NewReader(input), lines, cfg)
		close(lines)
	}()

	var results []LogLine
	for line := range lines {
		results = append(results, line)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 filtered line, got %d", len(results))
	}
}

func TestStreamOSLogNDJSONEmptyInput(t *testing.T) {
	lines := make(chan LogLine, 10)
	cfg := &Config{}

	go func() {
		streamOSLogNDJSON(strings.NewReader(""), lines, cfg)
		close(lines)
	}()

	var results []LogLine
	for line := range lines {
		results = append(results, line)
	}

	if len(results) != 0 {
		t.Errorf("expected 0 lines, got %d", len(results))
	}
}

func TestStreamOSLogNDJSONSkipsEmptyMessages(t *testing.T) {
	input := `{"timestamp":"2025-03-15 10:00:00.000000-0700","eventMessage":"","messageType":"Default","subsystem":"","category":"","processID":1,"processImagePath":""}
{"timestamp":"2025-03-15 10:00:00.000000-0700","eventMessage":"real message","messageType":"Default","subsystem":"","category":"","processID":1,"processImagePath":""}
`
	lines := make(chan LogLine, 10)
	cfg := &Config{}

	go func() {
		streamOSLogNDJSON(strings.NewReader(input), lines, cfg)
		close(lines)
	}()

	var results []LogLine
	for line := range lines {
		results = append(results, line)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 line (empty skipped), got %d", len(results))
	}
}

func TestStreamOSLogNDJSONMalformedLines(t *testing.T) {
	input := `not json at all
{"timestamp":"2025-03-15 10:00:00.000000-0700","eventMessage":"valid","messageType":"Default","subsystem":"","category":"","processID":1,"processImagePath":""}
{broken json
{"timestamp":"2025-03-15 10:00:01.000000-0700","eventMessage":"also valid","messageType":"Error","subsystem":"","category":"","processID":1,"processImagePath":""}
`
	lines := make(chan LogLine, 10)
	cfg := &Config{}

	go func() {
		streamOSLogNDJSON(strings.NewReader(input), lines, cfg)
		close(lines)
	}()

	var results []LogLine
	for line := range lines {
		results = append(results, line)
	}

	if len(results) != 2 {
		t.Fatalf("expected 2 valid lines (malformed skipped), got %d", len(results))
	}
}

func TestDeviceUDIDValidation(t *testing.T) {
	valid := []string{
		"00001234-000A1234AB1234CD",
		"abcdef1234567890abcdef1234567890abcdef12",
		"00008101-001A2B3C4D5E6F78",
	}
	for _, s := range valid {
		if !deviceUDIDRe.MatchString(s) {
			t.Errorf("deviceUDIDRe should accept %q", s)
		}
	}

	invalid := []string{"--output /etc/passwd", "not-a-udid!", "abc xyz", ""}
	for _, s := range invalid {
		if deviceUDIDRe.MatchString(s) {
			t.Errorf("deviceUDIDRe should reject %q", s)
		}
	}
}

func TestLastDurationValidation(t *testing.T) {
	valid := []string{"5m", "30m", "2h", "1d", "120m"}
	for _, s := range valid {
		if !lastDurationRe.MatchString(s) {
			t.Errorf("lastDurationRe should accept %q", s)
		}
	}

	invalid := []string{"--output", "5", "5s", "abc", "5m2h", ""}
	for _, s := range invalid {
		if lastDurationRe.MatchString(s) {
			t.Errorf("lastDurationRe should reject %q", s)
		}
	}
}

// FuzzStreamOSLogNDJSON exercises the ndjson parser with arbitrary input.
// Run: go test -fuzz=FuzzStreamOSLogNDJSON -fuzztime=30s
func FuzzStreamOSLogNDJSON(f *testing.F) {
	f.Add(`{"timestamp":"2025-03-15 10:30:45.123456-0700","eventMessage":"msg","messageType":"Default","subsystem":"","category":"","processID":0,"processImagePath":""}`)
	f.Add(`Filtering header text`)
	f.Add(``)
	f.Add(`{"timestamp":"invalid","eventMessage":"msg","messageType":"Error","subsystem":"","category":"","processID":0,"processImagePath":""}`)
	f.Add(`{"eventMessage":"","messageType":"Default"}`)
	f.Add(`not json`)

	f.Fuzz(func(t *testing.T, input string) {
		lines := make(chan LogLine, 100)
		cfg := &Config{}

		go func() {
			streamOSLogNDJSON(strings.NewReader(input), lines, cfg)
			close(lines)
		}()

		for line := range lines {
			if line.Text == "" {
				t.Error("parsed line with empty text")
			}
			if line.Source != SourceOSLog {
				t.Errorf("source = %v, want SourceOSLog", line.Source)
			}
		}
	})
}

// fakeSimctl writes an xcrun stand-in whose `log stream` behavior is
// streamBody, so a capture's outcome can be driven without a simulator.
func fakeSimctl(t *testing.T, streamBody string) {
	t.Helper()
	dir := t.TempDir()
	script := `#!/bin/sh
case "$*" in
"simctl list devices -j") echo '{"devices":{"fixture-runtime":[{"udid":"fixture-udid","state":"Booted"}]}}'; exit 0 ;;
simctl\ launch*) echo "org.example.fixture: 4242"; exec sleep 30 ;;
*" log stream "*) ` + streamBody + ` ;;
esac
exit 0
`
	if err := os.WriteFile(filepath.Join(dir, "xcrun"), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
}

// runXclogCLI runs xclog's main in a subprocess and returns its exit code,
// stdout and stderr.
func runXclogCLI(t *testing.T, args ...string) (int, string, string) {
	t.Helper()
	encoded, err := json.Marshal(args)
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(os.Args[0], "-test.run=^TestXclogCLIHelper$")
	cmd.Env = append(os.Environ(), "AXIOM_XCLOG_TEST_CLI=1", "AXIOM_XCLOG_TEST_ARGS="+string(encoded))
	var stdout, stderr strings.Builder
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	err = cmd.Run()
	code := 0
	if exit, ok := err.(*exec.ExitError); ok {
		code = exit.ExitCode()
	} else if err != nil {
		t.Fatal(err)
	}
	return code, stdout.String(), stderr.String()
}

const fixtureNDJSONLine = `{"eventMessage":"fixture-marker","timestamp":"2026-10-15 12:00:00.000000-0700","messageType":"Default","processImagePath":"/Fixture","subsystem":"","category":""}`

// Axiom-p89j: a log stream that dies on its own is a failed capture, even
// after it delivered lines; stopping it at --timeout or --max-lines is not.
func TestCaptureReportsLogStreamFailure(t *testing.T) {
	failing := `echo '` + fixtureNDJSONLine + `'; echo fixture-log-stream-failed >&2; exit 23`
	steady := `echo '` + fixtureNDJSONLine + `'; echo '` + fixtureNDJSONLine + `'; exec sleep 30`
	for _, test := range []struct {
		name, stream string
		args         []string
		wantCode     int
		wantStderr   string
	}{
		{"attach, stream fails", failing, []string{"attach", "Fixture", "--device", "fixture-udid", "--timeout", "10s"}, 1, "xclog: log stream exited early (exit status 23)"},
		{"launch, stream fails", failing, []string{"launch", "org.example.fixture", "--device", "fixture-udid", "--timeout", "4s"}, 1, "xclog: log stream exited early (exit status 23)"},
		{"attach, stream killed by SIGINT", `echo '` + fixtureNDJSONLine + `'; kill -INT $$`, []string{"attach", "Fixture", "--device", "fixture-udid", "--timeout", "10s"}, 0, ""},
		{"attach, Ctrl-C to xclog and stream", `echo '` + fixtureNDJSONLine + `'; sleep 0.3; kill -INT $PPID; sleep 0.2; exit 130`, []string{"attach", "Fixture", "--device", "fixture-udid", "--timeout", "10s"}, 0, ""},
		{"attach, stopped at timeout", steady, []string{"attach", "Fixture", "--device", "fixture-udid", "--timeout", "1s"}, 0, ""},
		{"attach, stopped at max-lines", steady, []string{"attach", "Fixture", "--device", "fixture-udid", "--timeout", "10s", "--max-lines", "1"}, 0, ""},
	} {
		t.Run(test.name, func(t *testing.T) {
			fakeSimctl(t, test.stream)
			code, stdout, stderr := runXclogCLI(t, test.args...)
			if code != test.wantCode || !strings.Contains(stdout, "fixture-marker") || !strings.Contains(stderr, test.wantStderr) {
				t.Fatalf("exit %d, stdout %q, stderr %q; want exit %d, the captured marker on stdout, and %q on stderr",
					code, stdout, stderr, test.wantCode, test.wantStderr)
			}
		})
	}
}

// TestListRejectsStrayArgument guards the Axiom-8qam class: `list` parsed with
// the stdlib parser, which stops at the first positional, so `list stray
// --device <udid>` dropped --device and listed the booted simulator instead.
func TestListRejectsStrayArgument(t *testing.T) {
	dir := t.TempDir()
	marker := filepath.Join(dir, "xcrun-ran")
	script := "#!/bin/sh\ntouch '" + marker + "'\nexit 0\n"
	if err := os.WriteFile(filepath.Join(dir, "xcrun"), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
	t.Setenv("AXIOM_XCLOG_TEST_CLI", "1")
	t.Setenv("AXIOM_XCLOG_TEST_ARGS", `["list","stray","--device","fixture-udid"]`)
	output, err := exec.Command(os.Args[0], "-test.run=^TestXclogCLIHelper$").CombinedOutput()
	exit, ok := err.(*exec.ExitError)
	_, ranErr := os.Stat(marker)
	if !ok || exit.ExitCode() != 2 || !strings.Contains(string(output), `list: unexpected argument "stray"`) || ranErr == nil {
		t.Fatalf("list stray --device: error %v, output %q; want exit 2 naming the stray argument, without running xcrun", err, output)
	}
}

// TestListHelpExitsZero pins `xclog list --help` at exit 0: the npm package
// smoke test and the Codex doctor probe it to prove the binary runs.
func TestListHelpExitsZero(t *testing.T) {
	t.Setenv("AXIOM_XCLOG_TEST_CLI", "1")
	t.Setenv("AXIOM_XCLOG_TEST_ARGS", `["list","--help"]`)
	output, err := exec.Command(os.Args[0], "-test.run=^TestXclogCLIHelper$").CombinedOutput()
	if err != nil || !strings.Contains(string(output), "-device") {
		t.Fatalf("list --help: error %v, output %q; want exit 0 with the flag usage", err, output)
	}
}
