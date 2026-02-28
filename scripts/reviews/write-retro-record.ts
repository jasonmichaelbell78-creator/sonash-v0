/**
 * CLI and library for writing validated RetroRecords to retros.jsonl.
 *
 * Library: writeRetroRecord(projectRoot, data)
 * CLI: node dist/write-retro-record.js --data '{"pr":399,...}'
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { RetroRecord, type RetroRecordType } from "./lib/schemas/retro";
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
 * Write a validated RetroRecord to retros.jsonl.
 *
 * Auto-assigns id as `retro-pr-{pr_number}` if no id provided and pr is set.
 *
 * @param projectRoot - Absolute path to project root
 * @param data - Partial retro data (id auto-assigned if missing)
 * @returns The validated record that was written
 */
export function writeRetroRecord(
  projectRoot: string,
  data: Record<string, unknown>
): RetroRecordType {
  // Auto-assign ID if not provided
  if (!data.id && typeof data.pr === "number") {
    data.id = `retro-pr-${data.pr}`;
  }

  // Validate with Zod -- throws ZodError on failure
  const validated = RetroRecord.parse(data);

  // Resolve target file
  const filePath = path.resolve(projectRoot, "data/ecosystem-v2/retros.jsonl");

  // Write using appendRecord (handles locking, symlink guard, mkdir)
  appendRecord(filePath, validated, RetroRecord);

  return validated;
}

// ---- CLI entry point --------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const dataIdx = args.indexOf("--data");

  if (dataIdx === -1 || dataIdx + 1 >= args.length) {
    console.error("Usage: write-retro-record --data '{...}'");
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
    const record = writeRetroRecord(projectRoot, data);
    console.log(`Wrote retro ${record.id} to retros.jsonl`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Validation error: ${err.message}`);
    } else {
      console.error("Unknown error");
    }
    process.exit(1);
  }
}

// Only run CLI when executed directly (not imported)
if (require.main === module) {
  main();
}
