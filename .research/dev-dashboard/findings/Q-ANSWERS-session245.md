# Open Question Answers — Session #245

**Date:** 2026-03-29 **Decided by:** User

## Q9: Velocity tracking repair priority

**Answer:** YES — add to pre-work bug fix scope. Fix `track-session.js`
extraction before building Tab 4. Verify the bug first, then fix. **Impact:**
Pre-work gate expands. Tab 4 Process Compliance ships complete.

## Q13: Minimum-viable scope for Tabs 5 and 6

**Answer:** NO SCOPE REDUCTION. NO MVP. FULL IMPLEMENTATION. Tabs 5 and 6 get
the same treatment as Tabs 1-4. No reduced widget sets, no "minimum-viable"
stubs. **Impact:** Phase 3/4 scope is full. Planning must account for complete
Tab 5 and Tab 6.

## Q14: Tab 4 Process Compliance sub-section gate

**Answer:** ADD TO PRE-WORK SCOPE. All three BLOCKS (G29 velocity broken, G30
commit-log seeded, G33 no retro follow-through source) must be resolved as
pre-work before Tab 4 is built. **Impact:** Pre-work gate expands significantly.
G29 = fix track-session.js. G30 = verify commit-tracker produces live records
(INV-1 says it does — confirm). G33 = create retro follow-through data source.

## Q12: Diff Mode comparison props

**Answer:** Design the `baseline` prop interface in Phase 1. Every tab data hook
gets an optional `baseline?: TabData` prop from the start. Diff Mode feature
ships later but the architecture is ready. **Impact:** Phase 1 adds ~30 minutes
of interface design work. Prevents 20-hour retrofit.

## Q8: Suppression audit capability

**Answer:** IN SCOPE. Add "Suppression Audit" widget. No invisible processes
anywhere in the codebase. Widget goes on Tab 5 (Governance & Audits) since
suppression rules are a governance concern. **Impact:** Tab 5 gains a new
widget. Requires reading `.gemini/styleguide.md` and `.qodo/pr-agent.toml`
formats to design the widget. May need brief investigation of these file formats
during /deep-plan.
