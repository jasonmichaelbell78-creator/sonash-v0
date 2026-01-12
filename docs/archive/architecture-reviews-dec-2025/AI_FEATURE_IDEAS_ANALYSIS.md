# AI Feature Ideas Analysis: Cross-Reference with Roadmap

> **Generated**: December 15, 2025  
> **Source**: Aggregated feature suggestions from multiple AI systems  
> **Compared Against**:
> [ROADMAP_V3.md](file:///c:/Users/jason/Workspace/dev-projects/sonash-v0/ROADMAP_V3.md)

---

## Legend

| Symbol | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| ✅     | **Already Planned** - Exists in roadmap                     |
| 🔄     | **Overlap/Expanded Scope** - Similar concept with new angle |
| ✨     | **New Idea** - Not in roadmap, worth discussing             |
| ⚠️     | **Complexity Warning** - High effort or risk                |
| ❌     | **Out of Scope** - Conflicts with design principles         |
| 🏷️     | Recommended milestone placement                             |

---

## 1. Onboarding and Personalization

| Idea                                                                 | Status | Roadmap Ref        | Notes                                                                                        |
| -------------------------------------------------------------------- | ------ | ------------------ | -------------------------------------------------------------------------------------------- |
| Recovery profile setup (clean date, substances, fellowship)          | ✅     | M1 Account Linking | Already have clean date, nickname, fellowship selection in onboarding                        |
| Stage-of-recovery selector ("first 90 / first year / long-term")     | ✨     | -                  | **NEW**: Could drive content emphasis. Low effort to add to profile. 🏷️ M1.5                 |
| Role-based onboarding ("newcomer / sponsor / sober living resident") | 🔄     | -                  | Interesting but complex. Could simplify to just "I have a sponsor" / "I am a sponsor" toggle |
| Values + vision exercise                                             | ✨     | -                  | **NEW**: "Future sober self" visioning. Could integrate with M5 inventories. 🏷️ M5 or M9     |
| Custom risk map (triggers, warning signs, high-risk times)           | ✅     | M7 F6              | Prevention Plan builder already planned                                                      |
| Gentle language / tone settings                                      | ✨     | -                  | **NEW**: Accessibility win. Low-medium effort. 🏷️ M1.5 Settings                              |
| Customizable Higher Power language                                   | ✅     | M6 P2              | User text overrides for prayers already planned                                              |

### New Ideas Worth Considering (Onboarding)

1. **Stage-of-recovery selector** - Simple dropdown ("< 90 days", "90 days - 1
   year", "1+ years") that adjusts:
   - How often app nudges for check-ins
   - Which features are emphasized (newcomer = meetings, long-term = service)
   - Tone of prompts
   - _Effort_: ~4 SP _(add to profile schema + conditional UI)_

2. **Tone/language settings** - Let user choose prompt style:
   - "Firm accountability partner"
   - "Gentle encourager"
   - "Neutral/matter-of-fact"
   - _Effort_: ~6 SP _(needs prompt templating system)_

---

## 2. Daily Rhythm and Maintenance

| Idea                                                     | Status | Roadmap Ref | Notes                                                                                  |
| -------------------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------------------------- |
| Morning check-in (mood/craving/sleep/gratitude + action) | ✅     | M5 5.3.2    | Step 11 Morning Planning                                                               |
| Nightly Step 10 review                                   | ✅     | M5 5.3.3    | Night Review (merged 10/11)                                                            |
| Spot-check inventory (2-3 min reset)                     | ✅     | M5 5.3.1    | Step 10 Spot-Check (FAST flow)                                                         |
| Recovery routine builder                                 | ✨     | -           | **NEW**: Assemble daily schedule + reminders + streaks. 🏷️ M7 or M9                    |
| One Day at a Time focus card                             | 🔄     | Today Page  | Similar to Daily Quote card already implemented                                        |
| "I made it through today" button                         | ✨     | -           | **NEW**: Simple end-of-day reinforcement. Low effort. 🏷️ M1.5                          |
| Then vs now review                                       | ✨     | -           | **NEW**: Periodic comparison of early entries vs now. Nice for anniversaries. 🏷️ M7 F5 |

### New Ideas Worth Considering (Daily)

3. **Recovery routine builder** - User creates custom daily schedule:
   - Morning: prayer, reading, gratitude (linked to M5/M6)
   - Daytime: check-ins, meetings
   - Evening: night review
   - Reminders + streak tracking
   - _Effort_: ~15 SP _(significant feature)_

4. **"I made it through today" button** - Simple one-tap at end of day:
   - Triggers celebration animation
   - Logs as "completed day" in daily log
   - Could surface on night review completion
   - _Effort_: ~2 SP

---

## 3. Sobriety Tracking and Motivation

| Idea                                           | Status | Roadmap Ref | Notes                                                                   |
| ---------------------------------------------- | ------ | ----------- | ----------------------------------------------------------------------- |
| Sobriety clock (days/months/years)             | ✅     | Today Page  | Already implemented with clean time tracker                             |
| Digital chips/coins + gallery                  | ✅     | M7 F5       | Milestones & Chips Enhancement (16 SP)                                  |
| Chip ceremony countdown                        | ✅     | M7 F5.2     | "Next chip" countdown planned                                           |
| Multiple sobriety dates                        | ✨     | -           | **NEW**: Separate counters for different substances. 🏷️ Consider        |
| Saved calculator (money/calories)              | ✨     | -           | **NEW**: Gamification. Could be motivating. 🏷️ M7 or M9                 |
| Milestone prep prompts ("first holiday sober") | ✨     | -           | **NEW**: Proactive coaching before known hard dates. 🏷️ M7 F5           |
| Streak reset with dignity                      | ✨     | -           | **NEW**: If someone uses, guide honest reset without shame. 🏷️ Critical |

### New Ideas Worth Considering (Tracking)

5. **Multiple sobriety dates** - For users with poly-substance history:
   - Primary clean date (drives main counter)
   - Secondary dates (alcohol vs drugs, etc.)
   - Privacy: user chooses which to display
   - _Effort_: ~5 SP

6. **Milestone prep prompts** - Proactive coaching:
   - "Your first sober Thanksgiving is in 2 weeks"
   - Surfaces prevention plan, suggests calling sponsor
   - Calendar-aware based on profile entries
   - _Effort_: ~8 SP

7. **"Savings calculator"** - Optional gamification:
   - User enters what they used to spend ($ per day/week)
   - App calculates cumulative savings
   - Caution: Can feel gimmicky; make optional
   - _Effort_: ~3 SP

---

## 4. Crisis and Relapse Prevention

| Idea                                       | Status | Roadmap Ref | Notes                                                                                                             |
| ------------------------------------------ | ------ | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| SOS / "I'm struggling" button              | ✅     | M7 F6.3     | Emergency Plan quick-access planned                                                                               |
| Craving interrupter screen                 | 🔄     | M7 F6       | Could enhance prevention plan with grounding tools                                                                |
| Craving countdown timer                    | ✨     | -           | **NEW**: "Ride it out" timer with prompts. 🏷️ M7 F6                                                               |
| HALT check                                 | ✨     | -           | **NEW**: Quick Hungry/Angry/Lonely/Tired assessment. 🏷️ M5 or M7                                                  |
| Play the tape forward                      | ✨     | -           | **NEW**: Guided visualization of likely outcomes. ⚠️ Sensitive. 🏷️ M9                                             |
| Relapse prevention plan builder            | ✅     | M7 F6       | Prevention Plan already detailed (12 SP)                                                                          |
| High-risk period alerts                    | ✨     | -           | **NEW**: Late nights/weekends/paydays nudges. ⚠️ Privacy concerns                                                 |
| Emergency contacts (one-tap + rotation)    | ✅     | M7 F1.6-1.7 | SOS contact + "I need help now" flow planned                                                                      |
| Emergency contact blast                    | 🔄     | M7 F1.7     | Could add multi-contact broadcast option                                                                          |
| Safety escalation path (suicidal ideation) | ⚠️❌   | -           | **OUT OF SCOPE for v1**: Requires crisis intervention expertise, liability. Should surface 988/crisis lines only. |

### New Ideas Worth Considering (Crisis)

8. **HALT check** - Quick self-assessment:
   - "Are you Hungry? Angry? Lonely? Tired?"
   - Suggests actions based on answers
   - Could integrate with Morning/Night check-ins
   - _Effort_: ~4 SP

9. **Craving countdown timer** - "Ride it out" feature:
   - 15/30/60 minute timer
   - Periodic prompts during countdown
   - "Cravings usually pass in 20 minutes"
   - Links to grounding exercises
   - _Effort_: ~6 SP

> [!CAUTION] **Safety escalation for suicidal ideation** is explicitly OUT OF
> SCOPE. The app should surface crisis resources (988 Suicide & Crisis Lifeline)
> but not attempt to provide crisis intervention. This requires professional
> expertise and creates liability.

---

## 5. 12-Step Step Work Hub

| Idea                                    | Status | Roadmap Ref   | Notes                                                             |
| --------------------------------------- | ------ | ------------- | ----------------------------------------------------------------- |
| Interactive step-by-step guide          | ✅     | M7 F4         | Step Progress Tracker (13 SP)                                     |
| Step progress tracker                   | ✅     | M7 F4         | Exactly as planned                                                |
| Step 1 tools (powerlessness inventory)  | 🔄     | M5            | Could add Step 1 specific inventory template                      |
| Step 2 tools (Higher Power exploration) | ✨     | -             | **NEW**: Belief evolution log. 🏷️ M5 or M6                        |
| Step 3 tools (surrender, God Box)       | 🔄     | M5/M6         | God Box mentioned; could formalize                                |
| Step 4 moral inventory suite            | ✅     | M5 Epic 5.2   | Resentments, Fears, Relationship, Harms (28 SP)                   |
| Step 4 pattern finder                   | ✨     | -             | **NEW**: AI-assisted theme summarization. ⚠️ Sensitive. 🏷️ Future |
| Step 5 toolkit                          | ✨     | -             | **NEW**: Prep checklist, debrief journaling. 🏷️ M5 addition       |
| Step 5 "burn after sharing"             | 🔄     | M5 5.4        | Mentioned in non-goals but could add secure delete                |
| Step 6 readiness + defects map          | ✨     | -             | **NEW**: Willingness tracking by defect. 🏷️ M5 Phase C            |
| Step 7 humility + growth tracker        | ✨     | -             | **NEW**: Changed-behavior log. 🏷️ M5 Phase C                      |
| Step 8 amends builder                   | ✅     | M5 5.2.4b     | Status field with Step 8/9 tracking planned                       |
| Step 9 amends planner                   | ✨     | -             | **NEW**: Scripts, outcome logging, living amends. 🏷️ M5 or M9     |
| Step 9 sponsor-approval workflow        | ⚠️     | -             | Complex; could be simple "discussed with sponsor" checkbox        |
| Step 10 real-time capture               | ✅     | M5 5.3.1      | Spot-Check already planned                                        |
| Step 11 practice suite                  | ✅     | M6 + M5 5.3.2 | Prayers + Morning Planning                                        |
| Step 12 service + message tools         | ✅     | M7 F3         | Commitments & Service Tracker (16 SP)                             |

### New Ideas Worth Considering (Step Work)

10. **Step 2 belief exploration log** - For newcomers struggling with Higher
    Power:
    - "What I tried before" map
    - Evidence-of-hope journal
    - Non-religious options highlighted
    - _Effort_: ~5 SP

11. **Step 6/7 defects tracker** - Character defects work:
    - List defects identified in Step 4
    - Readiness scale per defect (1-10)
    - Situations log when defects show up
    - Progress tracking over time
    - _Effort_: ~8 SP _(could be M5 Phase C add-on)_

12. **God Box digital implementation**:
    - "Turn it over" surrender practice
    - Write worry/control item → archive it
    - Periodic review of what you surrendered
    - _Effort_: ~4 SP

---

## 6. Prayer, Meditation, and Spiritual Practice

| Idea                                    | Status | Roadmap Ref | Notes                                           |
| --------------------------------------- | ------ | ----------- | ----------------------------------------------- |
| Prayer library (Serenity/3rd/7th/11th)  | ✅     | M6          | Prayers & Readings Module (63 SP)               |
| Custom prayer builder                   | ✅     | M6 P2.6     | User-added custom prayers planned               |
| Meditation timer + recovery meditations | ✨     | -           | **NEW**: Timer with guided audio. 🏷️ M6 or M9   |
| Two-way prayer journal                  | 🔄     | M6          | Could add to Step 11 journaling                 |
| Prayer pronunciation guide              | ✨     | -           | **NEW**: Audio/phonetic help. Low effort. 🏷️ M6 |
| God Box                                 | ✅     | Mentioned   | Digital surrender practice (see above)          |

### New Ideas Worth Considering (Spiritual)

13. **Meditation timer with recovery themes**:
    - Simple timer (5/10/15/20 min)
    - Recovery-focused guided options (cravings, resentment, forgiveness)
    - Could link to speaker tapes (M8) for "meditation talks"
    - _Effort_: ~10 SP

---

## 7. Meetings and Real-World Integration

| Idea                                  | Status | Roadmap Ref          | Notes                                                                     |
| ------------------------------------- | ------ | -------------------- | ------------------------------------------------------------------------- |
| Meeting finder (in-person + virtual)  | ✅     | Resources Page, M3.1 | Already built; proximity feature planned                                  |
| "Need a meeting now" mode             | ✨     | -                    | **NEW**: Filter to meetings starting within 1 hour. 🏷️ M3.1               |
| Virtual meeting directory             | ✨     | -                    | **NEW**: Time-zone aware virtual links. 🏷️ M3 or M9                       |
| Calendar sync + travel-time reminders | ✨     | -                    | **NEW**: Google Calendar integration. 🏷️ M7 F2                            |
| Meeting check-in / attendance log     | ✅     | M7 F2                | Meeting Attendance & Homegroup (15 SP)                                    |
| Court card / attendance verification  | ⚠️❌   | -                    | **OUT OF SCOPE**: High privacy/legal risk. Requires explicit opt-in only. |
| Meeting notes + key takeaways         | ✨     | -                    | **NEW**: Capture commitments from meetings. 🏷️ M7 F2                      |
| Chairing & speaking toolkit           | ✨     | -                    | **NEW**: Checklists, timers, formats. ⚠️ Copyright for readings           |
| Share timer (3-min warning)           | ✨     | -                    | **NEW**: Gentle vibration/audio cue. Fun. 🏷️ M9                           |
| Event/convention finder               | ✨     | -                    | **NEW**: Conferences, alcathons. 🏷️ M9                                    |
| Service commitment reminders          | ✅     | M7 F3.4              | Commitment reminder planned                                               |
| Service opportunity board             | ⚠️     | -                    | Complex; requires community moderation infrastructure                     |

### New Ideas Worth Considering (Meetings)

14. **"Meetings starting soon" filter**:
    - "Show meetings starting in next hour"
    - Prioritizes by proximity if location enabled
    - _Effort_: ~3 SP _(simple filter addition)_

15. **Meeting notes capture**:
    - "What did you commit to?"
    - "Key phrase that resonated?"
    - Links to attendance log
    - _Effort_: ~4 SP

16. **Calendar sync**:
    - Export recurring meetings to Google/Apple Calendar
    - Smart reminders with travel time
    - _Effort_: ~8 SP _(platform integration complexity)_

---

## 8. Community, Connection, and Fellowship

| Idea                                   | Status | Roadmap Ref | Notes                                                                 |
| -------------------------------------- | ------ | ----------- | --------------------------------------------------------------------- |
| Private recovery feed + forums         | ⚠️❌   | -           | **OUT OF SCOPE v1**: Requires moderation infrastructure, duty of care |
| Topic-based rooms                      | ⚠️❌   | -           | Same concerns as above                                                |
| Social circles with tiers              | ⚠️     | -           | Complex privacy UX; defer                                             |
| Need-a-call-now button                 | ✅     | M7 F1.7     | "I need help now" flow planned                                        |
| Burning Desire support circle          | ⚠️❌   | -           | Moderation + crisis escalation concerns                               |
| Buddy pairing / accountability partner | 🔄     | M7 F1       | Could add as contact role type                                        |
| Meeting buddy finder                   | ⚠️     | -           | Safety concerns; needs careful design                                 |
| Homegroup spaces                       | ⚠️❌   | -           | Becomes social platform; out of scope                                 |
| Ride share board                       | ⚠️❌   | -           | Liability, safety, identity exposure                                  |
| Fellowship contact list builder        | ✅     | M7 F1       | Contacts with context planned                                         |
| Encouragement system                   | ⚠️     | -           | Anonymity complexity                                                  |
| Recovery-friendly spaces directory     | ✨     | -           | **NEW**: Clubhouses, sober coffee shops. 🏷️ M9                        |

> [!WARNING] **Social/community features carry significant moderation burden and
> liability**. The roadmap correctly keeps scope focused on personal tools with
> optional sponsor/contact sharing. Building a "recovery social network" would
> be a pivot, not an addition.

### New Ideas Worth Considering (Community)

17. **Accountability partner role**:
    - Add "accountability partner" as contact role type
    - Daily check-in prompt: "Did you check in with your accountability
      partner?"
    - Simple; no platform building required
    - _Effort_: ~2 SP

---

## 9. Sponsor and Sponsee Tools

| Idea                               | Status | Roadmap Ref | Notes                                                  |
| ---------------------------------- | ------ | ----------- | ------------------------------------------------------ |
| Sponsor/sponsee linking            | 🔄     | M7 F1       | Could formalize with permission model                  |
| Structured shared workspace        | ⚠️     | -           | Complex; security implications                         |
| Secure step-work sharing (E2E)     | ⚠️     | -           | E2E encryption claims require accuracy                 |
| Self-destruct / burn options       | 🔄     | M5 5.4      | Could add secure delete option                         |
| Asynchronous review tools          | ⚠️     | -           | Basically building a collaboration platform            |
| Sponsor dashboard                  | ⚠️     | -           | Multi-sponsee management; complex                      |
| Sponsee progress overview          | ⚠️     | -           | Privacy/permission complexity                          |
| Sponsor availability toggle        | ✨     | -           | **NEW**: Simple "available for calls" toggle. 🏷️ M7 F1 |
| Sponsor matching                   | ⚠️❌   | -           | **OUT OF SCOPE**: Safety, verification, boundaries     |
| Sponsorship best-practices library | ✨     | -           | **NEW**: Educational content. 🏷️ M6 or Docs            |

### New Ideas Worth Considering (Sponsorship)

18. **Sponsor availability toggle**:
    - Contact card shows "Available now" / "Busy until X"
    - Sponsor sets in their own app
    - Reduces burnout, sets expectations
    - _Effort_: ~6 SP _(requires cross-user data)_

> [!NOTE] Heavy sponsorship tooling (shared workspaces, dashboards) essentially
> requires building a collaborative platform with complex permissions. This is
> better served by existing tools (Google Docs, Notes apps) with the
> **optional** share features already in M5/M6.

---

## 10. Literature and Media

| Idea                        | Status | Roadmap Ref | Notes                                                     |
| --------------------------- | ------ | ----------- | --------------------------------------------------------- |
| Annotated literature reader | ⚠️❌   | -           | **OUT OF SCOPE**: AAWS/Grapevine copyright restrictions   |
| Daily readers integration   | ✅     | M7 F7       | Daily Readings Integration (9 SP)                         |
| Speaker tape library        | ✅     | M8          | Speaker Tapes Library (49 SP)                             |
| Book page finder            | ⚠️     | -           | Copyright concerns for excerpts                           |
| Micro-lessons library       | ✨     | -           | **NEW**: PAWS, cravings, boundaries topics. 🏷️ M6 or Docs |
| Myth-busting cards          | ✨     | -           | **NEW**: Common misconceptions. 🏷️ M6                     |
| Glossary of terms/slogans   | ✨     | -           | **NEW**: HOW, HALT, abbreviations. 🏷️ M6                  |
| Meeting etiquette guide     | ✨     | -           | **NEW**: First-meeting anxiety reducer. 🏷️ M1 Onboarding  |

### New Ideas Worth Considering (Literature)

19. **Recovery glossary**:
    - Searchable list of terms, slogans, abbreviations
    - "What does 'HALT' mean?"
    - Could surface contextually during onboarding
    - _Effort_: ~6 SP

20. **Micro-lessons library**:
    - Short educational content (no AA copyrighted text)
    - Topics: PAWS, cravings, healthy boundaries, meeting etiquette
    - Original content or link-only to external resources
    - _Effort_: ~15 SP _(content creation heavy)_

21. **Meeting etiquette guide**:
    - "What to expect at your first meeting"
    - Sharing norms, cross-talk, anonymity
    - Reduces newcomer anxiety
    - _Effort_: ~4 SP

---

## 11. Tracking, Analytics, and Growth

| Idea                                | Status | Roadmap Ref     | Notes                                                    |
| ----------------------------------- | ------ | --------------- | -------------------------------------------------------- |
| Recovery dashboard                  | ✅     | Today Page + M7 | Meetings, progress, streaks planned                      |
| Mood/emotion tracker + correlations | 🔄     | Today Page      | Mood exists; correlations would be new                   |
| Meeting attendance analytics        | ✅     | M7 F2.6         | Attendance stats badge planned                           |
| Journal tagging + search            | ✅     | M1.5            | History search/filter planned                            |
| Annual recovery review              | ✨     | -               | **NEW**: Year-end summary. 🏷️ M7 or M9                   |
| Service hours tracker               | ✅     | M7 F3           | Service log planned                                      |
| Phone call tracker                  | 🔄     | M7 F1.8         | Contact interaction log planned                          |
| Spiritual condition tracker         | 🔄     | -               | Similar to mood; could add                               |
| Recovery capital index              | ⚠️     | -               | Complex; clinical-adjacent                               |
| Principle-based achievements        | ✨     | -               | **NEW**: Badges for honesty/service vs streaks. 🏷️ M7 F5 |
| Community challenges                | ⚠️     | -               | Requires moderation infrastructure                       |

### New Ideas Worth Considering (Tracking)

22. **Annual recovery review**:
    - Generates summary around anniversary date
    - "This year you attended X meetings, made Y phone calls..."
    - Gratitude/reflection prompts
    - _Effort_: ~8 SP

23. **Principle-based badges**:
    - Instead of just streak-based achievements
    - "Honesty hero" (completed spot-checks for 7 days)
    - "Service minded" (logged 5 service activities)
    - Avoids "streak shame"
    - _Effort_: ~6 SP

---

## 12. Life Integration and Practical Support

| Idea                                  | Status | Roadmap Ref    | Notes                                                   |
| ------------------------------------- | ------ | -------------- | ------------------------------------------------------- |
| Recovery resource directory           | ✅     | Resources Page | Sober living finder implemented; rehabs/detox could add |
| Employment toolkit                    | ⚠️     | -              | Regional accuracy; complex                              |
| Work re-entry planner                 | ⚠️     | -              | Could be simple checklist                               |
| Financial wellness + amends budgeting | ⚠️     | -              | "Not financial advice" disclaimer needed                |
| Relationship repair toolkit           | ⚠️     | -              | "Not therapy" disclaimer needed                         |
| Parenting in recovery module          | ⚠️     | -              | Sensitivity; requires expertise                         |
| Health & wellness trackers            | 🔄     | -              | Could integrate with HALT check                         |
| Medication reminders                  | ⚠️     | -              | Health data; liability concerns                         |
| Legal / probation tracker             | ⚠️     | -              | Sensitive legal data; out of core scope                 |
| Sober lifestyle explorer              | ✨     | -              | **NEW**: Hobbies, volunteering. 🏷️ M9                   |
| Sober fun ideas generator             | ✨     | -              | **NEW**: Combat boredom. Simple. 🏷️ M1.5 or M9          |

### New Ideas Worth Considering (Life Integration)

24. **Sober fun ideas generator**:
    - "I'm bored, what can I do?"
    - Random suggestions from curated list
    - Categories: free, outdoors, social, solo, creative
    - _Effort_: ~3 SP

> [!WARNING] Employment, financial, legal, and parenting tools require domain
> expertise and carry liability. These are better served by linking to external
> resources rather than building in-app.

---

## 13. Sober Living and Program Operations

| Idea                         | Status | Roadmap Ref | Notes                             |
| ---------------------------- | ------ | ----------- | --------------------------------- |
| House rules quick reference  | ⚠️     | -           | Niche B2B feature                 |
| Chore rotation + completion  | ⚠️     | -           | Sober living ops tool             |
| Curfew reminders             | ⚠️     | -           | Location privacy concerns         |
| House meetings notes         | ⚠️     | -           | Niche B2B feature                 |
| IOP/PHP schedule integration | ⚠️     | -           | Health data; treatment center ops |

> [!NOTE] **Sober living operations features** are a different product. These
> would require:
>
> - B2B sales motion
> - Role-based access (house manager vs resident)
> - Integration with treatment center systems
>
> **Recommendation**: Explicitly out of scope for consumer recovery app. Could
> be "SoNash for Operators" spinoff someday.

---

## 14. Long-Term Recovery and Service Growth

| Idea                              | Status | Roadmap Ref | Notes                                                      |
| --------------------------------- | ------ | ----------- | ---------------------------------------------------------- |
| Plateau / complacency detector    | ✨     | -           | **NEW**: Engagement drop triggers re-engagement. 🏷️ M7     |
| Beyond-one-fellowship planner     | ⚠️     | -           | Therapy/other pathways; scope creep                        |
| Legacy builder                    | ✨     | -           | **NEW**: Record story, speaker share outlines. 🏷️ M8 or M9 |
| Spiritual growth quests           | ⚠️     | -           | Risk of being "cringe" or competitive                      |
| Sponsee tree / lineage visualizer | ⚠️     | -           | Privacy + ego dynamics concerns                            |
| 12th-step readiness toolkit       | ✅     | M7 F3       | Linked to service tracking                                 |

### New Ideas Worth Considering (Long-Term)

25. **Complacency detector**:
    - Detects when engagement drops (no check-ins, no meetings logged)
    - Gentle prompt: "It's been a while since you checked in. Everything okay?"
    - Suggests: try a new meeting, call sponsor, deeper step work
    - _Effort_: ~6 SP

26. **Legacy builder / speaker share prep**:
    - Outline builder for sharing your story
    - "What was it like, what happened, what's it like now"
    - Prep for H&I, treatment center commitments
    - _Effort_: ~8 SP

---

## 15. Privacy, Safety, and Anonymity

| Idea                              | Status | Roadmap Ref | Notes                                        |
| --------------------------------- | ------ | ----------- | -------------------------------------------- |
| Granular sharing controls         | 🔄     | M5/M6/M7    | User-initiated sharing already planned       |
| Encryption + device lock          | 🔄     | -           | Mentioned in M5 for sensitive data           |
| Disguised icon + neutral app name | ✨     | -           | **NEW**: Privacy layer. 🏷️ M1.5 Settings     |
| Export + delete tools             | ✅     | M1 GDPR     | Data export/delete implemented               |
| Burn/self-destruct messaging      | 🔄     | M5          | Could add for Step 5 content                 |
| Anonymity reminders + tutorials   | ✨     | -           | **NEW**: Traditions education. 🏷️ Onboarding |
| Moderation systems                | ⚠️❌   | -           | Only needed if building social features      |

### New Ideas Worth Considering (Privacy)

27. **Disguised app icon + name**:
    - Optional "Notebook" or "Journal" app icon
    - Neutral default name
    - PIN/biometric lock on sensitive sections
    - _Effort_: ~5 SP

28. **Anonymity traditions tutorial**:
    - "Protecting your anonymity and others'"
    - Surfaces during onboarding
    - Reminder when sharing features are used
    - _Effort_: ~3 SP

---

## 16. Accessibility and Quality-of-Life

| Idea                                  | Status | Roadmap Ref          | Notes                                               |
| ------------------------------------- | ------ | -------------------- | --------------------------------------------------- |
| Dark mode                             | ✅     | M1.5                 | CSS variables for theming done                      |
| Offline/low-bandwidth mode            | ✨     | -                    | **NEW**: Cache key tools. ⚠️ Complex. 🏷️ M9         |
| Widgets suite                         | ✨     | -                    | **NEW**: Sobriety counter, quick actions. 🏷️ M9     |
| Notification customizer               | 🔄     | -                    | Could add to settings                               |
| Voice-to-text journaling              | ✅     | Universal Journaling | VoiceTextArea implemented                           |
| Text size and cognitive accessibility | 🔄     | M1.5 Settings        | Text size planned; ADHD modes new                   |
| Wearable integration                  | ⚠️     | -                    | Complex; platform-specific                          |
| Travel mode + time-zone tools         | ✨     | -                    | **NEW**: Meeting suggestions while traveling. 🏷️ M9 |

### New Ideas Worth Considering (Accessibility)

29. **Home screen widgets**:
    - Sobriety counter widget
    - Daily quote widget
    - "Call sponsor" quick action widget
    - iOS: WidgetKit; Android: App Widgets
    - _Effort_: ~15 SP _(platform-specific work)_

30. **ADHD-friendly mode**:
    - Simplified UI with less text
    - Larger buttons, high contrast
    - Timer-based prompts (pomodoro style)
    - _Effort_: ~10 SP

---

## Summary: Top New Ideas to Consider

Based on value, feasibility, and alignment with roadmap, here are the **top 15
new ideas** worth discussing:

| #   | Idea                             | Effort | Recommended Milestone |
| --- | -------------------------------- | ------ | --------------------- |
| 1   | Stage-of-recovery selector       | 4 SP   | M1.5 - Onboarding     |
| 2   | HALT check                       | 4 SP   | M5 or M7              |
| 3   | "I made it through today" button | 2 SP   | M1.5                  |
| 4   | Craving countdown timer          | 6 SP   | M7 F6                 |
| 5   | Multiple sobriety dates          | 5 SP   | Profile enhancement   |
| 6   | Milestone prep prompts           | 8 SP   | M7 F5                 |
| 7   | God Box digital                  | 4 SP   | M6                    |
| 8   | "Meetings starting soon" filter  | 3 SP   | M3.1                  |
| 9   | Meeting notes capture            | 4 SP   | M7 F2                 |
| 10  | Recovery glossary                | 6 SP   | M6                    |
| 11  | Meeting etiquette guide          | 4 SP   | Onboarding            |
| 12  | Annual recovery review           | 8 SP   | M7 or M9              |
| 13  | Complacency detector             | 6 SP   | M7                    |
| 14  | Disguised app icon               | 5 SP   | M1.5 Settings         |
| 15  | Sober fun ideas generator        | 3 SP   | M1.5 or M9            |

---

## Explicitly Out of Scope

These ideas conflict with design principles or represent scope creep:

| Idea                                    | Reason                          |
| --------------------------------------- | ------------------------------- |
| Social feeds / forums                   | Moderation burden, duty of care |
| Sponsor matching platform               | Safety, verification complexity |
| Court card verification                 | High privacy/legal risk         |
| Annotated literature reader             | AAWS/Grapevine copyright        |
| Sober living operations                 | B2B product, different business |
| Safety escalation for suicidal ideation | Requires professional expertise |
| Ride share board                        | Liability, identity exposure    |
| Sponsor dashboard (multi-sponsee)       | Complex permissions; defer      |

---

## Next Steps

1. **Review this analysis** and mark which new ideas you want to pursue
2. **Assign to milestones** based on dependencies and effort
3. **Create GitHub issues** for approved ideas
4. **Update ROADMAP_V3.md** with selected additions

---

## Appendix: Design Document Analysis (Dec 15, 2025)

> Source: Detailed AI design document covering daily checklists, sponsor
> workflows, inventory tracking, and peer chat moderation.

### New Feature Ideas Extracted

These features were not in the original aggregated list:

| #   | Feature                        | Description                                                                                                              | Effort | Milestone      |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------ | -------------- |
| 31  | **If-Then Smart Prompts**      | Use daily checklist answers to dynamically suggest actions (resentment=yes → spot-check; fear high → Step 3/7/11 prompt) | 8 SP   | M5 5.3.1       |
| 32  | **Micro-Inventory Mode**       | 60-90 second quick-capture that creates structured Step 4/10 records from emotional spikes                               | 6 SP   | M5             |
| 33  | **Sponsor Playbooks**          | Pre-built flow templates ("Big Book focus", "NA Step Working Guide") that structure reading, writing, call cadence       | 10 SP  | M7 Sponsorship |
| 34  | **Sponsor Office Hours**       | Sponsors set time blocks for availability; sponsees request slots instead of ad-hoc pings                                | 8 SP   | M7 F1          |
| 35  | **Pattern Spotlight**          | Periodically surface themes from inventories ("control in relationships shows up often") with suggested action           | 8 SP   | M5             |
| 36  | **Inventory-to-Amends Wizard** | Guided flow: Step 4 entries → Step 8 list → Step 9 plan with readiness/risk check-ins                                    | 12 SP  | M5/M7          |
| 37  | **Second-Cycle Mode**          | For users doing Steps again: shows old notes alongside new work, offers deeper prompts                                   | 8 SP   | M7 F4          |
| 38  | **"Too Tired" Mode**           | Reduces nightly checklist to 3 essential questions for that day only                                                     | 3 SP   | M5 5.3.3       |
| 39  | **Auto-Carry-Forward Nudges**  | If "Find a meeting" unchecked by midday, gentle reminder                                                                 | 4 SP   | M5 5.3.2       |
| 40  | **Course Correction Actions**  | If user answers "Yes" to harm/dishonesty in nightly review, auto-creates tomorrow action item                            | 5 SP   | M5 5.3.3       |

---

### Enhancements to Existing Planned Features

#### M5 5.3.2 - Step 11 Morning Planning (Enhanced)

Original scope: Form with priorities, motives, intention.

**New UX guidance from design doc:**

| Element          | Enhancement                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| Connection items | Add: "Checked in with Higher Power", "Read a recovery reading", "Set intention"  |
| Safety items     | Add: "Reviewed triggers or risky plans", "Planned meeting or supportive contact" |
| Action focus     | "One service action" + "One self-care action" with optional reminders            |
| UI pattern       | Toggle/quick choices ("Meeting today?" Yes/No/Not sure → prompt to find one)     |
| Journal box      | "Anything I'm worried about today?" stored for nightly comparison                |

#### M5 5.3.3 - Night Review (Enhanced)

Original scope: 9 YES/NO questions with collapsible notes.

**New UX guidance from design doc:**

| Element            | Enhancement                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Question count     | 5-10 concise questions covering: resentment, fear, dishonesty, harm, gratitude, helped others |
| Emotional check-in | Add sliders/emojis for mood, cravings, stress (stored for pattern analysis)                   |
| Course correction  | If harm/dishonesty = Yes → create tiny action item for tomorrow                               |
| End-of-day summary | "Today leaned toward gratitude/resentment; suggested: call sponsor"                           |
| "Save and lock"    | Entries autosave by date, protected by PIN/biometric if enabled                               |
| Tired mode         | "Too tired" button reduces to 3 essential questions                                           |

#### M5 5.3.1 - Step 10 Spot-Check (Enhanced)

Original scope: 30-90 second wizard.

**New UX guidance from design doc:**

| Element         | Enhancement                                                |
| --------------- | ---------------------------------------------------------- |
| Entry point     | Add "quick log button" for real-time resentment capture    |
| Micro-inventory | One-tap, 60-90 second flow creates structured record       |
| If-Then prompts | Dynamic suggestions based on answers                       |
| Link to Step 4  | Option to promote intense entries to Step 4 inventory list |

#### M7 F4 - Step Progress Tracker (Enhanced)

Original scope: 12 step cards with status.

**New UX guidance from design doc:**

| Element           | Enhancement                                                      |
| ----------------- | ---------------------------------------------------------------- |
| States            | "Not started", "In progress", "Shared/Completed", "Revisiting"   |
| Entry conditions  | Step 5 only marked complete after indicating shared with someone |
| Light gating      | Steps 1-3 before 4-9, but allow sponsor override                 |
| Notes per step    | "What this step meant to me" + date                              |
| Multiple passes   | Versioning: "Step 4 – first pass (year 1), second pass (year 3)" |
| Second-cycle mode | Show old notes alongside new work with deeper prompts            |

#### M5 Epic 5.2 - Step 4 Inventories (Enhanced)

**New UX guidance from design doc:**

| Element           | Enhancement                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| Views by column   | See all "my part" entries together to spot patterns                       |
| Views by person   | Everything involving specific person/situation                            |
| Status flags      | "Draft", "Reviewed with sponsor", "Carried into amends list"              |
| Chunking          | Sections (Family, Work, Romantic, Self) that can be marked done gradually |
| Pattern spotlight | Periodically surface recurring themes with suggested action               |

#### M7 F1 - Sponsor & Support Network (Enhanced)

**New sponsorship workflow concepts from design doc:**

| Element               | Enhancement                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| Sponsor profile       | Fellowship, years sober, availability, approach (Big Book, trauma-sensitive, etc.) |
| Sponsorship agreement | Template: expectations, boundaries, escalation plan                                |
| Shared workspace      | Kanban of "Current tasks", "Waiting for review", "Completed"                       |
| Daily summary         | Optional automatic summary to sponsor ("Daily check-in completed")                 |
| Weekly review         | Agenda template, action list for the week                                          |
| Playbooks             | Pre-built flow templates sponsors can apply to sponsees                            |
| Office hours          | Time blocks for availability; reduce ad-hoc pings                                  |
| Load management       | Max sponsees; system stops listing as "available" after limit                      |

---

### Out of Scope Reinforcement

The design document included detailed **Anonymous Peer Chat Moderation**
guidance. This reinforces our "Out of Scope" decision:

| Component               | Complexity                                         |
| ----------------------- | -------------------------------------------------- |
| Trained peer moderators | Recruitment, training, burnout management          |
| Crisis protocol         | Playbooks for self-harm, overdose, imminent danger |
| Content filters         | Automatic flagging, review queues                  |
| Topic-specific rooms    | Multiple moderated spaces                          |
| Privacy/GDPR compliance | Data handling for chat logs                        |
| Moderator tools         | Tiered interventions, backchannel coordination     |

> **Recommendation**: Continue to keep social/chat features explicitly out of
> scope. The moderation burden alone would require dedicated staff.

---

### UX Patterns Worth Adopting

General patterns from the design document applicable across features:

| Pattern                       | Application                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| **Tiered depth**              | Tap to expand prompts; quick-tap for yes/no when tired             |
| **One-screen overview**       | Today's status visible at a glance with "Done for today" state     |
| **Smart reminders**           | Timed to user habits (15-30 min before bedtime)                    |
| **Offline-first**             | Checklists work offline and sync later                             |
| **"Talk to a person" nudges** | When distress detected, emphasize human connection over app        |
| **Tradition guardrails**      | Recurring prompts about anonymity and not speaking for fellowships |
| **Simple visual indicators**  | Progress rings, counters, not complex dashboards                   |
| **Low-friction capture**      | Fast-add (minimal fields) vs Deep-edit (full layout)               |

---

### Summary: New Ideas from Design Doc

| Priority                         | New Ideas                                                           | Total Effort |
| -------------------------------- | ------------------------------------------------------------------- | ------------ |
| High (integrate into planned)    | If-Then Prompts, Micro-Inventory, Course Correction, Too Tired Mode | 22 SP        |
| Medium (new features)            | Inventory-to-Amends Wizard, Pattern Spotlight, Second-Cycle Mode    | 28 SP        |
| Lower (sponsorship enhancements) | Playbooks, Office Hours                                             | 18 SP        |
| **Total**                        | **10 new ideas**                                                    | **~68 SP**   |

These integrate well with existing M5 and M7 work rather than representing new
milestones.
