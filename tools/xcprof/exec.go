package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"time"
)

// DefaultExecTimeout is used when no explicit timeout is provided.
// Override via XCPROF_EXEC_TIMEOUT (seconds). xctrace export on a large trace
// can take a while, so the default is generous.
func DefaultExecTimeout() time.Duration {
	if v := os.Getenv("XCPROF_EXEC_TIMEOUT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return time.Duration(n) * time.Second
		}
	}
	return 120 * time.Second
}

// ExecResult captures both stdout and stderr regardless of exit status.
type ExecResult struct {
	Stdout []byte
	Stderr []byte
}

// TimeoutError wraps command timeouts.
type TimeoutError struct {
	Cmd     string
	Timeout time.Duration
}

func (e *TimeoutError) Error() string {
	return fmt.Sprintf("command timed out after %s: %s", e.Timeout, e.Cmd)
}

func IsTimeoutError(err error) bool {
	var te *TimeoutError
	return errors.As(err, &te)
}

// ExecRun runs a command with a timeout, returning both stdout and stderr.
func ExecRun(ctx context.Context, timeout time.Duration, name string, args ...string) (ExecResult, error) {
	return execRun(ctx, timeout, 0, name, args...)
}

// ExecRunInterruptible is ExecRun, except that on cancellation or timeout the command
// gets SIGINT and up to grace to exit before it is killed.
func ExecRunInterruptible(ctx context.Context, timeout, grace time.Duration, name string, args ...string) (ExecResult, error) {
	return execRun(ctx, timeout, grace, name, args...)
}

func execRun(ctx context.Context, timeout, interruptGrace time.Duration, name string, args ...string) (ExecResult, error) {
	if timeout <= 0 {
		timeout = DefaultExecTimeout()
	}
	cctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	cmd := exec.CommandContext(cctx, name, args...)
	if interruptGrace > 0 {
		cmd.Cancel = func() error { return cmd.Process.Signal(os.Interrupt) }
		cmd.WaitDelay = interruptGrace
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	res := ExecResult{Stdout: stdout.Bytes(), Stderr: stderr.Bytes()}
	if err == nil {
		return res, nil
	}
	select {
	case <-cctx.Done():
		if ctx.Err() != nil {
			return res, fmt.Errorf("%s cancelled: %w", name, ctx.Err())
		}
		return res, &TimeoutError{Cmd: name, Timeout: timeout}
	default:
		// With WaitDelay set, a descendant holding the output pipes makes Run report
		// ErrWaitDelay even though the command itself succeeded.
		if errors.Is(err, exec.ErrWaitDelay) && cmd.ProcessState != nil && cmd.ProcessState.Success() {
			return res, nil
		}
		return res, fmt.Errorf("%s: %w: %s", name, err, stderr.String())
	}
}
