import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeDefaultExec, resolveToolPath } from './binary-exec.js';

const NODE = process.execPath;
const MB = 1024 * 1024;

describe('resolveToolPath', () => {
  it('prefers an explicit env override', () => {
    expect(resolveToolPath('xctool', 'AXIOM_XCTOOL_PATH', { mode: 'production' }, { AXIOM_XCTOOL_PATH: '/custom/xctool' }))
      .toBe('/custom/xctool');
  });

  it('resolves to the plugin bin in development mode', () => {
    expect(resolveToolPath('xctool', 'AXIOM_XCTOOL_PATH', { mode: 'development', devSourcePath: '/plug' }, {}))
      .toBe(join('/plug', 'bin', 'xctool'));
  });

  it('resolves to the packaged binary in production', () => {
    const p = resolveToolPath('xctool', 'AXIOM_XCTOOL_PATH', { mode: 'production' }, {});
    expect(p.endsWith(join('bin', 'xctool'))).toBe(true);
  });
});

describe('makeDefaultExec', () => {
  it('reports stdout and exit 0 on success', async () => {
    const exec = makeDefaultExec(5000, 64 * MB);
    const r = await exec(NODE, ['-e', "process.stdout.write('hello')"]);
    expect(r).toEqual({ stdout: 'hello', stderr: '', code: 0 });
  });

  it('relays a numeric non-zero exit with its streams', async () => {
    const exec = makeDefaultExec(5000, 64 * MB);
    const r = await exec(NODE, ['-e', "process.stderr.write('boom');process.exit(3)"]);
    expect(r.code).toBe(3);
    expect(r.stderr).toContain('boom');
  });

  it('closes child stdin so a stdin-reading child gets EOF instead of hanging', async () => {
    // Without child.stdin.end() this child would block until the timeout and be
    // SIGTERM-killed; a clean EOF makes 'end' fire and the child exit normally.
    const exec = makeDefaultExec(3000, 64 * MB);
    const r = await exec(NODE, [
      '-e',
      "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write('end:'+d.length));process.stdin.resume()",
    ]);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe('end:0');
  });

  it('reports truncation (not malformed JSON) when output exceeds maxBuffer', async () => {
    const exec = makeDefaultExec(5000, 16); // tiny cap
    const r = await exec(NODE, ['-e', "process.stdout.write('x'.repeat(100000))"]);
    expect(r.stdout).toBe(''); // truncated prefix discarded, not surfaced
    expect(r.stderr).toContain('exceeded');
    expect(r.stderr).toContain('truncated');
  });

  it('labels a timeout kill distinctly from a usage error', async () => {
    const exec = makeDefaultExec(200, 64 * MB);
    const r = await exec(NODE, ['-e', 'setTimeout(() => {}, 5000)']);
    expect(r.code).not.toBe(0);
    expect(r.stderr).toContain('timed out');
  });

  // An Intel Mac refuses the arm64-only tools with EBADARCH, which Node throws
  // synchronously as "spawn Unknown system error -86". A PowerPC Mach-O header
  // makes every Mac refuse the same way, Rosetta or not.
  it.runIf(process.platform === 'darwin')('explains a binary built for a CPU this Mac cannot run', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'axiom-badarch-'));
    try {
      const header = Buffer.alloc(32);
      header.writeUInt32LE(0xfeedfacf, 0); // MH_MAGIC_64
      header.writeInt32LE(0x01000012, 4); // CPU_TYPE_POWERPC64
      header.writeUInt32LE(2, 12); // MH_EXECUTE
      const binary = join(dir, 'xctool');
      writeFileSync(binary, header, { mode: 0o755 });
      const r = await makeDefaultExec(5000, 64 * MB)(binary, []);
      expect(r).toEqual({ stdout: '', stderr: "xctool is built for Apple Silicon (arm64); this Mac's CPU cannot run it.", code: 1 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('still rejects on any other synchronous spawn failure', async () => {
    // An empty executable fails with ENOEXEC, as a truncated download can.
    const dir = mkdtempSync(join(tmpdir(), 'axiom-noexec-'));
    try {
      const binary = join(dir, 'xctool');
      writeFileSync(binary, '', { mode: 0o755 });
      await expect(makeDefaultExec(5000, 64 * MB)(binary, [])).rejects.toMatchObject({ code: 'ENOEXEC' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
