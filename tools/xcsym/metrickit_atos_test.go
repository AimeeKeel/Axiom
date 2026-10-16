package main

import (
	"context"
	"debug/macho"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// TestSymbolicateForTier_MetricKitOffsetsResolveWithRealAtos guards
// Axiom-fz9w. MetricKit frames carry offsetIntoBinaryTextSegment, not a
// runtime address, and atos given `-l 0x0 <offset>` returns the offset
// unresolved for any image whose __TEXT starts above zero (every app
// executable). Each case compiles a real binary, matches its dSYM by UUID,
// and requires the marker function back through the full parse → atos path.
func TestSymbolicateForTier_MetricKitOffsetsResolveWithRealAtos(t *testing.T) {
	for _, tool := range []string{"atos", "dsymutil", "xcrun"} {
		if _, err := exec.LookPath(tool); err != nil {
			t.Skipf("%s not available", tool)
		}
	}
	cases := []struct {
		name, arch string
		linkFlags  []string
		wantVMAddr uint64
	}{
		{"arm64 executable", "arm64", nil, 0x100000000},
		{"x86_64 executable", "x86_64", nil, 0x100000000},
		{"arm64 executable, low __TEXT", "arm64", []string{"-Wl,-pagezero_size,0x10000000"}, 0x10000000},
		{"x86_64 executable, low __TEXT", "x86_64", []string{"-Wl,-pagezero_size,0x10000000"}, 0x10000000},
		{"arm64 dylib", "arm64", []string{"-dynamiclib"}, 0},
		{"x86_64 dylib", "x86_64", []string{"-dynamiclib"}, 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			bin, dsym := buildMarkerBinary(t, tc.arch, tc.linkFlags)
			vmaddr, symAddr := textVMAddrAndSymbol(t, bin, tc.arch, "_axiom_marker")
			if vmaddr != tc.wantVMAddr {
				t.Fatalf("fixture __TEXT vmaddr = %#x, want %#x", vmaddr, tc.wantVMAddr)
			}
			uuids, err := ReadUUIDs(context.Background(), dsym)
			if err != nil || len(uuids) != 1 {
				t.Fatalf("ReadUUIDs(%s) = %v, %v; want one slice", dsym, uuids, err)
			}
			uuid := uuids[0].UUID
			offset := symAddr - vmaddr

			raw, err := ParseMetricKit([]byte(fmt.Sprintf(`{
  "diagnosticMetaData": {"platformArchitecture": %q, "bundleIdentifier": "com.example.Marker"},
  "callStackTree": {"callStackPerThread": true, "callStacks": [{"threadAttributed": true,
    "callStackRootFrames": [{"binaryUUID": %q, "binaryName": "Marker", "offsetIntoBinaryTextSegment": %d}]}]}
}`, tc.arch, uuid, offset)))
			if err != nil {
				t.Fatalf("ParseMetricKit: %v", err)
			}
			d := NewDiscoverer(DiscovererOptions{
				ExplicitByUUID: map[string]string{uuid: dsym},
				SkipDefaults:   true, SkipCache: true, SkipSpotlight: true,
			})
			warnings := SymbolicateForTier(context.Background(), raw, ImageStatus{}, d, TierFull)
			got := raw.Threads[0].Frames[0]
			wantAddr := fmt.Sprintf("0x%x", offset)
			if len(warnings) != 0 || !got.Symbolicated || !strings.Contains(got.Symbol, "axiom_marker") || got.Address != wantAddr {
				t.Fatalf("frame = {Symbol: %q, Symbolicated: %v, Address: %q}, warnings = %v; want axiom_marker symbolicated, Address %s, no warnings",
					got.Symbol, got.Symbolicated, got.Address, warnings, wantAddr)
			}
		})
	}
}

// buildMarkerBinary compiles a one-function C image for arch and returns the
// binary and its dSYM. A dylib still needs no main; an executable does.
func buildMarkerBinary(t *testing.T, arch string, linkFlags []string) (bin, dsym string) {
	t.Helper()
	dir := t.TempDir()
	src := filepath.Join(dir, "marker.c")
	code := "__attribute__((noinline)) int axiom_marker(void) { return 42; }\nint main(void) { return axiom_marker(); }\n"
	if err := os.WriteFile(src, []byte(code), 0o644); err != nil {
		t.Fatal(err)
	}
	bin = filepath.Join(dir, "Marker")
	args := append([]string{"clang", "-g", "-O0", "-arch", arch, "-mmacosx-version-min=13.0", src, "-o", bin}, linkFlags...)
	if out, err := exec.Command("xcrun", args...).CombinedOutput(); err != nil {
		t.Skipf("clang -arch %s unavailable: %v\n%s", arch, err, out)
	}
	dsym = bin + ".dSYM"
	if out, err := exec.Command("dsymutil", bin, "-o", dsym).CombinedOutput(); err != nil {
		t.Fatalf("dsymutil: %v\n%s", err, out)
	}
	return bin, dsym
}

// textVMAddrAndSymbol reads the __TEXT segment's preferred address and the
// named symbol's address straight from the Mach-O, independent of xcsym.
func textVMAddrAndSymbol(t *testing.T, path, arch, symbol string) (vmaddr, addr uint64) {
	t.Helper()
	f, err := macho.Open(path)
	if err != nil {
		t.Fatalf("macho.Open(%s): %v", path, err)
	}
	defer f.Close()
	seg := f.Segment("__TEXT")
	if seg == nil {
		t.Fatalf("%s (%s) has no __TEXT segment", path, arch)
	}
	for _, s := range f.Symtab.Syms {
		if s.Name == symbol {
			return seg.Addr, s.Value
		}
	}
	t.Fatalf("%s (%s) has no symbol %s", path, arch, symbol)
	return 0, 0
}
