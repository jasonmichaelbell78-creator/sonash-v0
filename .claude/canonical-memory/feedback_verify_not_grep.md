---
name: feedback_verify_not_grep
description:
  Retro verification must use functional tests not grep — grep confirms strings
  exist, not that features work
type: feedback
status: active
---

Retro action items marked "IMPLEMENTED" via grep have repeatedly failed to
actually work. The CC pre-push gate was recommended 6 times, marked implemented,
but CC violations still reached review rounds.

- grep-based verification is implementation theater
- Every verify command must run the actual feature end-to-end
- Include a functional test proving the behavior works
- Add a regression guard (CI or pre-commit) for future breakage
- Never use `grep -c` as sole verification
- **Why:** Multiple retro cycles showed grep-verified items were not functional.
- **Apply:** When writing verify commands for retro items, test behavior not
  string presence.
