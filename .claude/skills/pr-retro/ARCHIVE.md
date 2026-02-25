# PR Retro Skill -- Archive

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Archived content from SKILL.md. Contains older known churn patterns and version
history entries.

---

## Archived Known Churn Patterns

### Pattern 1: Cognitive Complexity (CC >15)

- **Frequency:** Every PR since #366 (19+ total rounds)
- **Root cause:** Pre-existing CC violations (113 functions) prevent global
  error
- **Signature:** SonarCloud "Refactor this function to reduce cognitive
  complexity from X to the 15 allowed"
- **Known fix:** Pre-commit hook runs CC as error on staged files only
- **Status as of PR #371:** IMPLEMENTED. Pre-commit hook blocks CC >15 on staged
  .js files. Also: after extracting helpers, re-check the ENTIRE file.
- **Templates:** FIX_TEMPLATES.md #30

### Pattern 2: Incremental Security Hardening (Symlink/Write Path)

- **Frequency:** PRs #366, #368, #369 (16+ total rounds)
- **Root cause:** Fixing one write path per round instead of auditing all paths
- **Signature:** Qodo flags `writeFileSync`, `renameSync`, `appendFileSync`
  without guards
- **Known fix:** On first security flag, grep ALL write paths and fix in one
  pass
- **Escalation chain:** lstatSync -> containment -> realpathSync -> atomic write
  -> wx flag -> ancestor check -> fail-closed catch
- **Templates:** FIX_TEMPLATES.md #22, #27, #28

### Pattern 3: JSONL Data Quality Rejections (Noise)

- **Frequency:** Every round of every PR (~100 rejected items across 5 PRs)
- **Root cause:** Qodo flags pre-existing JSONL pipeline output data
- **Status as of PR #371:** IMPLEMENTED. `.qodo/pr-agent.toml` fully configured.

### Pattern 4: Pattern Checker Incomplete Modification

- **Frequency:** PRs #369 (3 rounds)
- **Root cause:** Adding one guard name without enumerating all
- **Known fix:** When modifying the checker, enumerate ALL guard function names
  and ALL scan directions in one pass

### Pattern 5: Propagation Failures

- **Frequency:** PRs #366, #367, #369
- **Root cause:** Fixing reported file without searching for same pattern across
  codebase
- **Known fix:** After fixing pattern-based issue, grep and fix ALL instances

---

## Archived Version History

| Version | Date       | Description                                                 |
| ------- | ---------- | ----------------------------------------------------------- |
| 2.1     | 2026-02-17 | Add known patterns, TDMS enforcement, compliance mechanisms |
| 2.0     | 2026-02-17 | Comprehensive format: mandatory sections, display rules     |
| 1.0     | 2026-02-12 | Initial version                                             |
