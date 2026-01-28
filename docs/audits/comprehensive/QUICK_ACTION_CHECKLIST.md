# Process Audit - Quick Action Checklist

> **Last Updated:** 2026-01-27

## Purpose

This document provides a step-by-step implementation checklist for Process and
Automation audit recommendations, organized by priority phases with specific
tasks, verification steps, and time estimates.

---

**Use this checklist to implement audit recommendations in priority order.**

---

## Phase 1: Critical (Weeks 1-2) - Do These First!

### Week 1: Foundation (8 hours)

#### Day 1: Deployment Approval Gates (2 hours)

- [ ] Create GitHub environment: Settings → Environments → New → "production"
- [ ] Configure required reviewers: Environment → "Require reviewers"
- [ ] Update `.github/workflows/deploy-firebase.yml`:
  ```yaml
  jobs:
    deploy:
      environment:
        name: production
        url: https://sonash-app.web.app
  ```
- [ ] Test with manual workflow_dispatch on deploy-firebase
- [ ] Document in DEVELOPMENT.md: "Manual approval required for production
      deploys"

**Verification:** Next PR cannot deploy without approval

#### Day 2: Cost Budget Alerts (1 hour)

- [ ] Firebase Console → Billing → Budget alerts
- [ ] Set alerts: $50, $100, $500+
- [ ] Add email notifications to team
- [ ] Document in INCIDENT_RESPONSE.md: "Cost spike detection enabled"

**Verification:** Test by viewing billing dashboard

#### Day 3: Pre-Deploy Validation (2 hours)

- [ ] Update `.github/workflows/deploy-firebase.yml` before "Deploy Cloud
      Functions" step:
  ```yaml
  - name: Validate deployment target
    run: |
      firebase functions:list --project sonash-app | grep -q "functions:" || exit 1
      npm run build && [ -d ".next" ] || exit 1
  ```
- [ ] Add Firestore rules syntax check
- [ ] Test workflow with dry-run

**Verification:** Validation step runs and passes in CI

#### Day 4: Hook Performance Baseline (1 hour)

- [ ] Run and record current hook times:
  ```bash
  time git commit -m "test" --no-verify
  time git push --no-verify
  ```
- [ ] Document baselines in: `docs/HOOK_PERFORMANCE_BASELINE.md`
- [ ] Baseline: pre-commit ~15-20s, pre-push ~20-30s

**Verification:** Baseline documented with timestamps

#### Day 5: Quick-Start Guide (2 hours)

- [ ] Create `FIRST_COMMIT_GUIDE.md` with:
  - Clone and setup steps
  - First commit checklist
  - Common errors and fixes
  - Hook skip procedures (SKIP_TRIGGERS=1, etc.)
- [ ] Link from DEVELOPMENT.md
- [ ] Link from README.md

**Verification:** New developer can follow guide successfully

### Week 2: Health & Recovery (8 hours)

#### Day 6: Post-Deploy Health Checks (3 hours)

- [ ] Update `.github/workflows/deploy-firebase.yml` after "Deploy Hosting"
      step:
  ```yaml
  - name: Health Check
    run: |
      MAX_RETRIES=3
      for i in {1..$MAX_RETRIES}; do
        if curl -sf https://sonash-app.web.app/health; then
          echo "✅ Health check passed"
          exit 0
        fi
        echo "Health check attempt $i failed, retrying..."
        sleep 5
      done
      echo "❌ Health check failed after $MAX_RETRIES attempts"
      exit 1
  ```
- [ ] Add health endpoint if not exists: `/api/health` returns 200 OK
- [ ] Test workflow manually

**Verification:** Deploy workflow includes health check step

#### Day 7: Automated Rollback Preparation (3 hours)

- [ ] Document current function versions:
  ```bash
  firebase functions:list --project sonash-app > function-manifest.json
  ```
- [ ] Create rollback script: `scripts/rollback-deploy.js`
  - Captures version before deploy
  - Can restore on failure
  - Documents rollback timestamp
- [ ] Add to deploy workflow error handler:
  ```yaml
  - name: Rollback on failure
    if: failure()
    run: node scripts/rollback-deploy.js
  ```
- [ ] Test rollback procedure in staging

**Verification:** Rollback script created and tested

#### Day 8: Troubleshooting Guide (2 hours)

- [ ] Create `docs/TROUBLESHOOTING_CI_CD.md`:
  - Common CI failures
  - Hook failures and fixes
  - Test failures
  - Deployment issues
- [ ] Document remediation steps for each
- [ ] Link from DEVELOPMENT.md

**Verification:** Guide covers top 10 issues developers face

---

## Phase 2: High-Priority (Weeks 3-6) - Major Improvements

### Week 3: Test Optimization (8 hours)

#### Day 9: Test Parallelization (3 hours)

- [ ] Update `package.json`:
  ```json
  {
    "scripts": {
      "test:unit": "node --test dist-tests/tests/unit/**/*.test.js",
      "test:integration": "node --test dist-tests/tests/integration/**/*.test.js",
      "test:all": "npm run test:unit & npm run test:integration & wait"
    }
  }
  ```
- [ ] Reorganize tests/:
  ```
  tests/
    unit/          (auth, utils, etc)
    integration/   (firestore, cloud-functions)
    security/      (security-specific)
  ```
- [ ] Update CI workflow to run parallel:

  ```yaml
  jobs:
    test-unit:
      runs-on: ubuntu-latest
      steps:
        - name: Run unit tests
          run: npm run test:unit

    test-integration:
      runs-on: ubuntu-latest
      steps:
        - name: Run integration tests
          run: npm run test:integration
  ```

**Verification:** Tests run in parallel, total time <3s

#### Day 10: Coverage Trend Tracking (2 hours)

- [ ] Create `coverage-baseline.json`:
  ```json
  {
    "branches": 75,
    "functions": 80,
    "lines": 78,
    "statements": 78
  }
  ```
- [ ] Add to CI workflow after coverage step:
  ```yaml
  - name: Compare coverage
    run: |
      CURRENT=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
      BASELINE=$(cat coverage-baseline.json | jq '.lines')
      if (( $(echo "$CURRENT < $BASELINE - 2" | bc -l) )); then
        echo "::error::Coverage dropped from $BASELINE% to $CURRENT%"
        exit 1
      fi
  ```
- [ ] Commit baseline to repo

**Verification:** Coverage comparison runs in CI

#### Day 11: PR Coverage Comments (2 hours)

- [ ] Update `.github/workflows/ci.yml`:
  ```yaml
  - name: Comment coverage
    uses: romeovs/lcov-reporter-action@v0.3.1
    with:
      coverage-files: ./coverage/lcov.info
      github-token: ${{ secrets.GITHUB_TOKEN }}
  ```
- [ ] Test with PR: should see coverage change comment

**Verification:** PR shows coverage impact

#### Day 12: Hook Optimization (1 hour)

- [ ] Update `.husky/pre-commit`:
  - Remove: `npm test` (will run in pre-push)
  - Add: timing output for each check
  ```bash
  START=$(date +%s%N)
  # ... run checks ...
  END=$(date +%s%N)
  ELAPSED=$(( ($END - $START) / 1000000 ))
  echo "  ✅ ESLint passed (${ELAPSED}ms)"
  ```
- [ ] Test: pre-commit should now be <10s

**Verification:** pre-commit time reduced to <10s

### Week 4: Deployment Strategy (8 hours)

#### Day 13: Canary Deployment Framework (4 hours)

- [ ] Create `scripts/canary-deploy.js`:
  ```javascript
  // Deploy to 5% traffic
  // Monitor for errors
  // If all good: 50% traffic
  // If all good: 100% traffic
  // Rollback if errors detected
  ```
- [ ] Add to deploy workflow:
  ```yaml
  - name: Canary deployment
    if: github.event.workflow_dispatch.inputs.deployment_type == 'canary'
    run: node scripts/canary-deploy.js
  ```
- [ ] Document in: `docs/CANARY_DEPLOYMENT.md`

**Verification:** Canary deploy workflow created and documented

#### Day 14: Deployment Validation Framework (2 hours)

- [ ] Create smoke test suite in `tests/smoke/`:
  - Test app loads
  - Test authentication works
  - Test database reads
  - Test critical APIs
- [ ] Run after canary deployment:
  ```bash
  npm run test:smoke -- https://sonash-app.web.app
  ```

**Verification:** Smoke tests created and passing

#### Day 15: Deployment Status Tracking (2 hours)

- [ ] Create `deployments.log` format:
  ```
  COMMIT,DATE,STATUS,DURATION_MS,HEALTH_CHECK
  abc1234,2026-01-24T10:00:00Z,SUCCESS,45000,PASSED
  ```
- [ ] Add to deploy workflow:
  ```yaml
  - name: Record deployment
    run: |
      echo "$(git rev-parse --short HEAD),$(date -Iseconds),${{ job.status }},..." >> deployments.log
  ```
- [ ] Commit and track in repo

**Verification:** Deployments logged with status

### Week 5-6: Monitoring & Documentation (8 hours)

#### Day 16: Error Rate Monitoring (3 hours)

- [ ] Create `.github/workflows/error-monitoring.yml`:
  ```yaml
  name: Error Rate Check
  on:
    schedule:
      - cron: "0 * * * *" # Every hour
  jobs:
    check-errors:
      runs-on: ubuntu-latest
      steps:
        - name: Check error rates
          run: |
            # Query Firebase Functions logs
            firebase functions:log --project sonash-app | grep ERROR | wc -l
  ```
- [ ] Setup Slack/email alerts on spike
- [ ] Document in INCIDENT_RESPONSE.md

**Verification:** Error monitoring workflow active

#### Day 17: Sentry Integration (2 hours)

- [ ] Setup Sentry release tracking:
  ```yaml
  - name: Create Sentry release
    run: |
      npm install -g @sentry/cli
      sentry-cli releases create sonash@$(git rev-parse --short HEAD)
      sentry-cli releases set-commits --auto sonash@$(git rev-parse --short HEAD)
  ```
- [ ] Enable error tracking in Next.js
- [ ] Test with manual error trigger

**Verification:** Sentry shows releases and errors

#### Day 18: Developer Documentation (3 hours)

- [ ] Create `docs/CI_CD_RUNBOOK.md`:
  - Workflow descriptions
  - Trigger conditions
  - Common failures
  - Recovery procedures
- [ ] Update ROADMAP.md with deployment section
- [ ] Create `docs/MONITORING.md`:
  - Metrics explained
  - How to check health
  - Alert procedures

**Verification:** All docs linked from DEVELOPMENT.md

---

## Phase 3: Nice-to-Have (Weeks 7-12) - Advanced Features

### Week 7: Advanced Monitoring (4 hours)

- [ ] Add hook timing dashboard
- [ ] Setup deployment metrics tracking
- [ ] Create GCP cost analysis
- [ ] Add performance regression detection

### Week 8-9: Supply Chain Security (4 hours)

- [ ] Add SBOM generation (cyclonedx)
- [ ] Setup artifact signing
- [ ] Enable supply chain verification

### Week 10-12: Operations Dashboard (8 hours)

- [ ] Grafana or Datadog setup
- [ ] Real-time metrics display
- [ ] Incident timeline tracking
- [ ] Cost trend analysis

---

## Verification Tests

After each phase, verify:

### Phase 1 Verification

```bash
# Test deployment flow
git push  # Should require approval

# Test health checks
curl https://sonash-app.web.app/health  # Should return 200

# Test cost alerts
# Firebase Console → Billing → should see alerts configured

# Test quick-start
# Have new dev follow FIRST_COMMIT_GUIDE.md → should succeed
```

### Phase 2 Verification

```bash
# Test parallel tests
npm run test:all  # Should complete in <3s total

# Test coverage tracking
# Create PR → should see coverage comment

# Test hook performance
time git commit -m "test"  # Should be <10s

# Test canary deploy
# Manual workflow_dispatch → should deploy to 5% first
```

### Phase 3 Verification

```bash
# Test error monitoring
# Trigger error in production → should appear in Sentry within 1 min

# Test SBOM
# Deploy workflow → should generate sbom.json

# Test dashboard
# Open Grafana → should see deployment metrics
```

---

## Team Communication

### To Share Progress

```markdown
## Phase 1 Complete ✅

- [x] Deployment approval gates working
- [x] Cost budget alerts configured
- [x] Health checks detecting issues
- [x] Developer guides documented

**Impact:** Production deployments now require approval and health verification

### Next: Phase 2 (Test optimization + Canary deployments)

**Timeline:** Weeks 3-6 **Effort:** 24 hours
```

---

## Time Tracking Template

Copy this to track actual vs. estimated hours:

```markdown
| Task              | Estimated | Actual | Variance | Notes |
| ----------------- | --------- | ------ | -------- | ----- |
| Deploy Gates      | 2h        | ?      | -        |       |
| Cost Alerts       | 1h        | ?      | -        |       |
| Pre-Deploy Val    | 2h        | ?      | -        |       |
| Hook Baseline     | 1h        | ?      | -        |       |
| Quick-Start       | 2h        | ?      | -        |       |
| Health Checks     | 3h        | ?      | -        |       |
| Rollback Setup    | 3h        | ?      | -        |       |
| Troubleshooting   | 2h        | ?      | -        |       |
| **PHASE 1 TOTAL** | **16h**   | ?      | -        |       |
```

---

## Support & Questions

**Reference Documents:**

- Full audit: `docs/audits/comprehensive/audit-process-report.md`
- Summary: `docs/audits/comprehensive/AUDIT_SUMMARY.md`
- This checklist: `docs/audits/comprehensive/QUICK_ACTION_CHECKLIST.md`

**Key Contacts:**

- Deployment issues: See INCIDENT_RESPONSE.md
- Hook issues: See TROUBLESHOOTING_CI_CD.md
- Build issues: See DEVELOPMENT.md

**Questions to Consider:**

1. Should Phase 1 include all 5 items, or prioritize approval gates + health
   checks?
2. Who owns canary deployment implementation?
3. Should monitoring dashboard be Phase 2 or Phase 3?
4. Any dependencies blocking Phase 1 work?

---

**Created:** 2026-01-24 **Review By:** Team lead **Implementation Start:** TBD
**Target Completion:** Week 12, 2026

---

## Version History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2026-01-24 | Initial version |
