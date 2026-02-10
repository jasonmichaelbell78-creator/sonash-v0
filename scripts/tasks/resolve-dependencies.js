#!/usr/bin/env node
/* eslint-disable no-redeclare, no-undef */
/**
 * resolve-dependencies.js - Dependency-aware task ordering for ROADMAP.md
 *
 * Reads the active sprint from ROADMAP.md, parses [depends: X1, X2] annotations,
 * builds a DAG, and outputs tasks in dependency-resolved order using Kahn's
 * topological sort.
 *
 * Usage:
 *   node scripts/tasks/resolve-dependencies.js              # Show next available tasks
 *   node scripts/tasks/resolve-dependencies.js --all        # Show full dependency graph
 *   node scripts/tasks/resolve-dependencies.js --json       # Machine-readable output
 *   node scripts/tasks/resolve-dependencies.js --blocked    # Show only blocked tasks
 *
 * Task format in ROADMAP.md:
 *   - [ ] **B3:** Description [depends: B1, B2]
 *   - [x] **B1:** Already done
 *
 * Output:
 *   Ready:   B3 (depends: B1 ✓, B2 ✓)
 *   Blocked: B5 (waiting: B3, B4)
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ROADMAP_PATH = path.join(PROJECT_ROOT, "ROADMAP.md");

/**
 * Parse ROADMAP.md and extract task items with their status and dependencies
 */
function parseTasks() {
  let content;
  try {
    content = fs.readFileSync(ROADMAP_PATH, "utf8");
  } catch (err) {
    process.stderr.write(
      `Error reading ROADMAP.md: ${err instanceof Error ? err.message : String(err)}\n`
    );
    return new Map();
  }
  const lines = content.split("\n");
  const tasks = new Map(); // id -> { id, title, completed, depends, track, line }
  let currentTrack = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect track headers
    const trackMatch = line.match(/^###\s+Track\s+([A-Z])\s*[-–:]/);
    if (trackMatch) {
      currentTrack = trackMatch[1];
      continue;
    }

    // Match task items: - [ ] **B3:** Description [depends: B1, B2]
    // or: - [x] **B3:** Description
    // Also handles CANON-XXXX and DEBT-XXXX
    // Note: Uses {0,10} and {1,500} bounds to prevent regex DoS (SonarCloud S5852)
    const taskMatch = line.match(
      /^[ \t]{0,10}-\s{0,5}\[([ x])\]\s{0,5}\*\*([A-Z][A-Z0-9]{0,20}(?:-\d{1,6})?):?\*\*\s{0,5}(.{1,500})/i
    );
    if (taskMatch) {
      const completed = taskMatch[1] === "x";
      const id = taskMatch[2].toUpperCase();
      let description = taskMatch[3].trim();

      // Extract [depends: ...] annotation
      const depends = [];
      const depMatch = description.match(/\[depends?:\s{0,5}([^\]]{1,200})\]/i);
      if (depMatch) {
        const depIds = depMatch[1].split(/[,\s]+/).filter(Boolean);
        for (const dep of depIds) {
          depends.push(dep.toUpperCase().trim());
        }
        // Remove the annotation from description
        description = description.replace(/\s{0,5}\[depends?:\s{0,5}[^\]]{1,200}\]/i, "").trim();
      }

      tasks.set(id, {
        id,
        title: description,
        completed,
        depends,
        track: currentTrack || id.match(/^([A-Z]+)/)?.[1] || "",
        line: i + 1,
      });
    }
  }

  return tasks;
}

/**
 * Kahn's algorithm for topological sort
 * Returns tasks grouped by readiness
 */
function resolveOrder(tasks) {
  const ready = []; // Dependencies all satisfied (completed)
  const blocked = []; // Some dependencies not yet complete
  const completed = []; // Already done
  const orphanDeps = []; // References dependencies that don't exist

  // Compute topological order of incomplete tasks using Kahn's algorithm
  const topoOrder = topologicalOrder(tasks);

  for (const task of topoOrder) {
    if (task.completed) {
      completed.push(task);
      continue;
    }

    const unmet = [];
    const met = [];

    for (const depId of task.depends) {
      const dep = tasks.get(depId);
      if (!dep) {
        // Missing dependency = blocker (may be typo or in another doc)
        orphanDeps.push({ task: task.id, missingDep: depId });
        unmet.push(depId);
      } else if (dep.completed) {
        met.push(depId);
      } else {
        unmet.push(depId);
      }
    }

    if (unmet.length === 0) {
      ready.push({ ...task, metDeps: met, unmetDeps: [] });
    } else {
      blocked.push({ ...task, metDeps: met, unmetDeps: unmet });
    }
  }

  // Detect circular dependencies
  const circles = detectCircles(tasks);

  return { ready, blocked, completed, orphanDeps, circles };
}

/**
 * Kahn's topological sort — returns tasks in dependency-resolved order.
 * Completed tasks are treated as satisfied (indegree edges from completed deps
 * are not counted). Falls back to input iteration order if cycles exist.
 */
function topologicalOrder(tasks) {
  const indegree = new Map();
  const dependents = new Map(); // dep -> [tasks that depend on it]

  for (const [id] of tasks) {
    indegree.set(id, 0);
    dependents.set(id, []);
  }

  for (const [id, task] of tasks) {
    if (task.completed) continue; // completed tasks don't need ordering
    for (const depId of task.depends) {
      const dep = tasks.get(depId);
      if (!dep || dep.completed) continue; // skip satisfied/missing deps
      if (!dependents.has(depId)) dependents.set(depId, []);
      dependents.get(depId).push(id);
      indegree.set(id, (indegree.get(id) || 0) + 1);
    }
  }

  // Seed queue with tasks that have zero indegree (no unmet deps)
  const queue = [];
  for (const [id, deg] of indegree) {
    if (deg === 0 && tasks.has(id)) queue.push(id);
  }

  const result = [];
  while (queue.length > 0) {
    const id = queue.shift();
    const t = tasks.get(id);
    if (t) result.push(t);

    for (const next of dependents.get(id) || []) {
      indegree.set(next, (indegree.get(next) || 0) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }

  // If cycle prevented full ordering, append remaining tasks
  if (result.length < tasks.size) {
    for (const [, task] of tasks) {
      if (!result.includes(task)) result.push(task);
    }
  }

  return result;
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircles(tasks) {
  const circles = [];
  const visited = new Set();
  const inStack = new Set();

  function dfs(id, pathSoFar) {
    if (inStack.has(id)) {
      // Found a cycle
      const cycleStart = pathSoFar.indexOf(id);
      circles.push(pathSoFar.slice(cycleStart).concat(id));
      return;
    }
    if (visited.has(id)) {
      return;
    }

    visited.add(id);
    inStack.add(id);

    const task = tasks.get(id);
    if (task) {
      for (const dep of task.depends) {
        dfs(dep, [...pathSoFar, id]);
      }
    }

    inStack.delete(id);
  }

  for (const [id] of tasks) {
    if (!visited.has(id)) {
      dfs(id, []);
    }
  }

  return circles;
}

function printResults(results) {
  const { ready, blocked, completed, orphanDeps, circles } = results;
  const showAll = process.argv.includes("--all");
  const showBlocked = process.argv.includes("--blocked");

  if (circles.length > 0) {
    console.log("CIRCULAR DEPENDENCIES DETECTED:");
    for (const cycle of circles) {
      console.log(`  ${cycle.join(" -> ")}`);
    }
    console.log("");
  }

  if (!showBlocked) {
    console.log(`=== Ready (${ready.length} tasks) ===`);
    if (ready.length === 0) {
      console.log("  No tasks are currently unblocked.");
    } else {
      for (const task of ready) {
        const deps =
          task.metDeps.length > 0
            ? ` (depends: ${task.metDeps.map((d) => d + " \u2713").join(", ")})`
            : "";
        console.log(`  ${task.id}: ${task.title}${deps}`);
      }
    }
    console.log("");
  }

  if (showAll || showBlocked) {
    console.log(`=== Blocked (${blocked.length} tasks) ===`);
    if (blocked.length === 0) {
      console.log("  No tasks are currently blocked.");
    } else {
      for (const task of blocked) {
        const waiting = task.unmetDeps.join(", ");
        console.log(`  ${task.id}: ${task.title} (waiting: ${waiting})`);
      }
    }
    console.log("");
  }

  if (showAll) {
    console.log(`=== Completed (${completed.length} tasks) ===`);
    for (const task of completed) {
      console.log(`  ${task.id}: ${task.title}`);
    }
    console.log("");
  }

  if (orphanDeps.length > 0) {
    console.log("Warnings:");
    for (const { task, missingDep } of orphanDeps) {
      console.log(`  ${task} depends on ${missingDep} which is not in ROADMAP.md`);
    }
    console.log("");
  }

  // Summary line
  console.log(
    `Summary: ${completed.length} done, ${ready.length} ready, ${blocked.length} blocked`
  );
}

function run() {
  const tasks = parseTasks();
  const results = resolveOrder(tasks);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printResults(results);
  }
}

run();
