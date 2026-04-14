# Findings: Ruleset Overlap/Conflict Analysis and Optimal Consolidated Configuration

**Searcher:** deep-research-searcher (D9-SQ3) **Profile:** codebase + web
**Date:** 2026-03-29 **Sub-Question IDs:** D9-SQ3

---

## Key Findings

### 1. Full Ruleset Comparison Table [CONFIDENCE: HIGH]

Both rulesets are confirmed `active`, both target `~DEFAULT_BRANCH` (main), both
share the same bypass actor config: `RepositoryRole actor_id=5` with
`bypass_mode=always` (admin/maintain role can always bypass).

| Rule / Parameter                          | Ruleset 1: "main protection" (13352818)                                                             | Ruleset 2: "main-protection" (14350637)         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Created**                               | 2026-02-28                                                                                          | 2026-03-25                                      |
| **Last updated**                          | 2026-03-20                                                                                          | 2026-03-26                                      |
| **Target**                                | ~DEFAULT_BRANCH                                                                                     | ~DEFAULT_BRANCH                                 |
| **Enforcement**                           | active                                                                                              | active                                          |
| `deletion`                                | YES                                                                                                 | YES                                             |
| `non_fast_forward` (block force push)     | YES                                                                                                 | YES                                             |
| `required_linear_history`                 | YES                                                                                                 | NO                                              |
| `pull_request`                            | YES                                                                                                 | NO                                              |
| -- `required_approving_review_count`      | 0                                                                                                   | —                                               |
| -- `dismiss_stale_reviews_on_push`        | false                                                                                               | —                                               |
| -- `require_code_owner_review`            | false                                                                                               | —                                               |
| -- `require_last_push_approval`           | false                                                                                               | —                                               |
| -- `required_review_thread_resolution`    | false                                                                                               | —                                               |
| -- `allowed_merge_methods`                | squash, rebase                                                                                      | —                                               |
| `required_status_checks`                  | YES                                                                                                 | YES                                             |
| -- `strict_required_status_checks_policy` | **true**                                                                                            | **false**                                       |
| -- `do_not_enforce_on_create`             | false                                                                                               | false                                           |
| -- Status checks enforced                 | "Lint & Format", "Type Check & Test", "Build", "Dependency Review", "Analyze JavaScript/TypeScript" | "Validate & Compliance" (integration_id: 15368) |
| `required_signed_commits`                 | NO                                                                                                  | NO                                              |
| `require_conversation_resolution`         | NO                                                                                                  | NO                                              |
| Bypass actors                             | RepositoryRole id=5, always                                                                         | RepositoryRole id=5, always                     |

### 2. Overlap Analysis [CONFIDENCE: HIGH]

Three rules are duplicated across both rulesets, all targeting the same branch:

- **`deletion`** — both prevent branch deletion. Redundant, harmless.
- **`non_fast_forward`** — both block force pushes. Redundant, harmless.
- **`required_status_checks`** — both require status checks but with different
  check sets AND different strictness. This is the only operationally meaningful
  overlap and it has a conflict:
  - RS1 uses `strict=true`: branch must be up to date with main before merge
  - RS2 uses `strict=false`: branch does NOT need to be up to date

  **GitHub's aggregation rule: the most restrictive applies.** Since RS1's
  `strict=true` is more restrictive, PRs MUST have the branch up to date
  regardless of RS2's looser setting. The apparent conflict resolves
  automatically in favor of RS1. [1]

  However, the **check sets are additive** — a PR must pass ALL checks from both
  rulesets:
  - From RS1: "Lint & Format", "Type Check & Test", "Build", "Dependency
    Review", "Analyze JavaScript/TypeScript"
  - From RS2: "Validate & Compliance" (integration_id 15368, maps to `ci.yml`
    job at line 153)

  All 6 checks must pass for a PR to merge. This is intentional layering, not a
  conflict.

### 3. Unique to Ruleset 1 (RS1 has, RS2 lacks) [CONFIDENCE: HIGH]

- **`required_linear_history`** — prohibits merge commits. Combined with
  `allowed_merge_methods: [squash, rebase]` in the pull_request rule, this
  enforces a clean, linear git history on main.
- **`pull_request`** — requires all changes to go through a PR. Without this,
  direct pushes to main are allowed even with status checks (checks only apply
  to PR context; direct pushes bypass them).
  - `required_approving_review_count: 0` — PRs required but zero reviewer
    approvals needed (solo developer pattern, correct for this project).
  - `require_code_owner_review: false` — CODEOWNERS file exists at
    `.github/CODEOWNERS` but is not enforced by ruleset.
  - `required_review_thread_resolution: false` — unresolved PR comments do not
    block merge.
  - `dismiss_stale_reviews_on_push: false` — approvals persist after new
    commits.

### 4. What Ruleset 2 Adds That Ruleset 1 Lacks [CONFIDENCE: HIGH]

RS2's sole additive contribution is including **"Validate & Compliance"** in
required status checks. This maps to the `validate` job in `ci.yml` (line
152-153), which runs pattern compliance and validation checks. RS1 predates this
job (created 2026-02-28, job likely added ~2026-03-25 based on RS2 creation
date), explaining why RS2 was created as a patch rather than RS1 being updated.

### 5. Missing Protections — Neither Ruleset Covers [CONFIDENCE: HIGH]

| Missing Protection            | Rule Type                                                 | Risk if Absent                                                                                                                            | Priority                                 |
| ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Signed commits**            | `required_signed_commits`                                 | Unsigned commits cannot be verified as author-authentic                                                                                   | MEDIUM — solo dev, low supply-chain risk |
| **CODEOWNERS enforcement**    | `require_code_owner_review: true` in pull_request         | CODEOWNERS file exists but is decorative — changes to `firestore.rules`, `functions/src/`, `.github/workflows/` require no owner sign-off | HIGH — file exists, not enforced         |
| **Conversation resolution**   | `required_review_thread_resolution: true` in pull_request | PR review comments can be ignored/merged over                                                                                             | MEDIUM                                   |
| **Require branch up to date** | `strict_required_status_checks_policy: true`              | Already covered by RS1 strict=true — this IS effectively required [3]                                                                     | ALREADY MET                              |
| **Restrict push access**      | `restrict_updates`                                        | Any authenticated user with write access can push; no restriction beyond PR requirement                                                   | LOW — solo repo                          |
| **Code scanning gating**      | `require_code_scanning_results`                           | CodeQL and Semgrep run as workflows but not as blocking ruleset gates                                                                     | HIGH — scans exist, not gating           |
| **Maximum file changes**      | `max_file_path_length` / restrict file size               | No limit on PR size or file sizes                                                                                                         | LOW                                      |

**CODEOWNERS gap detail:** The file at `.github/CODEOWNERS` assigns
`@jasonmichaelbell78-creator` as owner of `*`, `functions/src/`,
`firestore.rules`, and `.github/workflows/`. However
`require_code_owner_review: false` in RS1's pull_request rule means CODEOWNERS
reviews are never enforced. For a solo developer, this is acceptable (you can't
require your own review), but it means the intent of CODEOWNERS is not
mechanically enforced.

**Code scanning gap detail:** `codeql.yml` runs CodeQL analysis and
`semgrep.yml` runs Semgrep. Neither result is enforced as a blocking required
check. The "Analyze JavaScript/TypeScript" check in RS1 is the CodeQL check, so
CodeQL IS gating. Semgrep is not.

### 6. Consolidation Recommendation [CONFIDENCE: MEDIUM-HIGH]

**Recommendation: Consolidate into one ruleset by updating RS1 ("main
protection") to absorb RS2.**

Rationale:

- RS2 exists solely because RS1 was not updated when the "Validate & Compliance"
  check was added to `ci.yml`. It is a patch, not an intentional separation of
  concerns.
- GitHub's own Well-Architected framework recommends minimizing ruleset count
  and preferring consolidated definitions to reduce management overhead [2].
- Two rulesets targeting the same branch with overlapping rules creates
  confusion about intent and authority.
- The sole unique value RS2 provides (one additional status check) is trivially
  added to RS1.

**Proposed single-ruleset configuration:**

```json
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "Lint & Format" },
          { "context": "Type Check & Test" },
          { "context": "Build" },
          { "context": "Dependency Review" },
          { "context": "Analyze JavaScript/TypeScript" },
          { "context": "Validate & Compliance", "integration_id": 15368 }
        ]
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ]
}
```

**Changes from current state:**

- `required_review_thread_resolution: true` added (currently false in RS1) — low
  friction addition
- "Validate & Compliance" check added to the unified check list
- RS2 deleted after RS1 update confirmed working

**Optional additions for higher security posture (not blocking for solo dev):**

- `required_signed_commits` — add if GPG/SSH signing is configured on dev
  machine
- `require_code_scanning_results` for Semgrep — add if Semgrep reliability is
  acceptable

### 7. Effective Merged Protection State (Current) [CONFIDENCE: HIGH]

Because GitHub aggregates rulesets with "most restrictive wins," the **current
effective protection** on main is equivalent to:

- Deletion blocked
- Force push blocked
- Linear history required
- PRs required (0 approvals, squash or rebase only)
- Branch must be up to date before merge (strict=true from RS1 wins)
- ALL 6 checks must pass: Lint & Format, Type Check & Test, Build, Dependency
  Review, Analyze JavaScript/TypeScript, Validate & Compliance
- Admin/maintain role can always bypass

This is functionally correct. The two-ruleset state is not causing broken
protections — it is just organizationally messy and adds a maintenance burden.

---

## Sources

| #   | URL                                                                                                                                       | Title                                             | Type              | Trust | CRAAP     | Date       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------- | ----- | --------- | ---------- |
| 1   | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets               | About rulesets - GitHub Docs                      | official-docs     | HIGH  | 5/5/5/5/5 | Current    |
| 2   | https://wellarchitected.github.com/library/governance/recommendations/managing-repositories-at-scale/rulesets-best-practices/             | Rulesets Best Practices - GitHub Well-Architected | official-guidance | HIGH  | 5/5/5/5/5 | Current    |
| 3   | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets | Available rules for rulesets - GitHub Docs        | official-docs     | HIGH  | 5/5/5/5/5 | Current    |
| 4   | gh api repos/.../rulesets/13352818                                                                                                        | Ruleset 13352818 full JSON                        | live-api          | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 5   | gh api repos/.../rulesets/14350637                                                                                                        | Ruleset 14350637 full JSON                        | live-api          | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 6   | .github/CODEOWNERS                                                                                                                        | CODEOWNERS file content                           | filesystem        | HIGH  | 5/5/5/5/5 | 2026-03-29 |
| 7   | .github/workflows/ci.yml:153                                                                                                              | ci.yml validate job name                          | filesystem        | HIGH  | 5/5/5/5/5 | 2026-03-29 |

---

## Contradictions

**Apparent strict/loose conflict on status checks:** RS1 sets
`strict_required_status_checks_policy: true` and RS2 sets it to `false`. These
conflict on the same rule parameter for the same branch. However, GitHub's
documented aggregation behavior resolves this automatically: the most
restrictive version (strict=true from RS1) wins. This is not a functional
conflict but IS a clarity problem — someone reading RS2 in isolation would
incorrectly believe branches do not need to be up to date. [Source 1]

**CODEOWNERS: exists but not enforced.** The CODEOWNERS file is present and
well-structured, but `require_code_owner_review: false` in the pull_request rule
means it has no enforcement mechanism. The file documents intent but provides no
gate. This is technically consistent (a solo developer cannot self-approve), but
worth documenting as an intentional gap vs oversight.

---

## Gaps

- **Integration ID 15368 identity not confirmed externally.** The
  `integration_id: 15368` in RS2's status check is confirmed to match the
  `Validate & Compliance` job in `ci.yml` via grep (file line 153), but I did
  not independently verify what GitHub app owns integration 15368. GitHub
  Actions built-in checks do not have external integration IDs, so this may be a
  quirk of how the ruleset API reports the GitHub Actions app ID. This does not
  affect the functional analysis.
- **Who created RS2 and why.** RS1 was last updated 2026-03-20 and RS2 was
  created 2026-03-25. It is unclear whether RS2 was created by the developer or
  by an automated tool (Copilot, Dependabot, etc.). The naming difference ("main
  protection" vs "main-protection") and the 5-day gap suggests manual creation.
  No commit history evidence was examined.
- **Semgrep gating:** Semgrep results are not required status checks in either
  ruleset. It is unclear whether this is intentional.

---

## Serendipity

- The repo has a `pattern-compliance-audit.yml` workflow that runs on schedule
  and PRs. This check ("Pattern Compliance Audit") is NOT in either ruleset's
  required status checks. If pattern compliance is critical (it runs
  `patterns:check` per CLAUDE.md), its absence from required checks is a
  potential gap worth flagging separately.
- The `auto-merge-dependabot.yml` workflow exists. With PRs required and status
  checks enforced, Dependabot PRs must pass all 6 checks before auto-merge. The
  bypass actor (RepositoryRole id=5) could theoretically allow Dependabot to
  bypass if it has that role, but this needs verification.

---

## Confidence Assessment

- HIGH claims: 6
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All factual claims are grounded in live API responses, filesystem reads, and
official GitHub documentation. The consolidation recommendation (MEDIUM-HIGH)
involves a design judgment, not a factual dispute.
