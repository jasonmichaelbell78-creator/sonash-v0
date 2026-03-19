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
// Now only flags writes to protected collections: journal, daily_logs, inventoryEntries
// =============================================================================

// ruleid: sonash.security.no-direct-firestore-write
setDoc(doc(db, "journal", entryId), entryData);

// ruleid: sonash.security.no-direct-firestore-write
addDoc(collection(db, "daily_logs"), logData);

// ruleid: sonash.security.no-direct-firestore-write
updateDoc(doc(db, "inventoryEntries", itemId), updates);

// ruleid: sonash.security.no-direct-firestore-write
deleteDoc(doc(db, "journal", entryId));

// ok: sonash.security.no-direct-firestore-write — non-protected collection
setDoc(doc(db, "meetings", meetingId), meetingData);

// ok: sonash.security.no-direct-firestore-write — non-protected collection
addDoc(collection(db, "quotes"), quoteData);

// ok: sonash.security.no-direct-firestore-write — non-protected collection
updateDoc(doc(db, "users", userId), profileData);

// ok: sonash.security.no-direct-firestore-write — read-only operations
import { getDoc, doc } from "firebase/firestore";

// ok: sonash.security.no-direct-firestore-write — import of write functions is fine
import { setDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
// Now only flags eval() and string-literal setTimeout/setInterval
// =============================================================================

// ruleid: sonash.security.no-eval-usage
eval("alert('xss')");

// ruleid: sonash.security.no-eval-constructor
new Function("return 1")();

// ok: sonash.security.no-eval-usage
JSON.parse('{"safe": true}');

// ok: sonash.security.no-eval-usage — function reference is safe
setTimeout(myCallback, 1000);

// ok: sonash.security.no-eval-usage — function reference is safe
setInterval(pollStatus, 5000);

// ok: sonash.security.no-eval-usage — arrow function is safe
setTimeout(() => doWork(), 1000);

// ok: sonash.security.no-eval-usage — arrow function is safe
setInterval(() => refresh(), 5000);

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
