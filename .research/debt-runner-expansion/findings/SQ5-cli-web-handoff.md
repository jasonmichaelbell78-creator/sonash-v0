# Findings: CLI to Web Handoff Mechanisms

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-03-27
**Sub-Question IDs:** SQ-5

---

## Key Findings

### 1. Web -> CLI handoff via clipboard is directly supported by existing codebase patterns [CONFIDENCE: HIGH]

The codebase has two working clipboard implementations:

**Pattern A — `navigator.clipboard.writeText()` with textarea fallback:**
`lib/utils/error-export.ts:300` defines `copyErrorExportToClipboard()` — a
promise-returning function that tries `navigator.clipboard.writeText(json)`,
falls back to the `document.execCommand('copy')` textarea trick for older
browsers.

**Pattern B — Inline `navigator.clipboard.writeText()` with toast
confirmation:** `components/meetings/meeting-details-dialog.tsx` calls
`navigator.clipboard.writeText(shareText)` directly with
`toast.success("Meeting info copied to clipboard!")` on success.

**Pattern C — Copy button with 2-second success state:**
`components/admin/errors-tab.tsx` uses `copySuccess` boolean state + a
`copySuccessTimeoutRef` that resets after 2000ms. The button visually changes
from "Export" to a checkmark while `copySuccess` is true.

For the debt tab, Pattern C is the right model: a "Copy CLI Command" button per
item that shows a brief checkmark, copying a string like
`/debt-runner verify --item DEBT-0774` to clipboard. The implementation is
straightforward — `navigator.clipboard.writeText()` is well-supported in the
Chrome-based environment where the admin-gated `/dev` page runs.

Sources: [1] (lib/utils/error-export.ts:300-323), [2]
(components/admin/errors-tab.tsx:748-768), [3]
(components/meetings/meeting-details-dialog.tsx)

---

### 2. CLI invocation strings are deterministic and derivable from DEBT item fields [CONFIDENCE: HIGH]

The SKILL.md defines the CLI invocation syntax as:
`/debt-runner [mode] [--severity S0,S1] [--interactive]`

Every debt item has `id` (DEBT-XXXX), `severity` (S0-S3), `category`, `status`,
`file`, and other structured fields. From these, the web dashboard can generate
precise CLI commands without ambiguity:

| Web action                            | Generated CLI string                                        |
| ------------------------------------- | ----------------------------------------------------------- |
| Single item inspect/verify            | `/debt-runner verify --item DEBT-0774`                      |
| Filtered set (S0 only)                | `/debt-runner verify --severity S0`                         |
| Filtered set (S0 + security category) | `/debt-runner verify --severity S0 --category security`     |
| Bulk selection (3 items)              | `/debt-runner verify --items DEBT-0774,DEBT-0812,DEBT-1033` |
| Plan for displayed items              | `/debt-runner plan --severity S0,S1`                        |
| Current filter as health check        | `/debt-runner health --severity S1,S2`                      |

Note: The current SKILL.md does not define `--item` or `--items` flags — these
are proposed additions. The `--severity` flag is documented. The web generates
commands using flags that either exist or must be added to the skill as part of
this expansion.

The `/debt-runner` command is a Claude Code skill, not a shell binary. The user
pastes the string into their Claude Code terminal, not a bash shell. This is a
critical distinction for the handoff design — there is no shell interop needed.

Sources: [4] (.claude/skills/debt-runner/SKILL.md lines 58-63), [5]
(docs/technical-debt/MASTER_DEBT.jsonl schema, confirmed by SQ1b findings)

---

### 3. CONFIRMED: Web cannot write to filesystem in production — static SPA cannot dispatch work to CLI [CONFIDENCE: HIGH]

`next.config.mjs` has `output: "export"` — the app is a fully static SPA served
from Firebase Hosting. In production, the web layer runs entirely in the user's
browser. There is no server process, no API route, no file system access.

The following handoff mechanisms are IMPOSSIBLE in production:

- Writing a task file to `.claude/state/` that the CLI picks up
- Sending an HTTP request to trigger a CLI command
- File-based inter-process communication of any kind

The following ARE possible:

- Clipboard copy (browser API, no server needed)
- URL-encoded command strings the user pastes into their terminal
- localStorage for persisting web-side state (bookmarks, filter preferences)

This is consistent with what SQ2 findings established. The `npm run dev`
(Turbopack) server DOES support API routes locally, but since `/dev` is a
desktop-only admin-gated page and the feature is used locally, this raises a
design question: could a dev-mode-only API route be used? The answer is still NO
— a production build would fail, making it an unreliable pattern.

Sources: [6] (next.config.mjs line 13), [7] (firebase.json hosting block), [8]
(SQ2-web-integration.md finding #3)

---

### 4. CLI -> Web data flow: the Lighthouse precedent reveals the full pattern [CONFIDENCE: HIGH]

The Lighthouse tab is the only implemented dev dashboard tab and reveals exactly
how CLI tools push data to the web. The flow is:

```
CLI tool runs (scripts/lighthouse-audit.js)
  -> writes to local .lighthouse/summary.json
  -> [MISSING: no Firestore push step yet - PERF-002/PERF-003 unimplemented]
  -> web reads from Firestore: db.collection("dev").doc("lighthouse").collection("history")
```

The lighthouse tab's `LighthouseTab` component shows "Setup Required" if no
Firestore data exists — confirming the push step is absent. This is not a
contradiction: the tab was built in anticipation of the push script being added
in CI (PERF-002).

**The debt dashboard should NOT wait for or depend on the Lighthouse push being
implemented.** The debt data flow is simpler and different: rather than pushing
to Firestore, it uses a local SQLite read mirror (established by SQ1b findings —
`data/tdms.db`). The web reads from this local SQLite database on demand via a
"Refresh Data" button.

For the debt use case, the CLI-to-web data flow is:

```
/debt-runner [mutates MASTER_DEBT.jsonl via scripts]
  -> post-mutation: node scripts/debt/sync-to-sqlite.js (auto-triggered)
  -> data/tdms.db updated (full rebuild, ~2 seconds)
  -> web: user clicks "Refresh Data" -> reads from tdms.db
```

The "Refresh Data" button is the handoff signal: after CLI operations, the user
clicks it in the web to see the updated state. This is the decision already
established in the QA decisions (deep-research state file):
`"web_refresh": "Manual button, no auto-sync, no Firebase"`.

Sources: [9] (scripts/lighthouse-audit.js full read), [10]
(components/dev/lighthouse-tab.tsx), [11]
(.claude/state/deep-research.debt-runner-expansion.state.json qa_decisions)

---

### 5. "Last synced" timestamp is the minimum viable sync signal [CONFIDENCE: HIGH]

The SQLite schema proposed in SQ1b includes a `sync_meta` table with
`last_sync_at`, `last_sync_duration_ms`, `last_sync_item_count`, and
`master_file_size_bytes`. This directly supports the "last updated" timestamp
display pattern.

The web dashboard header should show: "Data as of: 2026-03-27 14:23:08 (N
items)" with a "Refresh" button. This provides:

- Visible staleness signal (user knows when data was last pulled from
  MASTER_DEBT)
- No polling, no auto-sync, no network calls
- After CLI mutates data, user sees timestamp is stale and clicks Refresh

The timestamp is read from `sync_meta` on every data load — it costs nothing
extra since the initial data fetch already reads tdms.db.

Sources: [12] (SQ1b-sync-architecture.md Finding #15 — sync_meta table schema),
[13] (.claude/state/deep-research.debt-runner-expansion.state.json)

---

### 6. Web filter state -> CLI scope: URL hash encoding is the practical approach [CONFIDENCE: MEDIUM]

The current `/dev` page uses no URL query parameters for state — `dev-tabs.tsx`
manages tab state entirely in React `useState`. There is no existing
`useSearchParams` / `URLSearchParams` pattern in the app router for the dev page
(grep confirmed zero hits in `app/`).

However, the SPA IS served with client-side routing via Firebase Hosting
rewrites (`"**" -> "/index.html"`). URL hash fragments
(`#severity=S0&category=security`) persist through page reloads without
triggering server requests, making them suitable for encoding filter state.

Two options for filter-state-to-CLI handoff:

**Option A — "Copy CLI Command" button with current filters baked in:** The web
shows the active filter state (e.g., "Showing: S0, security category,
status=NEW"). A "Copy as CLI" button generates:
`/debt-runner verify --severity S0 --category security --status NEW` and copies
it to clipboard. The user pastes into Claude Code terminal. This is the simplest
approach — no URL encoding needed.

**Option B — URL hash encodes filter state:** The debt tab encodes its active
filters in `window.location.hash`. A "Share Filter" button copies the full URL.
This is more shareable but adds complexity with no clear benefit for a
single-user tool.

**Recommendation: Option A only for v1.** The clipboard command IS the filter
state export. No URL encoding needed.

Sources: [14] (components/dev/dev-tabs.tsx — no URL params), [15]
(app/dev/page.tsx — no useSearchParams), [16] (firebase.json — SPA rewrite
confirms hash-based routing viable)

---

### 7. Shared state: localStorage for web-only metadata is the right boundary [CONFIDENCE: HIGH]

The codebase already uses localStorage in two places:

- `components/notebook/hooks/use-smart-prompts.ts` — dismissed prompt
  persistence with structured JSON read/write wrapped in try/catch
- `components/notebook/pages/today-page.tsx` — celebration state persistence

The pattern is: try/catch on both read and write, with graceful degradation on
failure. This is the correct model for debt dashboard web-only metadata.

**What belongs in localStorage (web-side state, not CLI-relevant):**

- Active filter state (severity, category, status, search text) — restore on tab
  re-open
- UI preferences (sort order, items-per-page, column visibility)
- Dashboard layout state

**What does NOT belong in localStorage:**

- Debt item annotations, bookmarks, priority overrides — these are durable user
  decisions that should survive browser data clears. Options: Firestore or a
  local notes file. Given no-server constraint, Firestore is the right store for
  anything worth persisting long-term.

**What does NOT belong in the web layer at all:**

- CLI session state (debt-runner.state.json) — this is CLI-internal, survives
  compaction, and has no web equivalent
- MASTER_DEBT mutations — CLI owns all writes per SKILL.md Critical Rule #1

Sources: [17] (components/notebook/hooks/use-smart-prompts.ts — localStorage
pattern), [18] (.claude/skills/debt-runner/SKILL.md Critical Rules)

---

### 8. Firestore as shared state store: viable but scoped narrowly [CONFIDENCE: MEDIUM]

The existing Firestore service pattern (lib/firestore-service.ts) uses Cloud
Functions for all writes to protected collections (journal, daily_logs,
inventoryEntries) per CLAUDE.md Security Rules. The `dev/*` collections (e.g.,
`dev/lighthouse/history`) appear to be admin-write-only with no Cloud Function
gate — the Lighthouse tab reads them directly via `getDocs`.

**For debt data:** The QA decision in the state file says
`"web_refresh": "Manual button, no auto-sync, no Firebase"`. This decision
closes the question: MASTER_DEBT bulk data goes via SQLite, not Firestore.

**Where Firestore DOES make sense:** Web-only annotations that need to survive
browser clears:

- Bookmarks: `db.collection("dev").doc("debt").collection("bookmarks")`
- Item notes: `db.collection("dev").doc("debt").collection("notes")`
- Priority overrides (web-set, not synced back to CLI): same path

These write paths do NOT touch `journal`, `daily_logs`, or `inventoryEntries`,
so CLAUDE.md's Cloud Function requirement does NOT apply. Direct client writes
to `dev/debt/bookmarks` are architecturally consistent with how
`dev/lighthouse/history` is written (direct admin write from the lighthouse push
script).

**Firestore schema for web-only metadata:**

```
dev/debt/bookmarks/{debtId}  -> { bookmarkedAt: Timestamp, note: string }
dev/debt/annotations/{debtId} -> { note: string, priority: "high"|"normal", updatedAt: Timestamp }
```

This is a thin layer — only the annotations that have no CLI equivalent. The CLI
never reads these; they're purely web-side enrichment.

**Security:** The `/dev` page is already gated on `claims.admin === true` via
`getIdTokenResult(true)`. Firestore rules for `dev/**` paths should match:
`allow read, write: if request.auth.token.admin == true;`. This is consistent
with the existing Lighthouse data access pattern (admin-gated reads, no Cloud
Function needed for dev-tool data).

Sources: [19] (lib/firestore-service.ts — getLatestLighthouseRun shows direct
read), [20] (CLAUDE.md Section 2 — security rules scoped to specific
collections), [21] (.claude/state/deep-research.debt-runner-expansion.state.json
qa_decisions)

---

### 9. Session continuity: triage on web, continue in CLI — the practical handoff [CONFIDENCE: MEDIUM]

The SKILL.md defines `/debt-runner resume` — the CLI reads
`.claude/state/debt-runner.state.json` to resume an incomplete mode. This state
file tracks: last mode, step, pending staging files.

The web cannot write to this state file (static SPA, filesystem inaccessible in
production). Therefore, session continuity from web -> CLI requires:

**Pattern: Explicit handoff via clipboard command.**

Scenario: User browses the web dashboard, filters to S0 items not verified in

> 30 days, wants to triage them in Claude Code.

1. Web shows the filtered set (e.g., 14 items matching)
2. User clicks "Triage in CLI" button
3. Web generates: `/debt-runner verify --severity S0 --status NEW --limit 14`
   and copies to clipboard with a toast: "Command copied! Paste into Claude
   Code"
4. User pastes into Claude Code terminal, /debt-runner runs with that scope

The CLI does not need to "know" the web filter state. The web translates its
filter state into CLI flags on demand. There is no shared session object.

**What the CLI state file contributes to the web:**

- The state file exists at `.claude/state/debt-runner.state.json` — currently
  this file does NOT exist (confirmed: the file was absent when checked)
- If the state file DID exist, the web could not read it (static SPA)
- The SQLite `sync_meta` table is the web's equivalent: last_sync_at,
  last_sync_item_count

**What the CLI DOES need from the web (v1 scope):** Nothing. The CLI reads
MASTER_DEBT.jsonl directly. The web is a read-only view that generates CLI
commands. No bidirectional shared state needed in v1.

Sources: [22] (.claude/skills/debt-runner/SKILL.md Compaction Resilience
section), [23] (.claude/state/ directory listing — debt-runner.state.json
absent)

---

### 10. Lighthouse tab handoff pattern: CLI pushes to Firestore as the canonical precedent for CLI -> Web sync [CONFIDENCE: MEDIUM]

The lighthouse-audit.js script writes to `.lighthouse/summary.json` locally. The
Firestore path `dev/lighthouse/history` is referenced in
`getLatestLighthouseRun()` but no script pushes data to it — PERF-002 (CI
integration) and PERF-003 (Firestore history storage) are listed as pending in
the tab's status section.

This gap is actually informative for the debt dashboard design: the Lighthouse
approach (Firestore as shared store) was planned but not implemented. The debt
dashboard takes a different path (SQLite local read mirror + manual refresh),
which is a deliberate departure from the Lighthouse model.

The Lighthouse precedent DOES establish one useful cross-tab synergy
opportunity: once Lighthouse runs are pushed to Firestore and debt items are in
SQLite, a "correlation view" could show "Lighthouse regressions that coincide
with S0 debt items affecting those routes." This is v2+ scope but worth noting.

Sources: [24] (components/dev/lighthouse-tab.tsx lines 184-191 — PERF-002/003
status), [25] (scripts/lighthouse-audit.js — no Firestore writes confirmed)

---

### 11. Bulk selection -> batch CLI command: design pattern [CONFIDENCE: MEDIUM]

No existing bulk-selection UI pattern was found in the dev dashboard components.
The admin errors tab has a time-range export but not item-level multi-select.

For the debt tab, bulk selection for CLI command generation needs a new UI
pattern. The most practical design:

**Checkbox + command preview panel:**

```
[ ] DEBT-0774  S0  auth/validate.ts    Missing rate limit
[x] DEBT-0812  S0  lib/api.ts          SQL injection risk
[x] DEBT-1033  S1  components/form.tsx  XSS vector
[x] DEBT-1044  S1  components/form.tsx  Input not sanitized

Selected: 3 items
Generated command: /debt-runner verify --items DEBT-0812,DEBT-1033,DEBT-1044
[Copy Command]  [Clear Selection]
```

The generated command is reactive — updates as checkboxes change. The "Copy
Command" button uses `navigator.clipboard.writeText()` as established in Finding
#1.

Note: `--items` flag is not currently defined in SKILL.md. The expansion must
add this flag to the skill, OR the generated command could use multiple
`--severity` filters that approximate the selection (less precise). Defining
`--item DEBT-XXXX` and `--items DEBT-XXXX,DEBT-YYYY` flags is a clean skill
extension.

Sources: [26] (components/admin/errors-tab.tsx — export pattern, no
multi-select), [27] (.claude/skills/debt-runner/SKILL.md — current flags:
--severity, --interactive only)

---

## Sources

| #   | Path                                                               | Title                                       | Type          | Trust | CRAAP | Date       |
| --- | ------------------------------------------------------------------ | ------------------------------------------- | ------------- | ----- | ----- | ---------- |
| 1   | lib/utils/error-export.ts:300                                      | copyErrorExportToClipboard                  | source-code   | HIGH  | 5/5   | 2026       |
| 2   | components/admin/errors-tab.tsx:748                                | handleExportCopy pattern                    | source-code   | HIGH  | 5/5   | 2026       |
| 3   | components/meetings/meeting-details-dialog.tsx                     | navigator.clipboard inline                  | source-code   | HIGH  | 5/5   | 2026       |
| 4   | .claude/skills/debt-runner/SKILL.md                                | CLI invocation syntax                       | source-code   | HIGH  | 5/5   | 2026-03-15 |
| 5   | docs/technical-debt/MASTER_DEBT.jsonl                              | Debt item schema                            | data-file     | HIGH  | 5/5   | 2026       |
| 6   | next.config.mjs                                                    | output:export confirmation                  | source-code   | HIGH  | 5/5   | 2026       |
| 7   | firebase.json                                                      | Hosting SPA rewrite config                  | source-code   | HIGH  | 5/5   | 2026       |
| 8   | .research/debt-runner-expansion/findings/SQ2-web-integration.md    | Prior research                              | findings      | HIGH  | 5/5   | 2026-03-27 |
| 9   | scripts/lighthouse-audit.js                                        | Lighthouse CLI script (no Firestore writes) | source-code   | HIGH  | 5/5   | 2026       |
| 10  | components/dev/lighthouse-tab.tsx                                  | LighthouseTab (PERF-002/003 pending)        | source-code   | HIGH  | 5/5   | 2026       |
| 11  | .claude/state/deep-research.debt-runner-expansion.state.json       | QA decisions                                | state-file    | HIGH  | 5/5   | 2026-03-27 |
| 12  | .research/debt-runner-expansion/findings/SQ1b-sync-architecture.md | sync_meta table design                      | findings      | HIGH  | 5/5   | 2026-03-27 |
| 13  | .claude/state/deep-research.debt-runner-expansion.state.json       | web_refresh decision                        | state-file    | HIGH  | 5/5   | 2026-03-27 |
| 14  | components/dev/dev-tabs.tsx                                        | No URL params in tab state                  | source-code   | HIGH  | 5/5   | 2026       |
| 15  | app/dev/page.tsx                                                   | No useSearchParams                          | source-code   | HIGH  | 5/5   | 2026       |
| 16  | firebase.json                                                      | SPA rewrite                                 | source-code   | HIGH  | 5/5   | 2026       |
| 17  | components/notebook/hooks/use-smart-prompts.ts                     | localStorage pattern                        | source-code   | HIGH  | 5/5   | 2026       |
| 18  | .claude/skills/debt-runner/SKILL.md                                | Critical Rule #1                            | source-code   | HIGH  | 5/5   | 2026-03-15 |
| 19  | lib/firestore-service.ts                                           | getLatestLighthouseRun direct read          | source-code   | HIGH  | 5/5   | 2026       |
| 20  | CLAUDE.md Section 2                                                | Security rules scope                        | project-rules | HIGH  | 5/5   | 2026-03-24 |
| 21  | .claude/state/deep-research.debt-runner-expansion.state.json       | no Firebase decision                        | state-file    | HIGH  | 5/5   | 2026-03-27 |
| 22  | .claude/skills/debt-runner/SKILL.md                                | Resume/state section                        | source-code   | HIGH  | 5/5   | 2026-03-15 |
| 23  | .claude/state/ directory listing                                   | debt-runner.state.json absent               | filesystem    | HIGH  | 5/5   | 2026-03-27 |
| 24  | components/dev/lighthouse-tab.tsx:184                              | PERF status checklist                       | source-code   | HIGH  | 5/5   | 2026       |
| 25  | scripts/lighthouse-audit.js                                        | No Firestore imports                        | source-code   | HIGH  | 5/5   | 2026       |
| 26  | components/admin/errors-tab.tsx                                    | Export pattern only                         | source-code   | HIGH  | 5/5   | 2026       |
| 27  | .claude/skills/debt-runner/SKILL.md                                | Current flags documented                    | source-code   | HIGH  | 5/5   | 2026-03-15 |

---

## Contradictions

**QA Decision "no Firebase" vs. Firestore for web-only annotations:** The QA
decision states `"web_refresh": "Manual button, no auto-sync, no Firebase"`.
This was recorded in the context of MASTER_DEBT bulk data sync — the decision is
that debt items do not flow through Firestore. However, web-only metadata
(bookmarks, notes) has no CLI equivalent and survives browser clears only if
stored in Firestore. These are not contradictory: the decision applies to the
data flow for MASTER_DEBT, not to ephemeral web-side annotations. The
recommendation here is: SQLite for bulk read data, Firestore for web-only
durable annotations (scoped to `dev/debt/*` only).

**SKILL.md flags vs. proposed generated commands:** The current SKILL.md
documents `--severity` and `--interactive` flags only. The handoff designs in
Findings #2 and #11 propose `--item DEBT-XXXX`, `--items`, `--category`,
`--status` flags. These do not yet exist. The expansion plan must include adding
these flags to SKILL.md or the generated commands will not work.

---

## Gaps

1. **debt-runner.state.json schema** — The state file does not currently exist
   on disk. Its schema (when created during a `/debt-runner` session) is defined
   by the SKILL.md Compaction Resilience section but was not verified against
   any existing instance. The web cannot read it regardless, but its structure
   would inform any future "sync CLI session context to web" design.

2. **Firestore security rules for `dev/*` collections** — `firestore.rules` was
   not read. Whether `dev/debt/*` write access requires rule additions or
   inherits from existing admin-claim rules is unverified.

3. **`--item` / `--items` flag feasibility in SKILL.md** — The SKILL.md has no
   item-level targeting today. Whether the skill's convergence-loop model
   handles single-item scope correctly needs design work (a CL on one item is
   trivial but the menu/mode structure assumes batch operations).

4. **localStorage key namespace for debt tab** — No existing convention for the
   `/dev` page's localStorage keys was found. The smart-prompts hook uses
   `dismissed-prompts-${today}` as a key pattern. A `dev-debt-*` namespace would
   be consistent, but no formal convention exists.

5. **Firestore read limits for annotations** — If users annotate many items, the
   `dev/debt/annotations` collection could grow. The existing Firestore service
   uses `limit(QUERY_LIMITS.HISTORY_MAX)` for pagination. Whether annotations
   need pagination was not analyzed.

---

## Serendipity

**The Lighthouse PERF-002/003 gap is an opportunity:** The Lighthouse tab
currently shows "Setup Required" because no CLI push to Firestore exists. The
debt tab's SQLite approach (local refresh button) solves the same problem
differently and is actually MORE appropriate for a local dev tool. If the
Lighthouse push to Firestore is implemented in future, the pattern could also be
applied to push a debt summary to Firestore for a "remote view" use case
(viewing debt from a phone or non-dev machine). But for v1, local SQLite is
simpler and correct.

**The admin errors tab's export UI is the richest handoff precedent:** The
errors-tab.tsx has download + copy-to-clipboard dual export, dropdown with
timeframe selection, and copy success state management. This is the most
sophisticated data-export UX in the codebase. For the debt tab, the "Copy CLI
Command" feature is simpler than this — but the component patterns (dropdown,
success state, timeout-based reset) can be directly borrowed.

**`/debt-runner` is a Claude Code skill, not a shell binary:** This is an
important handoff distinction. The user pastes into the Claude Code chat, not a
terminal. This means the "command" can be more than a flag string — it could be
a natural language instruction like "Run /debt-runner verify on these items:
DEBT-0812, DEBT-1033, DEBT-1044" which Claude interprets and routes to the
skill. The clipboard copy could optionally include a conversational wrapper.
This is a UX enhancement for v2.

**Dev dashboard tab coordination (DECISIONS_PRE_PLAN.md Q10):** The pre-plan
document flags "how does /dev/debt interact with other planned tabs" as an open
question. Based on findings here: the Override Audit tab (already in
dev-tabs.tsx as a placeholder) uses `override-log.jsonl` — a completely separate
data source. The Errors tab and Debt tab could be linked in future (errors that
map to known DEBT items), but in v1 there is no shared state between tabs. Each
tab is self-contained.

---

## Confidence Assessment

- HIGH claims: 7
- MEDIUM claims: 4
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings are based on direct filesystem reads of actual source files and
cross-referenced against prior research findings (SQ1b, SQ2). The clipboard
patterns are confirmed by real code. The impossibility of filesystem writes from
the web layer is confirmed by the static export config. Firestore schema
proposals and URL encoding options are design recommendations (MEDIUM) rather
than observed facts.
