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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withLock, isSafeToWrite } = require(
  path.resolve(findProjectRoot(__dirname), "scripts/lib/safe-fs.js")
) as {
  withLock: (filePath: string, fn: () => void, timeoutMs?: number) => void;
  isSafeToWrite: (filePath: string) => boolean;
};

/**
 * Append a validated record to a JSONL file.
 *
 * Validates the record against the provided Zod schema before writing.
 * Uses safe-fs.js withLock for advisory locking and isSafeToWrite for
 * symlink guards. Lets ZodError propagate to caller on validation failure.
 *
 * @param filePath - Absolute path to the JSONL file
 * @param record - The record to append
 * @param schema - Zod schema to validate the record against
 */
export function appendRecord<T>(filePath: string, record: T, schema: z.ZodType<T>): void {
  const absPath = path.resolve(filePath);

  // Symlink guard
  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to write to unsafe path: ${path.basename(absPath)}`);
  }

  // Validate -- throws ZodError if invalid (intentionally not caught)
  const validated = schema.parse(record);

  const line = JSON.stringify(validated) + "\n";

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(absPath), { recursive: true });

  // Write under advisory lock
  withLock(absPath, () => {
    fs.appendFileSync(absPath, line, "utf8");
  });
}
