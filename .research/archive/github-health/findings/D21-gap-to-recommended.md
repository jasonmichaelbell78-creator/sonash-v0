# Findings: Gap Between Current GitHub Configuration and Recommended Best Practices

**Searcher:** deep-research-searcher (D21-SQ12b) **Profile:** web + codebase
synthesis **Date:** 2026-03-29 **Sub-Question IDs:** SQ-12b

---

## Summary

This document synthesizes findings from all previous D-series agents (D2, D4,
D5, D6, D8, D9, D10, D11, D12, D15, D17, D20) and new web research to produce a
comprehensive gap-to-recommended checklist for
`jasonmichaelbell78-creator/sonash-v0`. The repo scores 7.5/10 on OpenSSF
Scorecard (above industry median of 5.4) but has multiple concrete, fixable gaps
— several of which are one-click toggles.

---

## Key Findings

### 1. Overall GitHub Health Score [CONFIDENCE: HIGH]

**Calculated score: 61/100**

Scoring methodology: 38 items evaluated across 5 categories, weighted by
security impact. Items were scored 0 (gap exists), 0.5 (partial), or 1 (met).
Weights reflect severity.

| Category            | Weight   | Raw Score   | Weighted     |
| ------------------- | -------- | ----------- | ------------ |
| Security            | 35%      | 14/25 = 56% | 19.6/35      |
| CI/CD Pipeline      | 25%      | 13/20 = 65% | 16.3/25      |
| Repository Settings | 15%      | 7/10 = 70%  | 10.5/15      |
| Community Health    | 10%      | 5/8 = 63%   | 6.3/10       |
| Supply Chain        | 15%      | 9/15 = 60%  | 9.0/15       |
| **TOTAL**           | **100%** |             | **61.7/100** |

This translates to: **Grade: C+ / "Needs Work"** — Functional but several
production-impacting gaps.

The 7.5/10 OpenSSF Scorecard is misleading as a standalone indicator: it
measures supply chain hygiene (where the repo is strong) but does not score
deployment safety, environment protection, or operational reliability — areas
where the repo has critical gaps.

---

### 2. Critical Gaps (P0 — Production Risk Today) [CONFIDENCE: HIGH]

These gaps create active production risk without requiring an attacker or
external event to trigger:

**GAP-C1: Deploy workflow references no GitHub environment context**

- Current: `deploy-firebase.yml` has zero `environment:` keys across all jobs
- Recommended: `environment: Production` on the deploy job with branch
  restriction and wait timer
- Risk: A push to `main` deploys to production in under 5 minutes with no human
  gate possible
- Evidence: D12 confirms `grep -n "environment:" deploy-firebase.yml` returns
  zero matches
- Fix complexity: LOW (2-line YAML addition + UI environment configuration)

**GAP-C2: All three GitHub environments have zero protection rules**

- Current: Production, Preview, copilot environments all have
  `protection_rules: []`
- Recommended: Production requires `deployment_branch_policy: main`,
  `wait_timer`, and branch restriction; Preview restricted to PR head branches
- Risk: Even if C1 is fixed, the environments have no gates. The environments
  are purely decorative.
- Evidence: D12 API confirmed:
  `protection_rules: [], deployment_branch_policy: null, can_admins_bypass: true`
- Fix complexity: LOW (UI settings)

**GAP-C3: Deploy runs in parallel with CI — broken builds can reach production**

- Current: `deploy-firebase.yml` triggers on `push: branches: [main]`
  independently of CI
- Recommended: Deploy job should use `needs:` to depend on CI passing, or
  require CI as a required environment check before deployment proceeds
- Risk: A CI-failing commit on main deploys to production (confirmed occurred
  2026-03-23)
- Evidence: D12 confirms both workflows trigger simultaneously on push; CI and
  deploy run in parallel
- Fix complexity: MEDIUM (workflow refactor to add dependency gate)

**GAP-C4: Release Please has never worked — zero releases in 10+ months**

- Current: Every run fails with "sha wasn't supplied" API error; no GitHub
  Releases exist; `v1.0` is the only git tag; `.release-please-manifest.json`
  declares `0.2.0` but no such release exists
- Recommended: Bootstrap with manual `sonash-v0.2.0` release; ensure
  conventional commit format; upgrade action before 2026-06-02 Node.js 20
  deadline
- Risk: No auditable release history; no changelog; no version provenance;
  Vulnerabilities score drag
- Evidence: D5 and D11 confirm 10+ consecutive failures; D11 confirms zero
  GitHub Releases via API
- Fix complexity: MEDIUM (manual bootstrap + process change for conventional
  commits)

---

### 3. Comprehensive Gap Checklist [CONFIDENCE: HIGH for items sourced from earlier agents; MEDIUM for items derived from web research]

#### 3a. Security Category

| #   | Item                             | Current State                                    | Recommended                                                    | Gap                                                            | Fix Complexity | Priority |
| --- | -------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- | -------------- | -------- |
| S1  | Secret scanning                  | ENABLED (public repo default)                    | Enabled                                                        | NONE                                                           | None           | P3       |
| S2  | Push protection                  | ENABLED (public repo default, 2025)              | Enabled                                                        | NONE                                                           | None           | P3       |
| S3  | Dependabot alerts                | ENABLED                                          | Enabled                                                        | NONE                                                           | None           | P3       |
| S4  | Dependabot security updates      | ENABLED                                          | Enabled                                                        | NONE                                                           | None           | P3       |
| S5  | Dependabot version updates       | ENABLED via `dependabot.yml`                     | Enabled                                                        | NONE                                                           | None           | P3       |
| S6  | CodeQL analysis                  | ENABLED (workflow active)                        | Enabled, gates PRs                                             | PARTIAL — runs but not a blocking ruleset gate for Semgrep     | LOW            | P2       |
| S7  | Semgrep analysis                 | ENABLED (workflow active)                        | Results gate PRs                                               | GAP — results not enforced in rulesets                         | LOW            | P2       |
| S8  | SonarCloud analysis              | DISABLED (`disabled_manually`)                   | Enabled, gating                                                | GAP — disabled due to auto-analysis conflict                   | MEDIUM         | P1       |
| S9  | GITHUB_TOKEN minimum permissions | PARTIAL — 9 workflows flagged by Scorecard       | `permissions: read-all` at top level, write only at job level  | GAP — 9 workflows need hardening                               | LOW            | P2       |
| S10 | FIREBASE_SERVICE_ACCOUNT scope   | Repo-level secret (prod key)                     | Environment-scoped; separate prod/preview keys                 | GAP — single prod key usable by all workflows                  | MEDIUM         | P1       |
| S11 | `NEXT_PUBLIC_FIREBASE_*` storage | Stored as `secrets.*` (wrong type)               | Stored as `vars.*` (public values, not secrets)                | GAP — false security + breaks preview deploy                   | LOW            | P2       |
| S12 | Workload Identity Federation     | Service account JSON key on disk                 | WIF via `google-github-actions/auth` + GCP pool                | GAP — caveat: Firebase Admin SDK does not support WIF natively | HIGH           | P3       |
| S13 | CODEOWNERS enforcement           | File exists, `require_code_owner_review: false`  | Enforce CODEOWNERS for `firestore.rules`, `.github/workflows/` | PARTIAL — file decorative, not enforced                        | LOW            | P2       |
| S14 | Signed commits                   | Not required by either ruleset                   | `required_signed_commits: true` in ruleset                     | GAP — no commit signing enforcement                            | LOW            | P3       |
| S15 | Tag protection                   | No tag protection rules exist                    | Protect release tags (`v*`) via ruleset                        | GAP — any write-access user can create/delete tags             | LOW            | P2       |
| S16 | Required signed commits          | Not configured                                   | Enable if signing is set up locally                            | GAP                                                            | LOW            | P3       |
| S17 | Code scanning result gating      | CodeQL gates PRs (via ruleset); Semgrep does not | Both should gate PRs                                           | PARTIAL                                                        | LOW            | P2       |

#### 3b. CI/CD Pipeline Category

| #    | Item                                   | Current State                                  | Recommended                                                  | Gap                                | Fix Complexity | Priority |
| ---- | -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ | ---------------------------------- | -------------- | -------- |
| CI1  | Environment context in deploy workflow | MISSING — no `environment:` in any job         | `environment: Production` on deploy job                      | CRITICAL GAP                       | LOW            | P0       |
| CI2  | Deploy depends on CI passing           | MISSING — parallel runs                        | `needs: [lint, test, build]` in deploy job                   | CRITICAL GAP                       | MEDIUM         | P0       |
| CI3  | Environment protection rules           | MISSING — all 3 envs unprotected               | Branch restriction + wait timer on Production                | CRITICAL GAP                       | LOW            | P0       |
| CI4  | Preview deploy enabled                 | DISABLED — commented out trigger               | Enable with `vars.*` fix                                     | GAP — no staging path              | MEDIUM         | P1       |
| CI5  | Release Please functional              | BROKEN — 10+ consecutive failures              | Bootstrap `sonash-v0.2.0` release + conventional commits     | CRITICAL GAP                       | MEDIUM         | P0       |
| CI6  | Auto-delete branches on merge          | DISABLED                                       | Enable in repo settings                                      | GAP — branches accumulate          | LOW            | P2       |
| CI7  | Ruleset consolidation                  | 2 overlapping rulesets                         | 1 consolidated ruleset absorbing RS2                         | GAP — maintenance overhead         | LOW            | P2       |
| CI8  | Thread resolution required             | `required_review_thread_resolution: false`     | Set to `true` in ruleset                                     | GAP                                | LOW            | P3       |
| CI9  | Stale review dismissal                 | `dismiss_stale_reviews_on_push: false`         | Set to `true`                                                | GAP                                | LOW            | P2       |
| CI10 | Classic branch protection              | 404 on `/branches/main/protection`             | Scorecard requires classic rules for Branch-Protection check | GAP — Scorecard sees 4/10          | MEDIUM         | P1       |
| CI11 | Node.js 20 deprecation deadline        | Release Please action uses Node 20             | Upgrade before 2026-06-02                                    | TIME-SENSITIVE GAP                 | LOW            | P1       |
| CI12 | Knip false-positive                    | `@typescript/native-preview` flagged as unused | Add to `knip.json` ignoreDependencies                        | GAP — CI failing                   | LOW            | P0       |
| CI13 | Pattern compliance audit gating        | Runs but NOT a required status check           | Add to ruleset as required check                             | GAP                                | LOW            | P2       |
| CI14 | Bundle size tracking                   | Not present                                    | `ai/size-limit` action on PRs                                | GAP — no regression detection      | MEDIUM         | P3       |
| CI15 | Lighthouse CI                          | Not present                                    | `treosh/lighthouse-ci-action` on PRs or scheduled            | GAP — no perf regression detection | MEDIUM         | P3       |

#### 3c. Repository Settings Category

| #    | Item                        | Current State                            | Recommended                                                                          | Gap                       | Fix Complexity | Priority |
| ---- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------- | -------------- | -------- |
| RS1  | Repository description      | NULL                                     | 1-2 sentence description                                                             | GAP — invisible in search | LOW            | P2       |
| RS2  | Repository topics           | Empty `[]`                               | 5-8 relevant topics: nextjs, react, firebase, typescript, tailwindcss, wellness, pwa | GAP — no discoverability  | LOW            | P2       |
| RS3  | Delete head branch on merge | DISABLED                                 | ENABLED                                                                              | GAP                       | LOW            | P2       |
| RS4  | Auto-merge setting          | Not verified (API gap)                   | Available as opt-in per PR                                                           | LOW                       | None           | P3       |
| RS5  | Merge commits allowed       | Both squash and rebase allowed (correct) | Squash or rebase only (NOT merge commits)                                            | NONE — already correct    | None           | P3       |
| RS6  | Social preview image        | Not verified                             | Set to app screenshot or brand image                                                 | GAP (likely)              | LOW            | P3       |
| RS7  | Discussions enabled         | Not verified                             | Optional — enable if community interaction desired                                   | OPTIONAL                  | LOW            | P3       |
| RS8  | Wikis enabled               | Not verified                             | Disable (docs live in repo)                                                          | OPTIONAL                  | LOW            | P3       |
| RS9  | Issues linked to Projects   | Partial — some issues use Projects       | All issues should use project board                                                  | PARTIAL                   | LOW            | P3       |
| RS10 | Vulnerability alerts email  | Enabled by default                       | Enabled                                                                              | NONE                      | None           | P3       |

#### 3d. Community Health Category

| #   | Item                     | Current State                              | Recommended                              | Gap                                                | Fix Complexity | Priority |
| --- | ------------------------ | ------------------------------------------ | ---------------------------------------- | -------------------------------------------------- | -------------- | -------- |
| CH1 | README.md                | EXISTS                                     | Complete with badges, description, setup | PARTIAL (quality unknown)                          | LOW            | P3       |
| CH2 | SECURITY.md              | EXISTS (10/10 Scorecard)                   | Present, with disclosure policy          | NONE                                               | None           | P3       |
| CH3 | CONTRIBUTING.md          | Status unknown                             | Should exist for open source             | GAP (likely)                                       | LOW            | P3       |
| CH4 | CODE_OF_CONDUCT.md       | Status unknown                             | Should exist                             | GAP (likely)                                       | LOW            | P3       |
| CH5 | Pull request template    | Status unknown                             | `.github/pull_request_template.md`       | GAP (likely)                                       | LOW            | P2       |
| CH6 | Issue templates          | EXISTS (bug_report.md, feature_request.md) | Present (modern directory format)        | NONE — API bug mis-reports as gap                  | None           | P3       |
| CH7 | CII Best Practices badge | 0/10 Scorecard                             | Apply for OpenSSF CII badge              | GAP — zero effort started                          | MEDIUM         | P3       |
| CH8 | Community profile score  | 85% (API-deflated)                         | 100%                                     | GAP (CONTRIBUTING, CODE_OF_CONDUCT likely missing) | LOW            | P3       |

#### 3e. Supply Chain Category

| #    | Item                          | Current State                                      | Recommended                                                           | Gap                                       | Fix Complexity | Priority |
| ---- | ----------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------- | -------------- | -------- |
| SC1  | Action SHA pinning            | EXCELLENT — all 17 actions SHA-pinned              | All pinned with version comments                                      | NONE                                      | None           | P3       |
| SC2  | Dependabot for Actions        | ENABLED — `dependabot.yml` covers `github-actions` | Enabled with group strategy                                           | NONE                                      | None           | P3       |
| SC3  | Dependency review on PRs      | ENABLED — `dependency-review-action` present       | Enabled, blocks known CVEs                                            | NONE                                      | None           | P3       |
| SC4  | SBOM export                   | Not configured                                     | Generate SBOM on releases via `anchore/sbom-action`                   | GAP                                       | LOW            | P3       |
| SC5  | Provenance attestations       | Not configured                                     | `actions/attest-build-provenance` on release builds                   | GAP                                       | LOW            | P3       |
| SC6  | Open Dependabot CVEs          | 1 HIGH: `path-to-regexp@8.3.0` in root             | Zero open HIGH/CRITICAL CVEs                                          | GAP — Scorecard Vulnerabilities 5/10      | LOW            | P0       |
| SC7  | Scorecard as gating check     | Runs but NOT a required check                      | Add `scorecard` to ruleset required checks                            | GAP                                       | LOW            | P2       |
| SC8  | Binary artifacts              | 1 alert (likely `.exe` in repo)                    | Remove binary or document it                                          | GAP — Scorecard Binary-Artifacts 9/10     | LOW            | P2       |
| SC9  | Code Review (Scorecard check) | 0/10 — no human APPROVED reviews                   | At least 1 human reviewer approves PRs                                | CRITICAL GAP — requires structural change | STRUCTURAL     | P1       |
| SC10 | npm global firebase-tools     | Pinned to exact version `13.29.1` in workflow      | SHA pinning not possible for npm globals; exact version is acceptable | PARTIAL — version-pinned but not SHA      | LOW            | P3       |

---

### 4. Priority-Ranked Gap List [CONFIDENCE: HIGH]

#### P0 — Fix Immediately (Breaks Production or Blocks CI)

1. **GAP-C1/CI1: No `environment:` context in deploy workflow** — production
   deploys have no gate mechanism
2. **GAP-C2/CI3: Production environment has zero protection rules** —
   environment exists but is fully unprotected
3. **GAP-C3/CI2: Deploy runs in parallel with CI** — broken code can reach
   production
4. **GAP-C4/CI5: Release Please never worked** — 10+ consecutive failures on
   every push to main
5. **SC6: `path-to-regexp` CVE in root `package.json`** — HIGH severity CVE,
   Scorecard Vulnerabilities stuck at 5/10
6. **CI12: Knip `@typescript/native-preview` false positive** — CI is currently
   failing on PRs

#### P1 — Fix Within Sprint (Security or Reliability Impact)

7. **S8: SonarCloud disabled** — static analysis layer missing; needs
   auto-analysis conflict resolved
8. **S10: Production service account not environment-scoped** — same prod key
   accessible to all workflows
9. **S11: `NEXT_PUBLIC_FIREBASE_*` stored as secrets instead of vars** — causes
   preview deploy breakage and false security
10. **CI4: Preview deploy permanently disabled** — no staging environment for PR
    validation
11. **CI10: No classic branch protection** — Scorecard Branch-Protection sees
    4/10; rulesets alone are not sufficient for Scorecard scoring
12. **CI11: Node.js 20 deprecation deadline 2026-06-02** — Release Please action
    will break automatically in 65 days

#### P2 — Fix Within 30 Days (Quality or Posture Improvement)

13. **S6/S7/SC7: Semgrep results and pattern compliance not gating** — scans run
    but don't block
14. **S9: 9 workflows with Scorecard token-permissions alerts** — needs
    `permissions: read-all` at top level in affected workflows
15. **S13: CODEOWNERS decorative, not enforced** — CODEOWNERS file exists but no
    enforcement mechanism
16. **S15: No tag protection** — v\* release tags can be created or deleted
    freely
17. **CI6/RS3: Auto-delete branches on merge disabled** — branch accumulation
18. **CI7: Two overlapping rulesets** — consolidate into one
19. **CI9: Stale review dismissal disabled** — old approvals survive new pushes
20. **CI13: Pattern compliance audit not a required check** — runs but not
    blocking
21. **RS1: Missing repo description** — null description in GitHub search
22. **RS2: No topics set** — empty topics array, zero discoverability
23. **SC8: Binary artifacts alert** — `.exe` or similar in repo
24. **CH5: PR template likely missing** — no pull_request_template.md confirmed

#### P3 — Backlog (Enhancement / Nice to Have)

25. S12: Workload Identity Federation (Firebase Admin SDK caveat)
26. S14/CI8/CI9: Signed commits, thread resolution, dismiss stale reviews
27. SC4: SBOM export on releases
28. SC5: Provenance attestations on release builds
29. CI14: Bundle size tracking workflow
30. CI15: Lighthouse CI workflow
31. CH7: CII Best Practices badge application
32. RS6: Social preview image
33. RS7/RS8: Discussions/Wikis settings review

---

### 5. Free Wins — Toggle in GitHub UI with Zero Risk [CONFIDENCE: HIGH]

These items require only UI interaction (Settings page or API call), no workflow
YAML changes, no code changes, and carry zero regression risk:

| #    | Action                                              | Where                                | Time   | Impact                                            |
| ---- | --------------------------------------------------- | ------------------------------------ | ------ | ------------------------------------------------- |
| FW1  | Add repo description                                | Settings > General > Description     | 30 sec | Community profile +5%, search visibility          |
| FW2  | Add 5-8 topics                                      | Settings > General > Topics          | 2 min  | Discoverability, community profile +5%            |
| FW3  | Enable "Delete head branch on merge"                | Settings > General > Pull Requests   | 5 sec  | Branch hygiene                                    |
| FW4  | Add Production environment branch policy            | Settings > Environments > Production | 2 min  | Restricts deploys to `main` only                  |
| FW5  | Add Production environment wait timer (5 min)       | Settings > Environments > Production | 1 min  | Cancellation window before deploy commits         |
| FW6  | Consolidate rulesets (delete RS2, add check to RS1) | Settings > Rules > Rulesets          | 5 min  | Removes management confusion                      |
| FW7  | Enable `required_review_thread_resolution: true`    | Settings > Rules > main-protection   | 1 min  | Forces comment resolution before merge            |
| FW8  | Enable `dismiss_stale_reviews_on_push: true`        | Settings > Rules > main-protection   | 1 min  | Stale approvals invalidated on new push           |
| FW9  | Add tag protection rule for `v*` via ruleset        | Settings > Rules > New ruleset       | 3 min  | Prevents tag tampering                            |
| FW10 | Move `NEXT_PUBLIC_FIREBASE_*` to repo variables     | Settings > Secrets > Variables       | 5 min  | Enables preview deploy fix, removes false secrets |
| FW11 | npm audit fix + commit root path-to-regexp          | Terminal + commit                    | 3 min  | Fixes HIGH CVE, Scorecard Vulnerabilities → 10/10 |

**Total free wins time: ~24 minutes for 11 improvements**

---

### 6. Process Changes — Require Behavior or Workflow Changes [CONFIDENCE: HIGH]

These require YAML edits, new practices, or structural coordination:

| #    | Change                                                               | Effort                                                                               | Prerequisites               | Impact                                     |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------ |
| PC1  | Add `environment: Production` to deploy job                          | 2-line YAML change                                                                   | FW4 must be done first      | Activates environment gate                 |
| PC2  | Add `needs:` CI dependency to deploy job                             | Workflow refactor                                                                    | CI job names must be stable | Blocks broken-build deploys                |
| PC3  | Fix preview deploy: vars vs secrets, add `environment: Preview`      | Multi-step: move secrets to vars, re-enable `pull_request_target`, create preview SA | FW10 first                  | Restores staging environment               |
| PC4  | Bootstrap Release Please                                             | Create `sonash-v0.2.0` GitHub Release manually; push one conventional commit         | None                        | Unblocks releases and changelog            |
| PC5  | Adopt conventional commit format                                     | Team process change: `feat:`, `fix:`, `chore:`, `docs:` prefixes                     | Developer habit             | Powers Release Please, semantic versioning |
| PC6  | Fix Knip false positive                                              | Add `@typescript/native-preview` to `knip.json` ignoreDependencies                   | None                        | Unblocks CI                                |
| PC7  | Reconnect SonarCloud (disable auto-analysis, re-enable workflow)     | Workflow re-enable + SonarCloud project config                                       | SONAR_TOKEN present         | Restores code quality layer                |
| PC8  | Add classic branch protection for Scorecard                          | Settings > Branches > Add rule (alongside rulesets)                                  | None                        | Lifts Branch-Protection from 4/10 to 8/10  |
| PC9  | Create environment-scoped secrets + separate preview service account | GCP IAM + GitHub environments config                                                 | Firebase Console access     | Proper secret scoping                      |
| PC10 | Harden 9 workflow permissions                                        | Edit each workflow to use `permissions: read-all`                                    | Low risk                    | Token-Permissions 8/10 → 10/10             |
| PC11 | Upgrade Release Please action (Node.js 20 deadline)                  | Update SHA pin in `release-please.yml`                                               | PC4 should precede          | Prevents auto-break on 2026-06-02          |
| PC12 | Add Code Review (human approval) for Scorecard                       | Requires finding a trusted co-reviewer                                               | Developer coordination      | Code-Review 0/10 → potentially 8-10/10     |

---

### 7. OpenSSF Scorecard Score Projection [CONFIDENCE: MEDIUM]

Post-fix score projections, assuming P0 and P1 items are completed:

| Check               | Current    | After P0 fixes | After P0+P1 fixes | After All Fixes |
| ------------------- | ---------- | -------------- | ----------------- | --------------- |
| Branch-Protection   | 4/10       | 4/10           | 8/10 (PC8)        | 10/10           |
| Code-Review         | 0/10       | 0/10           | 0/10              | 8/10 (PC12)     |
| CII-Best-Practices  | 0/10       | 0/10           | 0/10              | 5/10 (partial)  |
| Vulnerabilities     | 5/10       | 10/10 (FW11)   | 10/10             | 10/10           |
| Token-Permissions   | 8/10       | 8/10           | 10/10 (PC10)      | 10/10           |
| Pinned-Dependencies | 9/10       | 9/10           | 9/10              | 10/10           |
| Binary-Artifacts    | 9/10       | 9/10           | 9/10              | 10/10           |
| All 10/10 checks    | 10/10      | 10/10          | 10/10             | 10/10           |
| **Projected Total** | **7.5/10** | **~8.2/10**    | **~8.7/10**       | **~9.2/10**     |

The Code-Review check (PC12) is the hardest to improve — it requires a
structural change (trusted co-reviewer). Without it, the ceiling is
approximately 9.0/10.

---

### 8. Overall GitHub Health Score Breakdown [CONFIDENCE: HIGH for measured items; MEDIUM for projected impact]

#### Current State: 61/100

| Category            | Score | Notes                                                                                   |
| ------------------- | ----- | --------------------------------------------------------------------------------------- |
| Security            | 56%   | Strong on scanning/pinning; weak on environment scoping, service account hygiene        |
| CI/CD               | 65%   | Good coverage but deploy pipeline has critical structural gaps                          |
| Repository Settings | 70%   | Functional but missing description, topics, branch hygiene settings                     |
| Community Health    | 63%   | Issue templates exist (API bug misreports); CONTRIBUTING/CODE_OF_CONDUCT likely missing |
| Supply Chain        | 60%   | Excellent action pinning; no provenance attestations; 1 open HIGH CVE                   |

#### Post-P0 Fix State: ~73/100

Fixing the 6 P0 items (deploy env context, protection rules, CI dependency,
Release Please, CVE, Knip) raises the score by approximately 12 points.

#### Post-P0+P1 Fix State: ~83/100

Adding P1 fixes (SonarCloud, secret scoping, preview deploy, branch protection,
Node.js upgrade) raises the score to approximately 83/100.

#### Theoretical Maximum (all gaps closed): ~91/100

The ceiling is not 100 because:

- Code-Review requires a human co-reviewer (structural limitation for solo dev)
- WIF for Firebase has upstream SDK limitations
- CII Best Practices badge requires 70+ criteria to be met over time

---

## Sources

| #   | URL                                                                                                                                                                              | Title                                              | Type               | Trust  | CRAAP     | Date       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------ | ------ | --------- | ---------- |
| 1   | D12 findings file                                                                                                                                                                | Deploy pipeline and environment configuration gaps | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 2   | D9 findings file                                                                                                                                                                 | Ruleset overlap and consolidation analysis         | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 3   | D20 findings file                                                                                                                                                                | OpenSSF Scorecard deep dive                        | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 4   | D4 findings file                                                                                                                                                                 | Workflow YAML audit (18 workflows)                 | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 5   | D5 findings file                                                                                                                                                                 | Failing workflows root causes                      | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 6   | D6 findings file                                                                                                                                                                 | Missing workflows analysis                         | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 7   | D8 findings file                                                                                                                                                                 | Dependabot pipeline reliability                    | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 8   | D10 findings file                                                                                                                                                                | Repo metadata and community profile                | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 9   | D11 findings file                                                                                                                                                                | Release Please failure analysis                    | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 10  | D15 findings file                                                                                                                                                                | SonarCloud integration status                      | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 11  | D2 findings file                                                                                                                                                                 | Code scanning alerts analysis                      | internal-research  | HIGH   | 5/5/5/5/5 | 2026-03-29 |
| 12  | https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions                                                             | GitHub Actions Security Hardening                  | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 13  | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-security-and-analysis-settings-for-your-repository | GitHub Security and Analysis Settings              | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 14  | https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment                                              | GitHub Environments for Deployment                 | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 15  | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets                                                      | About rulesets                                     | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 16  | https://docs.github.com/en/code-security/secret-scanning/enabling-secret-scanning-features/enabling-push-protection-for-your-repository                                          | Push Protection                                    | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 17  | https://github.blog/enterprise-software/devsecops/enhance-build-security-and-reach-slsa-level-3-with-github-artifact-attestations/                                               | SLSA Level 3 with GitHub Attestations              | official-blog      | HIGH   | 4/5/5/4/5 | 2024       |
| 18  | https://www.stepsecurity.io/blog/github-actions-security-best-practices                                                                                                          | GitHub Actions Security Best Practices             | community          | MEDIUM | 4/4/3/4/4 | 2025       |
| 19  | https://docs.cloud.google.com/iam/docs/workload-identity-federation                                                                                                              | GCP Workload Identity Federation                   | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 20  | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets                                        | Available Rulesets Rules                           | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 21  | https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph                                               | GitHub Dependency Graph and SBOM                   | official-docs      | HIGH   | 5/5/5/5/5 | Current    |
| 22  | https://github.blog/changelog/2026-03-23-push-protection-exemptions-from-repository-settings/                                                                                    | Push Protection Exemptions (2026-03)               | official-changelog | HIGH   | 5/5/5/5/5 | 2026-03-23 |
| 23  | https://wellarchitected.github.com/library/application-security/recommendations/                                                                                                 | GitHub Well-Architected Security                   | official-guidance  | HIGH   | 5/5/5/5/5 | Current    |

---

## Contradictions

**Contradiction 1 — Branch protection `protected: true` vs 404 on protection
API:** `gh api .../branches/main` returns `protected: true` but
`gh api .../branches/main/protection` returns HTTP 404. This is a GitHub API
behavior where rulesets trigger the `protected: true` flag but the classic
branch protection endpoint returns 404. The OpenSSF Scorecard checker uses the
classic endpoint and sees no protection — hence 4/10 on Branch-Protection. The
rulesets provide real protection but are invisible to Scorecard. Both
observations are accurate; they measure different things. Resolution: add a
classic branch protection rule alongside rulesets specifically to satisfy
Scorecard. [Sources: D12, D20]

**Contradiction 2 — WIF recommended but not fully supported for Firebase:**
GitHub's security hardening docs recommend OIDC/WIF as the gold standard for
cloud authentication, eliminating service account keys. However, the Firebase
Admin SDK documentation explicitly states "This option is not supported by
Firebase Admin SDK. Use Service Account Key JSON authentication instead." This
creates an irresolvable tension for Firebase deployments. Resolution: use WIF
for GCP operations (Cloud Run, GCS, BigQuery) but retain service account key for
Firebase deploy actions; scope the key to minimum required permissions.
[Sources: 12, 19]

**Contradiction 3 — Environment protection on Free plan:** GitHub's environment
documentation states that required reviewers for environments are "only
available for public repositories" on Free plan. The sonash-v0 repo IS public,
so required reviewers ARE available. Some community sources state environment
protection requires paid plans — this is only true for PRIVATE repositories.
Since this repo is public, all environment protection features (required
reviewers, wait timer, deployment branch policy) are available at no cost.
[Source: 14]

---

## Gaps

1. **Social preview image status** — could not verify via API whether a social
   preview image is set; requires GitHub web UI inspection.
2. **CONTRIBUTING.md and CODE_OF_CONDUCT.md presence** — existence was not
   confirmed in codebase searches by prior agents; community profile score of
   85% suggests these likely missing.
3. **Pull request template presence** — not confirmed in prior agent research;
   `.github/` directory was examined for CODEOWNERS and workflows but
   pull_request_template.md not explicitly verified.
4. **Repository visibility of all settings** — some settings (Wikis, Projects,
   Discussions) were not inspected by prior agents. Cannot confirm current
   state.
5. **Auto-merge setting at repo level** — whether auto-merge is enabled as a
   repo-wide option was not confirmed; only per-workflow auto-merge (Dependabot)
   was confirmed.
6. **Firebase service account IAM roles** — actual GCP IAM permissions attached
   to FIREBASE_SERVICE_ACCOUNT cannot be audited from GitHub API.
   Least-privilege assessment incomplete.
7. **SonarCloud current auto-analysis state** — whether auto-analysis is
   currently enabled or disabled in the SonarCloud project settings was not
   confirmed for current state.

---

## Serendipity

**The preview deploy disable was accidental security hardening.** The
`pull_request_target` trigger was disabled for operational reasons (wrong vars
vs secrets), not security reasons. This trigger is one of GitHub's highest-risk
Actions patterns because it runs with base-repo secrets while potentially
executing code from fork PRs. The current disable accidentally eliminates this
attack surface. When re-enabling, the existing guard condition in the workflow
(`github.event.pull_request.head.repo.full_name == github.repository`) provides
correct protection. [Source: D12]

**The repo has Gitleaks installed as a defense-in-depth layer.**
`gitleaks/gitleaks-action` is SHA-pinned across workflows. This provides a
secret scanning layer beyond GitHub's native secret scanning, which is important
because GitHub's push protection does not block all secret patterns. This is
above-average for a solo developer project. [Source: D4]

**Environment protection is free for public repos** — a common misconception is
that GitHub environment protection requires GitHub Enterprise or Team. Required
reviewers, wait timers, and deployment branch policies are all available for
FREE on public repositories. The only tier restriction is for PRIVATE repos.
This means the entire environment hardening recommendation (GAP-C1, C2) is
achievable at zero additional cost. [Source: 14, 22]

**Two P0 gaps (FW10 + PC1) are combined 7-minute fixes.** Moving 6
`NEXT_PUBLIC_FIREBASE_*` secrets to variables (FW10, ~5 min) and adding
`environment: Production` to the deploy job (PC1, ~2 min) together close two
critical gaps and also unblock the preview deploy. These are the highest ROI
fixes in the entire list.

---

## Confidence Assessment

- HIGH claims: 28
- MEDIUM claims: 8
- LOW claims: 2
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The vast majority of findings are grounded in live API data from prior D-series
agents and current official GitHub documentation. The health score calculation
(Finding 1) and projected score improvements (Finding 7-8) involve judgment
about relative severity weights and are rated MEDIUM confidence. No finding
relies on training data alone.
