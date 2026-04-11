#!/usr/bin/env node
/**
 * todos-cli.js — Mutation CLI for .planning/todos.jsonl
 *
 * Replaces in-skill Write-tool overwrites with locked, regression-checked
 * mutations. Mirrors the /add-debt → scripts/debt/intake-manual.js pattern.
 *
 * Why this exists (T30): the slash-command skill that manages .planning/todos.jsonl
 * previously read the file, mutated in memory, then overwrote it with the Write
 * tool. If the read happened with stale context (compaction), the overwrite silently
 * dropped any entries the in-memory copy was missing. T26/T27/T28 were lost twice
 * this way.
 *
 * This CLI:
 *   - Acquires an advisory lock before any mutation
 *   - Strictly parses every line — aborts on any parse error
 *   - Computes the expected post-mutation state per op (id set, line count)
 *   - Refuses to write if the post-mutation state diverges from expectations
 *   - Calls renderTodos() (imported from render-todos.js) after success
 *
 * Pure mutation helpers live in scripts/lib/todos-mutations.js (CommonJS) so
 * they can be unit-tested without CLI side effects.
 *
 * Subcommands:
 *   add          --data '{"title":"...","priority":"P2",...}'
 *   edit         --id T29 --data '{"priority":"P1","tags":["#x"]}'
 *   complete     --id T29
 *   progress     --id T29 --text "halfway done"
 *   delete       --id T29
 *   reprioritize --id T29 --priority P1
 *   archive      --id T29                    # single
 *   archive      --bulk --ids T29,T30        # multiple
 *   archive      --completed                 # all completed → archived
 *   validate                                 # integrity check, no mutation
 *
 * Exit codes:
 *   0 = success
 *   1 = user error (invalid args, missing id, validation failure)
 *   2 = fatal (corrupt file, lock failure, fs error, regression guard tripped)
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { safeWriteFileSync, withLock } from "../lib/safe-fs.js";
import { sanitizeError } from "../lib/sanitize-error.js";
import { renderTodos } from "./render-todos.js";

const require = createRequire(import.meta.url);
const mutations = require("../lib/todos-mutations.js");
const {
  parseStrictJsonl,
  serializeJsonl,
  validateIntegrity,
  assertRegressionGuard,
  opAdd,
  opEdit,
  opComplete,
  opProgress,
  opDelete,
  opReprioritize,
  opArchive,
} = mutations;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, "..", "..");
const PLANNING_DIR = join(ROOT, ".planning");
const TODOS_FILE = join(PLANNING_DIR, "todos.jsonl");

// ---- CLI arg parsing --------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function fail(msg, code = 1) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(code);
}

// ---- Strict JSONL load (CLI wrapper around the pure parser) ----------------
//
// Never use existsSync before readFileSync — the two are non-atomic, and the
// project pattern registry (CODE_PATTERNS.md #36) forbids this form due to
// race conditions. Handle ENOENT in the catch block instead, and sanitize any
// other error message before surfacing it.

function loadStrict(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    if (err?.code === "ENOENT") return [];
    fail(`cannot read ${filePath}: ${sanitizeError(err)}`, 2);
    return []; // unreachable, satisfies linter
  }
  if (raw.codePointAt(0) === 0xfeff) raw = raw.slice(1);
  try {
    return parseStrictJsonl(raw);
  } catch (err) {
    fail(`${filePath}: ${sanitizeError(err)}`, 2);
    return []; // unreachable, satisfies linter
  }
}

// ---- Subcommand dispatchers (CLI args → pure mutation calls) --------------

function dispatchAdd(before, args) {
  if (!args.data) fail("add requires --data '<json>'");
  let payload;
  try {
    payload = JSON.parse(args.data);
  } catch (err) {
    fail(`add --data must be valid JSON: ${sanitizeError(err)}`);
  }
  return opAdd(before, payload);
}

function dispatchEdit(before, args) {
  if (!args.id) fail("edit requires --id");
  if (!args.data) fail("edit requires --data '<json>'");
  let patch;
  try {
    patch = JSON.parse(args.data);
  } catch (err) {
    fail(`edit --data must be valid JSON: ${sanitizeError(err)}`);
  }
  return opEdit(before, args.id, patch);
}

function dispatchComplete(before, args) {
  if (!args.id) fail("complete requires --id");
  return opComplete(before, args.id);
}

function dispatchProgress(before, args) {
  if (!args.id) fail("progress requires --id");
  if (typeof args.text !== "string") fail("progress requires --text '<text>'");
  return opProgress(before, args.id, args.text);
}

function dispatchDelete(before, args) {
  if (!args.id) fail("delete requires --id");
  return opDelete(before, args.id);
}

function dispatchReprioritize(before, args) {
  if (!args.id) fail("reprioritize requires --id");
  if (!args.priority) fail("reprioritize requires --priority P0|P1|P2|P3");
  return opReprioritize(before, args.id, args.priority);
}

function dispatchArchive(before, args) {
  if (args.completed === true) return opArchive(before, { completed: true });
  if (args.bulk === true || args.ids) {
    if (typeof args.ids !== "string") fail("archive --bulk requires --ids T1,T2,...");
    const ids = args.ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) fail("archive --bulk requires at least one id");
    return opArchive(before, { ids });
  }
  if (!args.id) fail("archive requires --id, --bulk --ids, or --completed");
  return opArchive(before, { id: args.id });
}

function dispatchValidate() {
  const records = loadStrict(TODOS_FILE);
  const errors = validateIntegrity(records);
  if (errors.length > 0) {
    process.stderr.write(`Integrity check FAILED:\n  - ${errors.join("\n  - ")}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `Integrity OK: ${records.length} todos, last id ${records.at(-1)?.id ?? "(empty)"}\n`
  );
  process.exit(0);
}

// ---- Main dispatch ----------------------------------------------------------

const DISPATCHERS = {
  add: dispatchAdd,
  edit: dispatchEdit,
  complete: dispatchComplete,
  progress: dispatchProgress,
  delete: dispatchDelete,
  reprioritize: dispatchReprioritize,
  archive: dispatchArchive,
};

function main() {
  const argv = process.argv.slice(2);
  const subcommand = argv[0];
  if (!subcommand) {
    fail(
      "usage: todos-cli.js <add|edit|complete|progress|delete|reprioritize|archive|validate> [args]"
    );
  }

  if (subcommand === "validate") {
    dispatchValidate();
    return;
  }

  const dispatcher = DISPATCHERS[subcommand];
  if (!dispatcher) fail(`unknown subcommand: ${subcommand}`);

  const args = parseArgs(argv.slice(1));

  try {
    withLock(TODOS_FILE, () => {
      const before = loadStrict(TODOS_FILE);

      const preErrors = validateIntegrity(before);
      if (preErrors.length > 0) {
        throw new Error(
          `pre-flight integrity check failed — refusing mutation:\n  - ${preErrors.join("\n  - ")}`
        );
      }

      const { after, expectations, summary } = dispatcher(before, args);

      assertRegressionGuard(expectations, before, after);
      const postErrors = validateIntegrity(after);
      if (postErrors.length > 0) {
        throw new Error(
          `post-mutation integrity check failed — refusing write:\n  - ${postErrors.join("\n  - ")}`
        );
      }

      safeWriteFileSync(TODOS_FILE, serializeJsonl(after));
      process.stdout.write(summary + "\n");
    });
  } catch (err) {
    fail(sanitizeError(err), 2);
  }

  // Render outside the lock — render-todos.js does its own write
  try {
    renderTodos({ silent: true });
  } catch (err) {
    process.stderr.write(`warning: render failed (${sanitizeError(err)})\n`);
    process.exit(0);
  }
}

main();
