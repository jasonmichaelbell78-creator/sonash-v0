# Review Policy Index

**Last Updated:** 2026-01-04
**Status:** Active
**Purpose:** Central directory for all review policy documentation

---

## Overview

This directory contains the complete review policy architecture for the SoNash Recovery Notebook project. The policy is designed for **AI-first development** with Claude Code as the primary development interface.

**Key Principles:**
- Lightweight and developer-friendly
- Tier-based review rigor
- Fast-path for routine changes
- Escalate only when needed
- Continuous process improvement

---

## Documentation Structure

### 1. Core Policy Documents

| Document | Purpose | Audience | When to Read |
|----------|---------|----------|--------------|
| **[REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md)** | Complete policy specification | All developers, AI assistants | Before first PR, when designing new features |
| **[REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md)** | One-page cheat sheet | All developers | Before every PR (bookmark this!) |
| **[REVIEW_POLICY_VISUAL_GUIDE.md](./REVIEW_POLICY_VISUAL_GUIDE.md)** | Flowcharts and diagrams | Visual learners, onboarding | Team onboarding, presentations |

---

### 2. Supporting Documentation

| Document | Purpose | Link |
|----------|---------|------|
| **AI Review Process** | How AI code reviews work (CodeRabbit, Qodo) | [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md) |
| **AI Review Learnings** | Historical learnings from reviews | [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md) |
| **Global Security Standards** | Security requirements (all tiers) | [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md) |
| **Documentation Standards** | Documentation tier system | [DOCUMENTATION_STANDARDS.md](./DOCUMENTATION_STANDARDS.md) |
| **Triggers Reference** | All 68+ enforcement points | [TRIGGERS.md](./TRIGGERS.md) |
| **PR Workflow Checklist** | Pre-PR checklist | [PR_WORKFLOW_CHECKLIST.md](./PR_WORKFLOW_CHECKLIST.md) |

---

### 3. Implementation Artifacts

| Artifact | Purpose | Location | Status |
|----------|---------|----------|--------|
| **Tier Assignment Script** | Auto-assign review tiers | `/scripts/assign-review-tier.js` | ✅ Created |
| **GitHub Action: Auto-Label** | Label PRs with tier | `/.github/workflows/auto-label-review-tier.yml` | ✅ Created |
| **Fast-Path Checker** | Check fast-path eligibility | `/scripts/check-fast-path-eligible.js` | 📋 Planned (Phase 2) |
| **Escalation Detector** | Content-based tier escalation | `/scripts/check-review-escalation.js` | 📋 Planned (Phase 2) |
| **Metrics Collector** | Review effectiveness metrics | `/scripts/collect-review-metrics.js` | 📋 Planned (Phase 1) |

---

## Quick Start

### For Developers

**First time:**
1. Read [REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md) (5 minutes)
2. Bookmark the quick reference
3. Skim [REVIEW_POLICY_VISUAL_GUIDE.md](./REVIEW_POLICY_VISUAL_GUIDE.md) (visualize the flow)

**Before every PR:**
1. Check quick reference for tier assignment
2. Run pre-commit checks: `npm run patterns:check && npm run type-check && npm test`
3. Create PR (tier will be auto-assigned)
4. Address AI review feedback
5. Wait for appropriate approvals based on tier

**Common questions:**
- "What tier is my PR?" → Check files changed against [Quick Ref: File Path Lookup](./REVIEW_POLICY_QUICK_REF.md#file-path--tier-lookup)
- "How long until merge?" → See [Quick Ref: Review Time SLAs](./REVIEW_POLICY_QUICK_REF.md#review-time-slas)
- "Can I skip review?" → Only Tier 0 (auto-merge) skips human review

---

### For AI Assistants

**Session start:**
1. Read [REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md) (understand full policy)
2. Check [AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md) (your role in reviews)
3. Review [GLOBAL_SECURITY_STANDARDS.md](./GLOBAL_SECURITY_STANDARDS.md) (security requirements)

**When creating PRs:**
1. Determine tier (use [Section 1: Tier Classification](./REVIEW_POLICY_ARCHITECTURE.md#1-tier-classification-system))
2. Apply tier-appropriate review depth
3. Categorize issues (Critical, Major, Minor, Trivial)
4. Check for escalation triggers
5. Log learnings in [AI_REVIEW_LEARNINGS_LOG.md](./AI_REVIEW_LEARNINGS_LOG.md)

**When implementing automation:**
1. Use existing scripts as reference (`/scripts/check-patterns.js`)
2. Follow [Implementation Roadmap](./REVIEW_POLICY_ARCHITECTURE.md#6-implementation-roadmap)
3. Add tests for all automation
4. Update [TRIGGERS.md](./TRIGGERS.md)

---

### For Code Reviewers

**Reviewing a PR:**
1. Check tier label (auto-assigned by GitHub Action)
2. Verify tier is appropriate for changes
3. Review AI feedback first (CodeRabbit, Qodo)
4. Apply tier-specific review depth:
   - **Tier 1:** Quick spot-check (AI usually sufficient)
   - **Tier 2:** Moderate review (logic, tests, UX)
   - **Tier 3:** Deep review + security checklist
   - **Tier 4:** Exhaustive review + RFC validation
5. Leave constructive feedback
6. Approve or request changes

**Tier-specific checklists:**
- **Tier 2:** See [AI Review Process: Standard Review](./AI_REVIEW_PROCESS.md)
- **Tier 3:** See [Global Security Standards](./GLOBAL_SECURITY_STANDARDS.md#standard-4-owasp-top-10-compliance)
- **Tier 4:** See [Review Policy: Tier 4 Requirements](./REVIEW_POLICY_ARCHITECTURE.md#16-tier-4-critical-exhaustive-review)

---

## Review Tier Summary

| Tier | Name | Automation | Human Review | Typical Time |
|------|------|------------|--------------|--------------|
| **T0** | Exempt | ✅ Auto-merge | ❌ None | 4 hours |
| **T1** | Light | ✅ AI only | 🟡 Optional | 1-2 days |
| **T2** | Standard | ✅ AI + CI | 🟢 1 human | 2 days |
| **T3** | Heavy | ✅ Multi-AI | 🔴 2 humans + checklist | 3-5 days |
| **T4** | Critical | ✅ Maximum | 🔴 All owners + RFC | 1-2 weeks |

**68+ enforcement points** across the system ensure quality without manual overhead.

---

## Policy Evolution

### Current Status (Phase 0)
- ✅ Policy documents created
- ✅ Tier classification defined
- ✅ Auto-labeling GitHub Action created
- ✅ Tier assignment script created
- 📋 Awaiting Phase 1 implementation

### Implementation Phases

| Phase | Timeline | Status | Key Deliverables |
|-------|----------|--------|------------------|
| **Phase 1: Foundation** | Week 1-2 | 📋 Not started | Tier assignment, metrics baseline |
| **Phase 2: Automation** | Week 3-4 | 📋 Not started | Fast-path, content escalation |
| **Phase 3: Audits** | Week 5-6 | 📋 Not started | Security audit, docs drift |
| **Phase 4: Optimization** | Week 7-8 | 📋 Not started | Tune based on data |

**See:** [Implementation Roadmap](./REVIEW_POLICY_ARCHITECTURE.md#6-implementation-roadmap) for detailed tasks.

---

## Metrics & Success Criteria

### Quality Metrics (Target)
- Bugs caught in review: **>70%**
- Bugs escaped to production: **<5/month**
- Security issues caught: **100%**
- AI suggestion acceptance: **60-80%**

### Efficiency Metrics (Target)
- Time to first review: **<24h (T1-T2), <12h (T3-T4)**
- Time to merge: **<48h (T1-T2), <5d (T3-T4)**
- Auto-merge rate: **>40% of PRs**
- Fast-path usage: **>30% of PRs**

### Tier Accuracy (Target)
- Tier escalations: **<10% of PRs**
- Misclassified PRs: **<3%**

**Tracking:** Monthly metrics reports in `/docs/audits/YYYY-MM-review-metrics.md` (Phase 3)

---

## Integration with Existing Systems

### GitHub Actions (CI/CD)
- Auto-tier labeling (new)
- Existing CI checks (lint, test, build)
- Security scans (CodeQL, dependency review)
- Pattern compliance checks

### AI Review Tools
- CodeRabbit (primary AI reviewer)
- Qodo (secondary AI reviewer)
- Custom AI prompts for Tier 4

### Pre-Commit Hooks
- Husky pre-commit (lint-staged)
- Husky pre-push (tests, patterns, type-check)

### Documentation System
- 5-tier docs (Canonical, Foundation, Planning, Reference, Guides)
- Cross-references review policy throughout

---

## FAQ

**Q: How does this differ from the existing AI review process?**
A: This expands AI_REVIEW_PROCESS.md to cover ALL artifacts (not just code) and adds tier-based workflows with clear escalation paths.

**Q: Do I need to memorize all 5 tiers?**
A: No. Use the quick reference and let automation assign tiers. Over time you'll learn patterns.

**Q: What if I disagree with the auto-assigned tier?**
A: Comment on the PR with `@codeowner - Tier adjustment request: [reason]` and a reviewer will adjudicate.

**Q: How long until this is fully implemented?**
A: 8 weeks for full implementation (4 phases). Basic tier assignment works immediately.

**Q: Will this slow down development?**
A: No. Fast-path exemptions and batch reviews reduce friction. Target is 40%+ auto-merge rate.

**Q: What happens to existing review processes?**
A: They integrate seamlessly. AI_REVIEW_PROCESS.md becomes the Tier 2+ workflow. Security standards still apply.

---

## Related Resources

### Templates
- Multi-AI Security Audit: `/docs/templates/MULTI_AI_SECURITY_AUDIT_PLAN_TEMPLATE.md`
- Multi-AI Code Review: `/docs/templates/MULTI_AI_CODE_REVIEW_PLAN_TEMPLATE.md`
- Review Retrospective: `/docs/templates/REVIEW_RETROSPECTIVE_TEMPLATE.md` (Phase 3)

### Examples
- Tier classification examples: See [Visual Guide: Common Scenarios](./REVIEW_POLICY_VISUAL_GUIDE.md#common-scenarios-flowchart)
- Fast-path examples: See [Quick Ref: Fast-Path Eligibility](./REVIEW_POLICY_QUICK_REF.md#fast-path-eligibility)

### External References
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- GitHub Code Review Best Practices: https://github.com/features/code-review

---

## Contributing to Review Policy

### Suggesting Improvements
1. Identify issue (review too slow? tier misclassification?)
2. Document in monthly retrospective
3. Propose solution in retrospective action items
4. Implement and measure impact
5. Update policy documents if successful

### Updating Documentation
1. Make changes to appropriate policy document
2. Update "Last Updated" date
3. Add version history entry (if significant)
4. Create PR with `docs: Update review policy - [what changed]`
5. Get approval from codebase owner
6. Merge and announce changes to team

---

## Support & Questions

**For policy clarification:**
- Check [REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md) first
- Search full policy: [REVIEW_POLICY_ARCHITECTURE.md](./REVIEW_POLICY_ARCHITECTURE.md)
- Ask in PR comments (tag `@codeowner`)

**For technical implementation:**
- Check [Implementation Roadmap](./REVIEW_POLICY_ARCHITECTURE.md#6-implementation-roadmap)
- Review existing scripts: `/scripts/check-patterns.js`, `/scripts/assign-review-tier.js`
- Refer to [TRIGGERS.md](./TRIGGERS.md) for enforcement mechanisms

**For process feedback:**
- Monthly developer survey (Phase 3)
- Monthly review retrospective
- Direct feedback to codebase owners

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-04 | Initial review policy index created. Links all policy documents and implementation artifacts. | Claude Code |

---

## Next Steps

1. **Read Quick Reference:** Start with [REVIEW_POLICY_QUICK_REF.md](./REVIEW_POLICY_QUICK_REF.md)
2. **Create first PR:** Test auto-tier assignment
3. **Provide feedback:** What works? What doesn't?
4. **Track metrics:** Measure impact (Phase 1+)
5. **Iterate:** Continuous improvement based on data

---

**Remember:** This policy serves developers, not the other way around. If it's creating burden without value, let's fix it.

---

**END OF REVIEW_POLICY_INDEX.md**
