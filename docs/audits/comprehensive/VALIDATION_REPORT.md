# Audit Validation Report

**Generated:** 2026-02-03T21:36:02.949Z **Status:** PASS

---

## Pre-Audit Baseline

| Metric                   | Value            |
| ------------------------ | ---------------- |
| MASTER_DEBT.jsonl exists | Yes              |
| Item count               | 869              |
| Last DEBT-ID             | DEBT-0869        |
| File hash                | 67121fe3ee46237e |

### Severity Distribution (Baseline)

| Severity    | Count |
| ----------- | ----- |
| S0 Critical | 18    |
| S1 High     | 139   |
| S2 Medium   | 414   |
| S3 Low      | 298   |

---

## Stage Validation Results

### Stage 1

**Status:** PASS

| File                             | Findings | Schema Issues | S0/S1 Issues | Status |
| -------------------------------- | -------- | ------------- | ------------ | ------ |
| audit-code-findings.jsonl        | 18       | 0             | 0            | OK     |
| audit-security-findings.jsonl    | 6        | 0             | 0            | OK     |
| audit-performance-findings.jsonl | 15       | 0             | 0            | OK     |
| audit-refactoring-findings.jsonl | 11       | 0             | 0            | OK     |

### Stage 2

**Status:** PASS

| File                               | Findings | Schema Issues | S0/S1 Issues | Status |
| ---------------------------------- | -------- | ------------- | ------------ | ------ |
| audit-documentation-findings.jsonl | 24       | 0             | 0            | OK     |
| audit-process-findings.jsonl       | 46       | 0             | 0            | OK     |

### Stage 3

**Status:** PASS

| File                      | Findings | Schema Issues | S0/S1 Issues | Status |
| ------------------------- | -------- | ------------- | ------------ | ------ |
| aggregated-findings.jsonl | 30       | 0             | 0            | OK     |

---

## TDMS Intake Validation

**Dry-run status:** SUCCESS

| Metric             | Value |
| ------------------ | ----- |
| Items to add       | 30    |
| Duplicates skipped | 0     |

---

## Post-Audit Comparison

| Metric     | Before           | After            | Change  |
| ---------- | ---------------- | ---------------- | ------- |
| Item count | 869              | 898              | +29     |
| File hash  | 67121fe3ee46237e | 621deab8cb0f08a7 | Changed |

**New DEBT-IDs:** DEBT-0870, DEBT-0871, DEBT-0872, DEBT-0873, DEBT-0874,
DEBT-0875, DEBT-0876, DEBT-0877, DEBT-0878, DEBT-0879, DEBT-0880, DEBT-0881,
DEBT-0882, DEBT-0883, DEBT-0884, DEBT-0885, DEBT-0886, DEBT-0887, DEBT-0888,
DEBT-0889, DEBT-0890, DEBT-0891, DEBT-0892, DEBT-0893, DEBT-0894, DEBT-0895,
DEBT-0896, DEBT-0897, DEBT-0898

**Severity Changes:**

- S1: +20
- S2: +9

---

## Summary

**ALL VALIDATIONS PASSED**

- All JSONL outputs comply with schema
- All S0/S1 findings have verification_steps
- TDMS field mapping validated
- Intake dry-run successful
