package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// A native `xctrace record --launch` can leave a second, stopped copy of the target
// behind (parent launchd, state T) after the recorder and the sampled process exit —
// reproduced with direct xctrace on Xcode 27.2 beta 2 and RC (Axiom-31pb). record
// passes the target a per-recording random token through `xctrace --env`; the copy
// inherits it (measured on 27B48), so only the target and descendants that inherited
// its environment are candidates. Of those, stopped ones parented by launchd are
// killed; anything else is reported, never killed.
//
// When ps hides a process's environment (Apple platform binaries), a stopped orphan
// whose command line equals the launch command is reported instead. That fallback
// misses arguments containing newlines (ps shows them as \012) and .app bundle paths,
// which ps shows as the bundle's executable.

// recordTokenVar is the environment variable carrying the per-recording token.
const recordTokenVar = "XCPROF_RECORD_ID"

type procInfo struct {
	PID, PPID int
	State     string
	Start     string // ps lstart; with the PID it identifies one process instance
	Args      string
	Env       string // space-joined environment, when ps could show it
}

// LaunchSurvivor is a process this recording launched that is still running and
// record did not stop.
type LaunchSurvivor struct {
	PID     int    `json:"pid"`
	PPID    int    `json:"ppid"`
	State   string `json:"state"`
	Command string `json:"command"`
	Reason  string `json:"reason"`
}

// LaunchCleanup reports what record did about processes its launch left behind.
type LaunchCleanup struct {
	Killed    []int            `json:"killed,omitempty"`
	Survivors []LaunchSurvivor `json:"survivors,omitempty"`
	Errors    []string         `json:"errors,omitempty"`
}

const (
	reasonNotStopped   = "still running"
	reasonHasParent    = "parented by a process other than launchd"
	reasonStopFailed   = "stop failed: "
	reasonOutlivedKill = "still present 2s after SIGKILL"
	reasonUnconfirmed  = "SIGKILL sent; exit not confirmed: "
	// Apple platform binaries hide their environment from ps, so their token can't be read.
	reasonEnvUnreadable = "stopped copy of the launch command whose environment ps can't read; ownership not proven"
)

var killWaitTimeout = 2 * time.Second

// launchRecheckDelay is how long cleanup waits before listing again when a process
// carrying the token was still running or still had a parent, in case it was about
// to become a stopped orphan.
var launchRecheckDelay = 500 * time.Millisecond

func newRecordToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b) // crypto/rand.Read never returns an error
	return hex.EncodeToString(b)
}

const psFormat = "pid=,ppid=,stat=,lstart=,command="

// listProcesses lists every process, with the environment of those ps can show
// (the current user's). The command column of `ps -E` is the arguments followed by
// the environment, so the plain listing supplies the split point.
var listProcesses = func(ctx context.Context) ([]procInfo, error) {
	plain, err := runPS(ctx, "-axww")
	if err != nil {
		return nil, err
	}
	withEnv, err := runPS(ctx, "-axwwE")
	if err != nil {
		return nil, err
	}
	return attachEnv(plain, withEnv), nil
}

func runPS(ctx context.Context, flags string) ([]procInfo, error) {
	cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	cmd := exec.CommandContext(cctx, "ps", flags, "-o", psFormat)
	cmd.Env = append(os.Environ(), "LC_ALL=C") // fixed lstart format
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	return parsePS(string(out)), nil
}

var killProcess = func(pid int) error { return syscall.Kill(pid, syscall.SIGKILL) }

// parsePS reads `ps -o pid=,ppid=,stat=,lstart=,command=` output. lstart is five
// tokens; the command is the rest of the line, internal spaces intact.
func parsePS(out string) []procInfo {
	var procs []procInfo
	for _, line := range strings.Split(out, "\n") {
		var fields []string
		rest := line
		for len(fields) < 8 {
			rest = strings.TrimLeft(rest, " \t")
			end := strings.IndexAny(rest, " \t")
			if end < 0 {
				break
			}
			fields = append(fields, rest[:end])
			rest = rest[end:]
		}
		args := strings.TrimSpace(rest)
		if len(fields) < 8 || args == "" {
			continue
		}
		pid, err1 := strconv.Atoi(fields[0])
		ppid, err2 := strconv.Atoi(fields[1])
		if err1 != nil || err2 != nil {
			continue
		}
		procs = append(procs, procInfo{PID: pid, PPID: ppid, State: fields[2],
			Start: strings.Join(fields[3:8], " "), Args: args})
	}
	return procs
}

// attachEnv fills each plain process's Env from the `ps -E` listing, when the same
// instance (PID and start time) appears there with the arguments as a prefix.
func attachEnv(plain, withEnv []procInfo) []procInfo {
	byPID := make(map[int]procInfo, len(withEnv))
	for _, p := range withEnv {
		byPID[p.PID] = p
	}
	out := make([]procInfo, len(plain))
	for i, p := range plain {
		if e, ok := byPID[p.PID]; ok && e.Start == p.Start && strings.HasPrefix(e.Args, p.Args+" ") {
			p.Env = strings.TrimSpace(e.Args[len(p.Args):])
		}
		out[i] = p
	}
	return out
}

func hasToken(env, token string) bool {
	for _, kv := range strings.Fields(env) {
		if kv == recordTokenVar+"="+token {
			return true
		}
	}
	return false
}

// launchCommandLines lists the command lines a process launched from launchCmd can
// show in ps: as given, with argv[0] resolved to an absolute path, and with symlinks
// in that path resolved.
func launchCommandLines(launchCmd []string, cwd string) []string {
	lines := []string{strings.Join(launchCmd, " ")}
	add := func(exe string) {
		line := strings.Join(append([]string{exe}, launchCmd[1:]...), " ")
		for _, l := range lines {
			if l == line {
				return
			}
		}
		lines = append(lines, line)
	}
	exe := launchCmd[0]
	switch {
	case filepath.IsAbs(exe):
	case strings.Contains(exe, "/"):
		exe = filepath.Join(cwd, exe)
	default:
		found, err := exec.LookPath(exe)
		if err != nil {
			return lines
		}
		if exe, err = filepath.Abs(found); err != nil {
			return lines
		}
	}
	add(exe)
	if real, err := filepath.EvalSymlinks(exe); err == nil {
		add(real)
	}
	return lines
}

// cleanupLaunch kills the stopped copies this recording left behind and reports the
// rest of its launched processes. launchLines (from launchCommandLines) identify copies
// whose environment ps can't show. It returns nil when there is nothing to report.
func cleanupLaunch(ctx context.Context, token string, launchLines []string) *LaunchCleanup {
	procs, err := listProcesses(ctx)
	if err != nil {
		return &LaunchCleanup{Errors: []string{
			"process inventory failed after the recording; launched processes were not checked: " + err.Error()}}
	}
	kill, left := classifyLaunch(procs, token, launchLines)
	for _, s := range left {
		if s.Reason == reasonNotStopped || s.Reason == reasonHasParent {
			time.Sleep(launchRecheckDelay)
			if again, err := listProcesses(ctx); err == nil {
				kill, left = classifyLaunch(again, token, launchLines)
			}
			break
		}
	}
	c := &LaunchCleanup{Survivors: left}
	// Signal every candidate before confirming any, so each kill follows the listing
	// that identified it as closely as possible.
	var sent []procInfo
	for _, p := range kill {
		if err := killProcess(p.PID); err != nil {
			c.Survivors = append(c.Survivors, survivorOf(p, reasonStopFailed+err.Error()))
			continue
		}
		sent = append(sent, p)
	}
	confirmKilled(ctx, sent, c)
	if len(c.Killed) == 0 && len(c.Survivors) == 0 {
		return nil
	}
	return c
}

// classifyLaunch splits the listing into processes to kill and processes to report.
func classifyLaunch(procs []procInfo, token string, launchLines []string) (kill []procInfo, left []LaunchSurvivor) {
	for _, p := range procs {
		stoppedOrphan := p.PPID == 1 && strings.HasPrefix(p.State, "T")
		switch {
		case !hasToken(p.Env, token):
			if p.Env == "" && stoppedOrphan && containsString(launchLines, p.Args) {
				left = append(left, survivorOf(p, reasonEnvUnreadable))
			}
		case !strings.HasPrefix(p.State, "T"):
			left = append(left, survivorOf(p, reasonNotStopped))
		case p.PPID != 1:
			left = append(left, survivorOf(p, reasonHasParent))
		default:
			kill = append(kill, p)
		}
	}
	return kill, left
}

func survivorOf(p procInfo, reason string) LaunchSurvivor {
	return LaunchSurvivor{PID: p.PID, PPID: p.PPID, State: p.State, Command: p.Args, Reason: reason}
}

// confirmKilled waits for each signalled instance (PID and start time) to disappear,
// recording it as killed, or as a survivor once killWaitTimeout passes.
func confirmKilled(ctx context.Context, sent []procInfo, c *LaunchCleanup) {
	gone := make([]bool, len(sent))
	deadline := time.Now().Add(killWaitTimeout)
	for remaining := len(sent); remaining > 0; {
		procs, err := listProcesses(ctx)
		if err == nil {
			for i, p := range sent {
				if gone[i] {
					continue
				}
				alive := false
				for _, q := range procs {
					alive = alive || (q.PID == p.PID && q.Start == p.Start)
				}
				if !alive {
					gone[i] = true
					remaining--
				}
			}
		}
		if remaining == 0 {
			break
		}
		if time.Now().After(deadline) {
			for i, p := range sent {
				if gone[i] {
					continue
				}
				gone[i] = true // reported below as a survivor, not killed
				if err != nil {
					c.Survivors = append(c.Survivors, survivorOf(p, reasonUnconfirmed+err.Error()))
				} else {
					c.Survivors = append(c.Survivors, survivorOf(p, reasonOutlivedKill))
				}
				sent[i].PID = -1
			}
			break
		}
		time.Sleep(killWaitTimeout / 10)
	}
	for _, p := range sent {
		if p.PID != -1 {
			c.Killed = append(c.Killed, p.PID)
		}
	}
}

func containsString(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}
