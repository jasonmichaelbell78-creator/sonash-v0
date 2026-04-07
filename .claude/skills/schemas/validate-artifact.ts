#!/usr/bin/env npx tsx
/**
 * Validate skill artifacts against canonical Zod schemas.
 *
 * Usage:
 *   npx tsx validate-artifact.ts --type=analysis --path=<file>
 *   npx tsx validate-artifact.ts --type=findings --path=<file>
 *   npx tsx validate-artifact.ts --type=synthesis --path=<file>
 *
 * Exit codes:
 *   0 = valid
 *   1 = validation errors (strict mode)
 *   2 = legacy artifact (warning-only, still exits 0)
 */
import { readFileSync } from "fs";
import { analysisSchema } from "./analysis-schema.js";
import { findingSchema } from "./findings-schema.js";
import { synthesisSchema } from "./synthesis-schema.js";

const args = process.argv.slice(2);
const typeArg = args.find((a) => a.startsWith("--type="));
const pathArg = args.find((a) => a.startsWith("--path="));

if (!typeArg || !pathArg) {
  console.error(
    "Usage: npx tsx validate-artifact.ts --type=<analysis|findings|synthesis> --path=<file>"
  );
  process.exit(1);
}

const type = typeArg.split("=")[1];
const filePath = pathArg.split("=")[1];

try {
  const raw = readFileSync(filePath, "utf-8");

  if (type === "findings") {
    // JSONL: validate each line
    const lines = raw
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    let errors = 0;
    for (let i = 0; i < lines.length; i++) {
      const parsed = JSON.parse(lines[i]);
      const result = findingSchema.safeParse(parsed);
      if (!result.success) {
        console.error(`Line ${i + 1}: ${JSON.stringify(result.error.issues)}`);
        errors++;
      }
    }
    if (errors > 0) {
      console.error(`\n${errors} of ${lines.length} entries failed validation.`);
      process.exit(1);
    }
    console.log(`findings: ${lines.length} entries validated.`);
  } else {
    // JSON: validate single object
    const parsed = JSON.parse(raw);
    const schema = type === "analysis" ? analysisSchema : synthesisSchema;

    // Legacy detection: no schema_version field
    const isLegacy = type === "synthesis" && !parsed.schema_version && parsed.version;

    if (isLegacy) {
      console.warn(
        `WARNING: Legacy artifact (uses "version" instead of "schema_version"). Accepted with warning.`
      );
      // Remap for validation
      parsed.schema_version = parsed.version;
      delete parsed.version;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.error(`Validation failed:\n${JSON.stringify(result.error.issues, null, 2)}`);
      process.exit(isLegacy ? 0 : 1); // Legacy = warning only
    }
    console.log(`${type}: validated successfully.${isLegacy ? " (legacy mode)" : ""}`);
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error reading/parsing ${filePath}: ${message}`);
  process.exit(1);
}
