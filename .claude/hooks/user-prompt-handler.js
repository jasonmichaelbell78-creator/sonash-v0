#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename, security/detect-non-literal-regexp, security/detect-object-injection */

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const CLAUDE_DIR = path.join(ROOT_DIR, ".claude");
const HOOKS_DIR = path.join(CLAUDE_DIR, "hooks");

const rawArg = (process.argv[2] || "").trim();
let userPrompt = rawArg;
if (rawArg.startsWith("{")) {
  try {
    const parsed = JSON.parse(rawArg);
    userPrompt = parsed.prompt || parsed.request || parsed.message || parsed.content || "";
  } catch {
    userPrompt = rawArg;
  }
}
if (!userPrompt || typeof userPrompt !== "string") {
  console.log("ok");
  process.exit(0);
}
if (userPrompt.length > 2000) userPrompt = userPrompt.slice(0, 2000);
const requestLower = userPrompt.toLowerCase().trim();
const stdoutParts = [];

// === 1. ALERTS REMINDER ===
function runAlerts() {
  const COOLDOWN_FILE = path.join(HOOKS_DIR, ".alerts-cooldown.json");
  const COOLDOWN_MS = 10 * 60 * 1000;
  try {
    const data = JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf8"));
    if (Date.now() - data.lastRun < COOLDOWN_MS) return;
  } catch {
    /* no cooldown */
  }

  const messages = [];
  const ALERTS_FILE = path.join(CLAUDE_DIR, "pending-alerts.json");
  const ALERTS_ACK_FILE = path.join(CLAUDE_DIR, "alerts-acknowledged.json");
  const PENDING_MCP_FILE = path.join(CLAUDE_DIR, "pending-mcp-save.json");
  const CONTEXT_FILE = path.join(HOOKS_DIR, ".context-tracking-state.json");

  let alertsData = null;
  try {
    alertsData = JSON.parse(fs.readFileSync(ALERTS_FILE, "utf8"));
  } catch {
    /* */
  }
  if (alertsData) {
    let acked = false;
    try {
      const ackData = JSON.parse(fs.readFileSync(ALERTS_ACK_FILE, "utf8"));
      if (ackData.acknowledgedAt && alertsData.generated) {
        if (new Date(ackData.acknowledgedAt).getTime() >= new Date(alertsData.generated).getTime())
          acked = true;
      }
    } catch {
      /* */
    }

    if (!acked) {
      const counts = { error: 0, warning: 0, info: 0 };
      for (const alert of alertsData.alerts || [])
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      const total = counts.error + counts.warning + counts.info;
      if (total > 0) {
        const parts = [];
        if (counts.error > 0) parts.push(`${counts.error} error(s)`);
        if (counts.warning > 0) parts.push(`${counts.warning} warning(s)`);
        if (counts.info > 0) parts.push(`${counts.info} info`);
        messages.push(`ALERTS: ${total} pending (${parts.join(", ")}). Tell user or run /alerts.`);
      }
    }
  }

  let contextFilesRead = 0;
  try {
    contextFilesRead = JSON.parse(fs.readFileSync(CONTEXT_FILE, "utf8")).filesRead?.length || 0;
  } catch {
    /* */
  }
  let pendingMcp = null;
  try {
    pendingMcp = JSON.parse(fs.readFileSync(PENDING_MCP_FILE, "utf8"));
  } catch {
    /* */
  }
  if (contextFilesRead >= 20 || pendingMcp) {
    messages.push(
      `CONTEXT: ${contextFilesRead || "many"} files read. Save to MCP memory before compaction!`
    );
    if (pendingMcp) {
      messages.push(
        "ACTION: Run mcp__memory__create_entities with entity from .claude/pending-mcp-save.json"
      );
    } else {
      messages.push(
        "ACTION: Use /save-context skill or manually save important context to MCP memory"
      );
    }
  }

  if (messages.length > 0) stdoutParts.push(...messages);
  const tmpCooldown = `${COOLDOWN_FILE}.tmp`;
  try {
    fs.mkdirSync(path.dirname(COOLDOWN_FILE), { recursive: true });
    fs.writeFileSync(tmpCooldown, JSON.stringify({ lastRun: Date.now() }), "utf-8");
    try {
      fs.rmSync(COOLDOWN_FILE, { force: true });
    } catch {
      /* best-effort */
    }
    fs.renameSync(tmpCooldown, COOLDOWN_FILE);
  } catch {
    try {
      fs.rmSync(tmpCooldown, { force: true });
    } catch {
      /* cleanup */
    }
  }
}

// === 2. ANALYZE USER REQUEST ===
function runAnalyze() {
  const DIRECTIVE_STATE = path.join(HOOKS_DIR, ".directive-dedup.json");
  let directiveEmitted = false;

  function wasRecentlyDirected(directive) {
    try {
      const data = JSON.parse(fs.readFileSync(DIRECTIVE_STATE, "utf8"));
      const entry = data[directive];
      if (entry && Date.now() - entry < 15 * 60 * 1000) return true;
    } catch {
      /* */
    }
    return false;
  }

  function recordDirective(directive) {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(DIRECTIVE_STATE, "utf8"));
    } catch {
      /* */
    }
    data[directive] = Date.now();
    const tmpPath = `${DIRECTIVE_STATE}.tmp`;
    try {
      fs.mkdirSync(path.dirname(DIRECTIVE_STATE), { recursive: true });
      fs.writeFileSync(tmpPath, JSON.stringify(data), "utf-8");
      try {
        fs.rmSync(DIRECTIVE_STATE, { force: true });
      } catch {
        /* best-effort */
      }
      fs.renameSync(tmpPath, DIRECTIVE_STATE);
    } catch {
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        /* cleanup */
      }
    }
  }

  function matchesWord(pattern) {
    const parts = pattern.split(".?").map((p) => p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const joined = parts.join("[^a-z0-9]?");
    return new RegExp(`(^|[^a-z0-9])(${joined})([^a-z0-9]|$)`, "i").test(requestLower);
  }

  function matchesPhrase(phrase) {
    const tokens = String(phrase)
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
    if (tokens.length === 0) return false;
    return new RegExp(`(^|[^a-z0-9])(${tokens.join("[^a-z0-9]+")})([^a-z0-9]|$)`, "i").test(
      requestLower
    );
  }

  function emitDirective(msg) {
    if (directiveEmitted) return;
    if (wasRecentlyDirected(msg)) {
      directiveEmitted = true;
      return;
    }
    recordDirective(msg);
    stdoutParts.push(msg);
    directiveEmitted = true;
  }
  function suggestStderr(msg) {
    process.stderr.write(msg + "\n");
  }

  // Priority 1: Security
  const securityStrong = [
    "security",
    "authentication",
    "authorization",
    "password",
    "credential",
    "oauth",
    "jwt",
    "encrypt",
    "decrypt",
    "api.?key",
    "access.?control",
    "vulnerability",
    "xss",
    "injection",
  ];
  for (const p of securityStrong) {
    if (matchesWord(p)) {
      emitDirective("PRE-TASK: MUST use security-auditor agent");
      break;
    }
  }

  if (!directiveEmitted) {
    const securityWeak = ["auth", "token", "secret", "permission"];
    let hasWeak = false;
    for (const p of securityWeak) {
      if (matchesWord(p)) {
        if (
          matchesWord("security") ||
          matchesWord("login") ||
          matchesWord("protect") ||
          matchesWord("attack") ||
          matchesWord("hack")
        ) {
          emitDirective("PRE-TASK: MUST use security-auditor agent");
        }
        hasWeak = true;
      }
    }
    if (hasWeak && !directiveEmitted)
      suggestStderr("Hint: If this is security-related, consider using security-auditor agent");
  }

  // Priority 2: Bug/Error/Debugging
  if (!directiveEmitted) {
    const bugStrong = [
      "bug",
      "broken",
      "not.?working",
      "crash",
      "debug",
      "stack.?trace",
      "exception",
    ];
    for (const p of bugStrong) {
      if (matchesWord(p)) {
        emitDirective("PRE-TASK: MUST use systematic-debugging skill FIRST");
        break;
      }
    }
  }
  if (!directiveEmitted) {
    const bugPhrases = [
      "fix bug",
      "fix error",
      "fix crash",
      "fix issue",
      "fix problem",
      "error message",
      "failing test",
      "test failure",
      "test fail",
    ];
    for (const p of bugPhrases) {
      if (matchesPhrase(p)) {
        emitDirective("PRE-TASK: MUST use systematic-debugging skill FIRST");
        break;
      }
    }
  }

  // Priority 3: Database
  if (!directiveEmitted) {
    const dbStrong = ["database", "migration", "sql", "postgres", "mysql", "mongodb"];
    for (const p of dbStrong) {
      if (matchesWord(p)) {
        emitDirective("PRE-TASK: MUST use database-architect agent");
        break;
      }
    }
  }
  if (
    !directiveEmitted &&
    matchesWord("firestore") &&
    (matchesWord("query") || matchesWord("rule") || matchesWord("index") || matchesWord("schema"))
  ) {
    emitDirective("PRE-TASK: MUST use database-architect agent");
  }

  // Priority 4: UI/Frontend
  if (!directiveEmitted) {
    const uiStrong = ["frontend", "css", "styling", "layout", "responsive", "tailwind"];
    for (const p of uiStrong) {
      if (matchesWord(p)) {
        emitDirective("PRE-TASK: MUST use frontend-design skill");
        break;
      }
    }
  }
  if (
    !directiveEmitted &&
    (matchesWord("component") || matchesWord("button") || matchesWord("form")) &&
    (matchesWord("create") ||
      matchesWord("build") ||
      matchesWord("add") ||
      matchesWord("new") ||
      matchesWord("style") ||
      matchesWord("design"))
  ) {
    emitDirective("PRE-TASK: MUST use frontend-design skill");
  }

  // Priority 5: Planning
  if (!directiveEmitted) {
    for (const p of ["architect", "implement.?feature", "add.?feature", "new.?feature"]) {
      if (matchesWord(p)) {
        suggestStderr("Hint: Consider using Plan agent for multi-step work");
        break;
      }
    }
  }

  // Priority 6: Exploration
  if (!directiveEmitted) {
    for (const p of [
      "explore the",
      "explore this",
      "understand how",
      "how does this",
      "walk me through",
      "explain the code",
    ]) {
      if (matchesPhrase(p)) {
        suggestStderr("Hint: Consider using Explore agent for codebase exploration");
        break;
      }
    }
  }

  // Priority 7: Testing
  if (!directiveEmitted) {
    const testPhrases = ["write test", "add test", "test coverage", "run test", "testing strategy"];
    const testWords = ["jest", "cypress", "playwright"];
    if (testPhrases.some((p) => matchesPhrase(p)) || testWords.some((p) => matchesWord(p))) {
      suggestStderr("Hint: Consider using test-engineer agent");
    }
  }
}

// === 3. SESSION END REMINDER ===
function runSessionEnd() {
  const END_PATTERNS = [
    /^(?:that'?s?\s+)?(?:all|it)\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
    /^(?:i'?m\s+)?done\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
    /^(?:i'?m\s+)?finished\s*(?:for\s+(?:now|today))?\s*[.!]?$/i,
    /^(?:we'?re\s+)?done\s*(?:here)?\s*[.!]?$/i,
    /^(?:let'?s?\s+)?(?:stop|end|wrap\s*up)\s*(?:here|now|for\s+today)?\s*[.!]?$/i,
    /^(?:that'?s?\s+)?(?:enough|good)\s+for\s+(?:now|today)\s*[.!]?$/i,
    /^(?:i'?m\s+)?(?:signing|logging)\s*off\s*[.!]?$/i,
    /^(?:good)?bye\s*[.!]?$/i,
    /^thanks?,?\s*(?:that'?s?\s+)?(?:all|it)\s*[.!]?$/i,
    /^(?:ok|okay|great),?\s*(?:that'?s?\s+)?(?:all|it|enough)\s*[.!]?$/i,
    /^(?:i\s+)?(?:think\s+)?we'?re\s+(?:good|done)\s*[.!]?$/i,
    /^nothing\s+(?:else|more)\s*[.!]?$/i,
    /^no(?:pe|thing)?\s*(?:,?\s*(?:that'?s?\s+)?(?:all|it))?\s*[.!]?$/i,
  ];
  const isThanksOnly =
    /^(?:thanks?|thx|ty|thank\s+you)\s*[!.]?$/i.test(requestLower) && requestLower.length < 15;

  if (END_PATTERNS.some((p) => p.test(requestLower)) || isThanksOnly) {
    console.error("");
    console.error("\ud83d\udccb  SESSION ENDING?");
    console.error("\u2501".repeat(20));
    console.error("If you're wrapping up, consider running /session-end");
    console.error("");
    console.error("The session-end checklist helps:");
    console.error("  \u2714 Update SESSION_CONTEXT.md with progress");
    console.error("  \u2714 Commit uncommitted changes");
    console.error("  \u2714 Check for pending PR reviews");
    console.error("  \u2714 Document any decisions made");
    console.error("");
    console.error("Just say 'continue' if you have more work to do!");
    console.error("\u2501".repeat(20));
  }
}

// === 4. PLAN MODE SUGGESTION ===
function runPlanSuggestion() {
  if (userPrompt.length < 30) return;

  const IMPL_KEYWORDS = [
    "implement",
    "create",
    "build",
    "develop",
    "add feature",
    "add a feature",
    "new feature",
    "refactor",
    "redesign",
    "rewrite",
    "migrate",
    "integrate",
    "set up",
    "setup",
    "configure",
    "architect",
  ];
  const COMPLEXITY = [
    /\band\b.*\band\b/i,
    /,\s*[^,]+,\s*[^,]+/i,
    /\d+\.\s+.*\d+\.\s+/,
    /-\s+.*-\s+/,
    /across\s+(?:the\s+)?(?:\w+\s+)?(?:codebase|project|app|application|system)/i,
    /throughout\s+(?:the\s+)?(?:\w+\s+)?(?:codebase|project|app|application|system)/i,
    /multiple\s+(?:\w+\s+)?(?:files|components|modules|services|pages)/i,
    /several\s+(?:\w+\s+)?(?:files|components|modules|services|pages)/i,
    /all\s+(?:the\s+)?(?:\w+\s+)?(?:files|components|modules|services|pages)/i,
    /database\s+schema/i,
    /api\s+(?:design|architecture|endpoints)/i,
    /system\s+(?:design|architecture)/i,
    /full.?stack/i,
    /end.?to.?end/i,
    /from\s+scratch/i,
    /authentication\s+system/i,
    /oauth|sso|multi.?factor/i,
    /step\s+by\s+step/i,
    /phase\s*\d/i,
    /first.*then.*finally/i,
    /start\s+with.*move\s+on\s+to/i,
  ];
  const SIMPLE = [
    /^(?:just\s+)?(?:fix|update|change|modify)\s+(?:the\s+)?(?:one|single|this)/i,
    /^(?:can\s+you\s+)?(?:quickly|just)\s+/i,
    /^(?:small|minor|quick)\s+(?:fix|change|update)/i,
  ];

  const hasImpl = IMPL_KEYWORDS.some((k) => requestLower.includes(k));
  const complexityMatches = COMPLEXITY.filter((p) => p.test(userPrompt));
  const wordCount = userPrompt.split(/\s+/).length;
  const shouldSuggest = hasImpl && (complexityMatches.length > 0 || wordCount > 50);

  if (shouldSuggest && !SIMPLE.some((p) => p.test(userPrompt))) {
    console.error("");
    console.error("\ud83d\udcdd  MULTI-STEP TASK DETECTED");
    console.error("\u2501".repeat(28));
    console.error("This looks like a complex task that might benefit from");
    console.error("planning before implementation.");
    console.error("");
    console.error("Options:");
    console.error("  \u2022 Plan mode - Quick planning (2-3 questions, then plan)");
    console.error("  \u2022 /deep-plan - Exhaustive discovery (10-25 questions,");
    console.error("    decision record, then detailed plan with approval gate)");
    console.error("");
    if (complexityMatches.length > 0)
      console.error("Complexity detected: multiple items or broad scope");
    if (wordCount > 50)
      console.error(`Request length: ${wordCount} words (suggests multiple steps)`);
    console.error("");
    console.error('Say "continue without plan" to proceed directly.');
    console.error('Say "/deep-plan" for thorough discovery-first planning.');
    console.error("\u2501".repeat(28));
  }
}

// === MAIN ===
function main() {
  runAlerts();
  runAnalyze();
  runSessionEnd();
  runPlanSuggestion();

  if (stdoutParts.length > 0) {
    for (const line of stdoutParts) console.log(line);
  }
  console.log("ok");
  process.exit(0);
}

main();
