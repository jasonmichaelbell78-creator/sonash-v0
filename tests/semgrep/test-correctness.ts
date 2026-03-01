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
