---
name: expansion-evaluation
description: >-
  Manage the SoNash expansion evaluation process for reviewing ~240 feature and
  technical ideas across 21 modules. This skill should be used when the user
  wants to evaluate expansion ideas, track progress, make decisions, or resume
  an evaluation session. Supports commands: begin, evaluate, status, decide,
  end.
---

# Expansion Evaluation Skill

## Purpose

This skill manages a structured, resumable process for evaluating SoNash
expansion ideas from 21 modules (12 feature + 9 technical). It maintains state
across sessions and enables flexible navigation between modules and ideas.

## When to Use

- User wants to evaluate expansion ideas
- User says "expansion", "/expansion", or references the expansion docs
- User wants to check progress on expansion evaluation
- User wants to resume a previous evaluation session

## Command Reference

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `/expansion begin`                 | Initialize or resume evaluation    |
| `/expansion evaluate [module]`     | Jump to a specific module          |
| `/expansion evaluate [module] [n]` | Jump to specific idea in module    |
| `/expansion status`                | Show progress and recent decisions |
| `/expansion decide [action]`       | Record decision for current idea   |
| `/expansion questions`             | Review open questions              |
| `/expansion end`                   | Save checkpoint and commit         |

### Decision Actions

Use with `/expansion decide`:

- `accept [milestone] [reason]` - Accept idea for ROADMAP
- `defer [reason]` - Good idea, but not now
- `reject [reason]` - Doesn't fit vision/scope
- `merge [roadmap-item] [reason]` - Already in ROADMAP, enhance
- `discuss` - Mark for further discussion

## Core Workflow

### Begin Session

```
/expansion begin
```

1. Read `docs/EXPANSION_EVALUATION_TRACKER.md`
2. Display current progress summary
3. Show any open questions from previous session
4. Ask where to start or continue

### First-Time Initialization

On first run (no decisions yet), present these foundational questions:

**Architecture Questions:**

1. **Offline-first priority:** Should ALL features work offline, or just core
   journal/step work? (Impacts F3, F6, F9)
2. **Native app timing:** When should we pursue Capacitor wrapper? After M2?
   When PWA limits block us? Never?
3. **Encryption scope:** Should Step 4 encryption be optional or mandatory?

**Feature Questions:** 4. **Nashville scope:** Nashville-only, Nashville-first
extensible, or generic location system from start? 5. **Sponsor model:** Confirm
Push (snapshots only) vs Pull (permissions)? 6. **Meeting finder:** Build own,
integrate existing, link external, or hybrid?

**Process Questions:** 7. **Evaluation order:** Start with Technical (T1-T4),
Features (F1-F12), or Interleaved (related F+T together)? 8. **ROADMAP
integration:** Add accepted items immediately, batch at end, or session batches?

Record answers in tracker's Open Questions section before proceeding to module
evaluation.

### Evaluate Module

```
/expansion evaluate F1
/expansion evaluate T3 5
```

1. Load the specified module content
2. Check ROADMAP overlap for each idea
3. Present ideas one at a time with evaluation criteria
4. Discuss feasibility, dependencies, user benefit
5. Record decisions as they are made

### End Session

```
/expansion end
```

1. Update tracker with all decisions made
2. Set "Quick Resume" section with context
3. List any new open questions
4. Commit changes to git

## Evaluation Criteria

For each idea, assess:

| Criteria        | Question                                       |
| --------------- | ---------------------------------------------- |
| ROADMAP Overlap | Already planned? Partially covered? New?       |
| Feasibility     | Can we build with current stack?               |
| Technical Debt  | Does this add complexity? Require refactoring? |
| Dependencies    | What modules/features must exist first?        |
| User Benefit    | How much value does this provide?              |
| Effort          | S/M/L/XL estimate                              |

## Module Reference

### Feature Modules (F1-F12)

- F1: Step Work Depth (60 ideas)
- F2: Sponsor Tooling (11 ideas)
- F3: Nashville Advantage (8 ideas)
- F4: Offline/Privacy (15 ideas)
- F5: Journaling & Insights (15 ideas)
- F6: Recovery Knowledge Base (12 ideas)
- F7: Exports & Reports (11 ideas)
- F8: Personalization (11 ideas)
- F9: Daily Engagement (11 ideas)
- F10: Safety & Harm Reduction (10 ideas)
- F11: Visionary/Dream Big (10 ideas)
- F12: Final Gaps (11 ideas)

### Technical Modules (T1-T9)

- T1: System Architecture (~18 ideas)
- T2: Data Model & Firestore (~12 ideas)
- T3: Offline Queue & Conflict (~15 ideas)
- T4: Encryption & Passcode (~12 ideas)
- T5: Exports & PDF (~10 ideas)
- T6: Analytics Plan (~8 ideas)
- T7: Tech Debt & Quality (~10 ideas)
- T8: Native Path (~8 ideas)
- T9: Open Questions (~12 ideas)

## State Management

Primary state file: `docs/EXPANSION_EVALUATION_TRACKER.md`

The tracker maintains:

- Quick Resume section with last session context
- Module progress table (ideas reviewed/total)
- Decision log per module
- Open questions section
- Cross-reference table (F↔T dependencies)

## File Locations

| File                                           | Purpose                     |
| ---------------------------------------------- | --------------------------- |
| `docs/EXPANSION_EVALUATION_TRACKER.md`         | Main state/progress tracker |
| `docs/SoNash Expansion - Technical Modules.md` | T1-T9 parsed modules        |
| `docs/SoNash Expansion - Module N - *.md`      | F1-F12 feature modules      |
| `ROADMAP.md`                                   | Target for accepted ideas   |

## Implementation Notes

1. **Always read tracker first** - Check current state before any action
2. **Update tracker incrementally** - Don't batch updates
3. **Preserve discussion context** - Log key points in tracker
4. **Track dependencies** - Note when ideas depend on other modules
5. **Allow flexibility** - User can jump to any module at any time
