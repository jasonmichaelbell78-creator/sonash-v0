#!/usr/bin/env node
/**
 * Event-Based Trigger Checker
 *
 * Checks for conditions that trigger required actions before push.
 * Replaces time-based triggers with event-based triggers.
 *
 * Triggers:
 *   - security_audit: Security-sensitive files modified
 *   - consolidation: Review count threshold exceeded
 *   - skill_validation: Skill files modified
 *
 * Usage:
 *   node scripts/check-triggers.js [--blocking-only]
 *
 * Exit codes:
 *   0 - No blocking triggers, safe to proceed
 *   1 - Blocking triggers detected, action required
 *   2 - Script error
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Configuration
const TRIGGERS = {
  security_audit: {
    severity: "blocking",
    description: "Security-sensitive files modified",
    patterns: [
      /auth/i,
      /token/i,
      /credential/i,
      /secret/i,
      /password/i,
      /apikey/i,
      /api-key/i,
      /jwt/i,
      /oauth/i,
      // Note: /session/i removed - too broad (matches session-start.sh, SESSION_CONTEXT.md, etc.)
      // Session-related security concerns are covered by /auth/i and /token/i
      /encrypt/i,
      /crypto/i,
    ],
    action: "Run: npm run audit-security OR use security-auditor agent",
  },
  consolidation: {
    severity: "warning",
    description: "Review consolidation may be needed",
    threshold: 2, // Warn when 2 or fewer reviews remaining until 10 threshold
    action: "Consolidation will auto-run at next session-start",
  },
  skill_validation: {
    severity: "warning",
    description: "Skill/agent files modified",
    paths: [".claude/skills/", ".claude/commands/"],
    action: "Validate skill structure and test invocation",
  },
  review_sync: {
    severity: "warning",
    description: "Reviews in markdown not synced to JSONL",
    action: "Run: npm run reviews:sync -- --apply",
  },
};

/**
 * Run a git diff command and return parsed file list, or null on failure
 */
function tryGitDiff(gitArgs) {
  const result = spawnSync("git", gitArgs, {
    encoding: "utf-8",
    timeout: 5000,
  });
  if (result.status === 0) {
    return result.stdout.split("\n").filter((f) => f.trim());
  }
  return null;
}

/**
 * Resolve the base branch reference (origin/main, main, or master)
 */
function resolveBaseRef() {
  const baseCandidates = ["origin/main", "main", "master"];
  for (const candidate of baseCandidates) {
    const verify = spawnSync("git", ["rev-parse", "--verify", candidate], {
      encoding: "utf-8",
      timeout: 3000,
    });
    if (verify.status === 0) return candidate;
  }
  return null;
}

/**
 * Try to get changed files using merge-base against a base ref
 */
function tryMergeBaseDiff(baseRef) {
  const mergeBaseResult = spawnSync("git", ["merge-base", "HEAD", baseRef], {
    encoding: "utf-8",
    timeout: 5000,
  });

  if (mergeBaseResult.status !== 0 || !mergeBaseResult.stdout) return null;

  const mergeBase = mergeBaseResult.stdout.trim();
  return tryGitDiff(["diff", "--name-only", `${mergeBase}..HEAD`]);
}

// Get staged files for push
// Returns null on complete failure (fail-closed for security)
// Uses spawnSync with shell:false to prevent command injection
function getStagedFiles() {
  const baseRef = resolveBaseRef();

  if (baseRef) {
    // Try git merge-base for reliable branch divergence detection
    const mergeBaseFiles = tryMergeBaseDiff(baseRef);
    if (mergeBaseFiles) return mergeBaseFiles;

    // Fallback 1: try simple diff against base ref
    const simpleDiff = tryGitDiff(["diff", "--name-only", `${baseRef}..HEAD`]);
    if (simpleDiff) return simpleDiff;
  }

  // Fallback 2: get files in last commit
  const lastCommitDiff = tryGitDiff(["diff", "--name-only", "HEAD~1"]);
  if (lastCommitDiff) return lastCommitDiff;

  // Fallback 3: staged changes only (works on initial commits / shallow clones)
  const cachedDiff = tryGitDiff(["diff", "--name-only", "--cached"]);
  if (cachedDiff) return cachedDiff;

  // Fail-closed: return null to signal complete failure
  // This prevents silently bypassing security checks
  return null;
}

// Check security trigger
function checkSecurityTrigger(files) {
  const trigger = TRIGGERS.security_audit;
  const matches = [];

  // Only check code files, not docs/audits/configs
  const codeExtensions = /\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/i;
  const excludePaths = [
    /^docs\//i,
    /^\.claude\/commands\//i,
    /^\.claude\/skills\//i,
    /^\.claude\/hooks\//i,
    /^\.husky\//i,
    /^scripts\//i, // Scripts are infrastructure, not app code
    /node_modules\//i,
    /\.md$/i,
    /\.jsonl$/i,
  ];

  for (const file of files) {
    // Skip non-code files and excluded paths
    if (!codeExtensions.test(file)) continue;
    if (excludePaths.some((p) => p.test(file))) continue;

    const fileLower = file.toLowerCase();
    for (const pattern of trigger.patterns) {
      if (pattern.test(fileLower)) {
        matches.push({ file, pattern: pattern.toString() });
        break; // One match per file is enough
      }
    }
  }

  if (matches.length > 0) {
    return {
      triggered: true,
      name: "security_audit",
      severity: trigger.severity,
      description: trigger.description,
      action: trigger.action,
      details: matches.map((m) => `  - ${m.file}`).join("\n"),
    };
  }

  return { triggered: false, name: "security_audit" };
}

/**
 * Resolve git root directory, falling back to cwd
 */
function resolveGitRoot() {
  const gitRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    timeout: 3000,
  });
  return gitRoot.status === 0 && gitRoot.stdout
    ? gitRoot.stdout.trim()
    : path.resolve(process.cwd());
}

/**
 * Count pending reviews from JSONL file since last consolidation
 */
function countPendingReviews(reviewsPath, lastConsolidated) {
  // Size guard: skip oversized state files to prevent local DoS (Review #256)
  const MAX_REVIEWS_SIZE = 512 * 1024; // 512 KB
  let stat;
  try {
    stat = fs.statSync(reviewsPath);
  } catch {
    return 0; // File disappeared between existsSync and statSync
  }
  if (stat.size > MAX_REVIEWS_SIZE) {
    console.error(`   ⚠️  reviews.jsonl exceeds ${MAX_REVIEWS_SIZE} bytes, skipping`);
    return 0;
  }

  // Handle CRLF line endings + coerce string IDs (Review #256)
  let content;
  try {
    content = fs.readFileSync(reviewsPath, "utf8").replaceAll("\r\n", "\n").trim();
  } catch {
    return 0; // File became unreadable
  }
  if (!content) return 0;

  const lines = content.split("\n").filter(Boolean);
  let count = 0;
  for (const line of lines) {
    try {
      const r = JSON.parse(line);
      const id =
        typeof r.id === "number"
          ? r.id
          : typeof r.id === "string"
            ? Number.parseInt(r.id, 10)
            : NaN;
      if (Number.isFinite(id) && id > lastConsolidated) count++;
    } catch {
      /* skip malformed lines */
    }
  }
  return count;
}

// Check consolidation trigger (reads JSONL state files directly — Session #156)
function checkConsolidationTrigger() {
  const trigger = TRIGGERS.consolidation;

  try {
    const rootDir = resolveGitRoot();
    const statePath = path.join(rootDir, ".claude", "state", "consolidation.json");
    const reviewsPath = path.join(rootDir, ".claude", "state", "reviews.jsonl");

    if (!fs.existsSync(statePath) || !fs.existsSync(reviewsPath)) {
      return { triggered: false, name: "consolidation" };
    }

    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    const lastConsolidated =
      typeof state.lastConsolidatedReview === "number" ? state.lastConsolidatedReview : 0;
    const consolidationThreshold = typeof state.threshold === "number" ? state.threshold : 10;
    const pendingCount = countPendingReviews(reviewsPath, lastConsolidated);

    const remaining = consolidationThreshold - pendingCount;
    if (remaining <= trigger.threshold) {
      return {
        triggered: true,
        name: "consolidation",
        severity: trigger.severity,
        description: trigger.description,
        action: trigger.action,
        details: `  - ${remaining <= 0 ? "0" : remaining} reviews until consolidation threshold (${pendingCount} pending)`,
      };
    }

    return { triggered: false, name: "consolidation" };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`   ⚠️  Consolidation check failed: ${errMsg}`);
    return { triggered: false, name: "consolidation" };
  }
}

// Check skill validation trigger
function checkSkillValidationTrigger(files) {
  const trigger = TRIGGERS.skill_validation;
  const matches = [];

  for (const file of files) {
    for (const pathPrefix of trigger.paths) {
      if (file.startsWith(pathPrefix)) {
        matches.push(file);
        break;
      }
    }
  }

  if (matches.length > 0) {
    return {
      triggered: true,
      name: "skill_validation",
      severity: trigger.severity,
      description: trigger.description,
      action: trigger.action,
      details: matches.map((f) => `  - ${f}`).join("\n"),
    };
  }

  return { triggered: false, name: "skill_validation" };
}

// Check if reviews in markdown are synced to JSONL (Session #162)
function checkReviewSyncTrigger() {
  const trigger = TRIGGERS.review_sync;

  try {
    const rootDir = resolveGitRoot();
    const learningsLog = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
    const reviewsJsonl = path.join(rootDir, ".claude", "state", "reviews.jsonl");

    if (!fs.existsSync(learningsLog)) {
      return { triggered: false, name: "review_sync" };
    }

    // Get max review ID from markdown
    let mdMax = 0;
    try {
      const content = fs.readFileSync(learningsLog, "utf8");
      const matches = content.matchAll(/^####\s+Review\s+#(\d+)/gm);
      for (const m of matches) {
        const id = Number.parseInt(m[1], 10);
        if (id > mdMax) mdMax = id;
      }
    } catch {
      return { triggered: false, name: "review_sync" };
    }

    // Get max review ID from JSONL
    let jsonlMax = 0;
    if (fs.existsSync(reviewsJsonl)) {
      try {
        const lines = fs
          .readFileSync(reviewsJsonl, "utf8")
          .replaceAll("\r\n", "\n")
          .trim()
          .split("\n");
        for (const line of lines) {
          try {
            const id = JSON.parse(line).id;
            if (typeof id === "number" && id > jsonlMax) jsonlMax = id;
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }

    const drift = mdMax - jsonlMax;
    if (drift > 0) {
      return {
        triggered: true,
        name: "review_sync",
        severity: trigger.severity,
        description: trigger.description,
        action: trigger.action,
        details: `  - ${drift} reviews in markdown (#${jsonlMax + 1}-#${mdMax}) not synced to reviews.jsonl`,
      };
    }

    return { triggered: false, name: "review_sync" };
  } catch {
    return { triggered: false, name: "review_sync" };
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const blockingOnly = args.includes("--blocking-only");

  // Check for SKIP_TRIGGERS override (documented in SKILL_AGENT_POLICY.md)
  if (process.env.SKIP_TRIGGERS === "1") {
    const rawReason = process.env.SKIP_REASON;
    const reason = typeof rawReason === "string" ? rawReason.trim() : "";

    if (!reason) {
      console.error("❌ SKIP_REASON is required when overriding checks");
      console.error('   Usage: SKIP_REASON="your reason" SKIP_TRIGGERS=1 git push ...');
      console.error("   The audit trail is useless without a reason.");
      process.exit(1);
    }

    if (/[\r\n]/.test(reason)) {
      console.error("❌ SKIP_REASON must be single-line (no CR/LF)");
      process.exit(1);
    }

    console.log("⚠️  SKIP_TRIGGERS=1 detected - skipping trigger checks");
    console.log("   (Override logged for audit trail)\n");

    // Log the override for accountability
    // Using execFileSync to prevent command injection from SKIP_REASON
    try {
      const { execFileSync } = require("node:child_process");
      execFileSync("node", ["scripts/log-override.js", "--check=triggers", `--reason=${reason}`], {
        encoding: "utf-8",
        stdio: "inherit",
      });
    } catch {
      console.log("   (Note: Override logging failed, but continuing)\n");
    }

    process.exit(0);
  }

  console.log("🔍 Checking event-based triggers...\n");

  const files = getStagedFiles();

  // Fail-closed: if we can't determine changed files, block the push
  if (files === null) {
    console.log("❌ ERROR: Could not determine changed files (git commands failed)");
    console.log("   This blocks push to prevent bypassing security checks.");
    console.log("   Use SKIP_TRIGGERS=1 to override if this is expected.\n");
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("   No files to check.\n");
    process.exit(0);
  }

  const results = [];

  // Run all trigger checks
  results.push(
    checkSecurityTrigger(files),
    checkConsolidationTrigger(),
    checkSkillValidationTrigger(files),
    checkReviewSyncTrigger()
  );

  // Filter and display results
  const triggered = results.filter((r) => r.triggered);
  const blocking = triggered.filter((r) => r.severity === "blocking");
  const warnings = triggered.filter((r) => r.severity === "warning");

  if (triggered.length === 0) {
    console.log("   ✅ No triggers activated\n");
    process.exit(0);
  }

  // Display blocking triggers
  if (blocking.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚫 BLOCKING TRIGGERS (action required before push):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    for (const trigger of blocking) {
      console.log(`❌ ${trigger.description}`);
      console.log(`   Action: ${trigger.action}`);
      if (trigger.details) {
        console.log(`   Files:\n${trigger.details}`);
      }
      console.log("");
    }
  }

  // Display warning triggers
  if (warnings.length > 0 && !blockingOnly) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  WARNING TRIGGERS (recommended actions):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    for (const trigger of warnings) {
      console.log(`⚠️  ${trigger.description}`);
      console.log(`   Action: ${trigger.action}`);
      if (trigger.details) {
        console.log(`   Details:\n${trigger.details}`);
      }
      console.log("");
    }
  }

  // Exit with appropriate code
  if (blocking.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Push blocked. Complete required actions or use SKIP_TRIGGERS=1 to override.");
    console.log("(Overrides are logged for audit trail)");
    process.exit(1);
  }

  process.exit(0);
}

main();
