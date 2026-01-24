#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Safely stop Serena Dashboard on port 24282
 * Security controls:
 * 1. Only targets LISTENING processes (not clients)
 * 2. Verifies process is Node.js-based before termination
 * 3. Logs all actions for audit trail
 * 4. Graceful shutdown before forced termination
 * 5. Cross-platform (Windows, macOS, Linux)
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 24282;
const PROCESS_ALLOWLIST = ["node", "node.exe", "serena", "claude"];
const LOG_FILE = path.join(__dirname, ".serena-termination.log");

// User context for audit trail (Qodo Review #198 follow-up - comprehensive audit trails)
const USER_CONTEXT = process.env.USER || process.env.USERNAME || "unknown";
const SESSION_ID = process.env.CLAUDE_SESSION_ID || "unknown";

function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] [User:${USER_CONTEXT}] [Session:${SESSION_ID}] ${message}\n`;
  console.log(entry.trim());
  try {
    // Symlink protection with TOCTOU mitigation (Review #198 Round 3)
    // Use O_NOFOLLOW on Unix to atomically refuse symlinks, fallback to lstatSync on Windows
    const canNoFollow = process.platform !== "win32" && typeof fs.constants.O_NOFOLLOW === "number";

    if (canNoFollow) {
      // Unix: Use O_NOFOLLOW to prevent TOCTOU race
      const flags =
        fs.constants.O_WRONLY |
        fs.constants.O_CREAT |
        fs.constants.O_APPEND |
        fs.constants.O_NOFOLLOW;
      const fd = fs.openSync(LOG_FILE, flags, 0o600);
      try {
        fs.writeSync(fd, entry, null, "utf8");
      } finally {
        fs.closeSync(fd);
      }
    } else {
      // Windows: Fallback to lstatSync check (TOCTOU still possible but rare)
      if (fs.existsSync(LOG_FILE)) {
        const stats = fs.lstatSync(LOG_FILE);
        if (stats.isSymbolicLink()) {
          console.error(`[SECURITY] Refusing to write to symlink: ${LOG_FILE}`);
          return;
        }
      }
      fs.appendFileSync(LOG_FILE, entry, { mode: 0o600 });
    }
  } catch (err) {
    // Log failures to console for debugging (Review #198 follow-up)
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Failed to write to log: ${errMsg}`);
  }
}

function getProcessInfo(pid) {
  try {
    if (process.platform === "win32") {
      try {
        const output = execSync(
          `wmic process where ProcessId=${pid} get Name,CommandLine /format:csv`,
          { encoding: "utf8", timeout: 5000 }
        );
        const lines = output
          .trim()
          .split("\n")
          .filter((l) => l.includes(","));
        if (lines.length > 1) {
          const parts = lines[1].split(",");
          return { name: parts[2] || "", commandLine: parts[1] || "" };
        }
      } catch {
        // WMIC is deprecated on many Windows installs; fall back to PowerShell
        // (Qodo Review #198 follow-up - Windows process-info fallback)
        const output = execSync(
          `powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\") | Select-Object -Property Name,CommandLine | ConvertTo-Json -Compress"`,
          { encoding: "utf8", timeout: 5000 }
        ).trim();

        if (output) {
          try {
            const parsed = JSON.parse(output);
            return { name: parsed?.Name || "", commandLine: parsed?.CommandLine || "" };
          } catch (parseErr) {
            const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
            console.error(`[ERROR] Failed to parse PowerShell JSON for PID ${pid}: ${errMsg}`);
            return null;
          }
        }
      }
      return null;
    }

    const name = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8", timeout: 5000 }).trim();
    const commandLine = execSync(`ps -p ${pid} -o args=`, {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    return { name, commandLine };
  } catch (err) {
    // Log process info retrieval failures for debugging (Review #198 follow-up)
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Failed to get process info for PID ${pid}: ${errMsg}`);
    return null;
  }
}

function findListeningProcess(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(
        `powershell -NoProfile -NonInteractive -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
        { encoding: "utf8", timeout: 10000 }
      );
      const pids = output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((p) => parseInt(p.trim(), 10));
      return pids.length > 0 ? pids[0] : null;
    } else {
      const output = execSync(`lsof -i :${port} -sTCP:LISTEN -t 2>/dev/null`, {
        encoding: "utf8",
        timeout: 10000,
      });
      const pids = output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((p) => parseInt(p.trim(), 10));
      return pids.length > 0 ? pids[0] : null;
    }
  } catch (err) {
    // Log process discovery failures for debugging (Review #198 follow-up)
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Failed to find listening process on port ${port}: ${errMsg}`);
    return null;
  }
}

function isAllowedProcess(processInfo) {
  if (!processInfo) return false;
  const name = (processInfo.name || "").toLowerCase();
  const cmdLine = (processInfo.commandLine || "").toLowerCase();
  const nameMatch = PROCESS_ALLOWLIST.some((allowed) => name.includes(allowed.toLowerCase()));
  const cmdLineMatch =
    cmdLine.includes("serena") || cmdLine.includes("dashboard") || cmdLine.includes("24282");

  // Never allow killing generic Node processes unless the command line indicates Serena/dashboard
  // (Qodo Review #198 follow-up - prevent terminating unrelated Node.js processes)
  const isGenericNode = name === "node" || name === "node.exe";
  if (isGenericNode) return cmdLineMatch;

  return nameMatch && cmdLineMatch;
}

function terminateProcess(pid) {
  try {
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /PID ${pid}`, { timeout: 5000 });
        return true;
      } catch (gracefulErr) {
        // Graceful termination failed, try force kill (Review #198 Round 3 - add logging)
        const errMsg = gracefulErr instanceof Error ? gracefulErr.message : String(gracefulErr);
        console.error(
          `[WARN] Graceful taskkill failed for PID ${pid}: ${errMsg}, trying force kill`
        );
        try {
          execSync(`taskkill /PID ${pid} /F`, { timeout: 5000 });
          return true;
        } catch (forceErr) {
          const forceErrMsg = forceErr instanceof Error ? forceErr.message : String(forceErr);
          console.error(`[ERROR] Force taskkill failed for PID ${pid}: ${forceErrMsg}`);
          return false;
        }
      }
    } else {
      // Unix: Use native process.kill() instead of execSync (Review #198 Round 3)
      try {
        // Send SIGTERM for graceful shutdown
        process.kill(pid, "SIGTERM");
      } catch (killErr) {
        const errMsg = killErr instanceof Error ? killErr.message : String(killErr);
        console.error(`[ERROR] Failed to send SIGTERM to PID ${pid}: ${errMsg}`);
        return false;
      }

      // Poll for graceful shutdown (up to 5 seconds) instead of fixed sleep (Review #198 Round 3)
      const start = Date.now();
      while (Date.now() - start < 5000) {
        try {
          // Check if process still exists (kill(pid, 0) doesn't send signal, just checks existence)
          process.kill(pid, 0);
          // Still alive, wait 250ms before next check
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
        } catch {
          // Process terminated gracefully
          return true;
        }
      }

      // Graceful shutdown timeout - force kill with SIGKILL
      try {
        process.kill(pid, "SIGKILL");
        return true;
      } catch {
        // Process may have terminated between poll and SIGKILL
        return true;
      }
    }
  } catch {
    return false;
  }
}

function main() {
  log("Starting Serena dashboard termination check");
  const pid = findListeningProcess(PORT);

  if (!pid) {
    log(`No process listening on port ${PORT}`);
    process.exit(0);
  }

  // Validate PID before termination (Qodo Review #198 follow-up)
  if (!Number.isInteger(pid) || pid <= 0) {
    log(`BLOCKED: Invalid PID "${pid}" - refusing to terminate`, "WARN");
    process.exit(1);
  }

  log(`Found process ${pid} listening on port ${PORT}`);
  const processInfo = getProcessInfo(pid);

  if (!processInfo) {
    log(
      `BLOCKED: Could not get info for PID ${pid} - refusing to terminate unknown process`,
      "WARN"
    );
    process.exit(1);
  }

  // Log only process name to avoid exposing sensitive command line arguments (Review #198 Round 3)
  log(`Process info: name="${processInfo.name}" (command line redacted for security)`);

  if (!isAllowedProcess(processInfo)) {
    log(
      `BLOCKED: Process "${processInfo.name}" (PID ${pid}) is NOT in allowlist - refusing to terminate`,
      "WARN"
    );
    log(`Allowlist: ${PROCESS_ALLOWLIST.join(", ")}`, "INFO");
    process.exit(1);
  }

  log(
    `ALLOWED: Process "${processInfo.name}" (PID ${pid}) matches allowlist - proceeding with termination`
  );
  const success = terminateProcess(pid);

  if (success) {
    log(`SUCCESS: Terminated process ${pid}`, "INFO");
    process.exit(0);
  } else {
    log(`FAILED: Could not terminate process ${pid}`, "ERROR");
    process.exit(1);
  }
}

main();
