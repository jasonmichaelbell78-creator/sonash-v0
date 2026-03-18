/**
 * Semgrep test annotation file for correctness rules.
 *
 * Run with: semgrep --test --config .semgrep/rules/correctness/ tests/semgrep/
 *
 * Lines with `// ruleid: ...` MUST match (violations).
 * Lines with `// ok: ...` MUST NOT match (safe patterns).
 */

// =============================================================================
// sonash.correctness.async-without-try-catch
// =============================================================================

// ruleid: sonash.correctness.async-without-try-catch
async function unsafeAsync() {
  await fetchData();
  return process(data);
}

// ok: sonash.correctness.async-without-try-catch
async function safeAsync() {
  try {
    await fetchData();
    return process(data);
  } catch (err) {
    handleError(err);
  }
}

// =============================================================================
// sonash.correctness.file-read-without-try-catch
// =============================================================================

function unsafeRead() {
  // ruleid: sonash.correctness.file-read-without-try-catch
  const data = fs.readFileSync("file.txt", "utf8");
}

function safeRead() {
  try {
    // ok: sonash.correctness.file-read-without-try-catch
    const data = fs.readFileSync("file.txt", "utf8");
  } catch (err) {
    return null;
  }
}

// =============================================================================
// sonash.correctness.no-floating-promise
// =============================================================================

function floatingPromise() {
  // ruleid: sonash.correctness.no-floating-promise
  fetchData();
}

async function awaitedPromise() {
  // ok: sonash.correctness.no-floating-promise
  await fetchData();
}

function chainedPromise() {
  // ok: sonash.correctness.no-floating-promise
  fetchData().then(handleResult).catch(handleError);
}

// =============================================================================
// sonash.correctness.regex-without-lastindex-reset
// =============================================================================

const pattern = /test/g;
let input = "test string for regex matching";

// ruleid: sonash.correctness.regex-without-lastindex-reset
while (pattern.exec(input)) {
  processMatch();
}

// ok: sonash.correctness.regex-without-lastindex-reset
pattern.lastIndex = 0;
while (pattern.exec(input)) {
  processMatch();
}

// =============================================================================
// sonash.correctness.no-race-condition-file-ops
// =============================================================================

// ruleid: sonash.correctness.no-race-condition-file-ops
if (fs.existsSync(filePath)) {
  const data = fs.readFileSync(filePath, "utf8");
}

// ok: sonash.correctness.no-race-condition-file-ops
try {
  const data = fs.readFileSync(filePath, "utf8");
} catch (err) {
  // File doesn't exist or can't be read
}

// =============================================================================
// sonash.correctness.no-await-in-loop
// =============================================================================

async function sequentialFetch(items) {
  // ruleid: sonash.correctness.no-await-in-loop
  for (const item of items) {
    await fetchItem(item);
  }
}

async function parallelFetch(items) {
  // ok: sonash.correctness.no-await-in-loop
  await Promise.all(items.map((item) => fetchItem(item)));
}

// =============================================================================
// sonash.correctness.no-unchecked-array-access
// =============================================================================

function unsafeAccess(arr) {
  // ruleid: sonash.correctness.no-unchecked-array-access
  return arr[0];
}

function safeAccess(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length > 0) {
    return arr[0];
  }
}

function safeAccessEarlyReturn(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length === 0) return null;
  return arr[0];
}

function safeAccessEarlyReturnBlock(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length === 0) { return null; }
  return arr[0];
}

function safeAccessLengthLessThan(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length < 2) return null;
  return arr[0];
}

function safeAccessSplit(str) {
  // ok: sonash.correctness.no-unchecked-array-access
  return str.split("T")[0];
}

function safeAccessNullish(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  const val = arr[0] ?? "default";
  return val;
}

function safeAccessOptionalChain(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  return arr[0]?.name;
}

function safeAccessOptionalChainMethod(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  return arr[0]?.toString();
}

function safeAccessTernary(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  return arr.length > 0 ? arr[0] : null;
}

function safeAccessShortCircuit(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  return arr.length < 1 || arr[0];
}

function safeAccessLengthNotEquals(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length !== 0) {
    return arr[0];
  }
}

function safeAccessLengthGte(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr.length >= 1) {
    return arr[0];
  }
}

function safeAccessExistenceCheck(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  if (arr?.length) {
    return arr[0];
  }
}

function safeAccessRegexMatch(str) {
  const m = str.match(/(\d+)/);
  // ok: sonash.correctness.no-unchecked-array-access
  if (m) {
    return m[0];
  }
}

function safeAccessInsideMap(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  return arr.map((item) => item.split(",")[0]);
}

function unsafeAccessInsideFilter(arr) {
  // ruleid: sonash.correctness.no-unchecked-array-access
  return arr.filter((item) => item.parts[0] === "valid");
}

function unsafeAccessInsideForEach(arr) {
  arr.forEach((item) => {
    // ruleid: sonash.correctness.no-unchecked-array-access
    console.log(item.values[0]);
  });
}

function safeAccessOrFallback(arr) {
  // ok: sonash.correctness.no-unchecked-array-access
  const val = arr[0] || "default";
  return val;
}

// =============================================================================
// sonash.correctness.no-floating-promise (additional guard pattern tests)
// =============================================================================

function voidPromise() {
  // ok: sonash.correctness.no-floating-promise
  void fetch("/api/data");
}

function returnPromise() {
  // ok: sonash.correctness.no-floating-promise
  return fetch("/api/data");
}

function assignedPromise() {
  // ok: sonash.correctness.no-floating-promise
  const _result = fetch("/api/data");
  void _result;
}

async function tryCatchPromise() {
  try {
    // ok: sonash.correctness.no-floating-promise
    await fetch("/api/data");
  } catch (err) {
    handleError(err);
  }
}

function thenCatchPromise() {
  // ok: sonash.correctness.no-floating-promise
  fetch("/api/data").then(handle).catch(handleError);
}

async function assignedAwaitedFetch() {
  // ok: sonash.correctness.no-floating-promise
  const response = await fetch("/api/data");
  // ok: sonash.correctness.no-floating-promise
  const data = await response.json();
  return data;
}

async function letAssignedFetch() {
  // ok: sonash.correctness.no-floating-promise
  let response = await fetch("/api/data");
  return response;
}
