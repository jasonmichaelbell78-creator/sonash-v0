/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Data Persistence & Concurrency — Domain 3 (D3)
 *
 * 5 categories:
 *   1. jsonl_append_atomicity — Concurrent write safety
 *   2. file_rotation_cleanup — Unbounded growth detection
 *   3. schema_validation — Required fields present in JSONL records
 *   4. timestamp_consistency — ISO format, timezone, NaN date
 *   5. corrupt_entry_detection — Recovery from malformed entries
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    let m;
    if (e instanceof Error) {
      m = e.message;
    } else {
      m = String(e);
    }
    throw new Error(`[data-persistence] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "data_persistence";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_JSONL_SIZE = 5 * 1024 * 1024;

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const dataDir = path.join(rootDir, "data", "ecosystem-v2");
  const stateDir = path.join(rootDir, ".claude", "state");
  const healthLibDir = path.join(rootDir, "scripts", "health", "lib");

  scores.jsonl_append_atomicity = checkAppendAtomicity(rootDir, healthLibDir, findings);
  scores.file_rotation_cleanup = checkFileRotation(dataDir, stateDir, findings);
  scores.schema_validation = checkSchemaValidation(dataDir, findings);
  scores.timestamp_consistency = checkTimestampConsistency(dataDir, findings);
  scores.corrupt_entry_detection = checkCorruptDetection(rootDir, healthLibDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: JSONL Append Atomicity --------------------------------------

function checkAppendAtomicity(rootDir, healthLibDir, findings) {
  const bench = BENCHMARKS.jsonl_append_atomicity;
  let totalWriteOps = 0;
  let safeWriteOps = 0;

  // Scan health lib files for JSONL write operations
  const filesToCheck = [];
  try {
    for (const name of fs.readdirSync(healthLibDir)) {
      if (name.endsWith(".js") && !name.includes("test")) {
        const resolved = path.join(healthLibDir, name);
        const rel = path.relative(healthLibDir, resolved);
        if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
        const content = safeReadFile(resolved);
        if (content) filesToCheck.push({ name, content, resolvedPath: resolved });
      }
    }
  } catch {
    // dir not accessible
  }

  const writeOps = ["writeFileSync", "writeFile", "appendFileSync", "appendFile"];
  const writePattern = new RegExp("\\b(?:" + writeOps.join("|") + ")\\b", "g");
  const safeWritePattern = /safe(?:Write|Append)FileSync|atomic|\.tmp|rename/i;

  for (const file of filesToCheck) {
    const matches = file.content.match(writePattern);
    if (!matches) continue;

    totalWriteOps += matches.length;

    if (safeWritePattern.test(file.content)) {
      safeWriteOps += matches.length;
    } else {
      findings.push({
        id: "HMS-300",
        category: "jsonl_append_atomicity",
        domain: DOMAIN,
        severity: "warning",
        message: `Non-atomic JSONL writes in ${file.name}`,
        details:
          "Uses raw fs write operations. Concurrent writes (hook + manual run) may corrupt data.",
        impactScore: 65,
        frequency: matches.length,
        blastRadius: 3,
        patchType: "add_safe_write",
        patchTarget: file.resolvedPath,
      });
    }
  }

  const safePct = totalWriteOps > 0 ? Math.round((safeWriteOps / totalWriteOps) * 100) : 100;
  const result = scoreMetric(safePct, bench.safe_write_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalWriteOps, safeWriteOps, safePct },
  };
}

// -- Category 2: File Rotation & Cleanup -------------------------------------

function checkFileRotation(dataDir, stateDir, findings) {
  const bench = BENCHMARKS.file_rotation_cleanup;
  let unboundedCount = 0;

  const jsonlFiles = [];

  // Scan data/ecosystem-v2/ for JSONL files
  try {
    for (const name of fs.readdirSync(dataDir)) {
      if (name.endsWith(".jsonl")) {
        const filePath = path.join(dataDir, name);
        try {
          const stat = fs.statSync(filePath);
          jsonlFiles.push({ name, filePath, size: stat.size });
        } catch {
          // skip
        }
      }
    }
  } catch {
    // dir not accessible
  }

  // Also check .claude/state/ JSONL files
  try {
    for (const name of fs.readdirSync(stateDir)) {
      if (name.endsWith(".jsonl")) {
        const filePath = path.join(stateDir, name);
        try {
          const stat = fs.statSync(filePath);
          jsonlFiles.push({ name, filePath, size: stat.size });
        } catch {
          // skip
        }
      }
    }
  } catch {
    // dir not accessible
  }

  for (const file of jsonlFiles) {
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > 5) {
      unboundedCount++;
      findings.push({
        id: "HMS-310",
        category: "file_rotation_cleanup",
        domain: DOMAIN,
        severity: "error",
        message: `JSONL file exceeds 5MB: ${file.name} (${sizeMB.toFixed(1)}MB)`,
        details: "No rotation mechanism detected. File will grow unboundedly.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 4,
        patchType: "fix_rotation",
        patchTarget: file.filePath,
      });
    } else if (sizeMB > 1) {
      findings.push({
        id: "HMS-311",
        category: "file_rotation_cleanup",
        domain: DOMAIN,
        severity: "warning",
        message: `JSONL file approaching rotation threshold: ${file.name} (${sizeMB.toFixed(1)}MB)`,
        details: "Consider implementing rotation before file exceeds 5MB limit.",
        impactScore: 45,
        frequency: 1,
        blastRadius: 2,
      });
    }

    // Count lines in readable files
    if (file.size < MAX_JSONL_SIZE) {
      try {
        const content = fs.readFileSync(file.filePath, "utf8");
        const lineCount = content.split("\n").filter((l) => l.trim()).length;
        if (lineCount > 2000) {
          unboundedCount++;
          findings.push({
            id: "HMS-312",
            category: "file_rotation_cleanup",
            domain: DOMAIN,
            severity: "warning",
            message: `${file.name} has ${lineCount} entries (>2000)`,
            details: "Large entry count suggests missing rotation. Performance will degrade.",
            impactScore: 50,
            frequency: 1,
            blastRadius: 2,
          });
        }
      } catch {
        // skip
      }
    }
  }

  const result = scoreMetric(unboundedCount, bench.unbounded_count, "lower-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { jsonlFiles: jsonlFiles.length, unboundedCount },
  };
}

// -- Category 3: Schema Validation -------------------------------------------

function checkSchemaValidation(dataDir, findings) {
  const bench = BENCHMARKS.schema_validation;
  let totalEntries = 0;
  let validEntries = 0;

  // Check ecosystem-health-log.jsonl for required fields
  const healthLogPath = path.join(dataDir, "ecosystem-health-log.jsonl");
  const requiredFields = ["timestamp", "score", "grade", "mode"];

  try {
    if (fs.existsSync(healthLogPath)) {
      const stat = fs.statSync(healthLogPath);
      if (stat.size < MAX_JSONL_SIZE) {
        const content = fs.readFileSync(healthLogPath, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          totalEntries++;
          try {
            const entry = JSON.parse(line);
            const hasRequired = requiredFields.every((f) => entry[f] !== undefined);
            if (hasRequired) {
              validEntries++;
            } else {
              const missing = requiredFields.filter((f) => entry[f] === undefined);
              findings.push({
                id: "HMS-320",
                category: "schema_validation",
                domain: DOMAIN,
                severity: "warning",
                message: `Health log entry missing required fields: ${missing.join(", ")}`,
                details: `Entry timestamp: ${entry.timestamp || "unknown"}. Missing fields cause downstream parse failures.`,
                impactScore: 50,
                frequency: 1,
                blastRadius: 2,
              });
            }
          } catch {
            // Corrupt entry — handled in corrupt_entry_detection
            totalEntries--; // Don't count for schema validation
          }
        }
      }
    }
  } catch {
    // file not accessible
  }

  // Check warnings.jsonl schema
  const warningsPath = path.join(dataDir, "warnings.jsonl");
  const warningFields = ["id", "category", "message", "severity", "lifecycle"];

  try {
    if (fs.existsSync(warningsPath)) {
      const stat = fs.statSync(warningsPath);
      if (stat.size < MAX_JSONL_SIZE) {
        const content = fs.readFileSync(warningsPath, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          totalEntries++;
          try {
            const entry = JSON.parse(line);
            const hasRequired = warningFields.every((f) => entry[f] !== undefined);
            if (hasRequired) {
              validEntries++;
            }
          } catch {
            totalEntries--;
          }
        }
      }
    }
  } catch {
    // file not accessible
  }

  const validPct = totalEntries > 0 ? Math.round((validEntries / totalEntries) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalEntries, validEntries, validPct },
  };
}

// -- Category 4: Timestamp Consistency ---------------------------------------

function checkTimestampConsistency(dataDir, _findings) {
  const bench = BENCHMARKS.timestamp_consistency;
  let totalTimestamps = 0;
  let validTimestamps = 0;

  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

  const jsonlFiles = [];
  try {
    for (const name of fs.readdirSync(dataDir)) {
      if (name.endsWith(".jsonl")) {
        jsonlFiles.push(path.join(dataDir, name));
      }
    }
  } catch {
    // dir not accessible
  }

  for (const filePath of jsonlFiles) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_JSONL_SIZE) continue;
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.timestamp) {
            totalTimestamps++;
            if (isoPattern.test(entry.timestamp)) {
              const d = new Date(entry.timestamp);
              if (!isNaN(d.getTime())) {
                validTimestamps++;
              }
            }
          }
          if (entry.date) {
            totalTimestamps++;
            // date format: YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
              validTimestamps++;
            }
          }
        } catch {
          // malformed line
        }
      }
    } catch {
      // file not accessible
    }
  }

  const validPct =
    totalTimestamps > 0 ? Math.round((validTimestamps / totalTimestamps) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalTimestamps, validTimestamps, validPct },
  };
}

// -- Category 5: Corrupt Entry Detection -------------------------------------

function checkCorruptDetection(rootDir, healthLibDir, findings) {
  const bench = BENCHMARKS.corrupt_entry_detection;
  let totalHandlers = 0;
  let properHandlers = 0;

  // Check health lib files for JSONL read operations and how they handle parse errors
  try {
    for (const name of fs.readdirSync(healthLibDir)) {
      if (!name.endsWith(".js") || name.includes("test")) continue;
      const content = safeReadFile(path.join(healthLibDir, name));
      if (!content) continue;

      // Does this file read JSONL?
      const readsJsonl =
        /\.split\s*\(\s*["']\\n["']\s*\)/.test(content) && /JSON\.parse/.test(content);
      if (!readsJsonl) continue;

      totalHandlers++;

      // Does it handle parse failures gracefully?
      const hasFilter =
        /\.filter\s*\(\s*Boolean\s*\)/.test(content) || /\.filter\s*\([^)]*!=\s*null/.test(content);
      const hasTryCatch = /try\s*\{[^}]*JSON\.parse/.test(content);

      if (hasFilter && hasTryCatch) {
        properHandlers++;
      } else if (hasTryCatch) {
        properHandlers++; // Partial credit
      } else {
        findings.push({
          id: "HMS-340",
          category: "corrupt_entry_detection",
          domain: DOMAIN,
          severity: "warning",
          message: `${name} reads JSONL without corrupt entry filtering`,
          details: "A single corrupt line will cause the entire file read to fail.",
          impactScore: 60,
          frequency: 1,
          blastRadius: 3,
        });
      }
    }
  } catch {
    // dir not accessible
  }

  // Also check that health-log.js handles corrupt entries
  const healthLogContent = safeReadFile(path.join(healthLibDir, "health-log.js"));
  if (healthLogContent) {
    totalHandlers++;
    if (
      /filter\s*\(\s*Boolean\s*\)/.test(healthLogContent) ||
      /catch.*null/.test(healthLogContent)
    ) {
      properHandlers++;
    }
  }

  const handledPct = totalHandlers > 0 ? Math.round((properHandlers / totalHandlers) * 100) : 100;
  const result = scoreMetric(handledPct, bench.handled_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalHandlers, properHandlers, handledPct },
  };
}

module.exports = { run, DOMAIN };
