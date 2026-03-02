/**
 * Semgrep test annotation file for security rules.
 *
 * Run with: semgrep --test --config .semgrep/rules/security/ tests/semgrep/
 *
 * Lines with `// ruleid: ...` MUST match (violations).
 * Lines with `// ok: ...` MUST NOT match (safe patterns).
 */

// =============================================================================
// sonash.security.no-unsanitized-error-response
// =============================================================================

function unsafeHandler(req, res) {
  try {
    doSomething();
  } catch (err) {
    // ruleid: sonash.security.no-unsanitized-error-response
    res.json({ message: err.message });
  }
}

function unsafeHandlerStack(req, res) {
  try {
    doSomething();
  } catch (err) {
    // ruleid: sonash.security.no-unsanitized-error-response
    res.json({ stack: err.stack });
  }
}

function unsafeStatusHandler(req, res) {
  try {
    doSomething();
  } catch (err) {
    // ruleid: sonash.security.no-unsanitized-error-response
    res.status(500).json({ error: err.message });
  }
}

function safeHandler(req, res) {
  try {
    doSomething();
  } catch (err) {
    const safe = sanitizeError(err);
    // ok: sonash.security.no-unsanitized-error-response
    res.json({ message: safe.message });
  }
}

// =============================================================================
// sonash.security.taint-user-input-to-exec
// =============================================================================

function unsafeExec(req) {
  const cmd = req.body.command;
  // ruleid: sonash.security.taint-user-input-to-exec
  execSync(cmd);
}

function unsafeSpawn(req) {
  // ruleid: sonash.security.taint-user-input-to-exec
  spawn(req.query.program);
}

function safeExec(req) {
  const cmd = escapeShellArg(req.body.command);
  // ok: sonash.security.taint-user-input-to-exec
  execSync(cmd);
}

// =============================================================================
// sonash.security.taint-path-traversal
// =============================================================================

function unsafePathRead(req) {
  const filePath = req.params.file;
  // ruleid: sonash.security.taint-path-traversal
  fs.readFileSync(filePath);
}

function unsafePathJoin(req) {
  // ruleid: sonash.security.taint-path-traversal
  const full = path.join("/data", req.query.name);
}

function safePathRead(req) {
  const filePath = validatePathInDir(req.params.file, "/safe/dir");
  // ok: sonash.security.taint-path-traversal
  fs.readFileSync(filePath);
}

// =============================================================================
// sonash.security.no-direct-firestore-write
// =============================================================================

// ruleid: sonash.security.no-direct-firestore-write
import { setDoc, doc } from "firebase/firestore";

// ruleid: sonash.security.no-direct-firestore-write
import { addDoc, collection } from "firebase/firestore";

// ok: sonash.security.no-direct-firestore-write
import { getDoc, doc } from "firebase/firestore";

// =============================================================================
// sonash.security.no-hardcoded-secrets
// =============================================================================

// ruleid: sonash.security.no-hardcoded-secrets
const apiKey = "AIzaSyB1234567890abcdefghijklmn";

// ruleid: sonash.security.no-hardcoded-secrets
const slackToken = "xoxb-1234567890-abcdefghijklmn";

// ok: sonash.security.no-hardcoded-secrets
const apiKey2 = process.env.API_KEY;

// =============================================================================
// sonash.security.no-eval-usage
// =============================================================================

// ruleid: sonash.security.no-eval-usage
eval("alert('xss')");

// ruleid: sonash.security.no-eval-usage
new Function("return 1")();

// ok: sonash.security.no-eval-usage
JSON.parse('{"safe": true}');

// =============================================================================
// sonash.security.no-innerhtml-assignment
// =============================================================================

function unsafeInnerHTML(el, data) {
  // ruleid: sonash.security.no-innerhtml-assignment
  el.innerHTML = data;
}

function safeTextContent(el, data) {
  // ok: sonash.security.no-innerhtml-assignment
  el.textContent = data;
}

// =============================================================================
// sonash.security.no-dangerouslysetinnerhtml
// =============================================================================

function UnsafeComponent({ html }) {
  // ruleid: sonash.security.no-dangerouslysetinnerhtml
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function SafeComponent({ text }) {
  // ok: sonash.security.no-dangerouslysetinnerhtml
  return <div>{text}</div>;
}
