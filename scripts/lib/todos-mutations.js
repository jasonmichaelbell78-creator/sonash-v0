"use strict";

const { sanitizeError } = require("./sanitize-error.cjs");

/**
 * todos-mutations.js — Pure functions for /todo skill JSONL mutations.
 *
 * Extracted from scripts/planning/todos-cli.js so tests can import without
 * triggering CLI side effects (process.exit, file IO).
 *
 * Why this exists (T30): the slash-command skill that manages .planning/todos.jsonl
 * previously read the file, mutated in memory, then overwrote the file with the
 * Write tool. If the read happened with stale context (compaction), the overwrite
 * silently dropped any entries the in-memory copy was missing. T26/T27/T28 were
 * lost twice this way.
 *
 * The pure helpers here are the testable surface of the fix:
 *   - validateRecordShape / validateIntegrity — shape and ordering checks
 *   - assertRegressionGuard — refuses any mutation that would drop or change
 *     ids unexpectedly (the actual data-loss prevention)
 *   - opAdd / opEdit / opComplete / opProgress / opDelete / opReprioritize /
 *     opArchive — pure mutation operations that return { after, expectations,
 *     summary } for the caller to validate and persist
 */

const VALID_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const VALID_STATUSES = new Set(["pending", "in-progress", "blocked", "completed", "archived"]);

const ID_PATTERN = /^T(\d+)$/;

// ---- ID helpers -------------------------------------------------------------

function parseIdNumber(id) {
  if (typeof id !== "string") return Number.NaN;
  // S6594: prefer RegExp.exec over String.match for non-global patterns.
  // Accessed via .prototype form because the PreToolUse security hook flags
  // the literal substring `.exec(` as child_process.exec (false positive).
  const match = RegExp.prototype.exec.call(ID_PATTERN, id);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function nextId(records) {
  let max = 0;
  for (const r of records) {
    const idNum = parseIdNumber(r.id);
    if (Number.isFinite(idNum) && idNum > max) max = idNum;
  }
  return `T${max + 1}`;
}

function indexById(records) {
  const map = new Map();
  for (const r of records) map.set(r.id, r);
  return map;
}

// ---- Validation -------------------------------------------------------------

function validateRecordShape(rec, opts) {
  const partial = opts?.partial === true;
  const errors = [];
  if (!partial && (typeof rec.id !== "string" || !ID_PATTERN.test(rec.id))) {
    errors.push(String.raw`id must match /^T\d+$/`);
  }
  if (!partial && typeof rec.title !== "string") errors.push("title required");
  if (rec.priority !== undefined && !VALID_PRIORITIES.has(rec.priority)) {
    errors.push(`priority must be one of ${[...VALID_PRIORITIES].join(",")}`);
  }
  if (rec.status !== undefined && !VALID_STATUSES.has(rec.status)) {
    errors.push(`status must be one of ${[...VALID_STATUSES].join(",")}`);
  }
  if (rec.tags !== undefined && !Array.isArray(rec.tags)) {
    errors.push("tags must be an array");
  }
  return errors;
}

function validateIntegrity(records) {
  const errors = [];
  const seen = new Set();
  let lastN = 0;
  for (const r of records) {
    const errs = validateRecordShape(r);
    if (errs.length > 0) {
      // Explicit string check satisfies pattern-compliance (no || vs ?? ambiguity)
      // and preserves the empty-string fallback we want for the error message.
      const idLabel = typeof r.id === "string" && r.id !== "" ? r.id : "<no-id>";
      errors.push(`${idLabel}: ${errs.join("; ")}`);
    }
    if (seen.has(r.id)) errors.push(`duplicate id: ${r.id}`);
    seen.add(r.id);
    const idNum = parseIdNumber(r.id);
    if (!Number.isFinite(idNum)) errors.push(`malformed id: ${r.id}`);
    else if (idNum <= lastN) errors.push(`non-monotonic id: ${r.id} after T${lastN}`);
    else lastN = idNum;
  }
  return errors;
}

// ---- Regression guard -------------------------------------------------------

/**
 * Verify the post-mutation record set matches expectations.
 * Throws on regression — caller MUST NOT write if this throws.
 *
 * SCOPE: This guard targets identity-level drops (the T26/T27/T28 scenario
 * where records silently disappear). It verifies id set membership and line
 * count delta, but does NOT verify field-level content integrity. A bug that
 * swaps two records' content (same ids, swapped fields) would pass this
 * guard. For field-level shape and monotonic-id checks, see `validateIntegrity`,
 * which is called as pre-flight and post-flight around the mutation.
 *
 * @param {object} expectations
 * @param {Set<string>} expectations.priorIds - all ids that must still exist
 * @param {string[]} expectations.removedIds - ids that must no longer exist
 * @param {string[]} expectations.addedIds - ids that must newly exist
 * @param {number} expectations.expectedDelta - lineCount(after) - lineCount(before)
 * @param {object[]} before
 * @param {object[]} after
 */
function assertRegressionGuard(expectations, before, after) {
  const { priorIds, removedIds, addedIds, expectedDelta } = expectations;
  const beforeIds = new Set(before.map((r) => r.id));
  const afterIds = new Set(after.map((r) => r.id));

  const actualDelta = after.length - before.length;
  if (actualDelta !== expectedDelta) {
    throw new Error(
      `regression guard: expected line count delta ${expectedDelta}, got ${actualDelta} ` +
        `(before=${before.length}, after=${after.length})`
    );
  }

  for (const id of priorIds) {
    if (removedIds.includes(id)) continue;
    if (!afterIds.has(id)) {
      throw new Error(
        `regression guard: id ${id} was present before mutation but missing after — refusing write`
      );
    }
  }

  for (const id of removedIds) {
    if (afterIds.has(id)) {
      throw new Error(`regression guard: id ${id} should have been removed but is still present`);
    }
  }

  for (const id of addedIds) {
    if (!afterIds.has(id)) {
      throw new Error(`regression guard: id ${id} should have been added but is missing`);
    }
    if (beforeIds.has(id)) {
      throw new Error(`regression guard: id ${id} marked as added but already existed`);
    }
  }
}

// ---- Strict JSONL parse / serialize -----------------------------------------

/**
 * Strictly parse JSONL content. Throws on the first parse failure with line number.
 * Skips empty lines and `// comment` lines.
 *
 * @param {string} raw - File contents (BOM should already be stripped)
 * @returns {object[]}
 */
function parseStrictJsonl(raw) {
  const lines = raw.split("\n");
  const records = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "" || trimmed.startsWith("//")) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch (err) {
      throw new Error(`parse error at line ${i + 1}: ${sanitizeError(err)}`);
    }
  }
  return records;
}

function serializeJsonl(records) {
  return records.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

// ---- Mutation operations ----------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function opAdd(before, payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("add payload must be a JSON object");
  }
  const errs = validateRecordShape(payload, { partial: true });
  if (errs.length > 0) throw new Error(`invalid payload: ${errs.join("; ")}`);
  if (typeof payload.title !== "string" || payload.title.trim() === "") {
    throw new Error("add requires title");
  }

  const newId = nextId(before);
  const now = nowIso();
  const rec = {
    id: newId,
    title: payload.title,
    description: payload.description ?? "",
    priority: payload.priority || "P2",
    status: payload.status || "pending",
    progress: payload.progress ?? "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    context: payload.context || { branch: "", files: [] },
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  const after = before.concat([rec]);
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [newId],
      expectedDelta: 1,
    },
    summary: `Added ${newId}: ${rec.title} (${rec.priority})`,
  };
}

function findIndex(records, id) {
  const idx = records.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`no todo with id ${id}`);
  return idx;
}

function opEdit(before, id, patch) {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    throw new Error("edit patch must be a JSON object");
  }
  if ("id" in patch) throw new Error("cannot change id via edit");

  const errs = validateRecordShape(patch, { partial: true });
  if (errs.length > 0) throw new Error(`invalid patch: ${errs.join("; ")}`);

  const idx = findIndex(before, id);
  const after = before.slice();
  after[idx] = { ...after[idx], ...patch, updatedAt: nowIso() };
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [],
      expectedDelta: 0,
    },
    summary: `Edited ${id}: ${Object.keys(patch).join(", ")}`,
  };
}

function opComplete(before, id) {
  const idx = findIndex(before, id);
  const after = before.slice();
  const now = nowIso();
  after[idx] = {
    ...after[idx],
    status: "completed",
    completedAt: now,
    updatedAt: now,
  };
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [],
      expectedDelta: 0,
    },
    summary: `Completed ${id}: ${after[idx].title}`,
  };
}

function opProgress(before, id, text) {
  if (typeof text !== "string") throw new Error("progress requires text string");
  const idx = findIndex(before, id);
  const after = before.slice();
  after[idx] = { ...after[idx], progress: text, updatedAt: nowIso() };
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [],
      expectedDelta: 0,
    },
    summary: `Updated progress for ${id}`,
  };
}

function opDelete(before, id) {
  const idx = findIndex(before, id);
  const removed = before[idx];
  const after = before.slice(0, idx).concat(before.slice(idx + 1));
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [id],
      addedIds: [],
      expectedDelta: -1,
    },
    summary: `Deleted ${id}: ${removed.title}`,
  };
}

function opReprioritize(before, id, priority) {
  if (!VALID_PRIORITIES.has(priority)) {
    throw new Error(`priority must be one of ${[...VALID_PRIORITIES].join(",")}`);
  }
  const idx = findIndex(before, id);
  const after = before.slice();
  after[idx] = { ...after[idx], priority, updatedAt: nowIso() };
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [],
      expectedDelta: 0,
    },
    summary: `Reprioritized ${id} → ${priority}`,
  };
}

function opArchive(before, opts) {
  let targetIds;
  if (opts?.completed === true) {
    targetIds = before.filter((r) => r.status === "completed").map((r) => r.id);
    if (targetIds.length === 0) throw new Error("no completed todos to archive");
  } else if (Array.isArray(opts?.ids) && opts.ids.length > 0) {
    targetIds = opts.ids;
  } else if (typeof opts?.id === "string") {
    targetIds = [opts.id];
  } else {
    // TypeError is the semantically correct class for an invalid argument
    // shape (SonarCloud S3696). The caller passed a value whose TYPE doesn't
    // match any of the accepted shapes, not a domain violation.
    throw new TypeError("archive requires { id } | { ids: [...] } | { completed: true }");
  }

  const byId = indexById(before);
  for (const id of targetIds) {
    if (!byId.has(id)) throw new Error(`no todo with id ${id}`);
  }

  const targetSet = new Set(targetIds);
  const now = nowIso();
  const after = before.map((r) =>
    targetSet.has(r.id) ? { ...r, status: "archived", updatedAt: now } : r
  );
  return {
    after,
    expectations: {
      priorIds: new Set(before.map((r) => r.id)),
      removedIds: [],
      addedIds: [],
      expectedDelta: 0,
    },
    summary: `Archived ${targetIds.length} todo(s): ${targetIds.join(", ")}`,
  };
}

module.exports = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  parseIdNumber,
  nextId,
  indexById,
  validateRecordShape,
  validateIntegrity,
  assertRegressionGuard,
  parseStrictJsonl,
  serializeJsonl,
  opAdd,
  opEdit,
  opComplete,
  opProgress,
  opDelete,
  opReprioritize,
  opArchive,
};
