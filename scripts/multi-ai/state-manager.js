#!/usr/bin/env node
/**
 * Multi-AI Audit State Manager
 *
 * Manages session state for multi-AI audit workflow.
 * State persists to .claude/multi-ai-audit/ for compaction survival.
 * Backup state saved to docs/audits/multi-ai/<session>/state.json
 *
 * @example
 *   import { createSession, loadSession, updateSession } from './state-manager.js';
 *   const session = await createSession();
 *   await updateSession(session.session_id, { current_category: 'security' });
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { safeWriteFileSync } from "../lib/safe-fs.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

// Configuration
const CONFIG = {
  stateDir: join(REPO_ROOT, ".claude/multi-ai-audit"),
  stateFile: "session-state.json",
  outputBaseDir: join(REPO_ROOT, "docs/audits/multi-ai"),
};

// Valid categories for multi-AI audit
const VALID_CATEGORIES = [
  "code-quality",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];

// Category status values
const VALID_STATUS = ["pending", "collecting", "aggregated", "skipped"];

// Workflow phases
const VALID_PHASES = ["starting", "collecting", "aggregating", "unifying", "complete"];

// Session ID format
const SESSION_ID_PREFIX = "maa";
const SESSION_ID_REGEX = new RegExp(
  String.raw`^${SESSION_ID_PREFIX}-\d{4}-\d{2}-\d{2}-[a-f0-9]{6}$`
);

/**
 * Generate a unique session ID
 * Format: maa-YYYY-MM-DD-<random6>
 */
function generateSessionId() {
  const date = new Date().toISOString().split("T")[0];
  const random = randomBytes(3).toString("hex");
  return `${SESSION_ID_PREFIX}-${date}-${random}`;
}

/**
 * Get the path to the state file
 */
function getStateFilePath() {
  return join(CONFIG.stateDir, CONFIG.stateFile);
}

/**
 * Get the output directory for a session
 * @param {string} sessionId - The session ID
 * @returns {string} - Path to session output directory
 */
export function getSessionPath(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Invalid session ID");
  }
  // Validate session ID format to prevent path traversal
  if (!SESSION_ID_REGEX.test(sessionId)) {
    throw new Error(`Invalid session ID format: ${sessionId}`);
  }
  return join(CONFIG.outputBaseDir, sessionId);
}

/**
 * Initialize empty category state
 */
function initializeCategoryState() {
  const categories = {};
  for (const cat of VALID_CATEGORIES) {
    categories[cat] = {
      status: "pending",
      sources: [],
      finding_count: 0,
    };
  }
  return categories;
}

/**
 * Create a new audit session
 * @returns {object} - New session state object
 */
export function createSession() {
  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const session = {
    session_id: sessionId,
    created: now,
    status: "in_progress",
    workflow_phase: "starting",
    current_category: null,
    selected_categories: [...VALID_CATEGORIES],
    categories: initializeCategoryState(),
    final_output: null,
    last_updated: now,
  };

  // Ensure state directory exists
  if (!existsSync(CONFIG.stateDir)) {
    mkdirSync(CONFIG.stateDir, { recursive: true });
  }

  // Create session output directory structure
  const sessionDir = getSessionPath(sessionId);
  mkdirSync(join(sessionDir, "raw"), { recursive: true });
  mkdirSync(join(sessionDir, "canon"), { recursive: true });
  mkdirSync(join(sessionDir, "final"), { recursive: true });

  // Save state to primary location
  writeStateFile(session);

  // Save backup to session directory
  saveBackupState(session);

  console.log(`Created session: ${sessionId}`);
  console.log(`Output directory: ${sessionDir}`);

  return session;
}

/**
 * Load existing session state
 * Returns null if no session exists
 * @returns {object|null} - Session state or null
 */
export function loadSession() {
  const stateFilePath = getStateFilePath();

  if (!existsSync(stateFilePath)) {
    // Try to recover from most recent session backup
    return recoverFromBackup();
  }

  try {
    const content = readFileSync(stateFilePath, "utf-8");
    const session = JSON.parse(content);

    // Validate session structure
    if (!session.session_id || !session.status) {
      console.warn("Invalid session state, attempting recovery...");
      return recoverFromBackup();
    }

    return session;
  } catch (error) {
    console.warn(
      `Error loading session state: ${error instanceof Error ? error.message : String(error)}`
    );
    return recoverFromBackup();
  }
}

/**
 * Attempt to recover session from backup files
 * @returns {object|null} - Recovered session or null
 */
function recoverFromBackup() {
  if (!existsSync(CONFIG.outputBaseDir)) {
    return null;
  }

  try {
    const sessions = readdirSync(CONFIG.outputBaseDir)
      .filter((d) => d.startsWith("maa-"))
      .sort()
      .reverse(); // Most recent first

    for (const sessionDir of sessions) {
      const backupPath = join(CONFIG.outputBaseDir, sessionDir, "state.json");
      if (existsSync(backupPath)) {
        let content;
        try {
          content = readFileSync(backupPath, "utf-8");
        } catch (err) {
          // Expected for missing/inaccessible backup files
          const msg = err instanceof Error ? err.message : String(err);
          if (process.env.VERBOSE) console.warn(`  Skipped: ${msg}`);
          continue;
        }
        const session = JSON.parse(content);

        // Only recover incomplete sessions
        if (session.status !== "complete") {
          console.log(`Recovered session from backup: ${session.session_id}`);
          // Restore to primary state file
          writeStateFile(session);
          return session;
        }
      }
    }
  } catch (error) {
    console.warn(
      `Error recovering from backup: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return null;
}

/**
 * Write state to primary state file
 * @param {object} session - Session state object
 */
function writeStateFile(session) {
  const stateFilePath = getStateFilePath();

  // Ensure directory exists
  if (!existsSync(CONFIG.stateDir)) {
    mkdirSync(CONFIG.stateDir, { recursive: true });
  }

  safeWriteFileSync(stateFilePath, JSON.stringify(session, null, 2));
}

/**
 * Save backup state to session directory
 * @param {object} session - Session state object
 */
function saveBackupState(session) {
  const sessionDir = getSessionPath(session.session_id);
  const backupPath = join(sessionDir, "state.json");

  // Ensure directory exists
  if (!existsSync(sessionDir)) {
    mkdirSync(sessionDir, { recursive: true });
  }

  safeWriteFileSync(backupPath, JSON.stringify(session, null, 2));
}

/**
 * Update session state
 * @param {string} sessionId - Session ID to update
 * @param {object} updates - Partial state updates
 * @returns {object} - Updated session state
 */
export function updateSession(sessionId, updates) {
  const session = loadSession();

  if (!session) {
    throw new Error(`No session found with ID: ${sessionId}`);
  }

  if (session.session_id !== sessionId) {
    throw new Error(`Session ID mismatch: expected ${session.session_id}, got ${sessionId}`);
  }

  // Validate phase transitions
  if (updates.workflow_phase && !VALID_PHASES.includes(updates.workflow_phase)) {
    throw new Error(`Invalid workflow phase: ${updates.workflow_phase}`);
  }

  // Validate category updates
  if (updates.current_category && !VALID_CATEGORIES.includes(updates.current_category)) {
    throw new Error(`Invalid category: ${updates.current_category}`);
  }

  // Apply updates
  const updatedSession = {
    ...session,
    ...updates,
    last_updated: new Date().toISOString(),
  };

  // Handle nested category updates
  if (updates.categories) {
    updatedSession.categories = {
      ...session.categories,
      ...updates.categories,
    };
  }

  // Save to both locations
  writeStateFile(updatedSession);
  saveBackupState(updatedSession);

  return updatedSession;
}

/**
 * Update a specific category's state
 * @param {string} sessionId - Session ID
 * @param {string} category - Category name
 * @param {object} categoryUpdates - Updates for the category
 * @returns {object} - Updated session state
 */
export function updateCategoryState(sessionId, category, categoryUpdates) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }

  if (categoryUpdates.status && !VALID_STATUS.includes(categoryUpdates.status)) {
    throw new Error(`Invalid category status: ${categoryUpdates.status}`);
  }

  const session = loadSession();
  if (!session || session.session_id !== sessionId) {
    throw new Error(`Session not found or ID mismatch`);
  }

  const updatedCategories = {
    ...session.categories,
    [category]: {
      ...session.categories[category],
      ...categoryUpdates,
    },
  };

  return updateSession(sessionId, { categories: updatedCategories });
}

/**
 * Add a source to a category
 * @param {string} sessionId - Session ID
 * @param {string} category - Category name
 * @param {string} source - Source name (e.g., 'claude', 'gpt')
 * @param {number} findingCount - Number of findings from this source
 * @returns {object} - Updated session state
 */
export function addSourceToCategory(sessionId, category, source, findingCount) {
  const session = loadSession();
  if (!session || session.session_id !== sessionId) {
    throw new Error(`Session not found or ID mismatch`);
  }

  const categoryState = session.categories[category];
  if (!categoryState) {
    throw new Error(`Category not found: ${category}`);
  }

  // Add source if not already present
  const sources = categoryState.sources.includes(source)
    ? categoryState.sources
    : [...categoryState.sources, source];

  return updateCategoryState(sessionId, category, {
    status: "collecting",
    sources,
    finding_count: categoryState.finding_count + findingCount,
  });
}

/**
 * Mark session as complete
 * @param {string} sessionId - Session ID
 * @param {string} finalOutputPath - Path to final output file
 * @returns {object} - Updated session state
 */
export function completeSession(sessionId, finalOutputPath) {
  return updateSession(sessionId, {
    status: "complete",
    workflow_phase: "complete",
    final_output: finalOutputPath,
  });
}

/**
 * Delete session state (for starting fresh)
 * Does NOT delete output files - only clears the active state
 */
export function clearSession() {
  const stateFilePath = getStateFilePath();
  if (existsSync(stateFilePath)) {
    const session = loadSession();
    if (session) {
      console.log(`Clearing session: ${session.session_id}`);
    }
    // Remove state file but keep output directory
    safeWriteFileSync(stateFilePath, "{}");
  }
}

/**
 * Get session summary for display
 * @param {object} session - Session state object
 * @returns {object} - Summary object
 */
export function getSessionSummary(session) {
  if (!session) return null;

  const completedCategories = Object.entries(session.categories)
    .filter(([, state]) => state.status === "aggregated")
    .map(([name]) => name);

  const inProgressCategory = Object.entries(session.categories).find(
    ([, state]) => state.status === "collecting"
  )?.[0];

  const pendingCategories = Object.entries(session.categories)
    .filter(([, state]) => state.status === "pending")
    .map(([name]) => name);

  const totalSources = Object.values(session.categories).reduce(
    (sum, cat) => sum + cat.sources.length,
    0
  );

  const totalFindings = Object.values(session.categories).reduce(
    (sum, cat) => sum + cat.finding_count,
    0
  );

  return {
    session_id: session.session_id,
    status: session.status,
    phase: session.workflow_phase,
    completed: completedCategories,
    in_progress: inProgressCategory,
    pending: pendingCategories,
    total_sources: totalSources,
    total_findings: totalFindings,
    created: session.created,
    last_updated: session.last_updated,
  };
}

// Export constants for external use
export { VALID_CATEGORIES, VALID_STATUS, VALID_PHASES, CONFIG };

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "create": {
      const session = createSession();

      // Parse --categories flag: --categories=security,performance
      const categoriesArg = args.find((a) => a.startsWith("--categories"));
      if (categoriesArg) {
        const cats = categoriesArg
          .split("=")[1]
          ?.split(",")
          .map((c) => c.trim());
        if (cats && cats.length > 0) {
          // Validate each category
          const invalid = cats.filter((c) => !VALID_CATEGORIES.includes(c));
          if (invalid.length > 0) {
            console.error(`Invalid categories: ${invalid.join(", ")}`);
            console.error(`Valid: ${VALID_CATEGORIES.join(", ")}`);
            process.exit(1);
          }
          session.selected_categories = cats;
          // Mark non-selected categories as skipped
          for (const cat of VALID_CATEGORIES) {
            if (!cats.includes(cat)) {
              session.categories[cat].status = "skipped";
            }
          }
          // Save the updated state with category scoping applied
          writeStateFile(session);
          saveBackupState(session);
          console.log(`Scoped to categories: ${cats.join(", ")}`);
        }
      }
      break;
    }
    case "load": {
      const session = loadSession();
      if (session) {
        console.log(JSON.stringify(getSessionSummary(session), null, 2));
      } else {
        console.log("No active session found");
      }
      break;
    }
    case "clear":
      clearSession();
      console.log("Session cleared");
      break;
    default:
      console.log("Usage: node state-manager.js <create|load|clear>");
      process.exit(1);
  }
}
