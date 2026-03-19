# Review Policy Visual Guide

**Last Updated:** 2026-01-07

---

## Purpose

This document provides **visual diagrams and flowcharts** for the SoNash review
policy. Use it to:

- Visualize the review tier pyramid and decision flows
- Understand PR workflows through diagrams
- Explain the review process to new team members
- Quick visual reference for tier-specific requirements

For full policy details, see
[REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md).

## Quick Start

1. Identify your situation in the decision trees
2. Follow the flowchart path to determine action
3. Reference linked docs for full procedures

## AI Instructions

When using visual guides:

- Start at the top of relevant decision tree
- Follow branches based on your specific situation
- Use linked documentation for detailed steps

---

## Review Tier Pyramid

```text
                    Tier 4: CRITICAL
                  (RFC + All Owners)
                Infrastructure, Schema
              ────────────────────────────
                     Tier 3: HEAVY
                 (AI + 2 Humans + Checklist)
               Auth, Security, Payments, Migrations
          ─────────────────────────────────────────────
                      Tier 2: STANDARD
                    (AI + 1 Human Review)
             Features, Bug Fixes, Component Changes
     ──────────────────────────────────────────────────────────
                       Tier 1: LIGHT
                      (AI Review Only)
          Docs, Tests, UI Copy, Styles, Non-Critical Changes
   ────────────────────────────────────────────────────────────────
                        Tier 0: EXEMPT
                        (Auto-Merge)
             Typos, Comments, Logs, Formatting, Archives
```

**Review Rigor ↑ | Frequency ↓**

---

## PR Lifecycle Flow

```text
┌─────────────────┐
│ Developer       │
│ Creates PR      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Auto-Tier Assignment                │
│ (GitHub Action analyzes files)      │
└────────┬────────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │ Tier?   │
    └─┬───┬───┬───┬───┐
      │   │   │   │   │
   T0 │ T1│ T2│ T3│ T4│
      ▼   ▼   ▼   ▼   ▼
    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐
    │✓│ │AI│ │AI│ │AI│ │RFC│
    └┬┘ └┬┘ └┬┘ └┬┘ └┬┘
     │   │   │   │   │
     │   │   │   │   ▼
     │   │   │   │  ┌──────────┐
     │   │   │   │  │ RFC      │
     │   │   │   │  │ Review   │
     │   │   │   │  └────┬─────┘
     │   │   │   │       │
     │   │   │   ▼       ▼
     │   │   │ ┌────┐ ┌────┐
     │   │   │ │2👤 │ │All │
     │   │   │ │+📋 │ │👤  │
     │   │   │ └──┬─┘ └──┬─┘
     │   │   │    │      │
     │   │   ▼    ▼      ▼
     │   │ ┌────┐┌────┐┌────┐
     │   │ │1👤 ││Pass││Pass│
     │   │ └──┬─┘└──┬─┘└──┬─┘
     │   │    │     │     │
     │   ▼    ▼     ▼     ▼
     │ ┌─────────────────────┐
     │ │   Optional Human    │
     │ │   Review (Tier 1)   │
     │ └──────────┬──────────┘
     │            │
     ▼            ▼
   ┌──────────────────────────┐
   │    All Checks Pass?      │
   └────┬─────────────────┬───┘
        │                 │
      Yes                No
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │ MERGE   │      │ Fix      │
   └─────────┘      │ Issues   │
                    └────┬─────┘
                         │
                         └──────┐
                                ▼
                         (Loop back to checks)
```

---

## Fast-Path Decision Tree

```text
                    ┌─────────────────┐
                    │  PR Submitted   │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Is this Tier 0 or 1? │
                  └──┬────────────────┬──┘
                     │                │
                   Yes              No
                     │                │
                     ▼                └─────────────┐
          ┌──────────────────┐                    │
          │ All CI Checks    │                    │
          │ Pass?            │                    │
          └──┬───────────┬───┘                    │
             │           │                        │
           Yes          No                       │
             │           │                        │
             ▼           └────────┐               │
    ┌────────────────┐           │               │
    │ Any AI         │           │               │
    │ Warnings?      │           │               │
    └──┬──────────┬──┘           │               │
       │          │               │               │
      No         Yes              │               │
       │          │               │               │
       ▼          │               │               │
┌─────────────┐   │               │               │
│ Matches     │   │               │               │
│ Fast-Path   │   │               │               │
│ Pattern?    │   │               │               │
└──┬───────┬──┘   │               │               │
   │       │      │               │               │
  Yes     No      │               │               │
   │       │      │               │               │
   ▼       └──────┼───────────────┼───────────────┤
┌────────────┐    │               │               │
│ AUTO-MERGE │    │               │               │
│ in 4 hours │    │               │               │
└────────────┘    │               │               │
                  └───────────────┴───────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │ STANDARD      │
                          │ REVIEW PATH   │
                          └───────────────┘
```

---

## Escalation Flow

```text
Initial Tier Assignment (by file path)
            │
            ▼
     ┌──────────────┐
     │ Scan File    │
     │ Contents     │
     └──────┬───────┘
            │
            ▼
     ┌──────────────────────┐
     │ Contains Trigger?    │
     │ - eval()             │
     │ - dangerouslyHTML    │
     │ - firebase.auth()    │
     │ - BREAKING CHANGE    │
     └──┬────────────────┬──┘
        │                │
       No               Yes
        │                │
        │                ▼
        │         ┌──────────────┐
        │         │ Escalate     │
        │         │ Tier         │
        │         └──────┬───────┘
        │                │
        ▼                ▼
   ┌────────────────────────┐
   │ Contains Forbidden?    │
   │ - Hardcoded API key    │
   │ - .env file            │
   │ - TODO: SECURITY       │
   └──┬────────────────┬────┘
      │                │
     No               Yes
      │                │
      ▼                ▼
┌──────────┐     ┌──────────┐
│ Proceed  │     │ BLOCK    │
│ with     │     │ MERGE    │
│ Tier     │     └──────────┘
└──────────┘
```

---

## Approval Matrix

```text
┌────────┬──────────┬──────────────┬────────────────┬──────────────┐
│ Tier   │ AI       │ Human        │ Checklist      │ Time to      │
│        │ Review   │ Approvals    │ Required       │ Merge        │
├────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ T0     │ ❌       │ ❌           │ None           │ 4 hours      │
│        │          │              │                │              │
├────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ T1     │ ✅       │ 🟡 Optional  │ None           │ 1-2 days     │
│        │ Surface  │              │                │              │
│        │ scan     │              │                │              │
├────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ T2     │ ✅       │ ✅ 1 human   │ None           │ 2 days       │
│        │ Deep     │              │                │              │
│        │ analysis │              │                │              │
├────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ T3     │ ✅       │ ✅ 2 humans  │ ✅ Security    │ 3-5 days     │
│        │ Exhaustive│ (1 owner)   │ checklist      │              │
│        │ + Multi-AI│             │                │              │
├────────┼──────────┼──────────────┼────────────────┼──────────────┤
│ T4     │ ✅       │ ✅ All owners│ ✅ RFC +       │ 1-2 weeks    │
│        │ Multi-   │ (3+)         │ Security +     │              │
│        │ model    │              │ Deploy plan    │              │
└────────┴──────────┴──────────────┴────────────────┴──────────────┘
```

---

## Batch Review Process

### Before Batching

```text
PR #1: docs update → Review → Merge → 2 hours
PR #2: docs update → Review → Merge → 2 hours
PR #3: docs update → Review → Merge → 2 hours
PR #4: docs update → Review → Merge → 2 hours
PR #5: docs update → Review → Merge → 2 hours
────────────────────────────────────────────────
Total: 10 hours
```

### After Batching

```text
Branch: batch/docs-2026-01-04
  ├─ Commit 1: docs update
  ├─ Commit 2: docs update
  ├─ Commit 3: docs update
  ├─ Commit 4: docs update
  └─ Commit 5: docs update
      │
      ▼
Single PR → Single Review → Merge → 2 hours
────────────────────────────────────────────────
Total: 2 hours (80% time saved)
```

---

## Progressive Trust Model

```text
Developer Journey
─────────────────

PRs 1-5:
┌─────────────────────────────┐
│ Full Review on All PRs      │
│ - Detailed feedback         │
│ - Learning phase            │
└─────────────────────────────┘

PRs 6-20:
┌─────────────────────────────┐
│ Fast-Path Eligible          │
│ - T0/T1: Reduced friction   │
│ - T2+: Standard review      │
└─────────────────────────────┘

PRs 21+:
┌─────────────────────────────┐
│ Trusted Contributor         │
│ - T1: Self-merge allowed    │
│ - T2: 1 approval (vs 2)     │
│ - Can override minor AI     │
└─────────────────────────────┘

Continuous:
┌─────────────────────────────┐
│ Accountability              │
│ - Monthly audit             │
│ - Quality metrics tracked   │
│ - Revert to standard if ⬇️  │
└─────────────────────────────┘
```

---

## Time-Based Audit Schedule

```text
Weekly:
├─ Dependency Audit (Automated - Dependabot)
└─ Fast-path merge audit (spot check)

Bi-Weekly:
└─ Documentation drift scan (AI automated)

Monthly:
├─ Security audit (Multi-AI + Human)
├─ Review effectiveness metrics
├─ Review burden metrics
├─ Developer survey
└─ Review retrospective

Quarterly:
├─ Performance baseline audit
├─ Access control review (Firestore rules)
└─ Process optimization review
```

---

## Incident-Triggered Review Flow

```text
                ┌──────────────────┐
                │ Production       │
                │ Incident Occurs  │
                └────────┬─────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │ Immediate Hotfix (Tier 3   │
        │ fast-track, <4h approval)  │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Post-Mortem (24h)          │
        │ - Root cause analysis      │
        │ - Identify related code    │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Deep Review Schedule       │
        │ (Tier 4 review of related  │
        │ code areas, 1 week)        │
        └────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────────────┐
        │ Process Improvement        │
        │ - Update docs              │
        │ - Add to learnings log     │
        │ - Prevent recurrence       │
        └────────────────────────────┘
```

---

## Review Metrics Dashboard (Conceptual)

```text
┌────────────────────────────────────────────────────┐
│ Review Quality Metrics                             │
├────────────────────────────────────────────────────┤
│ Bugs caught in review:     ████████░░ 78% ✅      │
│ Bugs escaped to prod:      ██░░░░░░░░  3/mo ✅    │
│ Security issues caught:    ██████████ 100% ✅     │
│ AI suggestion accept rate: ███████░░░ 72% ✅      │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Review Efficiency Metrics                          │
├────────────────────────────────────────────────────┤
│ Time to first review:      ████░░░░░░ 18h ✅      │
│ Time to merge (T1-T2):     ██████░░░░ 36h ✅      │
│ Review iterations:         ███░░░░░░░ 2.3 ✅      │
│ Auto-merge rate:           ██████████ 45% ✅      │
│ Fast-path usage:           ████████░░ 38% ✅      │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Tier Accuracy Metrics                              │
├────────────────────────────────────────────────────┤
│ Tier escalations:          ██░░░░░░░░  8% ✅      │
│ Tier de-escalations:       █░░░░░░░░░  3% ✅      │
│ Misclassified PRs:         █░░░░░░░░░  2% ✅      │
└────────────────────────────────────────────────────┘
```

---

## Common Scenarios Flowchart

### Scenario 1: "I fixed a typo in README"

```text
┌────────────┐
│ Fix typo   │
│ in README  │
└─────┬──────┘
      │
      ▼
┌──────────────┐    ┌────────────┐
│ Commit       ├───→│ Tier 0     │
└──────┬───────┘    └────────────┘
       │
       ▼
┌──────────────┐
│ CI checks    │
│ pass         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Auto-merge   │
│ in 4 hours   │
└──────────────┘

Time: 4 hours total
```

### Scenario 2: "I added a new feature component"

```text
┌────────────┐
│ New React  │
│ component  │
└─────┬──────┘
      │
      ▼
┌──────────────┐    ┌────────────┐
│ Create PR    ├───→│ Tier 2     │
└──────┬───────┘    └────────────┘
       │
       ▼
┌──────────────┐
│ AI reviews   │
│ (CodeRabbit) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Address      │
│ AI issues    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Request 1    │
│ human review │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Approval +   │
│ Merge        │
└──────────────┘

Time: 1-2 days
```

### Scenario 3: "I changed authentication flow"

```text
┌────────────┐
│ Modify     │
│ auth code  │
└─────┬──────┘
      │
      ▼
┌──────────────┐    ┌────────────┐
│ Create PR    ├───→│ Tier 3     │
└──────┬───────┘    └────────────┘
       │
       ▼
┌──────────────┐
│ Multi-AI     │
│ exhaustive   │
│ review       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Complete     │
│ security     │
│ checklist    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Get 2 human  │
│ approvals    │
│ (1 owner)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ All checks   │
│ pass, merge  │
└──────────────┘

Time: 3-5 days
```

---

## Related Documents

- **Full Policy:**
  [REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md)
- **Quick Reference:**
  [REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md)
- **Security Standards:**
  [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md)

---

## Version History

| Version | Date       | Changes                                                                                |
| ------- | ---------- | -------------------------------------------------------------------------------------- |
| 1.1     | 2026-01-07 | Added Purpose and Version History sections for documentation standards compliance      |
| 1.0     | 2026-01-04 | Initial visual guide creation with tier pyramid, decision trees, and workflow diagrams |

---

**Tip:** Use these diagrams in team onboarding and when explaining review
process.
