import { z } from "zod";
import * as path from "node:path";
import * as fs from "node:fs";

// Walk up from __dirname until we find package.json (works from both source and dist)
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

// read-jsonl.js exports the function directly (module.exports = readJsonl)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const readJsonl = require(
  path.resolve(findProjectRoot(__dirname), "scripts/lib/read-jsonl.js")
) as (filePath: string, options?: { safe?: boolean; quiet?: boolean }) => Record<string, unknown>[];

/**
 * Result of reading and validating a JSONL file.
 */
export interface ReadResult<T> {
  valid: T[];
  warnings: string[];
}

/**
 * Read a JSONL file and validate each record against a Zod schema.
 *
 * Returns all valid records and warning messages for invalid ones.
 * Never throws -- always returns results even if all records are malformed
 * or the file is missing.
 *
 * @param filePath - Path to the JSONL file
 * @param schema - Zod schema to validate each record against
 * @param options - Optional configuration
 * @param options.quiet - If true, suppress console.warn output
 * @returns Object with valid records and warning messages
 */
export function readValidatedJsonl<T>(
  filePath: string,
  schema: z.ZodType<T>,
  options?: { quiet?: boolean }
): ReadResult<T> {
  const valid: T[] = [];
  const warnings: string[] = [];

  // readJsonl with safe:true returns [] on file read error
  const rawRecords = readJsonl(filePath, { safe: true });

  for (const raw of rawRecords) {
    const result = schema.safeParse(raw);
    if (result.success) {
      valid.push(result.data);
    } else {
      const id =
        typeof raw === "object" && raw !== null && "id" in raw ? String(raw.id) : "unknown";
      const msg = `Invalid record (id=${id}): ${result.error.message}`;
      warnings.push(msg);
      if (!options?.quiet) {
        console.warn(msg);
      }
    }
  }

  return { valid, warnings };
}
