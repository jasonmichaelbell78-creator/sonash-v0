#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Alerts Reminder Hook
 *
 * Checks if there are pending alerts that haven't been acknowledged this session
 * and reminds Claude to surface them to the user.
 *
 * This hook runs on UserPromptSubmit.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const ALERTS_FILE = path.join(ROOT_DIR, ".claude", "pending-alerts.json");
const SESSION_STATE_FILE = path.join(ROOT_DIR, ".claude", "session-state.json");
const ALERTS_ACK_FILE = path.join(ROOT_DIR, ".claude", "alerts-acknowledged.json");

function main() {
  // Check if alerts file exists
  if (!fs.existsSync(ALERTS_FILE)) {
    process.exit(0);
  }

  // Check if alerts have been acknowledged this session
  let alertsAcknowledged = false;
  if (fs.existsSync(ALERTS_ACK_FILE)) {
    try {
      const ackData = JSON.parse(fs.readFileSync(ALERTS_ACK_FILE, "utf8"));
      const alertsData = JSON.parse(fs.readFileSync(ALERTS_FILE, "utf8"));

      // If ack timestamp is after alerts generation, they've been acknowledged
      if (ackData.acknowledgedAt && alertsData.generated) {
        const ackTime = new Date(ackData.acknowledgedAt).getTime();
        const alertsTime = new Date(alertsData.generated).getTime();
        if (ackTime > alertsTime) {
          alertsAcknowledged = true;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (alertsAcknowledged) {
    process.exit(0);
  }

  // Read alerts
  let alerts;
  try {
    alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, "utf8"));
  } catch {
    process.exit(0);
  }

  // Count alerts by severity
  const counts = { error: 0, warning: 0, info: 0 };
  for (const alert of alerts.alerts || []) {
    counts[alert.severity] = (counts[alert.severity] || 0) + 1;
  }

  const total = counts.error + counts.warning + counts.info;
  if (total === 0) {
    process.exit(0);
  }

  // Output reminder
  const parts = [];
  if (counts.error > 0) parts.push(`${counts.error} error(s)`);
  if (counts.warning > 0) parts.push(`${counts.warning} warning(s)`);
  if (counts.info > 0) parts.push(`${counts.info} info`);

  console.log(`REMINDER: There are ${total} pending alerts (${parts.join(", ")}).`);
  console.log("Tell the user about these alerts or run /alerts for details.");
  console.log(
    "After discussing alerts, acknowledge by writing to .claude/alerts-acknowledged.json"
  );
}

main();
