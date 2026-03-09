/**
 * Tests for .claude/hooks/compact-restore.js
 *
 * The hook reads handoff.json and outputs recovery context.
 * We test the formatting functions that are extracted for unit testing.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

// Extracted from the hook for unit testing

interface Step {
  name: string;
  status: string;
}

interface TaskState {
  task?: string;
  steps?: Step[];
  context?: { status?: string };
  resume_point?: string;
}

function formatTaskStates(taskStates: Record<string, TaskState> | undefined): string {
  if (!taskStates || Object.keys(taskStates).length === 0) return "  (none)";

  const lines: string[] = [];
  for (const [file, state] of Object.entries(taskStates)) {
    const task = state.task || file;
    const steps = state.steps || [];
    const completed = steps.filter(
      (s) => s.status === "completed" || s.status === "completed-with-fixes"
    ).length;
    const total = steps.length;
    const pending = steps.filter((s) => s.status === "pending");
    const inProgress = steps.filter((s) => s.status === "in_progress");

    lines.push(`  ${task}: ${completed}/${total} steps done`);
    if (inProgress.length > 0) {
      lines.push(`    In progress: ${inProgress.map((s) => s.name).join(", ")}`);
    }
    if (pending.length > 0 && pending.length <= 3) {
      lines.push(`    Remaining: ${pending.map((s) => s.name).join(", ")}`);
    } else if (pending.length > 3) {
      lines.push(`    Remaining: ${pending.length} steps`);
    }
    if (state.context?.status) {
      lines.push(`    Status: ${state.context.status}`);
    }
    if (state.resume_point) {
      lines.push(`    Resume: ${state.resume_point}`);
    }
  }
  return lines.join("\n");
}

interface Commit {
  shortHash?: string;
  message?: string;
  session?: number;
}

function formatRecentCommits(commits: Commit[] | undefined): string {
  if (!commits || commits.length === 0) return "  (none in log)";

  return commits
    .slice(-10)
    .map((c) => {
      const hash = c.shortHash || "?";
      const msg = (c.message || "").slice(0, 65);
      const session = c.session ? ` [#${c.session}]` : "";
      return `  ${hash} ${msg}${session}`;
    })
    .join("\n");
}

function isHandoffStale(timestamp: string | undefined, maxAgeMs: number): boolean {
  if (!timestamp) return true;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return Number.isNaN(ageMs) || ageMs > maxAgeMs;
}

describe("formatTaskStates", () => {
  test("returns (none) for undefined taskStates", () => {
    assert.equal(formatTaskStates(undefined), "  (none)");
  });

  test("returns (none) for empty taskStates object", () => {
    assert.equal(formatTaskStates({}), "  (none)");
  });

  test("formats a task with completed and pending steps", () => {
    const taskStates: Record<string, TaskState> = {
      "task-1.state.json": {
        task: "Implement feature X",
        steps: [
          { name: "Step A", status: "completed" },
          { name: "Step B", status: "pending" },
          { name: "Step C", status: "pending" },
        ],
      },
    };
    const result = formatTaskStates(taskStates);
    assert.ok(result.includes("Implement feature X: 1/3 steps done"));
    assert.ok(result.includes("Remaining: Step B, Step C"));
  });

  test("formats in-progress steps", () => {
    const taskStates: Record<string, TaskState> = {
      "task-1.state.json": {
        task: "Task",
        steps: [
          { name: "Writing tests", status: "in_progress" },
          { name: "Deploy", status: "pending" },
        ],
      },
    };
    const result = formatTaskStates(taskStates);
    assert.ok(result.includes("In progress: Writing tests"));
  });

  test("shows 'Remaining: N steps' when more than 3 pending steps", () => {
    const taskStates: Record<string, TaskState> = {
      "task-1.state.json": {
        task: "Big task",
        steps: Array.from({ length: 5 }, (_, i) => ({ name: `Step ${i}`, status: "pending" })),
      },
    };
    const result = formatTaskStates(taskStates);
    assert.ok(result.includes("Remaining: 5 steps"));
  });

  test("includes resume_point when present", () => {
    const taskStates: Record<string, TaskState> = {
      "task-1.state.json": {
        task: "Task",
        steps: [],
        resume_point: "Continue from Step 3",
      },
    };
    const result = formatTaskStates(taskStates);
    assert.ok(result.includes("Resume: Continue from Step 3"));
  });

  test("counts completed-with-fixes as completed", () => {
    const taskStates: Record<string, TaskState> = {
      "task-1.state.json": {
        task: "Fixed task",
        steps: [
          { name: "Step A", status: "completed-with-fixes" },
          { name: "Step B", status: "completed" },
        ],
      },
    };
    const result = formatTaskStates(taskStates);
    assert.ok(result.includes("2/2 steps done"));
  });
});

describe("formatRecentCommits", () => {
  test("returns (none in log) for undefined commits", () => {
    assert.equal(formatRecentCommits(undefined), "  (none in log)");
  });

  test("returns (none in log) for empty commits array", () => {
    assert.equal(formatRecentCommits([]), "  (none in log)");
  });

  test("formats commits with hash, message, and session", () => {
    const commits: Commit[] = [{ shortHash: "abc1234", message: "feat: add tests", session: 213 }];
    const result = formatRecentCommits(commits);
    assert.ok(result.includes("abc1234"));
    assert.ok(result.includes("feat: add tests"));
    assert.ok(result.includes("[#213]"));
  });

  test("uses ? for missing shortHash", () => {
    const commits: Commit[] = [{ message: "fix: something" }];
    const result = formatRecentCommits(commits);
    assert.ok(result.includes("?"));
  });

  test("truncates message at 65 characters", () => {
    const long = "x".repeat(100);
    const commits: Commit[] = [{ shortHash: "abc", message: long }];
    const result = formatRecentCommits(commits);
    const line = result.trim();
    // Message portion should be at most 65 chars
    const messageInLine = line.slice("  abc ".length);
    assert.ok(messageInLine.length <= 65, `Message too long: ${messageInLine.length}`);
  });

  test("limits output to last 10 commits", () => {
    const commits: Commit[] = Array.from({ length: 20 }, (_, i) => ({
      shortHash: `s${i}`,
      message: `commit ${i}`,
    }));
    const result = formatRecentCommits(commits);
    const lines = result.split("\n");
    assert.equal(lines.length, 10);
    // Should include commits 10-19 (last 10)
    assert.ok(result.includes("s19"), "Should include last commit");
    assert.ok(!result.includes("s0"), "Should not include first commit");
  });
});

describe("isHandoffStale", () => {
  test("returns true for undefined timestamp", () => {
    assert.equal(isHandoffStale(undefined, 60 * 60 * 1000), true);
  });

  test("returns true for invalid ISO timestamp", () => {
    assert.equal(isHandoffStale("not-a-date", 60 * 60 * 1000), true);
  });

  test("returns false for a recent timestamp", () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    assert.equal(isHandoffStale(recent, 60 * 60 * 1000), false);
  });

  test("returns true for an old timestamp exceeding maxAgeMs", () => {
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    assert.equal(isHandoffStale(old, 60 * 60 * 1000), true);
  });

  test("returns false for timestamp exactly at the boundary (just inside)", () => {
    const boundary = new Date(Date.now() - 59 * 60 * 1000).toISOString(); // 59 min ago
    assert.equal(isHandoffStale(boundary, 60 * 60 * 1000), false);
  });
});
