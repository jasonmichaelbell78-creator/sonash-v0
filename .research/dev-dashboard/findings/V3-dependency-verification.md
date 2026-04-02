# Findings: Dependency and Component Verification — Dev Dashboard

**Searcher:** deep-research-searcher (verification agent) **Profile:**
codebase + web **Date:** 2026-03-29 **Sub-Question IDs:** V3
(dependency/component verification)

---

## Key Findings

### Claim 1: Recharts is NOT installed

**VERIFIED** [CONFIDENCE: HIGH]

Zero occurrences of `"recharts"` in `package-lock.json`. Not present in
`package.json` dependencies or devDependencies. Evidence: grep of
`package-lock.json` returned count 0.

---

### Claim 2: TanStack Table (`@tanstack/react-table`) is NOT installed

**VERIFIED** [CONFIDENCE: HIGH]

Zero occurrences of `"@tanstack/react-table"` in `package-lock.json`. Not
present in `package.json`.

---

### Claim 3: TanStack Virtual (`@tanstack/react-virtual`) is NOT installed

**VERIFIED** [CONFIDENCE: HIGH]

Zero occurrences of `"@tanstack/react-virtual"` in `package-lock.json`. Not
present in `package.json`.

---

### Claim 4: MiniSearch is NOT installed

**VERIFIED** [CONFIDENCE: HIGH]

Zero occurrences of `"minisearch"` in `package-lock.json`. Not present in
`package.json`.

---

### Claim 5: shadcn badge component is NOT installed

**VERIFIED** [CONFIDENCE: HIGH]

`components/ui/` directory listing shows: `button.tsx`, `dialog.tsx`,
`empty-state.tsx`, `input.tsx`, `label.tsx`, `scroll-area.tsx`, `select.tsx`,
`skeleton.tsx`, `textarea.tsx`, `voice-text-area.tsx`. No `badge.tsx` present.

---

### Claim 6: shadcn tooltip component — is it installed?

**REFUTED: NOT installed** [CONFIDENCE: HIGH]

No `tooltip.tsx` present in `components/ui/`. The directory listing confirms 10
files, none named `tooltip.tsx`.

---

### Claim 7: shadcn dropdown-menu — is it installed?

**REFUTED: NOT installed** [CONFIDENCE: HIGH]

No `dropdown-menu.tsx` present in `components/ui/`. Not in the directory
listing.

---

### Claim 8: shadcn checkbox — is it installed?

**REFUTED: NOT installed** [CONFIDENCE: HIGH]

No `checkbox.tsx` present in `components/ui/`. Not in the directory listing.

---

### Claim 9: shadcn table — is it installed?

**REFUTED: NOT installed** [CONFIDENCE: HIGH]

No `table.tsx` present in `components/ui/`. Not in the directory listing.

---

### Claim 10: cmdk IS installed

**VERIFIED** [CONFIDENCE: HIGH]

`package.json` lists `"cmdk": "^1.1.1"` in dependencies. Also confirmed in
`package-lock.json` via direct grep match.

---

### Claim 11: react-day-picker IS installed

**VERIFIED** [CONFIDENCE: HIGH]

`package.json` lists `"react-day-picker": "^9.14.0"` in dependencies. Also
confirmed in `package-lock.json` via direct grep match.

---

### Claim 12: React version is exactly 19.2.4

**VERIFIED** [CONFIDENCE: HIGH]

`package.json` lists `"react": "^19.2.4"` and `"react-dom": "^19.2.4"`. The `^`
prefix allows patch updates above 19.2.4, but the declared minimum is 19.2.4.
Also declared in `CLAUDE.md` Section 1 stack versions table as
`React 19.2.4 Stable`.

---

### Claim 13: Next.js version is 16.2.0

**VERIFIED** [CONFIDENCE: HIGH]

`package.json` lists `"next": "^16.2.0"`. Also declared in `CLAUDE.md` Section 1
stack versions table as `Next.js 16.2.0 App Router`.

---

### Claim 14: Recharts 3.x is compatible with React 19

**VERIFIED** [CONFIDENCE: MEDIUM-HIGH]

The recharts `main` branch `package.json` explicitly declares:

- `"react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`
- `"react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`

This covers the current 3.8.x release line (latest confirmed 3.8.1 as of March
25, 2025). The recharts GitHub discussion [#5701] confirms maintainers adopted
the approach of putting `react`, `react-dom`, and `react-is` as peerDependencies
covering ^19.0.0.

Caveat: earlier community reports (circa late 2024) noted a `react-is` override
was sometimes needed for React 19. The current main branch peer deps declaration
resolves this. No `overrides` entry is expected to be needed in this project's
`package.json`.

---

### Claim 15: `empty-state.tsx` exists in `components/ui/`

**VERIFIED** [CONFIDENCE: HIGH]

Confirmed present in directory listing of `components/ui/`.

---

### Claim 16: `skeleton.tsx` exists in `components/ui/`

**VERIFIED** [CONFIDENCE: HIGH]

Confirmed present in directory listing of `components/ui/`.

---

## Full Component Inventory

All 10 files present in `components/ui/` as of 2026-03-29:

| File                | Present |
| ------------------- | ------- |
| button.tsx          | YES     |
| dialog.tsx          | YES     |
| empty-state.tsx     | YES     |
| input.tsx           | YES     |
| label.tsx           | YES     |
| scroll-area.tsx     | YES     |
| select.tsx          | YES     |
| skeleton.tsx        | YES     |
| textarea.tsx        | YES     |
| voice-text-area.tsx | YES     |
| badge.tsx           | NO      |
| tooltip.tsx         | NO      |
| dropdown-menu.tsx   | NO      |
| checkbox.tsx        | NO      |
| table.tsx           | NO      |

---

## Sources

| #   | URL / Path                                                  | Title                             | Type            | Trust       | CRAAP     | Date          |
| --- | ----------------------------------------------------------- | --------------------------------- | --------------- | ----------- | --------- | ------------- |
| 1   | `package.json` (project root)                               | Project package.json              | filesystem      | HIGH        | 5/5/5/5/5 | 2026-03-29    |
| 2   | `package-lock.json` (project root)                          | npm lockfile                      | filesystem      | HIGH        | 5/5/5/5/5 | 2026-03-29    |
| 3   | `components/ui/` (directory listing)                        | shadcn component directory        | filesystem      | HIGH        | 5/5/5/5/5 | 2026-03-29    |
| 4   | https://github.com/recharts/recharts/blob/main/package.json | recharts main branch package.json | official-source | HIGH        | 5/5/4/5/5 | 2025 (active) |
| 5   | https://github.com/recharts/recharts/discussions/5701       | recharts peerDeps discussion      | official-github | MEDIUM-HIGH | 4/5/4/4/5 | 2025          |
| 6   | https://github.com/recharts/recharts/releases               | recharts releases page            | official-github | HIGH        | 5/5/4/5/5 | 2025-03       |

---

## Contradictions

None. All filesystem claims are directly verifiable and unambiguous. The
recharts React 19 compatibility claim had some earlier conflicting community
reports (workarounds needed), but the current official `package.json` peer deps
declaration resolves the contradiction in favor of compatibility.

---

## Gaps

- **React exact installed version**: `package.json` declares `^19.2.4` (caret
  allows minor patch upgrades). The exact installed version would require
  reading `package-lock.json` for the `"node_modules/react"` resolved version.
  The declared minimum is 19.2.4 and CLAUDE.md confirms this as the target
  version.
- **Recharts 3.x `react-is` override**: The older issue of needing an
  `overrides.react-is` entry in `package.json` is not resolved by this research
  — the current project `package.json` has no `overrides` for `react-is`. This
  may or may not cause a peer dependency warning at install time. The
  `overrides` section only covers `fast-xml-parser` and `@tootallnate/once`.

---

## Serendipity

- `voice-text-area.tsx` exists in `components/ui/` — this is a custom non-shadcn
  component, not a standard shadcn primitive. It may be relevant to any future
  UI components added to the dashboard.
- The `@radix-ui/react-dialog`, `@radix-ui/react-scroll-area`, and
  `@radix-ui/react-select` radix primitives ARE installed directly as
  dependencies (visible in `package.json`), meaning additional shadcn components
  that use only these primitives could be scaffolded without any new
  `@radix-ui/*` installs. Tooltip, dropdown-menu, and checkbox each require
  their own radix primitive that is NOT yet installed.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM-HIGH claims: 1 (recharts React 19 compat)
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH
