/**
 * CLI and library for tracking skill/agent invocations in invocations.jsonl.
 *
 * Library: writeInvocation(projectRoot, data)
 * CLI: node dist/write-invocation.js --data '{"skill":"pr-review","type":"skill",...}'
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { InvocationRecord, type InvocationRecordType } from "./lib/schemas/invocation";
import { appendRecord } from "./lib/write-jsonl";

// Walk up from startDir until we find package.json (works from both source and dist)
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

/**
 * Write a validated InvocationRecord to invocations.jsonl.
 *
 * Auto-assigns id as `inv-{timestamp}` if no id provided.
 * Auto-assigns date as today (YYYY-MM-DD) if no date provided.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Invocation data (id and date auto-assigned if missing)
 * @returns The validated record that was written
 */
export function writeInvocation(
  projectRoot: string,
  data: Record<string, unknown>
): InvocationRecordType {
  const recordData: Record<string, unknown> = {
    ...data,
    id: data.id ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: data.date ?? new Date().toISOString().slice(0, 10),
  };

  const validated = InvocationRecord.parse(recordData);

  // Resolve target file
  const filePath = path.resolve(projectRoot, "data/ecosystem-v2/invocations.jsonl");

  // Write using appendRecord (handles locking, symlink guard, mkdir)
  appendRecord(filePath, validated, InvocationRecord);

  return validated;
}

// ---- CLI entry point --------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const dataIdx = args.indexOf("--data");

  if (dataIdx === -1 || dataIdx + 1 >= args.length) {
    console.error("Usage: write-invocation --data '{...}'");
    process.exit(1);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(args[dataIdx + 1]) as Record<string, unknown>;
  } catch {
    console.error("Error: --data must be valid JSON");
    process.exit(1);
  }

  const projectRoot = findProjectRoot(__dirname);

  try {
    const record = writeInvocation(projectRoot, data);
    console.log(`Tracked invocation ${record.id} (${record.skill})`);
  } catch (err: unknown) {
    console.error(
      `Validation error: ${err instanceof Error ? err.message : "invocation record failed schema validation"}`
    );
    process.exit(1);
  }
}

// Only run CLI when executed directly (not imported)
if (require.main === module) {
  main();
}
