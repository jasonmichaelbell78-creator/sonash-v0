#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Cleanup Alert Sessions
 * Deletes alert session JSONL logs older than 7 days from .claude/tmp/
 */

const fs = require("node:fs");
const path = require("node:path");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")
  ));
} catch {
  console.error("symlink-guard unavailable; disabling writes");
  isSafeToWrite = () => false;
}

const ROOT_DIR = path.join(__dirname, "..");
const TMP_DIR = path.join(ROOT_DIR, ".claude", "tmp");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function main() {
  let files;
  try {
    files = fs.readdirSync(TMP_DIR);
  } catch {
    console.log("No .claude/tmp/ directory found — nothing to clean up.");
    return;
  }

  const sessionFiles = files.filter((f) => f.startsWith("alert-session-") && f.endsWith(".jsonl"));
  if (sessionFiles.length === 0) {
    console.log("No alert session files found.");
    return;
  }

  const cutoff = Date.now() - MAX_AGE_MS;
  let deleted = 0;

  for (const file of sessionFiles) {
    const filePath = path.join(TMP_DIR, file);
    // Path containment check (Review #33-#40)
    const rel = path.relative(TMP_DIR, filePath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
    try {
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) continue;
      if (stat.mtimeMs < cutoff) {
        if (!isSafeToWrite(filePath)) continue;
        fs.rmSync(filePath, { force: true });
        deleted++;
      }
    } catch (err) {
      console.error(`  [warn] Could not process ${file}: ${err.code || err.message}`);
    }
  }

  console.log(`Cleaned up ${deleted} of ${sessionFiles.length} alert session file(s).`);
}

main();
