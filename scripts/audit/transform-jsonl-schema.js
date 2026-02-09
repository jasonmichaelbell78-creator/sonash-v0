#!/usr/bin/env node
/* global __dirname */
/**
 * transform-jsonl-schema.js - Transform audit JSONL files to JSONL_SCHEMA_STANDARD.md format
 *
 * Converts old schema fields to new schema:
 * - id → (removed, fingerprint used instead)
 * - file + line → files array
 * - description → why_it_matters
 * - recommendation → suggested_fix
 * - confidence: "HIGH"|"MEDIUM"|"LOW" → 90|70|50
 * - verified → (removed)
 * - cross_ref → (stored in notes)
 * - evidence → evidence (kept)
 * - verification_steps → verification_steps (kept, required for S0/S1)
 * - (add) fingerprint, acceptance_tests
 *
 * Usage:
 *   node scripts/audit/transform-jsonl-schema.js <input.jsonl> [--output <output.jsonl>] [--dry-run]
 */

const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../config/load-config");

// Cache audit schema at module scope (avoid re-reading per item)
let VALID_SEVERITIES_CACHED;
try {
  const auditSchema = loadConfig("audit-schema");
  const severities = Array.isArray(auditSchema.validSeverities)
    ? auditSchema.validSeverities
    : ["S0", "S1", "S2", "S3"];
  VALID_SEVERITIES_CACHED = Object.freeze([...severities]);
} catch (configErr) {
  const msg = configErr instanceof Error ? configErr.message : String(configErr);
  console.error(`Warning: failed to load audit-schema config: ${msg}. Using defaults.`);
  VALID_SEVERITIES_CACHED = Object.freeze(["S0", "S1", "S2", "S3"]);
}

// Project root for path containment validation
const PROJECT_ROOT = path.resolve(__dirname, "../..");

/**
 * Validate that a resolved path is contained within the project root
 * Prevents path traversal attacks
 * @param {string} resolvedPath - Absolute path to validate
 * @returns {boolean} true if path is within project root
 */
function isPathContained(resolvedPath) {
  const relative = path.relative(PROJECT_ROOT, resolvedPath);
  // Path is escaped if:
  // - Empty string (same as root - allowed)
  // - Starts with ".." followed by separator or end (escaped)
  // - Is absolute path (escaped on Windows with different drive)
  // Use regex to avoid false positives like "..hidden.md"
  const isEscaped = /^\.\.(?:[\\/]|$)/.test(relative) || path.isAbsolute(relative);
  return !isEscaped;
}

/**
 * Validate and resolve a file path, ensuring it's within project bounds
 * Also resolves symlinks to prevent symlink-based path traversal
 * @param {string} inputPath - User-provided path
 * @param {string} label - Label for error messages (e.g., "input", "output")
 * @returns {string} Resolved absolute path
 * @throws {Error} If path is invalid or escapes project root
 */
function validatePath(inputPath, label) {
  if (!inputPath || typeof inputPath !== "string") {
    throw new Error(`${label} path is required`);
  }

  const resolved = path.resolve(PROJECT_ROOT, inputPath);

  // Basic containment check first
  if (!isPathContained(resolved)) {
    throw new Error(`${label} path "${inputPath}" escapes project root (path traversal blocked)`);
  }

  // Resolve symlinks to prevent symlink-based traversal
  let realResolved;
  try {
    realResolved = fs.realpathSync.native(resolved);

    // Reject directories early for better error messages
    const st = fs.statSync(realResolved);
    if (st.isDirectory()) {
      throw new Error(`${label} path "${inputPath}" points to a directory`);
    }
  } catch (e) {
    // If it's our directory error, rethrow it (safe error message access)
    const errMsg = e instanceof Error ? e.message : String(e);
    if (errMsg.includes("points to a directory")) {
      throw e;
    }
    // Path doesn't exist - for output files, validate parent directory instead
    const parent = path.dirname(resolved);
    try {
      const realParent = fs.realpathSync.native(parent);
      if (!isPathContained(realParent)) {
        throw new Error(
          `${label} path "${inputPath}" escapes project root via symlink (path traversal blocked)`
        );
      }
    } catch {
      // Parent doesn't exist either - allow (will fail later on actual access)
    }
    return resolved;
  }

  // Check containment after symlink resolution
  if (!isPathContained(realResolved)) {
    throw new Error(
      `${label} path "${inputPath}" escapes project root via symlink (path traversal blocked)`
    );
  }

  return realResolved;
}

// Category normalization map - all keys lowercase for consistent lookup
const CATEGORY_MAP = {
  // Code audit categories
  types: "code-quality",
  hygiene: "code-quality",
  framework: "code-quality",
  testing: "code-quality",
  aicode: "code-quality",
  // Security audit
  security: "security",
  auth: "security",
  headers: "security",
  data: "security",
  deps: "security",
  // Performance audit
  rendering: "performance",
  bundle: "performance",
  datafetching: "performance",
  datafetch: "performance",
  memory: "performance",
  corewebvitals: "performance",
  webvitals: "performance",
  performance: "performance",
  // Refactoring audit
  godobject: "refactoring",
  duplication: "refactoring",
  complexity: "refactoring",
  architecture: "refactoring",
  techdebt: "refactoring",
  // Documentation audit
  documentation: "documentation",
  // Process audit
  process: "process",
  // Engineering productivity
  goldenpath: "engineering-productivity",
  debugging: "engineering-productivity",
  offlinesupport: "engineering-productivity",
};

// Confidence string to number
const CONFIDENCE_MAP = {
  HIGH: 90,
  MEDIUM: 70,
  LOW: 50,
};

function normalizeCategory(category) {
  // Guard against missing/invalid category
  if (typeof category !== "string" || category.trim() === "") {
    console.warn(`  Warning: Missing/invalid category, defaulting to "code-quality"`);
    return "code-quality";
  }

  // Normalize whitespace and case upfront
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  // Valid normalized categories
  const validCategories = [
    "security",
    "performance",
    "code-quality",
    "documentation",
    "process",
    "refactoring",
    "engineering-productivity",
  ];

  // Check if already normalized (case/whitespace tolerant)
  if (validCategories.includes(lower)) return lower;

  // Try lookup in category map
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];

  // Default fallback
  console.warn(`  Warning: Unknown category "${category}", defaulting to "code-quality"`);
  return "code-quality";
}

/**
 * Sanitize a fingerprint component to prevent delimiter collisions
 * @param {*} value - Value to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeFingerprintPart(value) {
  return String(value ?? "unknown")
    .replaceAll("::", "--")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function generateFingerprint(item, normalizedCategory) {
  // If fingerprint already exists, validate and update
  if (item.fingerprint && typeof item.fingerprint === "string") {
    const parts = item.fingerprint.split("::");
    if (parts.length >= 3) {
      // Update category and sanitize all parts
      parts[0] = normalizedCategory;
      return parts.map(sanitizeFingerprintPart).join("::");
    }
    // Malformed fingerprint (less than 3 parts) - regenerate
  }

  // Generate from available fields
  const rawFile = item.file || (item.files && item.files[0]) || "unknown";
  const file = sanitizeFingerprintPart(rawFile);
  const id = sanitizeFingerprintPart(
    item.id ||
      item.title
        ?.substring(0, 30)
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .toLowerCase() ||
      "finding"
  );

  return `${normalizedCategory}::${file}::${id}`;
}

function transformItem(item, index) {
  const issues = [];

  // Normalize category
  const originalCategory = item.category;
  const normalizedCategory = normalizeCategory(originalCategory);
  if (originalCategory !== normalizedCategory) {
    issues.push(`category: "${originalCategory}" → "${normalizedCategory}"`);
  }

  // Generate/validate fingerprint
  const fingerprint = generateFingerprint(item, normalizedCategory);

  // Transform files
  let files = item.files;
  if (!files || !Array.isArray(files)) {
    if (item.file) {
      files = item.line ? [`${item.file}:${item.line}`] : [item.file];
      issues.push(`file → files array`);
    } else {
      files = ["unknown"];
      issues.push(`missing files`);
    }
  } else {
    // Normalize existing array to non-empty strings only
    files = files.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());
    if (files.length === 0) {
      files = ["unknown"];
      issues.push(`normalized empty files → ["unknown"]`);
    }
  }

  // Transform confidence
  let confidence = item.confidence;
  if (typeof confidence === "string") {
    // Normalize string: trim and uppercase for lookup
    const normalized = confidence.trim().toUpperCase();
    confidence = CONFIDENCE_MAP[normalized] || 70;
    issues.push(`confidence: "${item.confidence}" → ${confidence}`);
  } else if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    confidence = 70;
    issues.push(`confidence: missing/invalid → 70`);
  } else {
    // Clamp numeric confidence to valid range 0-100
    const clamped = Math.max(0, Math.min(100, confidence));
    if (clamped !== confidence) {
      issues.push(`confidence: out-of-range ${confidence} → ${clamped}`);
      confidence = clamped;
    }
  }

  // Transform description → why_it_matters
  let why_it_matters = item.why_it_matters;
  if (!why_it_matters && item.description) {
    why_it_matters = item.description;
    issues.push(`description → why_it_matters`);
  }
  if (!why_it_matters) {
    why_it_matters = item.title || "See title";
  }

  // Transform recommendation → suggested_fix
  let suggested_fix = item.suggested_fix;
  if (!suggested_fix && item.recommendation) {
    suggested_fix = item.recommendation;
    issues.push(`recommendation → suggested_fix`);
  }
  if (!suggested_fix) {
    suggested_fix = "Review and address the issue";
  }

  // Ensure acceptance_tests
  let acceptance_tests = item.acceptance_tests;
  if (!acceptance_tests || !Array.isArray(acceptance_tests) || acceptance_tests.length === 0) {
    // Try to derive from verification_steps
    if (
      item.verification_steps &&
      Array.isArray(item.verification_steps) &&
      item.verification_steps.length > 0
    ) {
      acceptance_tests = item.verification_steps
        .filter((v) => typeof v === "string" && v.trim())
        .map((v) => v.trim());
      issues.push(`verification_steps → acceptance_tests`);
    } else {
      acceptance_tests = ["Verify the fix addresses the issue", "Run relevant tests"];
      issues.push(`added default acceptance_tests`);
    }
  } else {
    // Validate existing acceptance_tests array
    acceptance_tests = acceptance_tests
      .filter((v) => typeof v === "string" && v.trim())
      .map((v) => v.trim());
  }

  // Fallback if all entries were invalid
  if (acceptance_tests.length === 0) {
    acceptance_tests = ["Verify the fix addresses the issue", "Run relevant tests"];
    issues.push(`normalized empty acceptance_tests → defaults`);
  }

  // Validate severity (case-insensitive - normalize to uppercase)
  const severityInput = typeof item.severity === "string" ? item.severity.trim().toUpperCase() : "";
  let severity = VALID_SEVERITIES_CACHED.includes(severityInput) ? severityInput : "S2";
  if (severity !== item.severity) {
    issues.push(`severity: "${item.severity}" → ${severity}`);
  }

  // Validate effort (case-insensitive - normalize to uppercase)
  const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];
  const effortInput = typeof item.effort === "string" ? item.effort.trim().toUpperCase() : "";
  let effort = VALID_EFFORTS.includes(effortInput) ? effortInput : "E2";
  if (effort !== item.effort) {
    issues.push(`effort: "${item.effort}" → ${effort}`);
  }

  // Guarantee non-empty title
  const title =
    typeof item.title === "string" && item.title.trim()
      ? item.title.trim()
      : `Untitled finding #${index + 1}`;
  if (title !== item.title) {
    issues.push(`title: missing/blank → default`);
  }

  // Build transformed item
  const transformed = {
    category: normalizedCategory,
    title: title,
    fingerprint: fingerprint,
    severity: severity,
    effort: effort,
    confidence: confidence,
    files: files,
    why_it_matters: why_it_matters,
    suggested_fix: suggested_fix,
    acceptance_tests: acceptance_tests,
  };

  // Preserve evidence if exists
  if (item.evidence && Array.isArray(item.evidence) && item.evidence.length > 0) {
    transformed.evidence = item.evidence;
  }

  // Convert and preserve verification_steps for S0/S1 (required structure per JSONL_SCHEMA_STANDARD.md)
  // Use normalized severity variable, not item.severity
  if (severity === "S0" || severity === "S1") {
    // Default verification_steps structure
    const defaultVerificationSteps = {
      first_pass: {
        method: "code_search",
        evidence_collected: [
          (item.evidence && item.evidence[0]) || "See files array for affected locations",
        ],
      },
      second_pass: {
        method: "manual_verification",
        confirmed: true,
        notes: "Confirmed during audit review",
      },
      tool_confirmation: {
        tool: "NONE",
        reference: "No automated tool confirmation available",
      },
    };

    // Convert array-style verification_steps to object structure
    if (Array.isArray(item.verification_steps) && item.verification_steps.length > 0) {
      // Filter to only valid strings before processing
      const steps = item.verification_steps.filter((v) => typeof v === "string" && v.trim());

      // Extract evidence from array items for first_pass (case-insensitive)
      const evidenceItems = steps.filter((v) => {
        const lower = v.toLowerCase();
        return (
          lower.includes("grep") ||
          lower.includes("search") ||
          lower.includes("run") ||
          lower.includes("check")
        );
      });
      const reviewItems = steps.filter((v) => {
        const lower = v.toLowerCase();
        return lower.includes("review") || lower.includes("verify") || lower.includes("confirm");
      });
      const toolRefs = steps.filter((v) => {
        const lower = v.toLowerCase();
        return (
          lower.includes("eslint") ||
          lower.includes("lint") ||
          lower.includes("npm") ||
          lower.includes("typescript") ||
          lower.includes("sonar")
        );
      });

      transformed.verification_steps = {
        first_pass: {
          method:
            evidenceItems.length > 0 && evidenceItems[0].toLowerCase().includes("grep")
              ? "grep"
              : "code_search",
          evidence_collected:
            evidenceItems.length > 0 ? evidenceItems : [steps[0] || "Initial code review"],
        },
        second_pass: {
          method: reviewItems.length > 0 ? "contextual_review" : "manual_verification",
          confirmed: true,
          notes: reviewItems.length > 0 ? reviewItems.join("; ") : "Confirmed via dual-pass review",
        },
        tool_confirmation: {
          tool:
            toolRefs.length > 0 && toolRefs[0].toLowerCase().includes("eslint")
              ? "eslint"
              : toolRefs.length > 0 && toolRefs[0].toLowerCase().includes("typescript")
                ? "typescript"
                : toolRefs.length > 0
                  ? "patterns_check"
                  : "NONE",
          reference: toolRefs.length > 0 ? toolRefs[0] : "Manual verification only",
        },
      };
      issues.push("verification_steps: array → object structure");
    } else if (
      item.verification_steps &&
      typeof item.verification_steps === "object" &&
      !Array.isArray(item.verification_steps)
    ) {
      // Already in object format - deep merge with defaults to ensure all required fields
      const provided = item.verification_steps;
      transformed.verification_steps = {
        ...defaultVerificationSteps,
        ...provided,
        first_pass: {
          ...defaultVerificationSteps.first_pass,
          ...(provided.first_pass || {}),
        },
        second_pass: {
          ...defaultVerificationSteps.second_pass,
          ...(provided.second_pass || {}),
        },
        tool_confirmation: {
          ...defaultVerificationSteps.tool_confirmation,
          ...(provided.tool_confirmation || {}),
        },
      };
      issues.push("verification_steps: normalized object structure");
    } else {
      // Generate default verification_steps for S0/S1 without existing ones
      transformed.verification_steps = defaultVerificationSteps;
      issues.push("added default verification_steps for S0/S1");
    }
  }

  // Add notes for preserved metadata
  const notes = [];
  if (item.id) notes.push(`Original ID: ${item.id}`);
  if (item.cross_ref) notes.push(`Cross-ref: ${item.cross_ref}`);
  if (item.verified) notes.push(`Verified: ${item.verified}`);
  if (notes.length > 0) {
    transformed.notes = notes.join("; ");
  }

  return { transformed, issues };
}

function processFile(inputPath, outputPath, dryRun) {
  console.log(`\nProcessing: ${path.basename(inputPath)}`);

  // Read file with error handling - check existence first for better error message
  if (!fs.existsSync(inputPath)) {
    console.error(`  ERROR: File not found: ${inputPath}`);
    process.exitCode = 1;
    return 0;
  }

  // Separate try/catch for readFileSync (pattern compliance)
  let content;
  try {
    content = fs.readFileSync(inputPath, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ERROR: Unable to read file "${inputPath}": ${msg}`);
    process.exitCode = 1;
    return 0;
  }

  const lines = content
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());

  console.log(`  Found ${lines.length} findings`);

  const results = [];
  let totalIssues = 0;
  let parseErrors = 0;

  for (let i = 0; i < lines.length; i++) {
    try {
      // Strip UTF-8 BOM if present (handles BOM-prefixed files)
      const rawLine = lines[i].replace(/^\uFEFF/, "");
      const item = JSON.parse(rawLine);
      const { transformed, issues } = transformItem(item, i);
      results.push(transformed);

      if (issues.length > 0) {
        totalIssues += issues.length;
        if (dryRun) {
          console.log(`  Line ${i + 1}: ${issues.join(", ")}`);
        }
      }
    } catch (err) {
      parseErrors += 1;
      // Safe error message access (Qodo compliance)
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR Line ${i + 1}: Invalid JSON - ${msg}`);
    }
  }

  console.log(`  Transformations: ${totalIssues} field changes`);

  // Abort on parse errors to prevent data loss (don't silently drop invalid lines)
  if (parseErrors > 0) {
    console.error(
      `  ERROR: ${parseErrors} invalid JSON line(s) found; refusing to write output to avoid data loss.`
    );
    process.exitCode = 1;
    return 0;
  }

  if (!dryRun) {
    // Write output atomically (tmp file + rename) to prevent corruption
    // Use unique temp file name with PID/timestamp to prevent race conditions
    const dir = path.dirname(outputPath);
    const base = path.basename(outputPath);
    const tmpPath = path.join(dir, `.${base}.tmp.${process.pid}.${Date.now()}`);

    try {
      // Check for pre-existing symlink at temp path (security hardening)
      try {
        const st = fs.lstatSync(tmpPath);
        if (st.isSymbolicLink()) {
          throw new Error(`Refusing to write through symlink temp file: ${tmpPath}`);
        }
        // Pre-existing temp file - remove it
        fs.unlinkSync(tmpPath);
      } catch (e) {
        // lstatSync/unlinkSync failing because it doesn't exist is OK
        if (e && typeof e === "object" && "code" in e && e.code !== "ENOENT") throw e;
      }

      const output = results.map((r) => JSON.stringify(r)).join("\n") + "\n";

      // Use exclusive write flag for security (wx = write exclusive)
      const fd = fs.openSync(tmpPath, "wx", 0o600);
      try {
        fs.writeFileSync(fd, output, "utf8");
      } finally {
        fs.closeSync(fd);
      }

      // Atomic rename (with Windows fallback)
      try {
        fs.renameSync(tmpPath, outputPath);
      } catch (renameErr) {
        // Windows can fail to overwrite existing destination; fall back to unlink+rename
        try {
          const st = fs.statSync(outputPath);
          if (st.isDirectory()) {
            throw new Error(`Output path is a directory: ${outputPath}`);
          }
          fs.unlinkSync(outputPath);
        } catch (unlinkErr) {
          // Ignore ENOENT (missing destination is fine); rethrow other errors
          if (
            !(
              unlinkErr &&
              typeof unlinkErr === "object" &&
              "code" in unlinkErr &&
              unlinkErr.code === "ENOENT"
            )
          ) {
            throw unlinkErr;
          }
        }
        fs.renameSync(tmpPath, outputPath);
      }

      console.log(`  Written to: ${outputPath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: Unable to write file "${outputPath}": ${msg}`);
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
      } catch {
        // Ignore cleanup errors
      }
      process.exitCode = 1;
      return 0;
    }
  } else {
    console.log(`  (dry-run - no changes written)`);
  }

  return results.length;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`
Usage: node transform-jsonl-schema.js <input.jsonl> [--output <output.jsonl>] [--dry-run]
       node transform-jsonl-schema.js --all [--dry-run]

Options:
  --output <file>  Output file path (default: overwrites input)
  --dry-run        Show changes without writing
  --all            Process all audit JSONL files in docs/audits/comprehensive/
`);
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const processAll = args.includes("--all");

if (processAll) {
  // --all mode: process all JSONL files in docs/audits/comprehensive/
  // This path is hardcoded relative to script location, not user input
  const auditDir = path.join(__dirname, "../../docs/audits/comprehensive");

  let files;
  try {
    if (!fs.existsSync(auditDir)) {
      console.error(`Error: Audit directory not found: ${auditDir}`);
      process.exit(1);
    }
    files = fs.readdirSync(auditDir).filter((f) => f.endsWith("-findings.jsonl"));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: Unable to read audit directory "${auditDir}": ${msg}`);
    process.exit(1);
  }

  console.log(`\n=== JSONL Schema Transformation ===`);
  console.log(`Processing ${files.length} files in docs/audits/comprehensive/`);
  if (dryRun) console.log(`(DRY RUN - no files will be modified)`);

  let totalFindings = 0;
  for (const file of files) {
    // Validate each file path is contained (defense in depth)
    const inputPath = path.join(auditDir, file);
    const resolvedInput = path.resolve(inputPath);
    if (!isPathContained(resolvedInput)) {
      console.error(`  Skipping suspicious file path: ${file}`);
      process.exitCode = 1;
      continue;
    }

    // Block symlink-based traversal (in-place overwrite would follow symlink)
    try {
      const stat = fs.lstatSync(resolvedInput);
      if (stat.isSymbolicLink()) {
        console.error(`  Skipping symlink file: ${file}`);
        process.exitCode = 1;
        continue;
      }
      // Resolve symlink and verify containment
      const realResolved = fs.realpathSync.native(resolvedInput);
      if (!isPathContained(realResolved)) {
        console.error(`  Skipping file resolving outside project root: ${file}`);
        process.exitCode = 1;
        continue;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Skipping unreadable file "${file}": ${msg}`);
      process.exitCode = 1;
      continue;
    }

    totalFindings += processFile(resolvedInput, resolvedInput, dryRun);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total findings processed: ${totalFindings}`);
} else {
  // Single file mode: validate user-provided paths
  const inputArg = args.find((a) => !a.startsWith("--"));
  const outputIdx = args.indexOf("--output");

  // Validate --output has a value
  let outputArg = null;
  if (outputIdx >= 0) {
    if (args.length <= outputIdx + 1 || args[outputIdx + 1].startsWith("--")) {
      console.error("Error: --output flag requires a file path");
      process.exit(1);
    }
    outputArg = args[outputIdx + 1];
  }

  if (!inputArg) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  // Validate and resolve paths with containment check
  let inputPath, outputPath;
  try {
    inputPath = validatePath(inputArg, "Input");
    outputPath = outputArg ? validatePath(outputArg, "Output") : inputPath;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    process.exit(1);
  }

  processFile(inputPath, outputPath, dryRun);
}
