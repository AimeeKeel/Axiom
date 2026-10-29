package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"reflect"
	"strings"
	"syscall"
	"testing"
	"time"
)

const (
	fixtureArgs = "/tmp/Fixture App.app/Contents/MacOS/Fixture App baseline"
	testToken   = "0123456789abcdef0123456789abcdef"
	otherToken  = "ffffffffffffffffffffffffffffffff"
	startA      = "Wed Oct 28 16:34:41 2026"
)

var fixtureLaunch = []string{"/tmp/Fixture App.app/Contents/MacOS/Fixture App", "baseline"}

func tokenEnv(token string) string {
	return "HOME=/tmp/home " + recordTokenVar + "=" + token + " PATH=/bin"
}

func proc(pid, ppid int, state, env string) procInfo {
	return procInfo{PID: pid, PPID: ppid, State: state, Start: startA, Args: fixtureArgs, Env: env}
}

func TestParsePS(t *testing.T) {
	out := "    1     0 Ss   Tue Oct 20 08:03:18 2026     /sbin/launchd\n" +
		"33472     1 T    Wed Oct  8 16:34:41 2026     /tmp/My App.app/Contents/MacOS/My App baseline\n" +
		"garbage\n"
	got := parsePS(out)
	want := []procInfo{
		{PID: 1, PPID: 0, State: "Ss", Start: "Tue Oct 20 08:03:18 2026", Args: "/sbin/launchd"},
		{PID: 33472, PPID: 1, State: "T", Start: "Wed Oct 8 16:34:41 2026", Args: "/tmp/My App.app/Contents/MacOS/My App baseline"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("parsePS =\n%+v\nwant\n%+v", got, want)
	}
}

func TestAttachEnv(t *testing.T) {
	plain := []procInfo{
		{PID: 10, Start: startA, Args: fixtureArgs},
		{PID: 11, Start: startA, Args: "/usr/bin/xctrace record --env " + recordTokenVar + "=" + testToken},
		{PID: 12, Start: startA, Args: fixtureArgs},
		{PID: 13, Start: startA, Args: fixtureArgs},
		{PID: 14, Start: startA, Args: fixtureArgs},
	}
	withEnv := []procInfo{
		{PID: 10, Start: startA, Args: fixtureArgs + " " + tokenEnv(testToken)},
		{PID: 11, Start: startA, Args: "/usr/bin/xctrace record --env " + recordTokenVar + "=" + testToken + " HOME=/tmp/home"},
		{PID: 12, Start: "Wed Oct 28 16:35:00 2026", Args: fixtureArgs + " " + tokenEnv(testToken)}, // PID reused between the two listings
		{PID: 13, Start: startA, Args: "/other " + tokenEnv(testToken)},                             // command column doesn't start with the plain one
		{PID: 14, Start: startA, Args: fixtureArgs},                                                 // environment hidden from ps
	}
	got := attachEnv(plain, withEnv)
	want := []procInfo{
		{PID: 10, Start: startA, Args: fixtureArgs, Env: tokenEnv(testToken)},
		{PID: 11, Start: startA, Args: "/usr/bin/xctrace record --env " + recordTokenVar + "=" + testToken, Env: "HOME=/tmp/home"},
		{PID: 12, Start: startA, Args: fixtureArgs},
		{PID: 13, Start: startA, Args: fixtureArgs},
		{PID: 14, Start: startA, Args: fixtureArgs},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("attachEnv =\n%+v\nwant\n%+v", got, want)
	}
}

// The real ps must list a child of this test with its parent, a five-token start time
// and the environment this test gave it.
// TestHelperSleep is the child process for TestListProcessesShowsChildEnvironment.
func TestHelperSleep(t *testing.T) {
	if os.Getenv("XCPROF_HELPER_SLEEP") == "" {
		t.Skip("helper process only")
	}
	time.Sleep(5 * time.Second)
}

// The child is the test binary because ps -E hides the environment of Apple platform
// binaries such as /bin/sleep.
func TestListProcessesShowsChildEnvironment(t *testing.T) {
	cmd := exec.Command(os.Args[0], "-test.run=^TestHelperSleep$")
	cmd.Env = append(os.Environ(), "XCPROF_HELPER_SLEEP=1", recordTokenVar+"="+testToken)
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = cmd.Process.Kill(); _ = cmd.Wait() })
	procs, err := listProcesses(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	for _, p := range procs {
		if p.PID == cmd.Process.Pid {
			wantArgs := strings.Join(cmd.Args, " ")
			if p.PPID != os.Getpid() || len(strings.Fields(p.Start)) != 5 || p.Args != wantArgs || !hasToken(p.Env, testToken) {
				t.Fatalf("child = %+v; want ppid %d, five-token start, args %q and the token in its environment", p, os.Getpid(), wantArgs)
			}
			return
		}
	}
	t.Fatalf("child pid %d not among %d processes", cmd.Process.Pid, len(procs))
}

func TestLaunchCommandLines(t *testing.T) {
	cases := []struct {
		name string
		cmd  []string
		want []string
	}{
		{"absolute", []string{"/bin/app", "-v"}, []string{"/bin/app -v"}},
		{"relative resolved against cwd", []string{"./bin/app", "-v"}, []string{"./bin/app -v", "/work/bin/app -v"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := launchCommandLines(c.cmd, "/work"); !reflect.DeepEqual(got, c.want) {
				t.Errorf("launchCommandLines(%q) = %q, want %q", c.cmd, got, c.want)
			}
		})
	}
}

func TestHasToken(t *testing.T) {
	cases := []struct {
		env  string
		want bool
	}{
		{tokenEnv(testToken), true},
		{"HOME=/tmp/home", false},
		{tokenEnv(otherToken), false},
		{"X=" + recordTokenVar + "=" + testToken, false},
		{"", false},
	}
	for _, c := range cases {
		if got := hasToken(c.env, testToken); got != c.want {
			t.Errorf("hasToken(%q) = %v, want %v", c.env, got, c.want)
		}
	}
}

func TestNewRecordToken(t *testing.T) {
	a, b := newRecordToken(), newRecordToken()
	if len(a) != 32 || strings.Trim(a, "0123456789abcdef") != "" || a == b {
		t.Fatalf("tokens %q, %q: want two distinct 32-char hex strings", a, b)
	}
}

func TestBuildRecordArgvPassesTokenOnlyForLaunch(t *testing.T) {
	launch := buildRecordArgv(recordSpec{instruments: []string{"CPU Profiler"}, output: "/t.trace", timeLimit: "1s",
		launchCmd: []string{"/bin/app", "baseline"}, launchToken: testToken})
	want := []string{"--env", recordTokenVar + "=" + testToken, "--launch", "--", "/bin/app", "baseline"}
	if got := launch[len(launch)-len(want):]; !reflect.DeepEqual(got, want) {
		t.Errorf("launch argv tail = %q, want %q", got, want)
	}
	attach := buildRecordArgv(recordSpec{instruments: []string{"CPU Profiler"}, output: "/t.trace", timeLimit: "1s", attach: "MyApp"})
	if strings.Contains(strings.Join(attach, " "), recordTokenVar) {
		t.Errorf("attach argv carries the launch token: %q", attach)
	}
}

// fakeProcs stands in for ps and kill; killed processes vanish from later listings
// unless sticky. failAfterKill makes every listing after the first kill fail.
type fakeProcs struct {
	procs          []procInfo
	listErr        error
	killErr        error
	sticky         bool
	reuseAfterKill bool // a killed PID reappears as a process started later
	failAfterKill  bool
	killed         []int
	listCtxErr     error      // ctx.Err() seen by the last listing
	later          []procInfo // replaces procs from the second listing on
	events         []string   // "list" and "kill <pid>", in order
	lists          int
}

func (f *fakeProcs) install(t *testing.T) {
	t.Helper()
	origList, origKill, origWait, origRecheck := listProcesses, killProcess, killWaitTimeout, launchRecheckDelay
	t.Cleanup(func() {
		listProcesses, killProcess, killWaitTimeout, launchRecheckDelay = origList, origKill, origWait, origRecheck
	})
	killWaitTimeout = 20 * time.Millisecond
	launchRecheckDelay = time.Millisecond
	listProcesses = func(ctx context.Context) ([]procInfo, error) {
		f.listCtxErr = ctx.Err()
		f.events = append(f.events, "list")
		if f.lists++; f.lists == 2 && f.later != nil {
			f.procs = f.later
		}
		if f.listErr != nil {
			return nil, f.listErr
		}
		if f.failAfterKill && len(f.killed) > 0 {
			return nil, errors.New("ps: exit status 1")
		}
		var live []procInfo
		for _, p := range f.procs {
			gone := false
			for _, k := range f.killed {
				gone = gone || (k == p.PID && !f.sticky)
			}
			switch {
			case !gone:
				live = append(live, p)
			case f.reuseAfterKill:
				p.Start = "Wed Oct 28 16:59:59 2026"
				live = append(live, p)
			}
		}
		return live, nil
	}
	killProcess = func(pid int) error {
		f.events = append(f.events, fmt.Sprintf("kill %d", pid))
		if f.killErr != nil {
			return f.killErr
		}
		f.killed = append(f.killed, pid)
		return nil
	}
}

func TestCleanupLaunch(t *testing.T) {
	ours := tokenEnv(testToken)
	cases := []struct {
		name       string
		fake       fakeProcs
		wantKilled []int
		want       *LaunchCleanup
	}{
		{
			name:       "stopped copy carrying this recording's token is stopped",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours)}},
			wantKilled: []int{33472},
			want:       &LaunchCleanup{Killed: []int{33472}},
		},
		{
			name:       "stopped session leader (Ts) is stopped too",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "Ts", ours)}},
			wantKilled: []int{33472},
			want:       &LaunchCleanup{Killed: []int{33472}},
		},
		{
			name:       "every stopped copy is killed before any is confirmed",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours), proc(33480, 1, "T", ours)}},
			wantKilled: []int{33472, 33480},
			want:       &LaunchCleanup{Killed: []int{33472, 33480}},
		},
		{
			name:       "process that becomes a stopped orphan by the recheck is killed",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 777, "R", ours)}, later: []procInfo{proc(33472, 1, "T", ours)}},
			wantKilled: []int{33472},
			want:       &LaunchCleanup{Killed: []int{33472}},
		},
		{
			name: "copy with extra arguments and a hidden environment is not reported",
			fake: fakeProcs{procs: []procInfo{{PID: 33472, PPID: 1, State: "T", Start: startA, Args: fixtureArgs + " extra"}}},
		},
		{
			name: "processes without this recording's token are untouched and unreported",
			fake: fakeProcs{procs: []procInfo{proc(24062, 24061, "RN", "HOME=/tmp/home"), proc(24063, 1, "T", tokenEnv(otherToken)),
				{PID: 900, PPID: 1, State: "T", Start: startA, Args: "xctrace record --env " + recordTokenVar + "=" + testToken, Env: "HOME=/tmp/home"}}},
		},
		{
			name: "running process with the token is reported, not stopped",
			fake: fakeProcs{procs: []procInfo{proc(33473, 1, "R", ours)}},
			want: &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33473, PPID: 1, State: "R", Command: fixtureArgs, Reason: reasonNotStopped}}},
		},
		{
			name: "stopped process still parented by another process is reported",
			fake: fakeProcs{procs: []procInfo{proc(33473, 900, "T", ours)}},
			want: &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33473, PPID: 900, State: "T", Command: fixtureArgs, Reason: reasonHasParent}}},
		},
		{
			name: "kill failure is reported",
			fake: fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours)}, killErr: errors.New("operation not permitted")},
			want: &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33472, PPID: 1, State: "T", Command: fixtureArgs,
				Reason: reasonStopFailed + "operation not permitted"}}},
		},
		{
			name:       "process that outlives the kill is reported, not claimed stopped",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours)}, sticky: true},
			wantKilled: []int{33472},
			want:       &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33472, PPID: 1, State: "T", Command: fixtureArgs, Reason: reasonOutlivedKill}}},
		},
		{
			name:       "PID reused by a new process after the kill still counts as stopped",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours)}, reuseAfterKill: true},
			wantKilled: []int{33472},
			want:       &LaunchCleanup{Killed: []int{33472}},
		},
		{
			name:       "exit that can't be confirmed is reported as such",
			fake:       fakeProcs{procs: []procInfo{proc(33472, 1, "T", ours)}, failAfterKill: true},
			wantKilled: []int{33472},
			want: &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33472, PPID: 1, State: "T", Command: fixtureArgs,
				Reason: reasonUnconfirmed + "ps: exit status 1"}}},
		},
		{
			name: "stopped launch-command copy whose environment ps hides is reported, not stopped",
			fake: fakeProcs{procs: []procInfo{proc(33472, 1, "T", ""), proc(33500, 1, "R", ""), proc(33501, 77, "T", "")}},
			want: &LaunchCleanup{Survivors: []LaunchSurvivor{{PID: 33472, PPID: 1, State: "T", Command: fixtureArgs, Reason: reasonEnvUnreadable}}},
		},
		{
			name: "inventory failure is an error",
			fake: fakeProcs{listErr: errors.New("ps: exit status 1")},
			want: &LaunchCleanup{Errors: []string{"process inventory failed after the recording; launched processes were not checked: ps: exit status 1"}},
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			c.fake.install(t)
			got := cleanupLaunch(context.Background(), testToken, launchCommandLines(fixtureLaunch, "/"))
			if len(c.fake.killed) == 2 && !reflect.DeepEqual(c.fake.events[:3], []string{"list", "kill 33472", "kill 33480"}) {
				t.Errorf("events %q: want both kills right after the listing", c.fake.events)
			}
			if !reflect.DeepEqual(c.fake.killed, c.wantKilled) || !reflect.DeepEqual(got, c.want) {
				t.Errorf("killed %v, cleanup %+v; want killed %v, cleanup %+v", c.fake.killed, got, c.wantKilled, c.want)
			}
		})
	}
}

// runLaunchRecord drives runRecord for a launch. During the stubbed recording, pid
// 33472 appears carrying whatever token runRecord passed to xctrace; during() runs
// inside the recording.
func runLaunchRecord(t *testing.T, f *fakeProcs, saveTrace bool, extra []string, during func(ctx context.Context) error) (int, RecordReport) {
	t.Helper()
	t.Setenv("XCPROF_TRACE_ROOT", t.TempDir())
	orig := runRecordCmd
	t.Cleanup(func() { runRecordCmd = orig })
	runRecordCmd = func(ctx context.Context, _ time.Duration, argv []string) (ExecResult, error) {
		for i, a := range argv {
			if a == "--env" {
				f.procs = []procInfo{proc(33472, 1, "T", "HOME=/tmp/home "+argv[i+1])}
			}
		}
		if saveTrace {
			if err := os.MkdirAll(outputPathFromArgv(argv), 0o755); err != nil {
				t.Fatal(err)
			}
		}
		if during != nil {
			if err := during(ctx); err != nil {
				return ExecResult{}, fmt.Errorf("xcrun cancelled: %w", err)
			}
			return ExecResult{}, nil
		}
		return ExecResult{}, errors.New("xcrun: exit status 54: ")
	}
	stubExportableTOC(t)
	var buf bytes.Buffer
	args := append(append([]string{"--preset", "cpu", "--allow-launch", "--time-limit", "1s"}, extra...), "--", "/bin/app", "baseline")
	code := runRecord(&buf, args)
	var rep RecordReport
	if err := json.Unmarshal(buf.Bytes(), &rep); err != nil {
		t.Fatalf("invalid JSON: %v\n%s", err, buf.String())
	}
	return code, rep
}

func TestRunRecordStopsOwnedCopyWhetherOrNotTheTraceSaved(t *testing.T) {
	for _, c := range []struct {
		saved    bool
		wantCode int
	}{{true, 0}, {false, 2}} {
		f := &fakeProcs{}
		f.install(t)
		code, rep := runLaunchRecord(t, f, c.saved, nil, nil)
		if code != c.wantCode || !reflect.DeepEqual(f.killed, []int{33472}) ||
			!reflect.DeepEqual(rep.LaunchCleanup, &LaunchCleanup{Killed: []int{33472}}) {
			t.Errorf("saved=%v: code %d, killed %v, cleanup %+v; want code %d and pid 33472 stopped",
				c.saved, code, f.killed, rep.LaunchCleanup, c.wantCode)
		}
	}
}

// SIGINT (Ctrl-C) or SIGTERM (an MCP client's timeout) mid-recording must cancel the
// recorder and still run cleanup, with a context the signal didn't cancel.
func TestRunRecordCleansUpAfterInterrupt(t *testing.T) {
	for _, sig := range []syscall.Signal{syscall.SIGINT, syscall.SIGTERM} {
		f := &fakeProcs{}
		f.install(t)
		code, rep := runLaunchRecord(t, f, true, nil, func(ctx context.Context) error {
			if err := syscall.Kill(os.Getpid(), sig); err != nil {
				t.Fatal(err)
			}
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(5 * time.Second):
				t.Fatalf("%v did not cancel the recording context", sig)
				return nil
			}
		})
		wantNotes := []string{"recording interrupted; the saved trace covers the time before the interrupt"}
		if code != 0 || f.listCtxErr != nil || !reflect.DeepEqual(rep.LaunchCleanup, &LaunchCleanup{Killed: []int{33472}}) ||
			!reflect.DeepEqual(rep.Notes, wantNotes) {
			t.Errorf("%v: code %d, cleanup ctx err %v, cleanup %+v, notes %q; want the copy stopped and %q",
				sig, code, f.listCtxErr, rep.LaunchCleanup, rep.Notes, wantNotes)
		}
	}
}

func TestRunRecordSkipsLocalCleanupWithoutALocalLaunch(t *testing.T) {
	origList := listProcesses
	t.Cleanup(func() { listProcesses = origList })
	listProcesses = func(context.Context) ([]procInfo, error) {
		t.Fatal("local processes must not be inventoried")
		return nil, nil
	}
	root := t.TempDir()
	t.Setenv("XCPROF_TRACE_ROOT", root)
	orig := runRecordCmd
	t.Cleanup(func() { runRecordCmd = orig })
	runRecordCmd = func(_ context.Context, _ time.Duration, argv []string) (ExecResult, error) {
		return ExecResult{}, os.MkdirAll(outputPathFromArgv(argv), 0o755)
	}
	stubExportableTOC(t)
	for _, args := range [][]string{
		{"--preset", "cpu", "--output", root + "/attach.trace", "--attach", "MyApp"},
		{"--preset", "cpu", "--output", root + "/device.trace", "--device", "00008110-000A", "--allow-launch", "--", "/bin/app"},
		{"--preset", "cpu", "--output", root + "/all.trace", "--all-processes", "--allow-all-processes"},
	} {
		var buf bytes.Buffer
		if code := runRecord(&buf, args); code != 0 {
			t.Fatalf("%v: exit = %d: %s", args, code, buf.String())
		}
	}
}

func TestWriteRecordHumanShowsLaunchCleanup(t *testing.T) {
	rep := RecordReport{OK: true, LaunchCleanup: &LaunchCleanup{
		Killed:    []int{33472},
		Survivors: []LaunchSurvivor{{PID: 40000, PPID: 1, State: "R", Command: "/bin/app", Reason: reasonNotStopped}},
		Errors:    []string{"process inventory failed after the recording; launched processes were not checked: boom"},
	}}
	var buf bytes.Buffer
	writeRecord(&buf, rep, true)
	for _, want := range []string{
		"  launch cleanup: killed pid 33472\n",
		"  launch survivor: pid 40000 (ppid 1, state R) /bin/app — " + reasonNotStopped + "\n",
		"  launch cleanup error: process inventory failed after the recording; launched processes were not checked: boom\n",
	} {
		if !strings.Contains(buf.String(), want) {
			t.Errorf("human output missing %q:\n%s", want, buf.String())
		}
	}
}

// TestHelperInterrupt is the child process for TestExecRunInterruptible. It writes
// ready once its SIGINT handling is in place; on SIGINT it writes interrupted and
// exits 0, unless told to ignore SIGINT.
func TestHelperInterrupt(t *testing.T) {
	dir := os.Getenv("XCPROF_HELPER_INTERRUPT")
	if dir == "" {
		t.Skip("helper process only")
	}
	sigs := make(chan os.Signal, 1)
	if os.Getenv("XCPROF_HELPER_IGNORE_INT") != "" {
		signal.Ignore(os.Interrupt)
	} else {
		signal.Notify(sigs, os.Interrupt)
	}
	_ = os.WriteFile(filepath.Join(dir, "ready"), nil, 0o644)
	select {
	case <-sigs:
		_ = os.WriteFile(filepath.Join(dir, "interrupted"), nil, 0o644)
		os.Exit(0)
	case <-time.After(30 * time.Second):
	}
}

func TestExecRunInterruptible(t *testing.T) {
	cases := []struct {
		name            string
		grace           time.Duration
		timeout         time.Duration
		cancelAfterInit bool
		ignoreInt       bool
		wantInterrupted bool
		wantErr         func(error) bool
		maxElapsed      time.Duration
	}{
		{"cancel interrupts", time.Second, 20 * time.Second, true, false, true,
			func(err error) bool { return errors.Is(err, context.Canceled) }, 10 * time.Second},
		{"timeout interrupts", time.Second, 2 * time.Second, false, false, true, IsTimeoutError, 10 * time.Second},
		{"ignored interrupt is killed after the grace", 500 * time.Millisecond, 2 * time.Second, false, true, false,
			IsTimeoutError, 10 * time.Second},
		{"no grace kills without interrupting", 0, 2 * time.Second, false, false, false, IsTimeoutError, 10 * time.Second},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			dir := t.TempDir()
			t.Setenv("XCPROF_HELPER_INTERRUPT", dir)
			if c.ignoreInt {
				t.Setenv("XCPROF_HELPER_IGNORE_INT", "1")
			}
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			if c.cancelAfterInit {
				go func() {
					for i := 0; i < 500; i++ {
						if _, err := os.Stat(filepath.Join(dir, "ready")); err == nil {
							cancel()
							return
						}
						time.Sleep(10 * time.Millisecond)
					}
				}()
			}
			began := time.Now()
			_, err := ExecRunInterruptible(ctx, c.timeout, c.grace, os.Args[0], "-test.run=^TestHelperInterrupt$")
			elapsed := time.Since(began)
			_, statErr := os.Stat(filepath.Join(dir, "interrupted"))
			if !c.wantErr(err) || (statErr == nil) != c.wantInterrupted || elapsed > c.maxElapsed {
				t.Errorf("err %v, interrupted %v, elapsed %s; want interrupted %v within %s",
					err, statErr == nil, elapsed, c.wantInterrupted, c.maxElapsed)
			}
		})
	}
}
