# Framework Roadmap

## Current Status: Initial Skeleton (v0.1.0)

### Completed

- [x] Project foundation (package.json, tsconfig, prettier, gitignore)
- [x] ESLint plugin with 23 custom rules
- [x] Claude Code hooks (12 hooks + 6 shared libraries)
- [x] Claude Code agents (12 specialized agents)
- [x] Claude Code skills (50+ development workflow skills)
- [x] Git hooks (pre-commit, pre-push with quality gates)
- [x] GitHub workflows (9 CI/CD workflows)
- [x] Shared script libraries (11 modules)
- [x] Configuration files (12 configs)
- [x] TDMS ecosystem scripts
- [x] PR review ecosystem scripts
- [x] Doc ecosystem scripts

### Phase 1: Stabilization

- [ ] Run full validation suite and fix broken references
- [ ] Install npm dependencies and verify ESLint rules load
- [ ] Verify all hooks fire correctly on their events
- [ ] Ensure all skills are discoverable
- [ ] Run pre-commit and pre-push hooks successfully

### Phase 2: Project-Specific Customization

- [ ] Configure SonarCloud project properties
- [ ] Set up GitHub repository secrets (SONAR_TOKEN, SEMGREP_APP_TOKEN)
- [ ] Create initial technical debt tracking (MASTER_DEBT.jsonl)
- [ ] Configure doc ecosystem paths for this project
- [ ] Set up review tier assignment rules

### Phase 3: Upstream Sync Mechanism

- [ ] Decide on sync strategy (git subtree, periodic diff, hash manifest, or npm package)
- [ ] Implement bidirectional sync between framework and consuming projects
- [ ] Create sync validation tooling

### Phase 4: Extended Hook Waves (from source project)

- [ ] Pattern compliance check (pre-commit wave 3)
- [ ] Audit S0/S1 validation (pre-commit wave 4)
- [ ] CANON schema validation (pre-commit wave 5)
- [ ] Skill configuration validation (pre-commit wave 6)
- [ ] Cross-document dependency check (pre-commit wave 7)
- [ ] Documentation index auto-update (pre-commit wave 8)
- [ ] Document header validation (pre-commit wave 9)
- [ ] Agent compliance check (pre-commit wave 10)
- [ ] Technical debt schema validation (pre-commit wave 11)
- [ ] Pattern compliance on push diff (pre-push)
- [ ] Propagation check (pre-push)
- [ ] Event-based trigger checker (pre-push)

### Phase 5: Additional Tooling

- [ ] SonarCloud integration (port /sonarcloud skill when configured)
- [ ] Remote session support (port /decrypt-secrets when needed)
- [ ] Monitoring dashboard (extend /alerts skill)

## Deferred Items

### Source-Specific Features (not ported)

These features were specific to the source project and excluded from the framework:

- Firebase deployment workflow
- Next.js build configuration
- Firestore mock testing rules
- Excel analysis skill
- Claude.ai artifacts builder skill
- Market research reports skill
- Developer growth analysis skill
- Serena dashboard hook

### Design Decisions to Revisit

- Upstream sync mechanism (Phase 3)
- TDMS sprint structure (currently config-driven, may need UI)
- PR review tier thresholds (may need per-project configuration)
- Doc ecosystem tier system (currently generic)
