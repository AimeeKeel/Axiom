package main

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"
)

func TestCountListLines(t *testing.T) {
	out := []byte("== Instruments ==\nActivity Monitor\nAllocations\nLeaks\n\nTime Profiler\n")
	if got := countListLines(out); got != 4 {
		t.Errorf("countListLines = %d, want 4", got)
	}
}

func TestCountListLinesEmpty(t *testing.T) {
	if got := countListLines([]byte("== Devices ==\n")); got != 0 {
		t.Errorf("countListLines = %d, want 0", got)
	}
}

func TestVersionConstSet(t *testing.T) {
	if version == "" {
		t.Fatal("version const must be set")
	}
}

// TestDoctorRejectsStrayArgument guards the Axiom-8qam class: the stdlib
// parser stops at the first positional, so `doctor stray --human` used to drop
// --human and print JSON with exit 0.
func TestDoctorRejectsStrayArgument(t *testing.T) {
	var out bytes.Buffer
	stderr := captureStderr(t, func() {
		if code := runDoctor(&out, []string{"stray", "--human"}); code != 2 {
			t.Errorf("exit = %d, want 2", code)
		}
	})
	if out.Len() != 0 || !strings.Contains(stderr, `doctor: unexpected argument "stray"`) {
		t.Errorf("stdout has %d bytes, stderr = %q; want no report and the stray argument named", out.Len(), stderr)
	}
}

func captureStderr(t *testing.T, fn func()) string {
	t.Helper()
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	old := os.Stderr
	os.Stderr = w
	fn()
	os.Stderr = old
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	b, err := io.ReadAll(r)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}
