import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import matter from "gray-matter";

const root = path.resolve(import.meta.dirname, "..");
const scripts =
  JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).scripts;

for (const failStage of ["", "test:mcp"]) {
  test(`CI executes MCP checks and stops on their failure (fail=${failStage || "none"})`, () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "axiom-ci-"));
    try {
      const log = path.join(fixture, "commands");
      fs.writeFileSync(
        path.join(fixture, "npm"),
        '#!/bin/sh\nprintf "npm %s\\n" "$*" >> "$AXIOM_CI_LOG"\n[ "$*" != "run $AXIOM_FAIL_STAGE" ]\n',
        { mode: 0o755 },
      );
      fs.writeFileSync(
        path.join(fixture, "node"),
        '#!/bin/sh\nprintf "node %s\\n" "$*" >> "$AXIOM_CI_LOG"\n',
        { mode: 0o755 },
      );
      const result = spawnSync("/bin/sh", ["-c", scripts["check:ci"]], {
        cwd: fixture,
        env: {
          ...process.env,
          PATH: fixture,
          AXIOM_CI_LOG: log,
          AXIOM_FAIL_STAGE: failStage,
        },
        encoding: "utf8",
      });
      assert.deepEqual({
        code: result.status,
        commands: fs.readFileSync(log, "utf8").trim().split("\n"),
      }, {
        code: failStage ? 1 : 0,
        commands: [
          "npm run test:unit",
          "npm run test:hooks",
          "npm run test:mcp",
          ...(failStage ? [] : ["node scripts/leak-scan.ts"]),
        ],
      });
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
}

for (const filename of ["test-suite.yml", "cursor-plugin.yml"]) {
  test(`${filename} permits only bounded manual runs without retained artifacts or caches`, () => {
    const source = fs.readFileSync(
      path.join(root, ".github/workflows", filename),
      "utf8",
    );
    const workflow = matter(`---\n${source}\n---\n`).data;
    assert.deepEqual(workflow.on, { workflow_dispatch: null });
    assert.deepEqual(workflow.concurrency, {
      group: "${{ github.workflow }}",
      "cancel-in-progress": true,
    });
    const jobs = Object.values(workflow.jobs) as Array<
      {
        "timeout-minutes": number;
        steps: Array<
          { uses?: string; with?: Record<string, unknown>; run?: string }
        >;
      }
    >;
    assert.ok(jobs.length > 0);
    for (const job of jobs) {
      assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 10);
      assert.deepEqual(
        job.steps.filter((step) =>
          /(?:upload-artifact|actions\/cache)/.test(step.uses ?? "") ||
          step.with?.cache !== undefined
        ),
        [],
      );
    }
    if (filename === "test-suite.yml") {
      const runs = jobs.flatMap((job) =>
        job.steps.map((step) => step.run ?? "")
      );
      const install = runs.findIndex((command) =>
        command.includes("pnpm --dir axiom-mcp install --frozen-lockfile")
      );
      const checks = runs.indexOf("npm run check:ci");
      assert.ok(
        install >= 0 && checks > install,
        "install locked MCP dependencies before invoking their tests",
      );
      assert.match(
        runs[install],
        /^pnpm --dir axiom-mcp install --frozen-lockfile --allow-build=esbuild$/m,
        "allow the locked esbuild install script required by Vitest",
      );
    }
  });
}
