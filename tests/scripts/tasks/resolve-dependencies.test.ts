/**
 * resolve-dependencies.js Test Suite
 *
 * Tests the internal graph logic from scripts/tasks/resolve-dependencies.js.
 * We extract parseTasks, resolveOrder, topologicalOrder, and detectCircles
 * without triggering the run() call.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

interface Task {
  id: string;
  title: string;
  completed: boolean;
  depends: string[];
  track: string;
  line: number;
}

interface ResolveResult {
  ready: Task[];
  blocked: Task[];
  completed: Task[];
  orphanDeps: Array<{ task: string; missingDep: string }>;
  circles: string[][];
}

interface ResolveDepsModule {
  parseTasks: () => Map<string, Task>;
  resolveOrder: (tasks: Map<string, Task>) => ResolveResult;
  topologicalOrder: (tasks: Map<string, Task>) => Task[];
  detectCircles: (tasks: Map<string, Task>) => string[][];
}

let mod: ResolveDepsModule;

before(() => {
  const srcPath = path.resolve(PROJECT_ROOT, "scripts/tasks/resolve-dependencies.js");
  let src = fs.readFileSync(srcPath, "utf-8");

  // Remove run() invocation
  src = src.replace(/^run\(\s*\)\s*;?\s*$/m, "// run() removed for test isolation");

  // Expose helpers
  src += `\nmodule.exports = { parseTasks, resolveOrder, topologicalOrder, detectCircles };\n`;

  const wrapperFile = srcPath.replace(".js", ".test-wrapper.js");
  fs.writeFileSync(wrapperFile, src, "utf-8");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(wrapperFile) as ResolveDepsModule;
  } finally {
    try {
      fs.unlinkSync(wrapperFile);
    } catch {
      /* best effort */
    }
  }
});

// Helper: build a Map of tasks from a ROADMAP-like markdown string
function buildTaskMap(content: string): Map<string, Task> {
  // Write to a temp ROADMAP.md and swap the module's ROADMAP_PATH by temporarily
  // writing the content to a temp file and patching fs.readFileSync within the
  // wrapped module's closure. Instead, we build the map directly here.
  //
  // Since parseTasks() reads from the real ROADMAP.md (hard-coded path), we test
  // resolveOrder/topologicalOrder/detectCircles directly with hand-crafted maps.
  void content;
  return new Map();
}

// =========================================================
// topologicalOrder
// =========================================================

describe("resolve-dependencies.topologicalOrder", () => {
  it("returns all tasks in order for a simple linear chain", () => {
    const tasks: Map<string, Task> = new Map([
      ["A1", { id: "A1", title: "First", completed: false, depends: [], track: "A", line: 1 }],
      ["A2", { id: "A2", title: "Second", completed: false, depends: ["A1"], track: "A", line: 2 }],
      ["A3", { id: "A3", title: "Third", completed: false, depends: ["A2"], track: "A", line: 3 }],
    ]);

    const order = mod.topologicalOrder(tasks);
    assert.equal(order.length, 3, "All 3 tasks should be returned");
    // A1 must come before A2, A2 before A3
    const idxA1 = order.findIndex((t) => t.id === "A1");
    const idxA2 = order.findIndex((t) => t.id === "A2");
    const idxA3 = order.findIndex((t) => t.id === "A3");
    assert.ok(idxA1 < idxA2, "A1 should come before A2");
    assert.ok(idxA2 < idxA3, "A2 should come before A3");
  });

  it("returns all tasks for independent tasks (no deps)", () => {
    const tasks: Map<string, Task> = new Map([
      ["B1", { id: "B1", title: "One", completed: false, depends: [], track: "B", line: 1 }],
      ["B2", { id: "B2", title: "Two", completed: false, depends: [], track: "B", line: 2 }],
      ["B3", { id: "B3", title: "Three", completed: false, depends: [], track: "B", line: 3 }],
    ]);

    const order = mod.topologicalOrder(tasks);
    assert.equal(order.length, 3, "All tasks should be included");
  });

  it("handles empty task map", () => {
    const order = mod.topologicalOrder(new Map());
    assert.equal(order.length, 0, "Empty map should return empty array");
  });

  it("treats completed tasks as already satisfied (not counted in indegree)", () => {
    const tasks: Map<string, Task> = new Map([
      ["C1", { id: "C1", title: "Done", completed: true, depends: [], track: "C", line: 1 }],
      [
        "C2",
        {
          id: "C2",
          title: "Depends on done C1",
          completed: false,
          depends: ["C1"],
          track: "C",
          line: 2,
        },
      ],
    ]);

    const order = mod.topologicalOrder(tasks);
    // C2 should appear — C1 is completed so C2's indegree should be 0
    const c2 = order.find((t) => t.id === "C2");
    assert.ok(c2 !== undefined, "C2 should be in the order");
  });
});

// =========================================================
// detectCircles
// =========================================================

describe("resolve-dependencies.detectCircles", () => {
  it("returns empty array for a DAG with no cycles", () => {
    const tasks: Map<string, Task> = new Map([
      ["D1", { id: "D1", title: "A", completed: false, depends: [], track: "D", line: 1 }],
      ["D2", { id: "D2", title: "B", completed: false, depends: ["D1"], track: "D", line: 2 }],
    ]);

    const circles = mod.detectCircles(tasks);
    assert.equal(circles.length, 0, "No circles should be detected");
  });

  it("detects a simple two-node cycle", () => {
    const tasks: Map<string, Task> = new Map([
      ["E1", { id: "E1", title: "A", completed: false, depends: ["E2"], track: "E", line: 1 }],
      ["E2", { id: "E2", title: "B", completed: false, depends: ["E1"], track: "E", line: 2 }],
    ]);

    const circles = mod.detectCircles(tasks);
    assert.ok(circles.length > 0, "A cycle should be detected");
    // The cycle should contain both E1 and E2
    const allIds = new Set(circles.flat());
    assert.ok(allIds.has("E1"), "Cycle should include E1");
    assert.ok(allIds.has("E2"), "Cycle should include E2");
  });

  it("returns empty array for an empty map", () => {
    const circles = mod.detectCircles(new Map());
    assert.equal(circles.length, 0, "No circles in empty map");
  });
});

// =========================================================
// resolveOrder
// =========================================================

describe("resolve-dependencies.resolveOrder", () => {
  it("classifies tasks with all deps met as ready", () => {
    const tasks: Map<string, Task> = new Map([
      ["F1", { id: "F1", title: "Done task", completed: true, depends: [], track: "F", line: 1 }],
      [
        "F2",
        {
          id: "F2",
          title: "Depends on done F1",
          completed: false,
          depends: ["F1"],
          track: "F",
          line: 2,
        },
      ],
    ]);

    const result = mod.resolveOrder(tasks);
    const readyIds = result.ready.map((t) => t.id);
    assert.ok(readyIds.includes("F2"), "F2 should be ready (F1 is completed)");
  });

  it("classifies tasks with unmet deps as blocked", () => {
    const tasks: Map<string, Task> = new Map([
      ["G1", { id: "G1", title: "Not done", completed: false, depends: [], track: "G", line: 1 }],
      [
        "G2",
        {
          id: "G2",
          title: "Blocked by G1",
          completed: false,
          depends: ["G1"],
          track: "G",
          line: 2,
        },
      ],
    ]);

    const result = mod.resolveOrder(tasks);
    const blockedIds = result.blocked.map((t) => t.id);
    assert.ok(blockedIds.includes("G2"), "G2 should be blocked (G1 is not completed)");
  });

  it("puts completed tasks in the completed array", () => {
    const tasks: Map<string, Task> = new Map([
      [
        "H1",
        { id: "H1", title: "Already done", completed: true, depends: [], track: "H", line: 1 },
      ],
    ]);

    const result = mod.resolveOrder(tasks);
    const completedIds = result.completed.map((t) => t.id);
    assert.ok(completedIds.includes("H1"), "H1 should be in completed");
  });

  it("reports orphan deps for missing dependency IDs", () => {
    const tasks: Map<string, Task> = new Map([
      [
        "I1",
        {
          id: "I1",
          title: "Depends on nonexistent",
          completed: false,
          depends: ["GHOST"],
          track: "I",
          line: 1,
        },
      ],
    ]);

    const result = mod.resolveOrder(tasks);
    assert.ok(result.orphanDeps.length > 0, "Should report orphan deps");
    assert.equal(result.orphanDeps[0].task, "I1");
    assert.equal(result.orphanDeps[0].missingDep, "GHOST");
  });

  it("returns empty arrays for an empty task map", () => {
    const result = mod.resolveOrder(new Map());
    assert.equal(result.ready.length, 0);
    assert.equal(result.blocked.length, 0);
    assert.equal(result.completed.length, 0);
  });
});

// =========================================================
// parseTasks (integration — reads real ROADMAP.md)
// =========================================================

describe("resolve-dependencies.parseTasks", () => {
  it("returns a Map (may be empty if ROADMAP.md has no tasks)", () => {
    const tasks = mod.parseTasks();
    assert.ok(tasks instanceof Map, "parseTasks should return a Map");
  });

  it("each task has required fields if any tasks are returned", () => {
    const tasks = mod.parseTasks();
    for (const [id, task] of tasks) {
      assert.equal(typeof id, "string");
      assert.equal(typeof task.id, "string");
      assert.equal(typeof task.title, "string");
      assert.equal(typeof task.completed, "boolean");
      assert.ok(Array.isArray(task.depends), "depends should be an array");
    }
  });
});
