#!/usr/bin/env npx tsx
/**
 * Validate skill artifacts against canonical Zod schemas.
 *
 * Usage:
 *   npx tsx validate-artifact.ts --type=analysis --path=<file>
 *   npx tsx validate-artifact.ts --type=findings --path=<file>
 *
 * For synthesis validation, use scripts/lib/analysis-schema.js::validate(record, 'synthesis')
 * — the canonical synthesisRecord schema lives there (T29, D#28).
 *
 * Exit codes:
 *   0 = valid
 *   1 = validation errors (strict mode)
 *   2 = legacy artifact (warning-only, still exits 0)
 */
import { readFileSync } from "fs";
import { analysisSchema } from "./analysis-schema.js";
import { findingSchema } from "./findings-schema.js";
import { sanitizeError } from "../../../scripts/lib/sanitize-error.js";

const VALID_TYPES = ["analysis", "findings"] as const;

const args = process.argv.slice(2);
const typeArg = args.find((a) => a.startsWith("--type="));
const pathArg = args.find((a) => a.startsWith("--path="));

if (!typeArg || !pathArg) {
  console.error("Usage: npx tsx validate-artifact.ts --type=<analysis|findings> --path=<file>");
  process.exit(1);
}

const type = typeArg.substring(typeArg.indexOf("=") + 1);
const filePath = pathArg.substring(pathArg.indexOf("=") + 1);

if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
  console.error(`Invalid --type "${type}". Expected one of: ${VALID_TYPES.join(", ")}`);
  process.exit(1);
}

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
    // JSON: validate single object (type === "analysis")
    const parsed = JSON.parse(raw);
    const result = analysisSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Validation failed:\n${JSON.stringify(result.error.issues, null, 2)}`);
      process.exit(1);
    }
    console.log(`${type}: validated successfully.`);
  }
} catch (err) {
  const message = sanitizeError(err);
  console.error(`Error reading/parsing ${filePath}: ${message}`);
  process.exit(1);
}
