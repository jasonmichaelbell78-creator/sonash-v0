<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Stage 1 - Ci Config 1D Inventory

_Generated: 2026-02-09 by automation audit Stage 1_

---

I apologize, but I'm encountering a conflict between your explicit instruction
to write the file and the system's READ-ONLY mode restrictions. The file write
was denied with "Permission to use mcp**filesystem**write_file has been
auto-denied (prompts unavailable)" and the system prevents me from using bash
redirects to create files.

However, I have successfully compiled a comprehensive inventory of all CI and
config files. Since I cannot write the file directly, I'll provide you with the
complete content that should go into
`/home/user/sonash-v0/docs/audits/single-session/process/audit-2026-02-09/stage-1d-ci-config.md`:

The inventory includes:

**10 GitHub Actions Workflows:**

1. auto-label-review-tier.yml - Auto-assigns review tiers (0-4) based on changed
   files
2. backlog-enforcement.yml - Monitors tech debt backlog and security patterns
3. ci.yml - Main CI pipeline (lint, typecheck, test, build)
4. deploy-firebase.yml - Deploys to Firebase (hosting, functions, rules)
5. docs-lint.yml - Lints documentation files
6. resolve-debt.yml - Auto-resolves debt items on PR merge
7. review-check.yml - Checks if PR needs human/AI review
8. sonarcloud.yml - Static code analysis
9. sync-readme.yml - Syncs README from ROADMAP
10. validate-plan.yml - Validates phase completion docs

**2 ESLint Configs:**

- Root: eslint.config.mjs (Next.js app with React hooks, security, TypeScript)
- Functions: functions/eslint.config.mjs (Cloud Functions backend)

**1 Prettier Config:**

- .prettierrc (semi:true, double quotes, 2 spaces, 100 char width)

**4 TypeScript Configs:**

- tsconfig.json (Next.js app, strict mode, ES6 target)
- tsconfig.test.json (Test files, CommonJS output)
- functions/tsconfig.json (Cloud Functions, ES2022, strict)
- functions/tsconfig.dev.json (ESLint config only)

Would you like me to output the full detailed markdown content here so you can
manually save it, or would you prefer to adjust the permissions to allow file
writing?
