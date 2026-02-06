#!/usr/bin/env node
/**
 * Extract JSONL findings from agent output files.
 * Usage: node scripts/multi-ai/extract-agent-findings.js <output-file> <dest-jsonl>
 */
const fs = require("fs");
const path = require("path");

const outputFile = process.argv[2];
const destFile = process.argv[3];

if (!outputFile || !destFile) {
  console.error("Usage: node extract-agent-findings.js <output-file> <dest-jsonl>");
  process.exit(1);
}

const ROOT_PREFIX = "C:\\Users\\jason\\Workspace\\dev-projects\\sonash-v0\\";

const content = fs.readFileSync(outputFile, "utf8");
const lines = content.split("\n").filter((l) => l.trim());
const findings = [];

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.type === "assistant" && entry.message && entry.message.content) {
      for (const block of entry.message.content) {
        if (block.type === "text" && block.text) {
          const textLines = block.text.split("\n");
          for (const tl of textLines) {
            const trimmed = tl.trim();
            if (trimmed.startsWith('{"title":')) {
              try {
                const finding = JSON.parse(trimmed);
                if (finding.title && finding.severity) {
                  // Normalize file paths to relative
                  if (finding.file) {
                    finding.file = finding.file.replace(ROOT_PREFIX, "").replace(/\\\\/g, "/");
                  }
                  findings.push(finding);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    }
  } catch {
    // Skip invalid log lines
  }
}

// Ensure dest dir exists
fs.mkdirSync(path.dirname(destFile), { recursive: true });

// Write findings
const jsonl = findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
fs.writeFileSync(destFile, jsonl);
console.log(`Extracted ${findings.length} findings to ${destFile}`);
