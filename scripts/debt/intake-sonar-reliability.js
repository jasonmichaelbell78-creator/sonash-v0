#!/usr/bin/env node
/* global __dirname */
/* eslint-disable complexity */
/**
 * Intake 295 SonarCloud reliability issues from dashboard paste
 *
 * Usage:
 *   node scripts/debt/intake-sonar-reliability.js --dry-run   (default, preview only)
 *   node scripts/debt/intake-sonar-reliability.js --write      (append new items)
 *
 * Writes to BOTH:
 *   - docs/technical-debt/MASTER_DEBT.jsonl
 *   - docs/technical-debt/raw/deduped.jsonl
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");

const TODAY = new Date().toISOString().split("T")[0];

// ---------------------------------------------------------------------------
// All 295 issues parsed from SonarCloud reliability dashboard paste
// ---------------------------------------------------------------------------
const RAW_ISSUES = [
  {
    file: "app/globals.css",
    line: 4,
    title: 'Unexpected unknown at-rule "@custom-variant"',
    kind: "Bug",
    sonarSev: "Major",
  },

  {
    file: "app/meetings/all/page.tsx",
    line: 222,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "app/meetings/all/page.tsx",
    line: 223,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "app/meetings/all/page.tsx",
    line: 240,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "app/meetings/all/page.tsx",
    line: 240,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/admin/errors-tab.tsx",
    line: 404,
    title: "Non-interactive elements should not be assigned mouse or keyboard event listeners",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/admin/jobs-tab.tsx",
    line: 72,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/admin/jobs-tab.tsx",
    line: 78,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/admin/logs-tab.tsx",
    line: 256,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/admin/logs-tab.tsx",
    line: 257,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/admin/logs-tab.tsx",
    line: 258,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/admin/logs-tab.tsx",
    line: 259,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/admin/privileges-tab.tsx",
    line: 314,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/admin/privileges-tab.tsx",
    line: 522,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/admin/users-tab.tsx",
    line: 1583,
    title: "Non-interactive elements should not be assigned mouse or keyboard event listeners",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/growth/GratitudeCard.tsx",
    line: 128,
    title: "Ambiguous spacing after previous element span",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/growth/SpotCheckCard.tsx",
    line: 167,
    title: "Ambiguous spacing after previous element span",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/growth/Step1WorksheetCard.tsx",
    line: 121,
    title: "Use new Array() instead of Array()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/growth/Step1WorksheetCard.tsx",
    line: 380,
    title: "Prefer String.fromCodePoint() over String.fromCharCode()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "components/growth/Step1WorksheetCard.tsx",
    line: 413,
    title: "Prefer String.fromCodePoint() over String.fromCharCode()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/journal/entry-card.tsx",
    line: 122,
    title: "Ambiguous spacing after previous element span",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/journal/entry-detail-dialog.tsx",
    line: 271,
    title: "Avoid non-native interactive elements",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "components/journal/entry-detail-dialog.tsx",
    line: 271,
    title:
      "Visible, non-interactive elements with click handlers must have at least one keyboard listener",
    kind: "Bug",
    sonarSev: "Minor",
  },
  {
    file: "components/journal/entry-detail-dialog.tsx",
    line: 275,
    title: "Avoid non-native interactive elements",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "components/journal/entry-detail-dialog.tsx",
    line: 275,
    title:
      "Visible, non-interactive elements with click handlers must have at least one keyboard listener",
    kind: "Bug",
    sonarSev: "Minor",
  },

  {
    file: "components/journal/entry-feed.tsx",
    line: 341,
    title: "Avoid non-native interactive elements",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "components/journal/entry-feed.tsx",
    line: 341,
    title:
      "Visible, non-interactive elements with click handlers must have at least one keyboard listener",
    kind: "Bug",
    sonarSev: "Minor",
  },
  {
    file: "components/journal/entry-feed.tsx",
    line: 345,
    title: "Avoid non-native interactive elements",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "components/journal/entry-feed.tsx",
    line: 345,
    title:
      "Visible, non-interactive elements with click handlers must have at least one keyboard listener",
    kind: "Bug",
    sonarSev: "Minor",
  },

  {
    file: "components/notebook/notebook-shell.tsx",
    line: 245,
    title: "Use new Array() instead of Array()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/notebook/pages/support-page.tsx",
    line: 114,
    title: "Use new Array() instead of Array()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/onboarding/onboarding-wizard.tsx",
    line: 135,
    title: "Prefer Number.isNaN over isNaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "components/ui/label.tsx",
    line: 6,
    title: "A form label must be associated with a control",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "components/widgets/compact-meeting-countdown.tsx",
    line: 275,
    title: "Avoid non-native interactive elements",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "components/widgets/compact-meeting-countdown.tsx",
    line: 275,
    title:
      "Visible, non-interactive elements with click handlers must have at least one keyboard listener",
    kind: "Bug",
    sonarSev: "Minor",
  },

  {
    file: "functions/src/admin.ts",
    line: 692,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/admin.ts",
    line: 696,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/admin.ts",
    line: 700,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/admin.ts",
    line: 3500,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/admin.ts",
    line: 3568,
    title: "Prefer Number.parseFloat over parseFloat",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "functions/src/security-logger.ts",
    line: 274,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 276,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 278,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 283,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 285,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 401,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 449,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 453,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 454,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 461,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 463,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 465,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 467,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 472,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 473,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "functions/src/security-logger.ts",
    line: 476,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "hooks/use-journal.ts",
    line: 73,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 74,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 76,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 78,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 79,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 80,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "hooks/use-journal.ts",
    line: 82,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "lib/db/meetings.ts",
    line: 26,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/db/meetings.ts",
    line: 27,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/db/meetings.ts",
    line: 49,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/db/meetings.ts",
    line: 50,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "lib/logger.ts",
    line: 87,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "lib/sentry.client.ts",
    line: 48,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "lib/types/firebase-types.ts",
    line: 56,
    title: "Prefer Number.isNaN over isNaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "lib/utils/admin-error-utils.ts",
    line: 19,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/utils/admin-error-utils.ts",
    line: 21,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/utils/admin-error-utils.ts",
    line: 27,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "lib/utils/admin-error-utils.ts",
    line: 33,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/aggregate-audit-findings.js",
    line: 186,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 189,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 207,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 236,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 236,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 236,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 473,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 518,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/aggregate-audit-findings.js",
    line: 737,
    title: "Prefer Number.NaN over NaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 47,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 48,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 49,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 59,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 60,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 61,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 62,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 63,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 64,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 75,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 445,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 532,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 644,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 645,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 790,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 791,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 1107,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 1115,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 1119,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 1286,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/analyze-learning-effectiveness.js",
    line: 1300,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/archive-doc.js",
    line: 432,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/archive-doc.js",
    line: 438,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/archive-doc.js",
    line: 473,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/archive-doc.js",
    line: 582,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/assign-review-tier.js",
    line: 30,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/assign-review-tier.js",
    line: 31,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/assign-review-tier.js",
    line: 33,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/assign-review-tier.js",
    line: 41,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/assign-review-tier.js",
    line: 458,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/audit/transform-jsonl-schema.js",
    line: 208,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/audit/transform-jsonl-schema.js",
    line: 232,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/audit/validate-audit-integration.js",
    line: 37,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/audit/validate-audit-integration.js",
    line: 509,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-backlog-health.js",
    line: 48,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-backlog-health.js",
    line: 290,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-content-accuracy.js",
    line: 242,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-cross-doc-deps.js",
    line: 221,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-cross-doc-deps.js",
    line: 225,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-cross-doc-deps.js",
    line: 246,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-cross-doc-deps.js",
    line: 250,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-doc-placement.js",
    line: 197,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-doc-placement.js",
    line: 213,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-doc-placement.js",
    line: 297,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-doc-placement.js",
    line: 369,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-doc-placement.js",
    line: 455,
    title: "This pattern can be replaced with \\\\",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-docs-light.js",
    line: 405,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-docs-light.js",
    line: 406,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-docs-light.js",
    line: 407,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-docs-light.js",
    line: 422,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-pattern-compliance.js",
    line: 1236,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-pattern-compliance.js",
    line: 1318,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-pattern-compliance.js",
    line: 1370,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-pattern-compliance.js",
    line: 1497,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-review-needed.js",
    line: 481,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/check-review-needed.js",
    line: 722,
    title: "Prefer Number.NaN over NaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/check-triggers.js",
    line: 237,
    title: "Prefer Number.NaN over NaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/dedup-multi-pass.js",
    line: 74,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/dedup-multi-pass.js",
    line: 75,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/dedup-multi-pass.js",
    line: 82,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/extract-audits.js",
    line: 169,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/extract-reviews.js",
    line: 165,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/extract-reviews.js",
    line: 207,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/generate-views.js",
    line: 47,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/generate-views.js",
    line: 47,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/intake-audit.js",
    line: 103,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/intake-manual.js",
    line: 71,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/debt/intake-manual.js",
    line: 328,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/intake-manual.js",
    line: 329,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/intake-pr-deferred.js",
    line: 64,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/debt/normalize-all.js",
    line: 141,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/resolve-item.js",
    line: 39,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/debt/resolve-item.js",
    line: 45,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/debt/sync-sonarcloud.js",
    line: 140,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/debt/sync-sonarcloud.js",
    line: 288,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/debt/sync-sonarcloud.js",
    line: 325,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/debt/validate-schema.js",
    line: 54,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 103,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 157,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 232,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 233,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 234,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 235,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 236,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-detailed-sonar-report.js",
    line: 237,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/generate-documentation-index.js",
    line: 67,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 67,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 130,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 131,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 132,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 133,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 134,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 135,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 136,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 137,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 138,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 139,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 140,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 141,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 178,
    title: "Do not use an object literal as default for parameter result",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 197,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 286,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 423,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 487,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 655,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/generate-documentation-index.js",
    line: 657,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/generate-skill-registry.js",
    line: 134,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/lib/security-helpers.js",
    line: 27,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 28,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 29,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 30,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 31,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 46,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 47,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 48,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 49,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 50,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 51,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 68,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 233,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 234,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 235,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/security-helpers.js",
    line: 279,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/lib/validate-paths.js",
    line: 26,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 27,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 28,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 29,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 30,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 31,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 32,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 33,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 34,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 35,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 36,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 37,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 38,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 39,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 43,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/lib/validate-paths.js",
    line: 128,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/log-override.js",
    line: 82,
    title: "Prefer String#codePointAt() over String#charCodeAt()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/log-session-activity.js",
    line: 68,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/metrics/review-churn-tracker.js",
    line: 55,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },
  {
    file: "scripts/metrics/review-churn-tracker.js",
    line: 59,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/multi-ai/aggregate-category.js",
    line: 69,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/aggregate-category.js",
    line: 70,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/aggregate-category.js",
    line: 113,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/aggregate-category.js",
    line: 114,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/multi-ai/extract-agent-findings.js",
    line: 111,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/multi-ai/fix-schema.js",
    line: 255,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 447,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 633,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 634,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 691,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 722,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 723,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/multi-ai/normalize-format.js",
    line: 878,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/normalize-canon-ids.js",
    line: 57,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/normalize-canon-ids.js",
    line: 58,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/normalize-canon-ids.js",
    line: 68,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/normalize-canon-ids.js",
    line: 69,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/phase-complete-check.js",
    line: 106,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 287,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 384,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 464,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 465,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 468,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 471,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 474,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 475,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 476,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 478,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 735,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 736,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 737,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/phase-complete-check.js",
    line: 739,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/reset-audit-triggers.js",
    line: 111,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/reset-audit-triggers.js",
    line: 170,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/run-consolidation.js",
    line: 76,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/run-consolidation.js",
    line: 77,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/run-consolidation.js",
    line: 78,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/search-capabilities.js",
    line: 109,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/search-capabilities.js",
    line: 110,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/secrets/decrypt-secrets.js",
    line: 155,
    title: "Prefer String#codePointAt() over String#charCodeAt()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/secrets/encrypt-secrets.js",
    line: 113,
    title: "Prefer String#codePointAt() over String#charCodeAt()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/security-check.js",
    line: 160,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/suggest-pattern-automation.js",
    line: 91,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 92,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 95,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 97,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 214,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 288,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/suggest-pattern-automation.js",
    line: 299,
    title: "Prefer String#codePointAt() over String#charCodeAt()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/surface-lessons-learned.js",
    line: 30,
    title: "Exporting mutable let binding, use const instead",
    kind: "Code Smell",
    sonarSev: "Critical",
  },
  {
    file: "scripts/surface-lessons-learned.js",
    line: 278,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/surface-lessons-learned.js",
    line: 400,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/surface-lessons-learned.js",
    line: 401,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/surface-lessons-learned.js",
    line: 402,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/surface-lessons-learned.js",
    line: 404,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/tasks/resolve-dependencies.js",
    line: 88,
    title: "Remove this assignment of i",
    kind: "Code Smell",
    sonarSev: "Major",
  },

  {
    file: "scripts/update-readme-status.js",
    line: 214,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/update-readme-status.js",
    line: 411,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/update-readme-status.js",
    line: 537,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/velocity/track-session.js",
    line: 31,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/velocity/track-session.js",
    line: 46,
    title: "Prefer Number.parseInt over parseInt",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/verify-skill-usage.js",
    line: 78,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "scripts/verify-sonar-phase.js",
    line: 232,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/verify-sonar-phase.js",
    line: 259,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "scripts/verify-sonar-phase.js",
    line: 260,
    title: "Prefer String#replaceAll() over String#replace()",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "styles/globals.css",
    line: 4,
    title: "Unexpected unknown at-rule @custom-variant",
    kind: "Bug",
    sonarSev: "Major",
  },

  {
    file: "tests/utils/date-utils.test.ts",
    line: 74,
    title: "Prefer Number.isNaN over isNaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },

  {
    file: "tests/utils/firebase-types.test.ts",
    line: 121,
    title: "Prefer Number.NaN over NaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
  {
    file: "tests/utils/firebase-types.test.ts",
    line: 140,
    title: "Prefer Number.isNaN over isNaN",
    kind: "Code Smell",
    sonarSev: "Minor",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map sonar kind+severity to TDMS severity */
function mapSeverity(kind, sonarSev) {
  if (kind === "Bug" && sonarSev === "Major") return "S2";
  if (kind === "Bug" && sonarSev === "Minor") return "S3";
  if (kind === "Code Smell" && sonarSev === "Critical") return "S1";
  if (kind === "Code Smell" && sonarSev === "Major") return "S2";
  if (kind === "Code Smell" && sonarSev === "Minor") return "S3";
  return "S3"; // fallback
}

/** Map sonar kind to TDMS type */
function mapType(kind) {
  if (kind === "Bug") return "bug";
  return "code-smell";
}

/** Determine category based on title and file */
function mapCategory(title, file) {
  const titleLower = title.toLowerCase();
  if (
    titleLower.includes("interactive element") ||
    titleLower.includes("keyboard listener") ||
    titleLower.includes("form label") ||
    titleLower.includes("non-native interactive") ||
    titleLower.includes("non-interactive element")
  ) {
    return "accessibility";
  }
  if (file.includes("security") || titleLower.includes("security")) {
    return "security";
  }
  return "code-quality";
}

/** Generate description from title and kind */
function makeDescription(title, kind, sonarSev) {
  return `SonarCloud ${kind} (${sonarSev}): ${title}`;
}

/** Recommendation lookup: [substring to match in title, recommendation text] */
const RECOMMENDATION_RULES = [
  [
    "replaceAll",
    "Replace .replace() with .replaceAll() for all occurrences, or use .replace() with /g flag for single occurrence replacements.",
  ],
  ["Number.parseInt", "Use Number.parseInt() instead of the global parseInt() function."],
  ["Number.parseFloat", "Use Number.parseFloat() instead of the global parseFloat() function."],
  [
    "Number.isNaN",
    "Use Number.isNaN() instead of the global isNaN() function for stricter type checking.",
  ],
  ["Number.NaN", "Use Number.NaN instead of the global NaN constant."],
  [
    "fromCodePoint",
    "Use String.fromCodePoint() instead of String.fromCharCode() for full Unicode support.",
  ],
  [
    "codePointAt",
    "Use String.prototype.codePointAt() instead of charCodeAt() for full Unicode support.",
  ],
  ["new Array", "Use new Array() constructor instead of Array() without new."],
  [
    "non-interactive",
    "Add keyboard event handlers (onKeyDown/onKeyUp) to elements with click handlers, or use a native interactive element like <button>.",
  ],
  [
    "keyboard listener",
    "Add keyboard event handlers (onKeyDown/onKeyUp) to elements with click handlers, or use a native interactive element like <button>.",
  ],
  [
    "non-native interactive",
    "Use native interactive elements (<button>, <a>) instead of adding click handlers to <div>/<span>.",
  ],
  [
    "form label",
    "Associate the label with a form control using htmlFor or by wrapping the control.",
  ],
  [
    "Ambiguous spacing",
    "Fix ambiguous whitespace between JSX elements by using explicit {' '} spacing.",
  ],
  [
    "at-rule",
    "Configure CSS linter to recognize Tailwind CSS v4 @custom-variant at-rule, or add ignore comment.",
  ],
  ["assignment of i", "Remove the unnecessary reassignment of the loop variable."],
  [
    "Exporting mutable let",
    "Change exported let binding to const, or use a getter function to export mutable state.",
  ],
  ["pattern can be replaced", "Simplify the regex pattern as suggested by SonarCloud."],
  [
    "object literal as default",
    "Move default parameter object to a named constant to avoid creating a new object on each call.",
  ],
];

/** Generate recommendation based on common patterns */
function makeRecommendation(title) {
  const titleLower = title.toLowerCase();
  for (const [substring, recommendation] of RECOMMENDATION_RULES) {
    if (titleLower.includes(substring.toLowerCase())) return recommendation;
  }
  return "";
}

/** Compute content_hash: SHA-256 of normalized file+line+title+description */
function contentHash(file, line, title, description) {
  const normalized = [file, String(line), title, description]
    .map((s) => s.trim().toLowerCase())
    .join("|");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/** Load JSONL file into array of objects */
function loadJsonl(filePath) {
  const items = [];
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        items.push(JSON.parse(trimmed));
      } catch {
        // Log but skip malformed lines to avoid silent data loss
        console.warn(`  WARN: skipping malformed JSONL line in ${path.basename(filePath)}`);
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // file doesn't exist yet, return empty
  }
  return items;
}

/** Get max numeric ID from existing entries */
function getMaxId(items) {
  let max = 0;
  for (const item of items) {
    if (!item.id) continue;
    const match = item.id.match(/^DEBT-(\d+)$/);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return max;
}

/** Format ID as DEBT-XXXX (4-digit zero-padded, or more if needed) */
function formatId(num) {
  return `DEBT-${String(num).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Dedup: first remove exact duplicates within the input (same file+line+title)
// ---------------------------------------------------------------------------
function dedupInput(issues) {
  const seen = new Set();
  const result = [];
  for (const issue of issues) {
    const titleNorm = (issue.title || "").trim().toLowerCase();
    const key = `${issue.file}:${issue.line}:${titleNorm}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(issue);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build dedup indices from existing MASTER items
// ---------------------------------------------------------------------------
function buildDedupIndices(masterItems) {
  const existingHashes = new Set();
  const existingFileLineTitle = new Set();
  for (const item of masterItems) {
    if (item.content_hash) existingHashes.add(item.content_hash);
    if (item.file && item.line != null && item.title) {
      const key = `${item.file}:${item.line}:${item.title.trim().toLowerCase()}`;
      existingFileLineTitle.add(key);
    }
  }
  return { existingHashes, existingFileLineTitle };
}

// ---------------------------------------------------------------------------
// Build a TDMS entry from a raw issue
// ---------------------------------------------------------------------------
function buildEntry(issue, id, description, hash) {
  return {
    id: formatId(id),
    source_id: `sonarcloud-paste:reliability:${issue.file}:${issue.line}`,
    source_file: "sonarcloud-dashboard-paste-2026-02-20",
    category: mapCategory(issue.title, issue.file),
    severity: mapSeverity(issue.kind, issue.sonarSev),
    type: mapType(issue.kind),
    file: issue.file,
    line: issue.line,
    title: issue.title,
    description: description,
    recommendation: makeRecommendation(issue.title),
    effort: "E0",
    status: "VERIFIED",
    roadmap_ref: "M2.1",
    created: TODAY,
    verified_by: null,
    resolution: null,
    content_hash: hash,
    rule: null,
    sonar_key: null,
  };
}

// ---------------------------------------------------------------------------
// Deduplicate issues against existing MASTER data and build new entries
// ---------------------------------------------------------------------------
function processIssues(dedupedInput, indices, startId) {
  const { existingHashes, existingFileLineTitle } = indices;
  let nextId = startId;
  const newItems = [];
  let alreadyTracked = 0;

  for (const issue of dedupedInput) {
    const description = makeDescription(issue.title, issue.kind, issue.sonarSev);
    const hash = contentHash(issue.file, issue.line, issue.title, description);

    if (existingHashes.has(hash)) {
      alreadyTracked++;
      continue;
    }
    const fltKey = `${issue.file}:${issue.line}:${issue.title.trim().toLowerCase()}`;
    if (existingFileLineTitle.has(fltKey)) {
      alreadyTracked++;
      continue;
    }

    newItems.push(buildEntry(issue, nextId, description, hash));
    existingHashes.add(hash);
    existingFileLineTitle.add(fltKey);
    nextId++;
  }

  return { newItems, alreadyTracked };
}

// ---------------------------------------------------------------------------
// Print summary report of new items
// ---------------------------------------------------------------------------
function printSummary(dedupedInput, alreadyTracked, newItems) {
  console.log(`\n--- Results ---`);
  console.log(`Total input (after self-dedup): ${dedupedInput.length}`);
  console.log(`Already tracked in MASTER:      ${alreadyTracked}`);
  console.log(`New items to add:               ${newItems.length}`);

  if (newItems.length === 0) return;

  console.log(`\nID range: ${newItems[0].id} - ${newItems[newItems.length - 1].id}`);

  const byCat = {};
  const bySev = {};
  for (const item of newItems) {
    byCat[item.category] = (byCat[item.category] || 0) + 1;
    bySev[item.severity] = (bySev[item.severity] || 0) + 1;
  }
  console.log(`\nBy category:`);
  for (const [cat, count] of Object.entries(byCat).sort()) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`By severity:`);
  for (const [sev, count] of Object.entries(bySev).sort()) {
    console.log(`  ${sev}: ${count}`);
  }

  console.log(`\nSample entries (first 3):`);
  for (const item of newItems.slice(0, 3)) {
    console.log(`  ${item.id}: [${item.severity}] ${item.file}:${item.line} - ${item.title}`);
  }
}

// ---------------------------------------------------------------------------
// Append new items to both MASTER and deduped files
// ---------------------------------------------------------------------------
/**
 * Check if a path is safe to write (not a symlink).
 */
function isWriteSafe(filePath) {
  for (const p of [path.dirname(filePath), filePath]) {
    try {
      const stat = fs.lstatSync(p);
      if (stat.isSymbolicLink()) {
        console.error(`ERROR: Refusing to write to symlink: ${path.basename(p)}`);
        return false;
      }
    } catch {
      // Path doesn't exist yet — continue
    }
  }
  return true;
}

function writeNewItems(newItems) {
  const now = new Date().toISOString();
  const ingestedUser = process.env.USER || process.env.USERNAME || "unknown";
  for (const item of newItems) {
    item.ingested_by = "intake-sonar-reliability";
    item.ingested_user = ingestedUser;
    item.ingested_at = now;
  }
  const newLines = newItems.map((item) => JSON.stringify(item)).join("\n") + "\n";

  // Symlink guard — refuse to write to symlinked targets
  if (!isWriteSafe(MASTER_FILE) || !isWriteSafe(DEDUPED_FILE)) {
    process.exit(1);
  }

  const masterTmp = MASTER_FILE + `.tmp.${process.pid}`;
  const dedupedTmp = DEDUPED_FILE + `.tmp.${process.pid}`;
  try {
    fs.mkdirSync(path.dirname(MASTER_FILE), { recursive: true });
    fs.mkdirSync(path.dirname(DEDUPED_FILE), { recursive: true });
    // Stage both writes before committing either
    const existingMaster = fs.existsSync(MASTER_FILE) ? fs.readFileSync(MASTER_FILE, "utf8") : "";
    const existingDeduped = fs.existsSync(DEDUPED_FILE)
      ? fs.readFileSync(DEDUPED_FILE, "utf8")
      : "";
    fs.writeFileSync(masterTmp, existingMaster + newLines, "utf8");
    fs.writeFileSync(dedupedTmp, existingDeduped + newLines, "utf8");
    // Commit atomically — rename master first, then deduped
    fs.renameSync(masterTmp, MASTER_FILE);
    try {
      fs.renameSync(dedupedTmp, DEDUPED_FILE);
    } catch (error_) {
      console.error(
        `CRITICAL: MASTER_FILE updated but DEDUPED_FILE rename failed. ` +
          `Manually rename ${dedupedTmp} to ${DEDUPED_FILE} to restore consistency.`
      );
      throw error_;
    }
    console.log(`\nAppended ${newItems.length} items to MASTER_DEBT.jsonl`);
    console.log(`Appended ${newItems.length} items to raw/deduped.jsonl`);
  } catch (err) {
    for (const tmp of [masterTmp, dedupedTmp]) {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore cleanup failure */
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    // Sanitize file paths from error messages — use string parsing instead of regex
    // to avoid ReDoS concerns (SonarCloud S5852)
    const sanitizedMsg = msg
      .split(/\s+/)
      .map((word) => {
        if (word.includes("/") || word.includes("\\")) return "<path>";
        return word;
      })
      .join(" ");
    console.error(`ERROR writing files: ${sanitizedMsg}`);
    process.exit(1);
  }

  console.log(`\nDone. Both files updated successfully.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const dryRun = !writeMode;

  console.log(`\n=== SonarCloud Reliability Intake ===`);
  console.log(`Mode: ${dryRun ? "DRY RUN (use --write to persist)" : "WRITE"}`);
  console.log(`Raw issues from paste: ${RAW_ISSUES.length}`);

  const dedupedInput = dedupInput(RAW_ISSUES);
  console.log(
    `After input self-dedup: ${dedupedInput.length} (removed ${RAW_ISSUES.length - dedupedInput.length} input duplicates)`
  );

  const masterItems = loadJsonl(MASTER_FILE);
  const dedupedItems = loadJsonl(DEDUPED_FILE);
  console.log(`\nExisting MASTER_DEBT.jsonl: ${masterItems.length} items`);
  console.log(`Existing raw/deduped.jsonl: ${dedupedItems.length} items`);

  const indices = buildDedupIndices([...masterItems, ...dedupedItems]);
  const maxExistingId = Math.max(getMaxId(masterItems), getMaxId(dedupedItems));
  const { newItems, alreadyTracked } = processIssues(dedupedInput, indices, maxExistingId + 1);

  printSummary(dedupedInput, alreadyTracked, newItems);

  if (dryRun) {
    console.log(`\n[DRY RUN] No files modified. Use --write to persist.`);
    return;
  }

  if (newItems.length === 0) {
    console.log(`\nNo new items to write.`);
    return;
  }

  writeNewItems(newItems);
}

main();
