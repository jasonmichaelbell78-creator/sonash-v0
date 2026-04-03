#!/usr/bin/env node
/* global process, require */
/* eslint-disable @typescript-eslint/no-require-imports */
// Check for GSD updates in background, write result to cache
// Called by SessionStart hook - runs once per session

const fs = require("fs");
const path = require("path");
const os = require("os");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { execSync, spawn } = require("child_process");

const homeDir = os.homedir();
const cacheDir = path.join(homeDir, ".claude", "cache");
const cacheFile = path.join(cacheDir, "gsd-update-check.json");
const versionFile = path.join(homeDir, ".claude", "get-shit-done", "VERSION");

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Run check in background (spawn detached process)
// Note: execSync used intentionally inside spawned child — input is hardcoded, not user-provided
const child = spawn(
  process.execPath,
  [
    "-e",
    `
  const fs = require('fs');
  const nodePath = require('path');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const versionFile = ${JSON.stringify(versionFile)};

  // Symlink guard: refuse to write through symlinks
  function isSafeToWrite(filePath) {
    try {
      let current = nodePath.resolve(filePath);
      while (true) {
        try {
          if (fs.lstatSync(current).isSymbolicLink()) return false;
        } catch (e) {
          if (!(e && typeof e === 'object' && e.code === 'ENOENT')) return false;
        }
        const parent = nodePath.dirname(current);
        if (parent === current) break;
        current = parent;
      }
      return true;
    } catch { return false; }
  }

  let installed = '0.0.0';
  try {
    installed = fs.readFileSync(versionFile, 'utf8').trim();
  } catch (e) {}

  let latest = null;
  try {
    latest = execSync('npm view get-shit-done-cc version', { encoding: 'utf8', timeout: 10000 }).trim();
  } catch (e) {}

  const result = {
    update_available: latest && installed !== latest,
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000)
  };

  if (isSafeToWrite(cacheFile)) {
    fs.writeFileSync(cacheFile, JSON.stringify(result));
  }
`,
  ],
  {
    detached: true,
    stdio: "ignore",
  }
);

child.unref();
