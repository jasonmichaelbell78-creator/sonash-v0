/**
 * Semgrep test annotation file for style rules.
 *
 * Run with: semgrep --test --config .semgrep/rules/style/ tests/semgrep/
 *
 * Lines with `// ruleid: ...` MUST match (violations).
 * Lines with `// ok: ...` MUST NOT match (safe patterns).
 */

// =============================================================================
// sonash.style.no-console-in-components
// =============================================================================

function MyComponent() {
  // ruleid: sonash.style.no-console-in-components
  console.log("debug output");

  // ruleid: sonash.style.no-console-in-components
  console.error("something broke");

  return <div>Hello</div>;
}

// ok: sonash.style.no-console-in-components
// (This annotation applies to scripts/ context, not app/ or components/)
function scriptLogger() {
  console.log("Script output is fine");
}

// =============================================================================
// sonash.style.no-any-type
// =============================================================================

// ruleid: sonash.style.no-any-type
function process(input: any) {
  return input;
}

// ruleid: sonash.style.no-any-type
const data: any = fetchData();

// ok: sonash.style.no-any-type
function process2(input: unknown) {
  return input;
}

// ok: sonash.style.no-any-type
const data2: string = "typed";

// =============================================================================
// sonash.style.no-inline-firestore-query
// =============================================================================

// In app/ or components/ context:
async function ComponentFetcher() {
  // ruleid: sonash.style.no-inline-firestore-query
  const snap = await getDoc(docRef);
  return snap.data();
}

async function ComponentListFetcher() {
  // ruleid: sonash.style.no-inline-firestore-query
  const snap = await getDocs(queryRef);
  return snap.docs.map((d) => d.data());
}

// ok: sonash.style.no-inline-firestore-query
// (This would be in lib/firestore-service.ts, excluded by paths)
async function firestoreService() {
  const snap = await getDoc(docRef);
  return snap.data();
}

// =============================================================================
// sonash.style.no-magic-numbers
// =============================================================================

// ruleid: sonash.style.no-magic-numbers
setTimeout(refreshData, 30000);

// ruleid: sonash.style.no-magic-numbers
setInterval(pollStatus, 5000);

// ok: sonash.style.no-magic-numbers
const REFRESH_INTERVAL_MS = 30000;
setTimeout(refreshData, REFRESH_INTERVAL_MS);

// =============================================================================
// sonash.style.no-default-export
// =============================================================================

// ruleid: sonash.style.no-default-export
export default function helperUtil() {
  return true;
}

// ok: sonash.style.no-default-export
export function namedHelper() {
  return true;
}

// ok: sonash.style.no-default-export
export const anotherHelper = () => true;
